<?php
session_start();
date_default_timezone_set('Europe/Sofia');
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

include 'db_connect.php';

// Обновяване на статуса чрез "Завършено" (чекбокс)
if (isset($_POST['update_called'])) {
    $order_id = (int)$_POST['order_id'];
    $new_status = isset($_POST['called']) ? 'Платено' : 'Въведени';
    
    $stmt = mysqli_prepare($conn, "SELECT client_id, order_date FROM orders WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $order_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $order_data = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if ($order_data) {
        $client_id = $order_data['client_id'];
        $order_date = $order_data['order_date'];
        
        $stmt = mysqli_prepare($conn, "UPDATE orders SET status = ? WHERE client_id = ? AND order_date = ?");
        mysqli_stmt_bind_param($stmt, "sis", $new_status, $client_id, $order_date);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }

    $redirect_params = http_build_query([
        'page' => isset($_GET['page']) ? $_GET['page'] : 1,
        'sort_by' => isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default',
        'show_future' => isset($_GET['show_future']) ? $_GET['show_future'] : '0',
        'search_client' => isset($_GET['search_client']) ? urlencode($_GET['search_client']) : ''
    ]);

    header("Location: index.php?$redirect_params#order_$order_id");
    exit;
}

// Обновяване на статуса чрез селектор
if (isset($_POST['update_status'])) {
    $order_id = (int)$_POST['order_id'];
    $status = $_POST['status'];
    $valid_statuses = ['Въведени', 'Доставено', 'ПОЗВЪНИ', 'Платено', 'Доставено (Не платено)'];

    $stmt = mysqli_prepare($conn, "SELECT client_id, order_date FROM orders WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $order_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $order_data = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if ($order_data) {
        $client_id = $order_data['client_id'];
        $order_date = $order_data['order_date'];
        
        if (in_array($status, $valid_statuses)) {
            $stmt = mysqli_prepare($conn, "UPDATE orders SET status = ? WHERE client_id = ? AND order_date = ?");
            mysqli_stmt_bind_param($stmt, "sis", $status, $client_id, $order_date);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        } else {
            $stmt = mysqli_prepare($conn, "UPDATE orders SET status = 'Въведени' WHERE client_id = ? AND order_date = ?");
            mysqli_stmt_bind_param($stmt, "is", $client_id, $order_date);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
    }

    $redirect_params = http_build_query([
        'page' => isset($_GET['page']) ? $_GET['page'] : 1,
        'sort_by' => isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default',
        'show_future' => isset($_GET['show_future']) ? $_GET['show_future'] : '0',
        'search_client' => isset($_GET['search_client']) ? urlencode($_GET['search_client']) : ''
    ]);

    header("Location: index.php?$redirect_params#order_$order_id");
    exit;
}

// Изтриване на цяла поръчка
if (isset($_POST['delete_order'])) {
    $order_id = (int)$_POST['order_id'];

    $stmt = mysqli_prepare($conn, "SELECT client_id, order_date FROM orders WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $order_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $order_data = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    $sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default';
    $show_future = isset($_GET['show_future']) && $_GET['show_future'] == '1' ? true : false;
    $search_client = isset($_GET['search_client']) ? $_GET['search_client'] : '';
    $page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
    $orders_per_page = 100;
    $offset = ($page - 1) * $orders_per_page;

    $order_by_clause = "ORDER BY o.order_date DESC, o.id DESC";
    if ($sort_by == 'date_desc') {
        $order_by_clause = "ORDER BY o.order_date DESC, o.id DESC";
    } elseif ($sort_by == 'date_asc') {
        $order_by_clause = "ORDER BY o.order_date ASC, o.id ASC";
    }

    $where_clause = "WHERE o.order_date <= CURDATE()";
    if ($show_future) {
        $where_clause = "WHERE 1=1";
    }
    if (!empty($search_client)) {
        $where_clause .= " AND c.company_name LIKE ?";
    }

    $orders_query = "SELECT DISTINCT o.id AS order_id, o.client_id, o.order_date
                     FROM orders o 
                     LEFT JOIN clients c ON o.client_id = c.id 
                     $where_clause 
                     $order_by_clause";
    $stmt = mysqli_prepare($conn, $orders_query);
    if (!empty($search_client)) {
        $search_client_param = "%$search_client%";
        mysqli_stmt_bind_param($stmt, "s", $search_client_param);
    }
    mysqli_stmt_execute($stmt);
    $orders_result = mysqli_stmt_get_result($stmt);
    $order_ids = [];
    while ($row = mysqli_fetch_assoc($orders_result)) {
        $order_ids[] = $row['order_id'];
    }
    mysqli_stmt_close($stmt);

    $target_id = null;
    $current_index = array_search($order_id, $order_ids);
    if ($current_index !== false) {
        if ($current_index > 0) {
            $target_id = $order_ids[$current_index - 1];
        } elseif ($current_index < count($order_ids) - 1) {
            $target_id = $order_ids[$current_index + 1];
        }
    }

    if ($order_data) {
        $client_id = $order_data['client_id'];
        $order_date = $order_data['order_date'];
        
        $stmt = mysqli_prepare($conn, "DELETE FROM orders WHERE client_id = ? AND order_date = ?");
        mysqli_stmt_bind_param($stmt, "is", $client_id, $order_date);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }

    $total_orders_query = "SELECT COUNT(DISTINCT o.client_id, o.order_date) as total 
                          FROM orders o 
                          LEFT JOIN clients c ON o.client_id = c.id 
                          $where_clause";
    $stmt = mysqli_prepare($conn, $total_orders_query);
    if (!empty($search_client)) {
        $search_client_param = "%$search_client%";
        mysqli_stmt_bind_param($stmt, "s", $search_client_param);
    }
    mysqli_stmt_execute($stmt);
    $total_result = mysqli_stmt_get_result($stmt);
    $total_orders = mysqli_fetch_assoc($total_result)['total'];
    mysqli_stmt_close($stmt);

    $total_pages = ceil($total_orders / $orders_per_page);
    if ($total_orders <= ($page - 1) * $orders_per_page && $page > 1) {
        $page--;
    }

    $redirect_params = http_build_query([
        'page' => $page,
        'sort_by' => $sort_by,
        'show_future' => $show_future ? '1' : '0',
        'search_client' => urlencode($search_client)
    ]);

    $redirect_url = "index.php?$redirect_params";
    if ($target_id !== null) {
        $redirect_url .= "#order_$target_id";
    }

    header("Location: $redirect_url");
    exit;
}

// Изтриване на отделен ред от поръчка
if (isset($_POST['delete_order_row'])) {
    $row_id = (int)$_POST['row_id'];
    $order_id = (int)$_POST['order_id'];

    $stmt = mysqli_prepare($conn, "SELECT client_id, order_date FROM orders WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $row_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $order_data = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if ($order_data) {
        $client_id = $order_data['client_id'];
        $order_date = $order_data['order_date'];

        $stmt = mysqli_prepare($conn, "DELETE FROM orders WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "i", $row_id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);

        $stmt = mysqli_prepare($conn, "SELECT COUNT(*) as row_count FROM orders WHERE client_id = ? AND order_date = ?");
        mysqli_stmt_bind_param($stmt, "is", $client_id, $order_date);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $row_count = mysqli_fetch_assoc($result)['row_count'];
        mysqli_stmt_close($stmt);

        if ($row_count == 0) {
            $sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default';
            $show_future = isset($_GET['show_future']) && $_GET['show_future'] == '1' ? true : false;
            $search_client = isset($_GET['search_client']) ? $_GET['search_client'] : '';
            $page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
            $orders_per_page = 100;
            $offset = ($page - 1) * $orders_per_page;

            $order_by_clause = "ORDER BY o.order_date DESC, o.id DESC";
            if ($sort_by == 'date_desc') {
                $order_by_clause = "ORDER BY o.order_date DESC, o.id DESC";
            } elseif ($sort_by == 'date_asc') {
                $order_by_clause = "ORDER BY o.order_date ASC, o.id ASC";
            }

            $where_clause = "WHERE o.order_date <= CURDATE()";
            if ($show_future) {
                $where_clause = "WHERE 1=1";
            }
            if (!empty($search_client)) {
                $where_clause .= " AND c.company_name LIKE ?";
            }

            $orders_query = "SELECT DISTINCT o.id AS order_id, o.client_id, o.order_date
                             FROM orders o 
                             LEFT JOIN clients c ON o.client_id = c.id 
                             $where_clause 
                             $order_by_clause";
            $stmt = mysqli_prepare($conn, $orders_query);
            if (!empty($search_client)) {
                $search_client_param = "%$search_client%";
                mysqli_stmt_bind_param($stmt, "s", $search_client_param);
            }
            mysqli_stmt_execute($stmt);
            $orders_result = mysqli_stmt_get_result($stmt);
            $order_ids = [];
            while ($row = mysqli_fetch_assoc($orders_result)) {
                $order_ids[] = $row['order_id'];
            }
            mysqli_stmt_close($stmt);

            $target_id = null;
            $current_index = array_search($order_id, $order_ids);
            if ($current_index !== false) {
                if ($current_index > 0) {
                    $target_id = $order_ids[$current_index - 1];
                } elseif ($current_index < count($order_ids) - 1) {
                    $target_id = $order_ids[$current_index + 1];
                }
            }

            $total_orders_query = "SELECT COUNT(DISTINCT o.client_id, o.order_date) as total 
                                  FROM orders o 
                                  LEFT JOIN clients c ON o.client_id = c.id 
                                  $where_clause";
            $stmt = mysqli_prepare($conn, $total_orders_query);
            if (!empty($search_client)) {
                $search_client_param = "%$search_client%";
                mysqli_stmt_bind_param($stmt, "s", $search_client_param);
            }
            mysqli_stmt_execute($stmt);
            $total_result = mysqli_stmt_get_result($stmt);
            $total_orders = mysqli_fetch_assoc($total_result)['total'];
            mysqli_stmt_close($stmt);

            $total_pages = ceil($total_orders / $orders_per_page);
            if ($total_orders <= ($page - 1) * $orders_per_page && $page > 1) {
                $page--;
            }

            $redirect_params = http_build_query([
                'page' => $page,
                'sort_by' => $sort_by,
                'show_future' => $show_future ? '1' : '0',
                'search_client' => urlencode($search_client)
            ]);

            $redirect_url = "index.php?$redirect_params";
            if ($target_id !== null) {
                $redirect_url .= "#order_$target_id";
            }

            header("Location: $redirect_url");
            exit;
        }
    }

    $redirect_params = http_build_query([
        'page' => isset($_GET['page']) ? $_GET['page'] : 1,
        'sort_by' => isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default',
        'show_future' => isset($_GET['show_future']) ? $_GET['show_future'] : '0',
        'search_client' => isset($_GET['search_client']) ? urlencode($_GET['search_client']) : ''
    ]);

    header("Location: index.php?$redirect_params#order_$order_id");
    exit;
}

// Обновяване на количество, върнати галони, персонализирана цена, продукт, дата и коментар
if (isset($_POST['update_order_details'])) {
    $order_id = (int)$_POST['order_id'];
    $products = $_POST['products'];
    $new_order_date = $_POST['order_date'] ?? date('Y-m-d');
    $comment = $_POST['comment'] ?? null;

    $stmt = mysqli_prepare($conn, "SELECT client_id, order_date FROM orders WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $order_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $order_data = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if ($order_data) {
        $client_id = $order_data['client_id'];
        $old_order_date = $order_data['order_date'];

        // Актуализиране на датата и коментара
        $stmt = mysqli_prepare($conn, "UPDATE orders SET order_date = ?, comment = ? WHERE client_id = ? AND order_date = ?");
        mysqli_stmt_bind_param($stmt, "ssis", $new_order_date, $comment, $client_id, $old_order_date);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);

        // Актуализиране на съществуващи продукти
        foreach ($products as $index => $product_data) {
            if (isset($product_data['is_new']) && $product_data['is_new'] == '1') {
                // Добавяне на нов продукт
                $product_name = $product_data['product'];
                $quantity = (int)$product_data['quantity'];
                $returned_gallons = isset($product_data['returned_gallons']) && $product_data['returned_gallons'] !== '' ? (int)$product_data['returned_gallons'] : null;
                $custom_price = isset($product_data['custom_price']) && $product_data['custom_price'] !== '' ? (float)$product_data['custom_price'] : null;
                $status = 'Въведени';

                $stmt = mysqli_prepare($conn, "INSERT INTO orders (client_id, order_date, product, quantity, returned_gallons, custom_price, status, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                mysqli_stmt_bind_param($stmt, "issidsss", $client_id, $new_order_date, $product_name, $quantity, $returned_gallons, $custom_price, $status, $comment);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            } else {
                // Актуализиране на съществуващ продукт
                $row_id = (int)$product_data['row_id'];
                $product_name = $product_data['product'];
                $quantity = (int)$product_data['quantity'];
                $returned_gallons = isset($product_data['returned_gallons']) && $product_data['returned_gallons'] !== '' ? (int)$product_data['returned_gallons'] : null;
                $custom_price = isset($product_data['custom_price']) && $product_data['custom_price'] !== '' ? (float)$product_data['custom_price'] : null;

                $stmt = mysqli_prepare($conn, "UPDATE orders SET product = ?, quantity = ?, returned_gallons = ?, custom_price = ?, comment = ? WHERE id = ?");
                mysqli_stmt_bind_param($stmt, "siidsi", $product_name, $quantity, $returned_gallons, $custom_price, $comment, $row_id);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
        }

        $is_future_date = strtotime($new_order_date) > strtotime(date('Y-m-d'));
        $show_future = $is_future_date ? '1' : (isset($_GET['show_future']) ? $_GET['show_future'] : '0');

        $redirect_params = http_build_query([
            'page' => isset($_GET['page']) ? $_GET['page'] : 1,
            'sort_by' => isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default',
            'show_future' => $show_future,
            'search_client' => isset($_GET['search_client']) ? $_GET['search_client'] : ''
        ]);

        header("Location: index.php?$redirect_params#order_$order_id");
        exit;
    }

    $redirect_params = http_build_query([
        'page' => isset($_GET['page']) ? $_GET['page'] : 1,
        'sort_by' => isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default',
        'show_future' => isset($_GET['show_future']) ? $_GET['show_future'] : '0',
        'search_client' => isset($_GET['search_client']) ? urlencode($_GET['search_client']) : ''
    ]);

    header("Location: index.php?$redirect_params");
    exit;
}

// Автоматично обновяване на статуса на просрочени поръчки на "ПОЗВЪНИ"
$stmt = mysqli_prepare($conn, "UPDATE orders SET status = 'ПОЗВЪНИ' WHERE DATEDIFF(CURDATE(), order_date) > 40 AND status NOT IN ('ОК', 'Доставено', 'Платено')");
mysqli_stmt_execute($stmt);
mysqli_stmt_close($stmt);

// Пагинация и сортиране
$orders_per_page = 100;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $orders_per_page;

$sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default';
$show_future = isset($_GET['show_future']) && $_GET['show_future'] == '1' ? true : false;
$search_client = isset($_GET['search_client']) ? $_GET['search_client'] : '';

$order_by_clause = "ORDER BY o.order_date DESC, o.id DESC";
if ($sort_by == 'date_desc') {
    $order_by_clause = "ORDER BY o.order_date DESC, o.id DESC";
} elseif ($sort_by == 'date_asc') {
    $order_by_clause = "ORDER BY o.order_date ASC, o.id ASC";
}

$where_clause = "WHERE o.order_date <= CURDATE()";
if ($show_future) {
    $where_clause = "WHERE 1=1";
}
if (!empty($search_client)) {
    $where_clause .= " AND c.company_name LIKE ?";
}

$total_orders_query = "SELECT COUNT(DISTINCT o.client_id, o.order_date) as total 
                       FROM orders o 
                       LEFT JOIN clients c ON o.client_id = c.id 
                       $where_clause";
$stmt = mysqli_prepare($conn, $total_orders_query);
if (!empty($search_client)) {
    $search_client_param = "%$search_client%";
    mysqli_stmt_bind_param($stmt, "s", $search_client_param);
}
mysqli_stmt_execute($stmt);
$total_result = mysqli_stmt_get_result($stmt);
$total_orders = mysqli_fetch_assoc($total_result)['total'];
$total_pages = ceil($total_orders / $orders_per_page);
mysqli_stmt_close($stmt);

$start_order_number = $total_orders - ($page - 1) * $orders_per_page;

$orders_query = "SELECT o.id AS order_id, o.client_id, o.order_date, o.status, o.product, o.quantity, o.returned_gallons, o.custom_price, o.comment,
                        c.company_name, c.phone, c.address, c.address_details,
                        p.category, 
                        DATEDIFF(CURDATE(), o.order_date) AS days_diff 
                 FROM orders o 
                 LEFT JOIN clients c ON o.client_id = c.id 
                 LEFT JOIN products p ON o.product = p.name 
                 $where_clause 
                 $order_by_clause";
$stmt = mysqli_prepare($conn, $orders_query);
if (!empty($search_client)) {
    $search_client_param = "%$search_client%";
    mysqli_stmt_bind_param($stmt, "s", $search_client_param);
}
mysqli_stmt_execute($stmt);
$orders_result = mysqli_stmt_get_result($stmt);

$product_info = [];
$prices_query = "SELECT name, price, category FROM products";
$prices_result = mysqli_query($conn, $prices_query);
while ($price_row = mysqli_fetch_assoc($prices_result)) {
    $product_info[$price_row['name']] = [
        'price' => $price_row['price'],
        'category' => $price_row['category']
    ];
}

$all_products = array_keys($product_info);

$raw_orders = [];
while ($row = mysqli_fetch_assoc($orders_result)) {
    $raw_orders[] = $row;
}

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
            'is_overdue' => $row['days_diff'] > 40 && $row['status'] != 'ОК' && $row['status'] != 'Доставено' && $row['status'] != 'Платено',
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
    $grouped_orders[$key]['returned_gallons'] = max($grouped_orders[$key]['returned_gallons'], $row['returned_gallons']);
}

$orders = array_values($grouped_orders);
usort($orders, function($a, $b) {
    if ($a['is_overdue'] && !$b['is_overdue']) return -1;
    if (!$a['is_overdue'] && $b['is_overdue']) return 1;
    return strtotime($b['order_date']) - strtotime($a['order_date']) ?: $b['order_id'] - $a['order_id'];
});

$orders = array_slice($orders, $offset, $orders_per_page);

if (isset($_GET['ajax']) && $_GET['ajax'] == '1') {
    ob_start();
    $order_number = $start_order_number;
    foreach ($orders as $index => $row) {
        $is_overdue = $row['is_overdue'];
        $current_date = date('Y-m-d');
        $order_date = date('Y-m-d', strtotime($row['order_date']));
        $is_today = $order_date == $current_date;
        $row_class = $is_overdue ? 'bg-overdue' : '';
        ?>
        <tr id="order_<?php echo $row['order_id']; ?>" class="<?php echo $row_class; ?> hover:bg-gray-50 transition" data-order-date="<?php echo $order_date; ?>" data-address="<?php echo htmlspecialchars($row['address'] ?? ''); ?>" data-address-details="<?php echo htmlspecialchars($row['address_details'] ?? ''); ?>" data-total-price="<?php echo $row['total_price']; ?>">
            <td class="p-3 border-b border-r text-center"><?php echo $order_number--; ?></td>
            <td class="p-3 border-b border-r text-center">
                <input type="checkbox" class="order_checkbox form-checkbox h-5 w-5 text-blue-600" data-id="<?php echo $row['order_id']; ?>" <?php echo !$is_today ? 'disabled' : ''; ?>>
            </td>
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
                    <select name="status" class="border p-2 rounded-lg <?php echo $is_overdue ? 'bg-white text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'; ?> transition w-full status-select" onchange="this.form.submit()">
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
                    <input type="checkbox" name="called" <?php echo ($row['status'] == 'Доставено' || $row['status'] == 'Платено') ? 'checked' : ''; ?> onchange="this.form.submit()" class="form-checkbox h-5 w-5 text-blue-600">
                    <input type="hidden" name="update_called" value="1">
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
            <td class="p-3 border-b text-center">
                <div class="flex justify-center gap-2">
                    <button type="button" class="edit-order-btn bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 transition" data-index="<?php echo $index; ?>" data-order-id="<?php echo $row['order_id']; ?>" data-products='<?php echo json_encode($row['products']); ?>' data-order-date='<?php echo $row['order_date']; ?>' data-comment='<?php echo htmlspecialchars($row['comment'] ?? ''); ?>'>✏️</button>
                    <form method="POST" class="inline" onsubmit="return confirm('Сигурен ли си, че искаш да изтриеш тази поръчка?');">
                        <input type="hidden" name="order_id" value="<?php echo $row['order_id']; ?>">
                        <button type="submit" name="delete_order" class="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition">🗑️</button>
                    </form>
                </div>
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
    <title>🏠 💧📋 Vodazamen Manager – Начало</title>
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
            .edit-order-btn, .delete-order-btn, .delete-row-btn, .comment-btn, .add-product-btn { display: none; }
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
        .product-row { 
            display: flex; 
            align-items: flex-end; 
            gap: 8px; 
            margin-bottom: 8px; 
            background-color: #f9fafb; 
            padding: 6px; 
            border-radius: 6px; 
        }
        .field-container { flex: 1; }
        .input-field { 
            padding: 6px; 
            font-size: 14px; 
            border-radius: 6px; 
            border: 1px solid #d1d5db; 
            width: 100%; 
        }
        label { 
            font-size: 12px; 
            color: #374151; 
            margin-bottom: 2px; 
        }
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
        .select-today { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 8px; 
            align-items: center; 
        }
        .status-select { 
            font-size: 14px; 
            padding: 4px; 
            min-width: 150px; 
            white-space: normal; 
        }
        .delete-row-btn, .add-product-btn {
            background-color: #dc2626; 
            color: white; 
            padding: 6px; 
            border-radius: 6px; 
            font-size: 14px; 
            transition: background-color 0.2s;
        }
        .delete-row-btn:hover, .add-product-btn:hover {
            background-color: #b91c1c;
        }
        .add-product-btn {
            background-color: #10b981;
        }
        .add-product-btn:hover {
            background-color: #059669;
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
        .comment-field {
            width: 100%;
            min-height: 80px;
            resize: vertical;
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
            th:nth-child(10), td:nth-child(10), th:nth-child(11), td:nth-child(11) { 
                display: table-cell; 
                min-width: 60px; 
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
            .edit-order-btn, .bg-red-500, .delete-row-btn, .comment-btn, .add-product-btn { 
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
            .select-today { 
                flex-direction: column; 
                gap: 4px; 
                align-items: flex-start; 
            }
            .product-row {
                flex-direction: column;
                align-items: stretch;
            }
            .field-container {
                width: 100%;
            }
        }
    </style>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200">
    <div class="container mx-auto bg-white rounded-lg shadow-lg w-full sm:w-11/12 md:w-11/12 lg:w-11/12">
        <?php include 'head.php'; ?>
        <?php include 'menu.php'; ?>

        <h2 class="text-xl font-semibold mt-4">📋 Списък с поръчки</h2>
        <div class="filters-container">
            <div class="filter-buttons">
                <a href="?sort_by=default" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition <?php echo $sort_by == 'default' ? 'font-bold' : ''; ?>">📋 По подразбиране</a>
                <a href="?sort_by=date_desc" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition <?php echo $sort_by == 'date_desc' ? 'font-bold' : ''; ?>">📅 По дата (низходящо)</a>
                <a href="?sort_by=date_asc" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition <?php echo $sort_by == 'date_asc' ? 'font-bold' : ''; ?>">📅 По дата (възходящо)</a>
                <a href="?show_future=1" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition <?php echo $show_future ? 'font-bold' : ''; ?>">👁️ Покажи бъдещи доставки</a>
            </div>

            <div class="search-and-select">
                <div class="flex flex-col gap-2 w-full sm:w-auto">
                    <h3 class="text-lg font-semibold mb-2">🕵️‍♂️ Търсене по клиент</h3>
                    <input type="text" id="client-search" class="border p-2 rounded-lg w-full sm:w-64" value="<?php echo htmlspecialchars($search_client); ?>" autocomplete="off">
                </div>

                <div class="select-today">
                    <label class="mr-2">📅 Избери поръчки за днес:</label>
                    <input type="checkbox" id="select_all_today" class="form-checkbox h-5 w-5 text-blue-600">
                    <button id="print_selected" class="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition" disabled>🖨️ Принтирай избраните</button>
                </div>
            </div>
        </div>

        <div>
            <table class="bg-white border border-gray-300 rounded-lg shadow-md">
                <thead>
                    <tr class="bg-gray-800 text-white">
                        <th class="p-3 border-b border-r text-center">№</th>
                        <th class="p-3 border-b border-r text-center"><input type="checkbox" id="select_all" class="form-checkbox h-5 w-5 text-blue-600"></th>
                        <th class="p-3 border-b border-r text-center">👤 Клиент</th>
                        <th class="p-3 border-b border-r text-center">📞 Номер</th>
                        <th class="p-3 border-b border-r text-center">📅 Дата</th>
                        <th class="p-3 border-b border-r text-center">📦 Продукти</th>
                        <th class="p-3 border-b border-r text-center">♻️ Върнати галони</th>
                        <th class="p-3 border-b border-r text-center">📋 Статус</th>
                        <th class="p-3 border-b border-r text-center">✅ Завършено</th>
                        <th class="p-3 border-b border-r text-center">💰 Цена</th>
                        <th class="p-3 border-b border-r text-center">⚠️</th>
                        <th class="p-3 border-b text-center">⚙️ Действия</th>
                    </tr>
                </thead>
                <tbody id="orders-body">
                    <?php 
                    $order_number = $start_order_number;
                    foreach ($orders as $index => $row) { 
                        $is_overdue = $row['is_overdue'];
                        $current_date = date('Y-m-d');
                        $order_date = date('Y-m-d', strtotime($row['order_date']));
                        $is_today = $order_date == $current_date;
                        $row_class = $is_overdue ? 'bg-overdue' : '';
                    ?>
                        <tr id="order_<?php echo $row['order_id']; ?>" class="<?php echo $row_class; ?> hover:bg-gray-50 transition" data-order-date="<?php echo $order_date; ?>" data-address="<?php echo htmlspecialchars($row['address'] ?? ''); ?>" data-address-details="<?php echo htmlspecialchars($row['address_details'] ?? ''); ?>" data-total-price="<?php echo $row['total_price']; ?>">
                            <td class="p-3 border-b border-r text-center"><?php echo $order_number--; ?></td>
                            <td class="p-3 border-b border-r text-center">
                                <input type="checkbox" class="order_checkbox form-checkbox h-5 w-5 text-blue-600" data-id="<?php echo $row['order_id']; ?>" <?php echo !$is_today ? 'disabled' : ''; ?>>
                            </td>
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
                                    <select name="status" class="border p-2 rounded-lg <?php echo $is_overdue ? 'bg-white text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'; ?> transition w-full status-select" onchange="this.form.submit()">
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
                                    <input type="checkbox" name="called" <?php echo ($row['status'] == 'Доставено' || $row['status'] == 'Платено') ? 'checked' : ''; ?> onchange="this.form.submit()" class="form-checkbox h-5 w-5 text-blue-600">
                                    <input type="hidden" name="update_called" value="1">
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
                            <td class="p-3 border-b text-center">
                                <div class="flex justify-center gap-2">
                                    <button type="button" class="edit-order-btn bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 transition" data-index="<?php echo $index; ?>" data-order-id="<?php echo $row['order_id']; ?>" data-products='<?php echo json_encode($row['products']); ?>' data-order-date='<?php echo $row['order_date']; ?>' data-comment='<?php echo htmlspecialchars($row['comment'] ?? ''); ?>'>✏️</button>
                                    <form method="POST" class="inline" onsubmit="return confirm('Сигурен ли си, че искаш да изтриеш тази поръчка?');">
                                        <input type="hidden" name="order_id" value="<?php echo $row['order_id']; ?>">
                                        <button type="submit" name="delete_order" class="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition">🗑️</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    <?php } ?>
                </tbody>
            </table>
        </div>

        <div class="mt-6 flex justify-center gap-2 items-center">
            <?php
            // Подготвяне на GET параметрите за връзките
            $base_params = http_build_query([
                'sort_by' => $sort_by,
                'show_future' => $show_future ? '1' : '0',
                'search_client' => urlencode($search_client)
            ]);

            // Бутон "Предишна"
            if ($page > 1): ?>
                <a href="?page=<?php echo $page - 1; ?>&<?php echo $base_params; ?>" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">⬅️ Предишна</a>
            <?php endif; ?>

            <?php
            // Логика за номерираните страници
            $range = 2; // Брой страници преди и след текущата
            $start_page = max(2, $page - $range); // Начало на диапазона
            $end_page = min($total_pages - 1, $page + $range); // Край на диапазона

            // Винаги показва първата страница
            ?>
            <a href="?page=1&<?php echo $base_params; ?>" class="p-2 rounded-lg <?php echo $page == 1 ? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'; ?> transition"><?php echo 1; ?></a>
            
            <?php
            // Показва многоточие, ако има пропуск между първата страница и началото на диапазона
            if ($start_page > 2): ?>
                <span class="p-2 text-gray-700">...</span>
            <?php endif; ?>

            <?php
            // Показва страниците в диапазона около текущата
            for ($i = $start_page; $i <= $end_page; $i++): ?>
                <a href="?page=<?php echo $i; ?>&<?php echo $base_params; ?>" class="p-2 rounded-lg <?php echo $page == $i ? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'; ?> transition"><?php echo $i; ?></a>
            <?php endfor; ?>

            <?php
            // Показва многоточие, ако има пропуск между края на диапазона и последната страница
            if ($end_page < $total_pages - 1): ?>
                <span class="p-2 text-gray-700">...</span>
            <?php endif; ?>

            <?php
            // Показва последната страница, ако има повече от една страница
            if ($total_pages > 1): ?>
                <a href="?page=<?php echo $total_pages; ?>&<?php echo $base_params; ?>" class="p-2 rounded-lg <?php echo $page == $total_pages ? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'; ?> transition"><?php echo $total_pages; ?></a>
            <?php endif; ?>

            <?php
            // Бутон "Следваща"
            if ($page < $total_pages): ?>
                <a href="?page=<?php echo $page + 1; ?>&<?php echo $base_params; ?>" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">Следваща ➡️</a>
            <?php endif; ?>
        </div>
    </div>

    <div id="editModal" class="modal">
        <div class="modal-content">
            <span class="close">×</span>
            <h2 class="text-xl font-semibold mb-4">✏️ Редактиране на поръчка</h2>
            <form method="POST" id="editForm">
                <input type="hidden" name="order_id" id="editOrderId">
                <input type="hidden" name="update_order_details" value="1">
                <div class="field-container">
                    <label>📅 Дата на поръчка</label>
                    <input type="date" name="order_date" id="editOrderDate" class="input-field" required>
                </div>
                <div class="field-container mt-4">
                    <label>📝 Допълнителна информация</label>
                    <textarea name="comment" id="editComment" class="input-field comment-field" placeholder="Въведете коментар (ако е необходимо)"></textarea>
                </div>
                <div id="editProducts" class="flex flex-col gap-2 mt-4"></div>
                <button type="button" class="add-product-btn bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition mt-4">➕ Добави продукт</button>
                <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition mt-4">💾 Запази</button>
            </form>
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
                    url: 'index.php',
                    method: 'GET',
                    data: { 
                        search_client: search,
                        ajax: 1,
                        sort_by: '<?php echo $sort_by; ?>',
                        show_future: '<?php echo $show_future ? '1' : '0'; ?>',
                        page: '<?php echo $page; ?>'
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

            const today = '<?php echo date('Y-m-d'); ?>';
            const allProducts = <?php echo json_encode($all_products); ?>;
            const productInfo = <?php echo json_encode($product_info); ?>;

            function setupEventListeners() {
                $('.order_checkbox').each(function() {
                    const orderDate = $(this).closest('tr').data('order-date');
                    if (orderDate === today) {
                        $(this).prop('checked', false);
                        $(this).prop('disabled', false);
                    } else {
                        $(this).prop('checked', false);
                        $(this).prop('disabled', true);
                    }
                });

                $('#select_all_today').off('change').on('change', function() {
                    const isChecked = $(this).is(':checked');
                    $('.order_checkbox').each(function() {
                        const orderDate = $(this).closest('tr').data('order-date');
                        if (orderDate === today) {
                            $(this).prop('checked', isChecked);
                            $(this).prop('disabled', false);
                        } else {
                            $(this).prop('checked', false);
                            $(this).prop('disabled', true);
                        }
                    });
                    $('#print_selected').prop('disabled', !isChecked && $('.order_checkbox:checked').length === 0);
                });

                $('.order_checkbox').off('change').on('change', function() {
                    const anyChecked = $('.order_checkbox:checked').length > 0;
                    $('#print_selected').prop('disabled', !anyChecked);
                    const allTodayChecked = $('.order_checkbox').filter(function() {
                        const orderDate = $(this).closest('tr').data('order-date');
                        return orderDate === today && !$(this).is(':disabled');
                    }).length === $('.order_checkbox:checked').length;
                    $('#select_all_today').prop('checked', allTodayChecked);
                });

                $('#select_all').off('change').on('change', function() {
                    const isChecked = $(this).is(':checked');
                    $('.order_checkbox').each(function() {
                        const orderDate = $(this).closest('tr').data('order-date');
                        if (orderDate === today) {
                            $(this).prop('checked', isChecked);
                            $(this).prop('disabled', false);
                        } else {
                            $(this).prop('checked', false);
                            $(this).prop('disabled', true);
                        }
                    });
                    $('#print_selected').prop('disabled', !isChecked);
                    $('#select_all_today').prop('checked', isChecked);
                });

                $('.edit-order-btn').off('click').on('click', function() {
                    const orderId = $(this).data('order-id');
                    const products = $(this).data('products');
                    const orderDate = $(this).data('order-date');
                    const comment = $(this).data('comment');
                    const modal = $('#editModal');
                    const editProductsDiv = $('#editProducts');
                    editProductsDiv.empty();
                    $('#editOrderId').val(orderId);
                    $('#editOrderDate').val(orderDate);
                    $('#editComment').val(comment);

                    $.each(products, function(index, product) {
                        const displayPrice = product.custom_price !== null ? product.custom_price : product.price;
                        let html = `
                            <div class="product-row" data-index="${index}" data-row-id="${product.row_id}">
                                <div class="field-container">
                                    <label>📝 Продукт</label>
                                    <select name="products[${index}][product]" class="input-field product-select" required>
                        `;
                        allProducts.forEach(function(prod) {
                            html += `<option value="${prod}" ${prod === product.name ? 'selected' : ''}>${prod}</option>`;
                        });
                        html += `
                                    </select>
                                </div>
                                <div class="field-container">
                                    <label>📏 Количество</label>
                                    <input type="number" name="products[${index}][quantity]" value="${product.quantity}" min="0" class="input-field" required>
                                    <input type="hidden" name="products[${index}][row_id]" value="${product.row_id}">
                                </div>
                        `;
                        if (product.category === 'Вода') {
                            html += `
                                <div class="field-container">
                                    <label>♻️ Върнати галони</label>
                                    <input type="number" name="products[${index}][returned_gallons]" value="${product.returned_gallons || ''}" min="0" class="input-field" placeholder="-">
                                </div>
                            `;
                        }
                        html += `
                                <div class="field-container">
                                    <label>💸 Цена</label>
                                    <input type="number" name="products[${index}][custom_price]" value="${displayPrice}" min="0" step="0.01" class="input-field" placeholder="Стандартна цена">
                                </div>
                                <button type="button" class="delete-row-btn" data-row-id="${product.row_id}" data-order-id="${orderId}">🗑️ Изтрий</button>
                            </div>`;
                        editProductsDiv.append(html);
                    });

                    $('.product-select').on('change', function() {
                        const row = $(this).closest('.product-row');
                        const selectedProduct = $(this).val();
                        const category = productInfo[selectedProduct].category;
                        const returnedGallonsField = row.find('input[name$="[returned_gallons]"]');
                        if (category === 'Вода' && returnedGallonsField.length === 0) {
                            row.find('.field-container').eq(1).after(`
                                <div class="field-container">
                                    <label>♻️ Върнати галони</label>
                                    <input type="number" name="products[${row.data('index')}][returned_gallons]" value="" min="0" class="input-field" placeholder="-">
                                </div>
                            `);
                        } else if (category !== 'Вода') {
                            returnedGallonsField.closest('.field-container').remove();
                        }
                    });

                    modal.show();
                });

                $('.add-product-btn').off('click').on('click', function() {
                    const editProductsDiv = $('#editProducts');
                    const newIndex = editProductsDiv.find('.product-row').length;
                    let html = `
                        <div class="product-row" data-index="${newIndex}">
                            <div class="field-container">
                                <label>📝 Продукт</label>
                                <select name="products[${newIndex}][product]" class="input-field product-select" required>
                    `;
                    allProducts.forEach(function(prod) {
                        html += `<option value="${prod}">${prod}</option>`;
                    });
                    html += `
                                </select>
                            </div>
                            <div class="field-container">
                                <label>📏 Количество</label>
                                <input type="number" name="products[${newIndex}][quantity]" value="1" min="0" class="input-field" required>
                                <input type="hidden" name="products[${newIndex}][is_new]" value="1">
                            </div>
                    `;
                    if (productInfo[allProducts[0]].category === 'Вода') {
                        html += `
                            <div class="field-container">
                                <label>♻️ Върнати галони</label>
                                <input type="number" name="products[${newIndex}][returned_gallons]" value="" min="0" class="input-field" placeholder="-">
                            </div>
                        `;
                    }
                    html += `
                            <div class="field-container">
                                <label>💸 Цена</label>
                                <input type="number" name="products[${newIndex}][custom_price]" value="" min="0" step="0.01" class="input-field" placeholder="Стандартна цена">
                            </div>
                            <button type="button" class="delete-row-btn" data-order-id="${$('#editOrderId').val()}">🗑️ Изтрий</button>
                        </div>`;
                    editProductsDiv.append(html);

                    $('.product-select').off('change').on('change', function() {
                        const row = $(this).closest('.product-row');
                        const selectedProduct = $(this).val();
                        const category = productInfo[selectedProduct].category;
                        const returnedGallonsField = row.find('input[name$="[returned_gallons]"]');
                        if (category === 'Вода' && returnedGallonsField.length === 0) {
                            row.find('.field-container').eq(1).after(`
                                <div class="field-container">
                                    <label>♻️ Върнати галони</label>
                                    <input type="number" name="products[${row.data('index')}][returned_gallons]" value="" min="0" class="input-field" placeholder="-">
                                </div>
                            `);
                        } else if (category !== 'Вода') {
                            returnedGallonsField.closest('.field-container').remove();
                        }
                    });
                });

                $('.close').off('click').on('click', function() {
                    $('#editModal').hide();
                    $('#commentModal').hide();
                });

                $(document).off('click', '.delete-row-btn').on('click', '.delete-row-btn', function() {
                    if (!confirm('Сигурен ли си, че искаш да изтриеш този ред от поръчката?')) {
                        return;
                    }
                    const rowId = $(this).data('row-id');
                    const orderId = $(this).data('order-id');
                    const rowElement = $(this).closest('.product-row');
                    const index = rowElement.data('index');

                    if (rowId) {
                        $.ajax({
                            url: 'index.php',
                            method: 'POST',
                            data: {
                                delete_order_row: 1,
                                row_id: rowId,
                                order_id: orderId,
                                sort_by: '<?php echo $sort_by; ?>',
                                show_future: '<?php echo $show_future ? '1' : '0'; ?>',
                                page: '<?php echo $page; ?>',
                                search_client: '<?php echo urlencode($search_client); ?>'
                            },
                            success: function() {
                                rowElement.remove();
                                const remainingRows = $('#editProducts .product-row').length;
                                if (remainingRows === 0) {
                                    $('#editModal').hide();
                                    $.ajax({
                                        url: 'index.php',
                                        method: 'GET',
                                        data: { 
                                            search_client: '<?php echo urlencode($search_client); ?>',
                                            ajax: 1,
                                            sort_by: '<?php echo $sort_by; ?>',
                                            show_future: '<?php echo $show_future ? '1' : '0'; ?>',
                                            page: '<?php echo $page; ?>'
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
                                            console.error('Грешка при обновяване на таблицата:', error);
                                        }
                                    });
                                } else {
                                    const editButton = $(`.edit-order-btn[data-order-id="${orderId}"]`);
                                    let products = editButton.data('products');
                                    products = products.filter((_, i) => i !== index);
                                    editButton.data('products', products);
                                }
                            },
                            error: function(xhr, status, error) {
                                console.error('Грешка при изтриване на ред:', error);
                                alert('Грешка при изтриване на реда. Моля, опитай отново.');
                            }
                        });
                    } else {
                        rowElement.remove();
                    }
                });

                $('.comment-btn').off('click').on('click', function() {
                    const comment = $(this).data('comment');
                    $('#commentText').text(comment);
                    $('#commentModal').show();
                });

                $('#print_selected').off('click').on('click', function() {
                    const selectedOrders = [];
                    $('.order_checkbox:checked').each(function() {
                        const orderId = $(this).data('id');
                        const row = $(this).closest('tr');
                        const orderNumber = row.find('td:nth-child(1)').text();
                        const client = row.find('td:nth-child(3)').text();
                        const phone = row.find('td:nth-child(4)').text();
                        const date = row.find('td:nth-child(5)').text();
                        const product = row.find('.product-cell').html();
                        const returned_gallons = row.find('td:nth-child(7)').text();
                        const address = row.data('address') || '';
                        const address_details = row.data('address-details') || '';
                        const total_price = row.data('total-price') || 0;
                        const comment = row.find('.comment-btn').data('comment') || '';
                        selectedOrders.push({
                            orderNumber, client, phone, date, product, returned_gallons, address, address_details, total_price, comment
                        });
                    });

                    if (selectedOrders.length > 0) {
                        const form = $('<form>', {
                            action: 'print_orders.php',
                            method: 'POST',
                            target: '_blank'
                        }).append(
                            $('<input>', {
                                type: 'hidden',
                                name: 'orders',
                                value: JSON.stringify(selectedOrders)
                            })
                        ).appendTo('body');
                        form.submit();
                        form.remove();
                    }
                });
            }

            setupEventListeners();

            $(window).on('click', function(event) {
                if ($(event.target).is('#editModal')) {
                    $('#editModal').hide();
                }
                if ($(event.target).is('#commentModal')) {
                    $('#commentModal').hide();
                }
            });
        });
    </script>
</body>
</html>