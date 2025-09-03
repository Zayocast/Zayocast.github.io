<?php
ini_set('display_errors', 0);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
date_default_timezone_set('Europe/Sofia');
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

include 'db_connect.php';
if (!$conn) {
    error_log("Database connection error: " . mysqli_connect_error());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Проверка и създаване на таблици, ако не съществуват
$queries = [
    "CREATE TABLE IF NOT EXISTS company_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        eic VARCHAR(20),
        address VARCHAR(255),
        vat_number VARCHAR(20),
        phone VARCHAR(20),
        email VARCHAR(100),
        logo_path VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci",
    "CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        invoice_number VARCHAR(20) NOT NULL,
        invoice_date DATE NOT NULL,
        invoice_type ENUM('Original', 'Copy') NOT NULL,
        order_ids VARCHAR(255) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        vat_rate DECIMAL(5,2) DEFAULT 0.00,
        pdf_path VARCHAR(255),
        payment_method VARCHAR(50) DEFAULT 'Cash',
        document_type ENUM('Invoice', 'DeliveryNote') DEFAULT 'Invoice',
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci"
];

foreach ($queries as $query) {
    if (!mysqli_query($conn, $query)) {
        die("Table creation failed: " . mysqli_error($conn));
    }
}

// Извличане на данни за фирмата
$company_query = "SELECT * FROM company_details LIMIT 1";
$company_result = mysqli_query($conn, $company_query);
$company = mysqli_fetch_assoc($company_result) ?: [
    'company_name' => 'Сток 2016 ЕООД',
    'eic' => '204140119',
    'address' => 'БЪЛГАРИЯ, с. Синитово, 5, 20',
    'vat_number' => '',
    'phone' => '0879101771',
    'email' => 'info@vodazamen.com',
    'logo_path' => ''
];

// AJAX за поръчки на клиент
if (isset($_GET['client_id']) && !isset($_POST['generate_document']) && !isset($_POST['reprint_invoice'])) {
    $client_id = (int)$_GET['client_id'];
    $orders_query = "SELECT o.id, o.client_id, o.order_date, o.product, o.quantity, o.custom_price, c.company_name 
                     FROM orders o 
                     LEFT JOIN clients c ON o.client_id = c.id 
                     WHERE o.client_id = ? AND o.invoiced = 0"; // Добавяме условие за нефактурирани
    $stmt = mysqli_prepare($conn, $orders_query);
    mysqli_stmt_bind_param($stmt, "i", $client_id);
    mysqli_stmt_execute($stmt);
    $orders_result = mysqli_stmt_get_result($stmt);
    
    header('Content-Type: text/html; charset=UTF-8');
    ob_start();
    if (mysqli_num_rows($orders_result) > 0) {
?>
<div id="orders-container">
    <label class="block text-sm font-medium text-gray-700">📦 Поръчки</label>
    <table class="min-w-full bg-white border border-gray-300 rounded-lg shadow-md mt-2" id="orders-table">
        <thead>
            <tr class="bg-gray-800 text-white">
                <th class="p-3 border-b border-r text-center"><input type="checkbox" id="select_all" class="form-checkbox h-5 w-5 text-blue-600"></th>
                <th class="p-3 border-b border-r text-center">Клиент</th>
                <th class="p-3 border-b border-r text-center">Дата</th>
                <th class="p-3 border-b border-r text-center">Продукт</th>
                <th class="p-3 border-b border-r text-center">Количество</th>
                <th class="p-3 border-b text-center">Цена (лв.)</th>
            </tr>
        </thead>
        <tbody>
            <?php while ($order = mysqli_fetch_assoc($orders_result)): ?>
                <tr class="bg-gray-50 hover:bg-gray-100 transition">
                    <td class="p-3 border-b border-r text-center">
                        <input type="checkbox" name="order_ids[]" value="<?php echo $order['id']; ?>" class="order_checkbox form-checkbox h-5 w-5 text-blue-600">
                    </td>
                    <td class="p-3 border-b border-r text-center"><?php echo htmlspecialchars($order['company_name']); ?></td>
                    <td class="p-3 border-b border-r text-center"><?php echo date('d.m.Y', strtotime($order['order_date'])); ?></td>
                    <td class="p-3 border-b border-r text-center"><?php echo htmlspecialchars($order['product']); ?></td>
                    <td class="p-3 border-b border-r text-center"><?php echo $order['quantity']; ?></td>
                    <td class="p-3 border-b text-center"><?php echo number_format($order['custom_price'] ?? mysqli_fetch_assoc(mysqli_query($conn, "SELECT price FROM products WHERE name = '" . mysqli_real_escape_string($conn, $order['product']) . "'"))['price'] ?? 0, 2, '.', ''); ?></td>
                </tr>
            <?php endwhile; ?>
        </tbody>
    </table>
</div>
<?php
        echo ob_get_clean();
    } else {
        echo '<div id="orders-container"><label class="block text-sm font-medium text-gray-700">📦 Поръчки</label><p class="text-red-500">Няма нефактурирани поръчки за този клиент.</p></div>';
    }
    exit;
}

// AJAX за репринт
if (isset($_POST['reprint_invoice'])) {
    $invoice_id = (int)$_POST['invoice_id'];
    $invoice_type = $_POST['invoice_type'] ?? 'Original';

    $query = "SELECT invoice_number, document_type FROM invoices WHERE id = ?";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "i", $invoice_id);
    mysqli_stmt_execute($stmt);
    $invoice = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    if ($invoice) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'url' => "view_invoice.php?invoice_number=" . urlencode($invoice['invoice_number']) . "&document_type=" . urlencode($invoice['document_type']) . "&invoice_type=" . urlencode($invoice_type)
        ]);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Invoice not found']);
    }
    exit;
}

// AJAX за история на документите с търсене и пагинация
if (isset($_GET['ajax']) && $_GET['ajax'] == '1') {
    $per_page = 20;
    $page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
    $offset = ($page - 1) * $per_page;

    $sort_by = $_GET['sort_by'] ?? 'date_desc';
    $search_client = $_GET['search_client'] ?? '';
    $search_invoice_number = $_GET['search_invoice_number'] ?? '';

    $order_by_clause = $sort_by == 'date_asc' ? "ORDER BY i.invoice_date ASC, i.id ASC" : "ORDER BY i.invoice_date DESC, i.id DESC";
    $where_clause = "WHERE 1=1";
    $params = [];
    $types = '';
    if (!empty($search_client)) {
        $where_clause .= " AND c.company_name LIKE ?";
        $params[] = "%$search_client%";
        $types .= 's';
    }
    if (!empty($search_invoice_number)) {
        $where_clause .= " AND i.invoice_number LIKE ?";
        $params[] = "%$search_invoice_number%";
        $types .= 's';
    }

    $total_query = "SELECT COUNT(DISTINCT i.invoice_number, i.document_type) as total 
                    FROM invoices i 
                    LEFT JOIN clients c ON i.client_id = c.id 
                    $where_clause";
    $stmt = mysqli_prepare($conn, $total_query);
    if (!empty($params)) {
        mysqli_stmt_bind_param($stmt, $types, ...$params);
    }
    mysqli_stmt_execute($stmt);
    $total_result = mysqli_stmt_get_result($stmt);
    $total_invoices = mysqli_fetch_assoc($total_result)['total'];
    $total_pages = ceil($total_invoices / $per_page);
    mysqli_stmt_close($stmt);

    $invoices_query = "SELECT i.id, i.invoice_number, i.invoice_date, i.client_id, i.document_type, i.total_amount, c.company_name 
                       FROM invoices i 
                       LEFT JOIN clients c ON i.client_id = c.id 
                       $where_clause 
                       GROUP BY i.invoice_number, i.document_type 
                       $order_by_clause 
                       LIMIT ? OFFSET ?";
    $stmt = mysqli_prepare($conn, $invoices_query);
    $params[] = $per_page;
    $params[] = $offset;
    $types .= 'ii';
    mysqli_stmt_bind_param($stmt, $types, ...$params);
    mysqli_stmt_execute($stmt);
    $invoices_result = mysqli_stmt_get_result($stmt);

    ob_start();
?>
<table class="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
    <thead>
        <tr class="bg-gray-800 text-white">
            <th class="p-3 border-b border-r text-center">Номер</th>
            <th class="p-3 border-b border-r text-center">Дата</th>
            <th class="p-3 border-b border-r text-center">Клиент</th>
            <th class="p-3 border-b border-r text-center">Тип</th>
            <th class="p-3 border-b border-r text-center">Обща сума</th>
            <th class="p-3 border-b text-center">Действия</th>
        </tr>
    </thead>
    <tbody>
        <?php while ($invoice = mysqli_fetch_assoc($invoices_result)): ?>
            <tr class="bg-gray-50 hover:bg-gray-100 transition">
                <td class="p-3 border-b border-r text-center"><?php echo htmlspecialchars($invoice['invoice_number']); ?></td>
                <td class="p-3 border-b border-r text-center"><?php echo date('d.m.Y', strtotime($invoice['invoice_date'])); ?></td>
                <td class="p-3 border-b border-r text-center"><?php echo htmlspecialchars($invoice['company_name']); ?></td>
                <td class="p-3 border-b border-r text-center"><?php echo $invoice['document_type'] === 'Invoice' ? 'Фактура' : 'Стокова Разписка'; ?></td>
                <td class="p-3 border-b border-r text-center"><?php echo number_format($invoice['total_amount'], 2, '.', '') . ' лв.'; ?></td>
                <td class="p-3 border-b text-center">
                    <select name="reprint_type" id="reprint_type_<?php echo $invoice['id']; ?>" class="border border-gray-300 rounded-md p-1 mr-2">
                        <option value="Original">Оригинал</option>
                        <option value="Copy">Копие</option>
                    </select>
                    <button class="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 transition reprint-invoice" data-invoice-id="<?php echo $invoice['id']; ?>">🖨️ Печат</button>
                </td>
            </tr>
        <?php endwhile; ?>
    </tbody>
</table>
<?php
    echo ob_get_clean();
    exit;
}

// Основен интерфейс
$clients_result = mysqli_query($conn, "SELECT id, company_name FROM clients");
$per_page = 20;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $per_page;
$sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'date_desc';
$search_client = isset($_GET['search_client']) ? $_GET['search_client'] : '';
$search_invoice_number = isset($_GET['search_invoice_number']) ? $_GET['search_invoice_number'] : '';

$order_by_clause = $sort_by == 'date_asc' ? "ORDER BY i.invoice_date ASC, i.id ASC" : "ORDER BY i.invoice_date DESC, i.id DESC";
$where_clause = "WHERE 1=1";
$params = [];
$types = '';
if (!empty($search_client)) {
    $where_clause .= " AND c.company_name LIKE ?";
    $params[] = "%$search_client%";
    $types .= 's';
}
if (!empty($search_invoice_number)) {
    $where_clause .= " AND i.invoice_number LIKE ?";
    $params[] = "%$search_invoice_number%";
    $types .= 's';
}

$total_query = "SELECT COUNT(DISTINCT i.invoice_number, i.document_type) as total 
                FROM invoices i 
                LEFT JOIN clients c ON i.client_id = c.id 
                $where_clause";
$stmt = mysqli_prepare($conn, $total_query);
if (!empty($params)) {
    mysqli_stmt_bind_param($stmt, $types, ...$params);
}
mysqli_stmt_execute($stmt);
$total_result = mysqli_stmt_get_result($stmt);
$total_invoices = mysqli_fetch_assoc($total_result)['total'];
$total_pages = ceil($total_invoices / $per_page);
mysqli_stmt_close($stmt);

$invoices_query = "SELECT i.id, i.invoice_number, i.invoice_date, i.client_id, i.document_type, i.total_amount, c.company_name 
                   FROM invoices i 
                   LEFT JOIN clients c ON i.client_id = c.id 
                   $where_clause 
                   GROUP BY i.invoice_number, i.document_type 
                   $order_by_clause 
                   LIMIT ? OFFSET ?";
$stmt = mysqli_prepare($conn, $invoices_query);
$params[] = $per_page;
$params[] = $offset;
$types .= 'ii';
mysqli_stmt_bind_param($stmt, $types, ...$params);
mysqli_stmt_execute($stmt);
$invoices_result = mysqli_stmt_get_result($stmt);
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Издаване на Документ</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        .container { padding: 16px; max-width: 800px; margin: 0 auto; }
        .modal { display: none; position: fixed; z-index: 50; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); }
        .modal-content { background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 90%; max-width: 500px; border-radius: 8px; }
        .close { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
        .close:hover, .close:focus { color: black; text-decoration: none; }
        #client-suggestions { position: absolute; background-color: white; border: 1px solid #d1d5db; border-radius: 4px; width: 100%; max-height: 200px; overflow-y: auto; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        #client-suggestions li { padding: 8px; cursor: pointer; }
        #client-suggestions li:hover { background-color: #f3f4f6; }
        .input-field, select { padding: 8px; font-size: 14px; border-radius: 6px; border: 1px solid #d1d5db; width: 100%; }
        .bg-blue-500, .bg-green-500, .bg-red-500, .bg-yellow-500 { background-color: #1F2937 !important; }
        .bg-blue-500:hover, .bg-green-500:hover, .bg-red-500:hover, .bg-yellow-500:hover { background-color: #374151 !important; }
        .text-white { color: white !important; }
    </style>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200">
    <div class="container mx-auto bg-white p-6 rounded-lg shadow-lg">
         <?php include 'head.php'; ?>
        <?php include 'menu.php'; ?>
        
        <h2 class="text-xl font-semibold mb-4">Избери клиент и поръчки</h2>
        <form method="POST" action="generate_invoice.php" class="flex flex-col gap-6">
            <div class="relative">
                <label for="client-search" class="block text-sm font-medium text-gray-700">👤 Клиент (Търсене)</label>
                <input type="text" id="client-search" placeholder="Търси по име..." class="input-field mt-1" required>
                <input type="hidden" name="client_id" id="client-id">
                <ul id="client-suggestions" class="hidden"></ul>
            </div>
            <div>
                <label for="client-dropdown" class="block text-sm font-medium text-gray-700">👤 Клиент (Падащо меню)</label>
                <select id="client-dropdown" name="client_id" class="input-field mt-1" onchange="updateOrders(this.value); $('#client-search').val($(this).find('option:selected').text()); $('#client-id').val(this.value);">
                    <option value="">Избери клиент</option>
                    <?php 
                    mysqli_data_seek($clients_result, 0);
                    while ($client = mysqli_fetch_assoc($clients_result)): ?>
                        <option value="<?php echo $client['id']; ?>"><?php echo htmlspecialchars($client['company_name']); ?></option>
                    <?php endwhile; ?>
                </select>
            </div>
            <div id="orders-container"></div>
            <div>
                <label for="document_type" class="block text-sm font-medium text-gray-700">📜 Тип документ</label>
                <select name="document_type" id="document_type" class="input-field mt-1" required>
                    <option value="Invoice">Фактура</option>
                    <option value="DeliveryNote">Стокова Разписка</option>
                </select>
            </div>
            <div>
                <label for="vat_rate" class="block text-sm font-medium text-gray-700">% ДДС</label>
                <select name="vat_rate" id="vat_rate" class="input-field mt-1" required>
                    <option value="0.00">0%</option>
                    <option value="20.00">20%</option>
                </select>
            </div>
            <div>
                <label for="payment_method" class="block text-sm font-medium text-gray-700">💳 Начин на плащане</label>
                <select name="payment_method" id="payment_method" class="input-field mt-1">
                    <option value="Cash">Брой</option>
                    <option value="BankTransfer">Банков превод</option>
                    <option value="Card">Карта</option>
                </select>
            </div>
            <button type="submit" name="generate_document" class="bg-green-500 text-white px-6 py-3 rounded-lg shadow hover:bg-green-600 transition">📄 Издаване</button>
        </form>

        <h2 class="text-xl font-semibold mt-6 mb-4">📜 История на документите</h2>
        <div class="flex flex-col gap-4 mb-6">
            <div class="flex gap-4 items-center">
                <a href="?sort_by=default" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition <?php echo $sort_by == 'default' ? 'font-bold' : ''; ?>">📋 По подразбиране</a>
                <a href="?sort_by=date_desc" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition <?php echo $sort_by == 'date_desc' ? 'font-bold' : ''; ?>">📅 По дата (низходящо)</a>
                <a href="?sort_by=date_asc" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition <?php echo $sort_by == 'date_asc' ? 'font-bold' : ''; ?>">📅 По дата (възходящо)</a>
            </div>
            <div class="flex flex-col gap-2">
                <h3 class="text-lg font-semibold mb-2">🕵️‍♂️ Търсене</h3>
                <div class="flex gap-4">
                    <div class="w-1/2">
                        <label for="search-client" class="block text-sm font-medium text-gray-700">👤 Клиент</label>
                        <input type="text" id="search-client" class="border p-2 rounded-lg w-full" value="<?php echo htmlspecialchars($search_client); ?>" autocomplete="off">
                    </div>
                    <div class="w-1/2">
                        <label for="search-invoice-number" class="block text-sm font-medium text-gray-700">📋 Номер на документ</label>
                        <input type="text" id="search-invoice-number" class="border p-2 rounded-lg w-full" value="<?php echo htmlspecialchars($search_invoice_number); ?>" autocomplete="off">
                    </div>
                </div>
            </div>
        </div>

        <table class="min-w-full bg-white border border-gray-300 rounded-lg shadow-md" id="invoices-table">
            <thead>
                <tr class="bg-gray-800 text-white">
                    <th class="p-3 border-b border-r text-center">Номер</th>
                    <th class="p-3 border-b border-r text-center">Дата</th>
                    <th class="p-3 border-b border-r text-center">Клиент</th>
                    <th class="p-3 border-b border-r text-center">Тип</th>
                    <th class="p-3 border-b border-r text-center">Обща сума</th>
                    <th class="p-3 border-b text-center">Действия</th>
                </tr>
            </thead>
            <tbody>
                <?php while ($invoice = mysqli_fetch_assoc($invoices_result)): ?>
                    <tr class="bg-gray-50 hover:bg-gray-100 transition">
                        <td class="p-3 border-b border-r text-center"><?php echo htmlspecialchars($invoice['invoice_number']); ?></td>
                        <td class="p-3 border-b border-r text-center"><?php echo date('d.m.Y', strtotime($invoice['invoice_date'])); ?></td>
                        <td class="p-3 border-b border-r text-center"><?php echo htmlspecialchars($invoice['company_name']); ?></td>
                        <td class="p-3 border-b border-r text-center"><?php echo $invoice['document_type'] === 'Invoice' ? 'Фактура' : 'Стокова Разписка'; ?></td>
                        <td class="p-3 border-b border-r text-center"><?php echo number_format($invoice['total_amount'], 2, '.', '') . ' лв.'; ?></td>
                        <td class="p-3 border-b text-center">
                            <select name="reprint_type" id="reprint_type_<?php echo $invoice['id']; ?>" class="border border-gray-300 rounded-md p-1 mr-2">
                                <option value="Original">Оригинал</option>
                                <option value="Copy">Копие</option>
                            </select>
                            <button class="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 transition reprint-invoice" data-invoice-id="<?php echo $invoice['id']; ?>">🖨️ Печат</button>
                        </td>
                    </tr>
                <?php endwhile; ?>
            </tbody>
        </table>

        <div class="mt-6 flex justify-center gap-2 pagination">
            <?php if ($page > 1): ?>
                <a href="?page=<?php echo $page - 1; ?>&sort_by=<?php echo $sort_by; ?>&search_client=<?php echo urlencode($search_client); ?>&search_invoice_number=<?php echo urlencode($search_invoice_number); ?>" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">⬅️ Предишна</a>
            <?php endif; ?>
            <span class="p-2">📄 Страница <?php echo $page; ?> от <?php echo $total_pages; ?></span>
            <?php if ($page < $total_pages): ?>
                <a href="?page=<?php echo $page + 1; ?>&sort_by=<?php echo $sort_by; ?>&search_client=<?php echo urlencode($search_client); ?>&search_invoice_number=<?php echo urlencode($search_invoice_number); ?>" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">Следваща ➡️</a>
            <?php endif; ?>
        </div>
    </div>

    <script>
    $(document).ready(function() {
        $('form').on('submit', function(e) {
            e.preventDefault();
            let formData = $(this).serialize();
            formData += '&generate_document=1'; // Добавяме generate_document ръчно
            $.ajax({
                url: $(this).attr('action'),
                method: 'POST',
                data: formData,
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        window.open('view_invoice.php?invoice_number=' + encodeURIComponent(response.invoice_number) + '&document_type=' + encodeURIComponent(response.document_type) + '&invoice_type=Original', '_blank');
                    } else {
                        alert('Грешка: ' + response.error);
                    }
                },
                error: function(xhr, status, error) {
                    alert('Грешка при генериране на документа: ' + error);
                }
            });
        });

        $('#select_all').on('change', function() {
            $('.order_checkbox').prop('checked', $(this).is(':checked'));
        });

        $('.reprint-invoice').on('click', function() {
            const invoiceId = $(this).data('invoice-id');
            const invoiceType = $('#reprint_type_' + invoiceId).val();
            $.ajax({
                url: 'invoice.php',
                method: 'POST',
                data: { reprint_invoice: true, invoice_id: invoiceId, invoice_type: invoiceType },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        window.open(response.url, '_blank');
                    } else {
                        alert('Грешка при репринт: ' + response.error);
                    }
                }
            });
        });

        $('#client-search').on('input', function() {
            const query = $(this).val();
            const suggestions = $('#client-suggestions');
            suggestions.empty();
            <?php
            mysqli_data_seek($clients_result, 0);
            while ($row = mysqli_fetch_assoc($clients_result)): ?>
                if (query.toLowerCase().split(' ').some(q => '<?php echo strtolower($row['company_name']); ?>'.toLowerCase().includes(q))) {
                    const li = $('<li>').text('<?php echo $row['company_name']; ?>').addClass('p-2 hover:bg-gray-200 cursor-pointer').on('click', function() {
                        $('#client-search').val('<?php echo $row['company_name']; ?>');
                        $('#client-id').val('<?php echo $row['id']; ?>');
                        $('#client-dropdown').val('<?php echo $row['id']; ?>');
                        suggestions.addClass('hidden');
                        updateOrders('<?php echo $row['id']; ?>');
                    });
                    suggestions.append(li);
                }
            <?php endwhile; ?>
            if (query.length > 1) {
                suggestions.removeClass('hidden');
            } else {
                suggestions.addClass('hidden');
            }
        });

        $(document).on('click', function(e) {
            if (!$('#client-search').is(e.target) && !$('#client-suggestions').is(e.target) && $('#client-suggestions').has(e.target).length === 0) {
                $('#client-suggestions').addClass('hidden');
            }
        });

        function updateOrders(clientId) {
            if (clientId) {
                $.ajax({
                    url: 'invoice.php',
                    method: 'GET',
                    data: { client_id: clientId },
                    success: function(response) {
                        $('#orders-container').html(response);
                        $('#select_all').off('change').on('change', function() {
                            $('.order_checkbox').prop('checked', $(this).is(':checked'));
                        });
                    }
                });
            } else {
                $('#orders-container').html('');
            }
        }

        $('#search-client, #search-invoice-number').on('input', function() {
            let searchClient = $('#search-client').val();
            let searchInvoiceNumber = $('#search-invoice-number').val();
            $.ajax({
                url: 'invoice.php',
                method: 'GET',
                data: { 
                    ajax: 1,
                    search_client: searchClient,
                    search_invoice_number: searchInvoiceNumber,
                    sort_by: '<?php echo $sort_by; ?>',
                    page: '<?php echo $page; ?>'
                },
                success: function(response) {
                    $('#invoices-table').html(response);
                    updatePagination(searchClient, searchInvoiceNumber);
                }
            });
        });

        function updatePagination(searchClient, searchInvoiceNumber) {
            let page = '<?php echo $page; ?>';
            let totalPages = '<?php echo $total_pages; ?>';
            let paginationHtml = '';
            if (page > 1) {
                paginationHtml += '<a href="?page=' + (page - 1) + '&sort_by=<?php echo $sort_by; ?>&search_client=' + encodeURIComponent(searchClient) + '&search_invoice_number=' + encodeURIComponent(searchInvoiceNumber) + '" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">⬅️ Предишна</a>';
            }
            paginationHtml += '<span class="p-2">📄 Страница ' + page + ' от ' + totalPages + '</span>';
            if (page < totalPages) {
                paginationHtml += '<a href="?page=' + (parseInt(page) + 1) + '&sort_by=<?php echo $sort_by; ?>&search_client=' + encodeURIComponent(searchClient) + '&search_invoice_number=' + encodeURIComponent(searchInvoiceNumber) + '" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">Следваща ➡️</a>';
            }
            $('.pagination').html(paginationHtml);
        }

        updatePagination('<?php echo htmlspecialchars($search_client); ?>', '<?php echo htmlspecialchars($search_invoice_number); ?>');
    });
    </script>
     <?php include 'footer.php'; ?>
</body>
</html>