<?php
session_start();
date_default_timezone_set('Europe/Sofia');
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

include 'db_connect.php';

// Автоматично обновяване на статуса на просрочени поръчки на "ПОЗВЪНИ"
$stmt = mysqli_prepare($conn, "UPDATE orders SET status = 'ПОЗВЪНИ' WHERE DATEDIFF(CURDATE(), order_date) > 30 AND status NOT IN ('ОК', 'Доставено', 'Платено') AND (postpone_until IS NULL OR postpone_until < CURDATE())");
mysqli_stmt_execute($stmt);
mysqli_stmt_close($stmt);

// Обновяване на статуса чрез "Завършено" (чекбокс)
if (isset($_POST['update_called'])) {
    $order_id = (int)$_POST['order_id'];
    $new_status = isset($_POST['called']) ? 'Платено' : 'ПОЗВЪНИ';
    
    // Вземане на client_id и order_date за групиране
    $stmt = mysqli_prepare($conn, "SELECT client_id, order_date FROM orders WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $order_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $order_data = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if ($order_data) {
        $client_id = $order_data['client_id'];
        $order_date = $order_data['order_date'];
        
        // Обновяване на всички поръчки за този клиент и дата
        $stmt = mysqli_prepare($conn, "UPDATE orders SET status = ? WHERE client_id = ? AND order_date = ?");
        mysqli_stmt_bind_param($stmt, "sis", $new_status, $client_id, $order_date);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }

    $redirect_params = http_build_query([
        'page' => isset($_GET['page']) ? $_GET['page'] : 1,
        'sort_by' => isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default',
        'search_client' => isset($_GET['search_client']) ? urlencode($_GET['search_client']) : ''
    ]);

    header("Location: unpaid_orders.php?$redirect_params#order_$order_id");
    exit;
}

// Обновяване на статуса чрез селектор
if (isset($_POST['update_status'])) {
    $order_id = (int)$_POST['order_id'];
    $status = $_POST['status'];
    $valid_statuses = ['Въведени', 'Доставено', 'ПОЗВЪНИ', 'Платено', 'Доставено (Не платено)'];

    // Вземане на client_id и order_date за групиране
    $stmt = mysqli_prepare($conn, "SELECT client_id, order_date FROM orders WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $order_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $order_data = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if ($order_data) {
        $client_id = $order_data['client_id'];
        $order_date = $order_data['order_date'];
        
        // Обновяване на всички поръчки за този клиент и дата
        if (in_array($status, $valid_statuses)) {
            $stmt = mysqli_prepare($conn, "UPDATE orders SET status = ? WHERE client_id = ? AND order_date = ?");
            mysqli_stmt_bind_param($stmt, "sis", $status, $client_id, $order_date);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        } else {
            $stmt = mysqli_prepare($conn, "UPDATE orders SET status = 'ПОЗВЪНИ' WHERE client_id = ? AND order_date = ?");
            mysqli_stmt_bind_param($stmt, "is", $client_id, $order_date);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
    }

    $redirect_params = http_build_query([
        'page' => isset($_GET['page']) ? $_GET['page'] : 1,
        'sort_by' => isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default',
        'search_client' => isset($_GET['search_client']) ? urlencode($_GET['search_client']) : ''
    ]);

    header("Location: unpaid_orders.php?$redirect_params#order_$order_id");
    exit;
}

// Отлагане на поръчка
if (isset($_POST['postpone'])) {
    $order_id = (int)$_POST['order_id'];

    // Вземане на client_id
    $stmt = mysqli_prepare($conn, "SELECT client_id FROM orders WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $order_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $order_data = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if ($order_data) {
        $client_id = $order_data['client_id'];

        // Отлагане на всички поръчки за този клиент
        $stmt = mysqli_prepare($conn, "UPDATE orders SET postpone_until = DATE_ADD(CURDATE(), INTERVAL 5 DAY) WHERE client_id = ?");
        mysqli_stmt_bind_param($stmt, "i", $client_id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }

    $redirect_params = http_build_query([
        'page' => isset($_GET['page']) ? $_GET['page'] : 1,
        'sort_by' => isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default',
        'search_client' => isset($_GET['search_client']) ? urlencode($_GET['search_client']) : ''
    ]);

    header("Location: unpaid_orders.php?$redirect_params#order_$order_id");
    exit;
}

// Пагинация и сортиране
$orders_per_page = 100;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $orders_per_page;

$sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default';
$search_client = isset($_GET['search_client']) ? $_GET['search_client'] : '';

$order_by_clause = "ORDER BY FIELD(o.status, 'Доставено (Не платено)', 'ПОЗВЪНИ'), o.order_date ASC, o.id ASC"; // Доставено (Не платено) първо, след това най-старите
if ($sort_by == 'date_desc') {
    $order_by_clause = "ORDER BY FIELD(o.status, 'Доставено (Не платено)', 'ПОЗВЪНИ'), o.order_date DESC, o.id DESC";
} elseif ($sort_by == 'date_asc') {
    $order_by_clause = "ORDER BY FIELD(o.status, 'Доставено (Не платено)', 'ПОЗВЪНИ'), o.order_date ASC, o.id ASC";
}

// Филтриране на поръчки само с ПОЗВЪНИ или Доставено (Не платено)
$where_clause = "WHERE o.status IN ('ПОЗВЪНИ', 'Доставено (Не платено)') 
                 AND (o.postpone_until IS NULL OR o.postpone_until < CURDATE())
                 AND NOT EXISTS (
                     SELECT 1 
                     FROM orders o2 
                     WHERE o2.client_id = o.client_id 
                     AND o2.order_date > o.order_date 
                     AND o2.status = 'Платено'
                 )";
$params = [];
$param_types = "";
if (!empty($search_client)) {
    $where_clause .= " AND c.company_name LIKE ?";
    $params[] = "%$search_client%";
    $param_types .= "s";
}

// Общ брой поръчки (само последната за всеки клиент)
$total_orders_query = "WITH latest AS (
                        SELECT client_id, MAX(order_date) as max_order_date 
                        FROM orders 
                        WHERE status IN ('ПОЗВЪНИ', 'Доставено (Не платено)') 
                        AND (postpone_until IS NULL OR postpone_until < CURDATE())
                        AND NOT EXISTS (
                            SELECT 1 
                            FROM orders o2 
                            WHERE o2.client_id = orders.client_id 
                            AND o2.order_date > orders.order_date 
                            AND o2.status = 'Платено'
                        )
                        GROUP BY client_id
                      )
                      SELECT COUNT(DISTINCT o.client_id) as total 
                      FROM orders o 
                      INNER JOIN latest l ON o.client_id = l.client_id AND o.order_date = l.max_order_date
                      LEFT JOIN clients c ON o.client_id = c.id 
                      $where_clause";
$stmt = mysqli_prepare($conn, $total_orders_query);
if (!empty($params)) {
    mysqli_stmt_bind_param($stmt, $param_types, ...$params);
}
mysqli_stmt_execute($stmt);
$total_result = mysqli_stmt_get_result($stmt);
$total_orders = mysqli_fetch_assoc($total_result)['total'] ?? 0;
$total_pages = ceil($total_orders / $orders_per_page);
mysqli_stmt_close($stmt);

$start_order_number = ($page - 1) * $orders_per_page + 1;

// Заявка за поръчки с пагинация, само последната за клиент
$orders_query = "WITH latest AS (
                   SELECT client_id, MAX(order_date) as max_order_date 
                   FROM orders 
                   WHERE status IN ('ПОЗВЪНИ', 'Доставено (Не платено)') 
                   AND (postpone_until IS NULL OR postpone_until < CURDATE())
                   AND NOT EXISTS (
                       SELECT 1 
                       FROM orders o2 
                       WHERE o2.client_id = orders.client_id 
                       AND o2.order_date > orders.order_date 
                       AND o2.status = 'Платено'
                   )
                   GROUP BY client_id
                 )
                 SELECT o.id AS order_id, o.client_id, o.order_date, o.status, o.product, o.quantity, o.returned_gallons, o.custom_price, o.comment,
                        c.company_name, c.phone, c.address, c.address_details,
                        p.category, 
                        DATEDIFF(CURDATE(), o.order_date) AS days_diff 
                 FROM orders o 
                 INNER JOIN latest l ON o.client_id = l.client_id AND o.order_date = l.max_order_date
                 LEFT JOIN clients c ON o.client_id = c.id 
                 LEFT JOIN products p ON o.product = p.name 
                 $where_clause 
                 $order_by_clause 
                 LIMIT ?, ?";
$params[] = $offset;
$params[] = $orders_per_page;
$param_types .= "ii";

$stmt = mysqli_prepare($conn, $orders_query);
mysqli_stmt_bind_param($stmt, $param_types, ...$params);
mysqli_stmt_execute($stmt);
$orders_result = mysqli_stmt_get_result($stmt);

// Зареждане на цените на продуктите
$product_info = [];
$prices_query = "SELECT name, price, category FROM products";
$prices_result = mysqli_query($conn, $prices_query);
while ($price_row = mysqli_fetch_assoc($prices_result)) {
    $product_info[$price_row['name']] = [
        'price' => $price_row['price'],
        'category' => $price_row['category']
    ];
}

// Групиране на поръчките по client_id и order_date
$raw_orders = [];
while ($row = mysqli_fetch_assoc($orders_result)) {
    $raw_orders[] = $row;
}
mysqli_stmt_close($stmt);

$grouped_orders = [];
foreach ($raw_orders as $row) {
    $key = $row['client_id'] . '|' . $row['order_date'];
    if (!isset($grouped_orders[$key])) {
        $grouped_orders[$key] = [
            'client_id' => $row['client_id'],
            'order_date' => $row['order_date'],
            'status' => $row['status'],
            'company_name' => $row['company_name'],
            'phone' => $row['phone'],
            'address' => $row['address'],
            'address_details' => $row['address_details'],
            'order_id' => $row['order_id'],
            'days_diff' => $row['days_diff'],
            'products' => [],
            'returned_gallons' => $row['returned_gallons'],
            'total_price' => 0,
            'is_overdue' => $row['days_diff'] > 30,
            'comment' => $row['comment']
        ];
    }

    $name = $row['product'];
    $quantity = (int)$row['quantity'];
    $custom_price = $row['custom_price'] !== null ? (float)$row['custom_price'] : null;
    $category = isset($product_info[$name]) ? $product_info[$name]['category'] : $row['category'] ?? 'Неизвестна';
    $price = $custom_price !== null ? $custom_price : (isset($product_info[$name]) ? $product_info[$name]['price'] : 0);

    $grouped_orders[$key]['products'][] = [
        'row_id' => $row['order_id'],
        'name' => $name,
        'quantity' => $quantity,
        'price' => $price,
        'custom_price' => $custom_price,
        'returned_gallons' => $row['returned_gallons'],
        'category' => $category
    ];

    $grouped_orders[$key]['total_price'] += $price * $quantity;
    $grouped_orders[$key]['returned_gallons'] = max($grouped_orders[$key]['returned_gallons'], $row['returned_gallons'] ?? 0);
}

$orders = array_values($grouped_orders);

// AJAX заявка за обновяване на таблицата
if (isset($_GET['ajax']) && $_GET['ajax'] == '1') {
    ob_start();
    $order_number = $start_order_number;
    foreach ($orders as $index => $row) {
        $row_class = $row['is_overdue'] ? 'bg-overdue' : '';
        ?>
        <tr id="order_<?php echo $row['order_id']; ?>" class="<?php echo $row_class; ?> hover:bg-gray-50 transition" data-order-date="<?php echo date('Y-m-d', strtotime($row['order_date'])); ?>" data-address="<?php echo htmlspecialchars($row['address'] ?? ''); ?>" data-address-details="<?php echo htmlspecialchars($row['address_details'] ?? ''); ?>" data-total-price="<?php echo $row['total_price']; ?>">
            <td class="p-3 border-b border-r text-center"><?php echo $order_number++; ?></td>
            <td class="p-3 border-b border-r text-center"><?php echo htmlspecialchars($row['company_name']); ?></td>
            <td class="p-3 border-b border-r text-center"><?php echo htmlspecialchars($row['phone']); ?></td>
            <td class="p-3 border-b border-r text-center"><?php echo date('d.m.Y', strtotime($row['order_date'])); ?></td>
            <td class="p-3 border-b border-r text-left product-cell">
                <div class="grid grid-cols-1 gap-2">
                    <?php if (!empty($row['products'])) { ?>
                        <div class="flex flex-col">
                            <?php foreach ($row['products'] as $product) { ?>
                                <?php if ($product['category'] === 'Кафе') { ?>
                                    <span class="font-semibold text-gray-700">☕ Кафе:</span>
                                <?php } elseif ($product['category'] === 'Вода') { ?>
                                    <span class="font-semibold text-gray-700">💧 Вода:</span>
                                <?php } else { ?>
                                    <span class="font-semibold text-gray-700">❓ Неизвестна категория:</span>
                                <?php } ?>
                                <ul class="list-disc pl-5">
                                    <li><?php echo htmlspecialchars($product['name']) . ' - ' . $product['quantity'] . ' бр. (' . number_format($product['price'], 2) . ' лв./бр.)'; ?></li>
                                </ul>
                            <?php } ?>
                        </div>
                    <?php } else { ?>
                        <span class="text-gray-500 italic">Няма продукти</span>
                    <?php } ?>
                </div>
            </td>
            <td class="p-3 border-b border-r text-center"><?php echo $row['returned_gallons'] ? htmlspecialchars($row['returned_gallons']) : '-'; ?></td>
            <td class="p-3 border-b border-r text-center">
                <form method="POST" class="inline">
                    <input type="hidden" name="order_id" value="<?php echo $row['order_id']; ?>">
                    <select name="status" class="border p-2 rounded-lg <?php echo $row['is_overdue'] ? 'bg-white text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'; ?> transition w-full status-select" onchange="this.form.submit()">
                        <option value="Въведени" <?php echo $row['status'] == 'Въведени' ? 'selected' : ''; ?>>📝 Въведени</option>
                        <option value="Доставено" <?php echo $row['status'] == 'Доставено' ? 'selected' : ''; ?>>🚚 Доставено</option>
                        <option value="ПОЗВЪНИ" <?php echo $row['status'] == 'ПОЗВЪНИ' ? 'selected' : ''; ?>>📞 ПОЗВЪНИ</option>
                        <option value="Платено" <?php echo $row['status'] == 'Платено' ? 'selected' : ''; ?>>💰 Платено</option>
                        <option value="Доставено (Не платено)" <?php echo $row['status'] == 'Доставено (Не платено)' ? 'selected' : ''; ?>>🚚❌ Доставено (Не платено)</option>
                    </select>
                    <input type="hidden" name="update_status" value="1">
                </form>
            </td>
            <td class="p-3 border-b border-r text-center">
                <form method="POST" class="inline">
                    <input type="hidden" name="order_id" value="<?php echo $row['order_id']; ?>">
                    <input type="checkbox" name="called" <?php echo $row['status'] == 'Платено' ? 'checked' : ''; ?> onchange="this.form.submit()" class="form-checkbox h-5 w-5 text-blue-600">
                    <input type="hidden" name="update_called" value="1">
                </form>
            </td>
            <td class="p-3 border-b border-r text-center">
                <form method="POST" class="inline">
                    <input type="hidden" name="order_id" value="<?php echo $row['order_id']; ?>">
                    <input type="hidden" name="postpone" value="5">
                    <button type="submit" class="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 transition">⏳ Отложи 5 дни</button>
                </form>
            </td>
            <td class="p-3 border-b border-r text-center"><?php echo number_format($row['total_price'], 2, '.', '') . ' лв.'; ?></td>
            <td class="p-3 border-b border-r text-center">
                <?php if (!empty($row['comment'])) { ?>
                    <button type="button" class="comment-btn bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition" data-comment="<?php echo htmlspecialchars($row['comment']); ?>">⚠️</button>
                <?php } else { ?>
                    -
                <?php } ?>
            </td>
        </tr>
        <?php
    }
    echo ob_get_clean();
    exit;
}
?>
<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📞 💧📋 Vodazamen Manager – Неплатени поръчки</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        @media print {
            body { margin: 0; }
            .container { width: 100%; margin: 0; padding: 0; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 14px; }
            th { background-color: #1F2937; color: white; }
            td { color: black; }
            h1 { text-align: center; font-size: 24px; margin: 20px 0; }
            .product-cell ul { padding-left: 20px; margin: 0; }
            .comment-btn { display: none; }
        }
        .container { 
            padding: 16px;
            margin-top: 0;
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
        }
        th, td { 
            border: 1px solid #d1d5db; 
            padding: 8px; 
            white-space: normal; 
        }
        th { 
            background-color: #1F2937; 
            color: white; 
            font-weight: bold; 
        }
        tr:nth-child(even) { background-color: #F9FAFB; color: black; }
        tr:nth-child(odd) { background-color: #FFFFFF; color: black; }
        .bg-overdue { background-color: #F87171 !important; color: white !important; }
        .hover\:bg-gray-50:hover { background-color: #F3F4F6; }
        .product-cell { 
            min-width: 250px;
            white-space: normal; 
        }
        .product-cell ul { 
            list-style-type: disc; 
            padding-left: 20px; 
            margin: 0; 
        }
        .product-cell .font-semibold { color: #374151; }
        .bg-blue-500, .bg-green-500, .bg-red-500, .bg-yellow-500 { background-color: #1F2937 !important; }
        .bg-blue-500:hover, .bg-green-500:hover, .bg-red-500:hover, .bg-yellow-600:hover { background-color: #374151 !important; }
        .text-white { color: white !important; }
        #client-search { border-color: #1F2937; }
        #client-search:focus { border-color: #1F2937; outline: none; }
        .modal { display: none; position: fixed; z-index: 50; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); }
        .modal-content { background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 90%; max-width: 800px; border-radius: 8px; }
        .close { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
        .close:hover, .close:focus { color: black; text-decoration: none; }
        .filters-container { 
            display: flex; 
            flex-direction: column; 
            gap: 16px; 
            margin-bottom: 16px; 
        }
        .filter-buttons { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 8px; 
        }
        .search-and-select { 
            display: flex; 
            flex-direction: column; 
            gap: 16px; 
        }
        .status-select { 
            font-size: 14px; 
            padding: 4px; 
            min-width: 150px; 
            white-space: normal; 
        }
        .comment-btn {
            background-color: #1F2937;
            color: white;
            padding: 6px;
            border-radius: 6px;
            font-size: 14px;
            transition: background-color 0.2s;
        }
        .comment-btn:hover {
            background-color: #374151;
        }
        @media (max-width: 640px) {
            .container { padding: 12px; }
            table { 
                display: block; 
                overflow-x: auto; 
                white-space: nowrap; 
                min-width: 100%; 
            }
            th, td { 
                font-size: 10px; 
                padding: 4px; 
                line-height: 1.2; 
            }
            .product-cell { 
                min-width: 150px; 
                white-space: normal; 
            }
            .product-cell ul { 
                padding-left: 10px; 
                margin: 0; 
            }
            .product-cell li { 
                font-size: 10px; 
                line-height: 1.2; 
            }
            .status-select { 
                font-size: 10px; 
                padding: 2px; 
                min-width: 100px; 
                white-space: normal; 
            }
            button, input[type="checkbox"] { 
                min-width: 30px; 
                min-height: 30px; 
                font-size: 12px; 
            }
            .comment-btn { 
                padding: 4px; 
                font-size: 12px; 
            }
            .modal-content { 
                width: 95%; 
                margin: 10% auto; 
            }
            .filters-container { 
                flex-direction: column; 
                gap: 8px; 
                align-items: stretch; 
            }
            .filter-buttons { 
                flex-direction: column; 
                gap: 4px; 
            }
            .search-and-select { 
                flex-direction: column; 
                gap: 8px; 
                align-items: stretch; 
            }
            #client-search { 
                width: 100%; 
                max-width: none; 
            }
        }
    </style>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200">
    <div class="container mx-auto bg-white rounded-lg shadow-lg w-full sm:w-11/12 md:w-11/12 lg:w-11/12">
        <?php include 'head.php'; ?>
        <?php include 'menu.php'; ?>

        <h2 class="text-xl font-semibold mt-4">📞 Неплатени поръчки</h2>
        <div class="filters-container">
            <div class="filter-buttons">
                <a href="?sort_by=default" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition <?php echo $sort_by == 'default' ? 'font-bold' : ''; ?>">📋 По подразбиране</a>
                <a href="?sort_by=date_desc" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition <?php echo $sort_by == 'date_desc' ? 'font-bold' : ''; ?>">📅 По дата (низходящо)</a>
                <a href="?sort_by=date_asc" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition <?php echo $sort_by == 'date_asc' ? 'font-bold' : ''; ?>">📅 По дата (възходящо)</a>
            </div>

            <div class="search-and-select">
                <div class="flex flex-col gap-2 w-full sm:w-auto">
                    <h3 class="text-lg font-semibold mb-2">🕵️‍♂️ Търсене по клиент</h3>
                    <input type="text" id="client-search" class="border p-2 rounded-lg w-full sm:w-64" value="<?php echo htmlspecialchars($search_client); ?>" autocomplete="off">
                </div>
            </div>
        </div>

        <div>
            <table class="bg-white border border-gray-300 rounded-lg shadow-md">
                <thead>
                    <tr class="bg-gray-800 text-white">
                        <th class="p-3 border-b border-r text-center">№</th>
                        <th class="p-3 border-b border-r text-center">👤 Клиент</th>
                        <th class="p-3 border-b border-r text-center">📞 Номер</th>
                        <th class="p-3 border-b border-r text-center">📅 Дата</th>
                        <th class="p-3 border-b border-r text-center">📦 Продукти</th>
                        <th class="p-3 border-b border-r text-center">♻️ Върнати галони</th>
                        <th class="p-3 border-b border-r text-center">📋 Статус</th>
                        <th class="p-3 border-b border-r text-center">✅ Завършено</th>
                        <th class="p-3 border-b border-r text-center">⏳ Отложи 5 дни</th>
                        <th class="p-3 border-b border-r text-center">💰 Цена</th>
                        <th class="p-3 border-b border-r text-center">⚠️</th>
                    </tr>
                </thead>
                <tbody id="orders-body">
                    <?php 
                    $order_number = $start_order_number;
                    foreach ($orders as $index => $row) { 
                        $row_class = $row['is_overdue'] ? 'bg-overdue' : '';
                    ?>
                        <tr id="order_<?php echo $row['order_id']; ?>" class="<?php echo $row_class; ?> hover:bg-gray-50 transition" data-order-date="<?php echo date('Y-m-d', strtotime($row['order_date'])); ?>" data-address="<?php echo htmlspecialchars($row['address'] ?? ''); ?>" data-address-details="<?php echo htmlspecialchars($row['address_details'] ?? ''); ?>" data-total-price="<?php echo $row['total_price']; ?>">
                            <td class="p-3 border-b border-r text-center"><?php echo $order_number++; ?></td>
                            <td class="p-3 border-b border-r text-center"><?php echo htmlspecialchars($row['company_name']); ?></td>
                            <td class="p-3 border-b border-r text-center"><?php echo htmlspecialchars($row['phone']); ?></td>
                            <td class="p-3 border-b border-r text-center"><?php echo date('d.m.Y', strtotime($row['order_date'])); ?></td>
                            <td class="p-3 border-b border-r text-left product-cell">
                                <div class="grid grid-cols-1 gap-2">
                                    <?php if (!empty($row['products'])) { ?>
                                        <div class="flex flex-col">
                                            <?php foreach ($row['products'] as $product) { ?>
                                                <?php if ($product['category'] === 'Кафе') { ?>
                                                    <span class="font-semibold text-gray-700">☕ Кафе:</span>
                                                <?php } elseif ($product['category'] === 'Вода') { ?>
                                                    <span class="font-semibold text-gray-700">💧 Вода:</span>
                                                <?php } else { ?>
                                                    <span class="font-semibold text-gray-700">❓ Неизвестна категория:</span>
                                                <?php } ?>
                                                <ul class="list-disc pl-5">
                                                    <li><?php echo htmlspecialchars($product['name']) . ' - ' . $product['quantity'] . ' бр. (' . number_format($product['price'], 2) . ' лв./бр.)'; ?></li>
                                                </ul>
                                            <?php } ?>
                                        </div>
                                    <?php } else { ?>
                                        <span class="text-gray-500 italic">Няма продукти</span>
                                    <?php } ?>
                                </div>
                            </td>
                            <td class="p-3 border-b border-r text-center"><?php echo $row['returned_gallons'] ? htmlspecialchars($row['returned_gallons']) : '-'; ?></td>
                            <td class="p-3 border-b border-r text-center">
                                <form method="POST" class="inline">
                                    <input type="hidden" name="order_id" value="<?php echo $row['order_id']; ?>">
                                    <select name="status" class="border p-2 rounded-lg <?php echo $row['is_overdue'] ? 'bg-white text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'; ?> transition w-full status-select" onchange="this.form.submit()">
                                        <option value="Въведени" <?php echo $row['status'] == 'Въведени' ? 'selected' : ''; ?>>📝 Въведени</option>
                                        <option value="Доставено" <?php echo $row['status'] == 'Доставено' ? 'selected' : ''; ?>>🚚 Доставено</option>
                                        <option value="ПОЗВЪНИ" <?php echo $row['status'] == 'ПОЗВЪНИ' ? 'selected' : ''; ?>>📞 ПОЗВЪНИ</option>
                                        <option value="Платено" <?php echo $row['status'] == 'Платено' ? 'selected' : ''; ?>>💰 Платено</option>
                                        <option value="Доставено (Не платено)" <?php echo $row['status'] == 'Доставено (Не платено)' ? 'selected' : ''; ?>>🚚❌ Доставено (Не платено)</option>
                                    </select>
                                    <input type="hidden" name="update_status" value="1">
                                </form>
                            </td>
                            <td class="p-3 border-b border-r text-center">
                                <form method="POST" class="inline">
                                    <input type="hidden" name="order_id" value="<?php echo $row['order_id']; ?>">
                                    <input type="checkbox" name="called" <?php echo $row['status'] == 'Платено' ? 'checked' : ''; ?> onchange="this.form.submit()" class="form-checkbox h-5 w-5 text-blue-600">
                                    <input type="hidden" name="update_called" value="1">
                                </form>
                            </td>
                            <td class="p-3 border-b border-r text-center">
                                <form method="POST" class="inline">
                                    <input type="hidden" name="order_id" value="<?php echo $row['order_id']; ?>">
                                    <input type="hidden" name="postpone" value="5">
                                    <button type="submit" class="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 transition">⏳ Отложи 5 дни</button>
                                </form>
                            </td>
                            <td class="p-3 border-b border-r text-center"><?php echo number_format($row['total_price'], 2, '.', '') . ' лв.'; ?></td>
                            <td class="p-3 border-b border-r text-center">
                                <?php if (!empty($row['comment'])) { ?>
                                    <button type="button" class="comment-btn bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition" data-comment="<?php echo htmlspecialchars($row['comment']); ?>">⚠️</button>
                                <?php } else { ?>
                                    -
                                <?php } ?>
                            </td>
                        </tr>
                    <?php } ?>
                </tbody>
            </table>
        </div>

        <div class="mt-6 flex justify-center gap-2 items-center">
            <?php
            $base_params = http_build_query([
                'sort_by' => $sort_by,
                'search_client' => urlencode($search_client)
            ]);

            if ($page > 1): ?>
                <a href="?page=<?php echo $page - 1; ?>&<?php echo $base_params; ?>" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">⬅️ Предишна</a>
            <?php endif; ?>

            <?php
            $range = 2;
            $start_page = max(2, $page - $range);
            $end_page = min($total_pages - 1, $page + $range);
            ?>
            <a href="?page=1&<?php echo $base_params; ?>" class="p-2 rounded-lg <?php echo $page == 1 ? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'; ?> transition"><?php echo 1; ?></a>
            
            <?php if ($start_page > 2): ?>
                <span class="p-2 text-gray-700">...</span>
            <?php endif; ?>

            <?php for ($i = $start_page; $i <= $end_page; $i++): ?>
                <a href="?page=<?php echo $i; ?>&<?php echo $base_params; ?>" class="p-2 rounded-lg <?php echo $page == $i ? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'; ?> transition"><?php echo $i; ?></a>
            <?php endfor; ?>

            <?php if ($end_page < $total_pages - 1): ?>
                <span class="p-2 text-gray-700">...</span>
            <?php endif; ?>

            <?php if ($total_pages > 1): ?>
                <a href="?page=<?php echo $total_pages; ?>&<?php echo $base_params; ?>" class="p-2 rounded-lg <?php echo $page == $total_pages ? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'; ?> transition"><?php echo $total_pages; ?></a>
            <?php endif; ?>

            <?php if ($page < $total_pages): ?>
                <a href="?page=<?php echo $page + 1; ?>&<?php echo $base_params; ?>" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">Следваща ➡️</a>
            <?php endif; ?>
        </div>
    </div>

    <div id="commentModal" class="modal">
        <div class="modal-content">
            <span class="close">×</span>
            <h2 class="text-xl font-semibold mb-4">⚠️ Допълнителна информация</h2>
            <p id="commentText" class="text-gray-700"></p>
            <button class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition mt-4" onclick="$('#commentModal').hide()">Затвори</button>
        </div>
    </div>

    <?php include 'footer.php'; ?>

    <script src="scripts.js"></script>
    <script>
        $(document).ready(function() {
            $('#client-search').on('input', function() {
                let search = $(this).val();
                $.ajax({
                    url: 'unpaid_orders.php',
                    method: 'GET',
                    data: { 
                        search_client: search,
                        ajax: 1,
                        sort_by: '<?php echo $sort_by; ?>',
                        page: 1 // Винаги рестартира на първа страница при търсене
                    },
                    success: function(response) {
                        $('#orders-body').html(response);
                        setupEventListeners();
                        if (window.location.hash) {
                            const target = $(window.location.hash);
                            if (target.length) {
                                $('html, body').animate({
                                    scrollTop: target.offset().top - 100
                                }, 500);
                            }
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('Грешка при търсенето:', error);
                    }
                });
            });

            function setupEventListeners() {
                $('.comment-btn').off('click').on('click', function() {
                    const comment = $(this).data('comment');
                    $('#commentText').text(comment);
                    $('#commentModal').show();
                });

                $('.close').off('click').on('click', function() {
                    $('#commentModal').hide();
                });
            }

            setupEventListeners();

            $(window).on('click', function(event) {
                if ($(event.target).is('#commentModal')) {
                    $('#commentModal').hide();
                }
            });
        });
    </script>
</body>
</html>