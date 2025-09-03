<?php
// Проверка за бял интервал – увери се, че няма празни редове или интервали преди този таг!

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

ob_start();

include 'db_connect.php';
require('fpdf/fpdf.php');

$error = "";
$client = null;
$orders = [];
$selected_orders = [];

// Проверка за клиент чрез GET или POST
if (isset($_GET['client_id']) && !empty($_GET['client_id']) && is_numeric($_GET['client_id'])) {
    $client_id = (int)$_GET['client_id'];
    
    // Извличане на данни за клиента
    $stmt = mysqli_prepare($conn, "SELECT company_name, phone, eik, address FROM clients WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $client_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $client = mysqli_fetch_assoc($result);
    
    if (!$client) {
        $error = "Клиентът не е намерен.";
    } else {
        // Извличане на всички поръчки за клиента
        $stmt = mysqli_prepare($conn, "SELECT id, product, quantity, returned_gallons, order_date FROM orders WHERE client_id = ? ORDER BY order_date DESC");
        mysqli_stmt_bind_param($stmt, "i", $client_id);
        mysqli_stmt_execute($stmt);
        $orders_result = mysqli_stmt_get_result($stmt);
        while ($order = mysqli_fetch_assoc($orders_result)) {
            $orders[] = $order;
        }
    }
}

// Обработка на селектираните поръчки за фактура
if (isset($_POST['generate_invoice']) && isset($_POST['order_ids']) && !empty($_POST['order_ids'])) {
    $order_ids = array_map('intval', $_POST['order_ids']);
    $payment_method = $_POST['payment_method'] ?? 'Cash';
    
    // Извличане на данните за селектираните поръчки
    $in_clause = implode(',', array_fill(0, count($order_ids), '?'));
    $types = str_repeat('i', count($order_ids));
    $stmt = mysqli_prepare($conn, "SELECT product, quantity, returned_gallons, order_date FROM orders WHERE id IN ($in_clause)");
    mysqli_stmt_bind_param($stmt, $types, ...$order_ids);
    mysqli_stmt_execute($stmt);
    $selected_orders_result = mysqli_stmt_get_result($stmt);
    while ($order = mysqli_fetch_assoc($selected_orders_result)) {
        $selected_orders[] = $order;
    }
    
    if (empty($selected_orders)) {
        $error = "Няма селектирани поръчки за фактура.";
    } else {
        // Генериране на фактура
        $pdf = new FPDF();
        
        // Генериране на Оригинал
        generatePDF($pdf, $client, $selected_orders, 'Original', $payment_method);
        
        // Генериране на Копие
        $pdf = new FPDF();
        generatePDF($pdf, $client, $selected_orders, 'Copy', $payment_method);
        
        // Записване на фактурата в базата
        $invoice_number = generateInvoiceNumber($conn);
        $file_path_original = "invoices/invoice_$invoice_number.pdf";
        $file_path_copy = "invoices/invoice_$invoice_number_copy.pdf";
        
        // Запис на Оригинал
        $stmt = mysqli_prepare($conn, "INSERT INTO invoices (client_id, invoice_number, invoice_date, pdf_path, invoice_type, payment_method) VALUES (?, ?, CURDATE(), ?, 'Original', ?)");
        mysqli_stmt_bind_param($stmt, "isss", $client_id, $invoice_number, $file_path_original, $payment_method);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
        
        // Запис на Копие
        $stmt = mysqli_prepare($conn, "INSERT INTO invoices (client_id, invoice_number, invoice_date, pdf_path, invoice_type, payment_method) VALUES (?, ?, CURDATE(), ?, 'Copy', ?)");
        mysqli_stmt_bind_param($stmt, "isss", $client_id, $invoice_number, $file_path_copy, $payment_method);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
        
        header("Location: invoice_list.php");
        exit;
    }
}

// Обработка на генериране на Стокова Разписка
if (isset($_POST['generate_delivery_note']) && isset($_POST['order_ids']) && !empty($_POST['order_ids'])) {
    $order_ids = array_map('intval', $_POST['order_ids']);
    
    // Извличане на данните за селектираните поръчки
    $in_clause = implode(',', array_fill(0, count($order_ids), '?'));
    $types = str_repeat('i', count($order_ids));
    $stmt = mysqli_prepare($conn, "SELECT product, quantity, returned_gallons, order_date FROM orders WHERE id IN ($in_clause)");
    mysqli_stmt_bind_param($stmt, $types, ...$order_ids);
    mysqli_stmt_execute($stmt);
    $selected_orders_result = mysqli_stmt_get_result($stmt);
    while ($order = mysqli_fetch_assoc($selected_orders_result)) {
        $selected_orders[] = $order;
    }
    
    if (empty($selected_orders)) {
        $error = "Няма селектирани поръчки за Стокова Разписка.";
    } else {
        // Генериране на Стокова Разписка
        $pdf = new FPDF();
        generateDeliveryNote($pdf, $client, $selected_orders);
        
        // Генериране на номер на Стокова Разписка
        $note_number = generateDeliveryNoteNumber($conn);
        $file_path = "delivery_notes/note_$note_number.pdf";
        $delivery_notes_dir = 'delivery_notes';
        
        if (!is_dir($delivery_notes_dir)) {
            if (!mkdir($delivery_notes_dir, 0777, true)) {
                $error = "Не може да се създаде папка за Стокови Разписки. Провери правата.";
                exit;
            }
        }
        if (is_writable($delivery_notes_dir)) {
            $pdf->Output('F', $file_path);
            
            // Запис на Стоковата Разписка в базата
            $stmt = mysqli_prepare($conn, "INSERT INTO delivery_notes (client_id, note_number, note_date, pdf_path) VALUES (?, ?, CURDATE(), ?)");
            mysqli_stmt_bind_param($stmt, "iss", $client_id, $note_number, $file_path);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
            
            header("Location: delivery_note_list.php"); // Ще създадем този файл по-късно
            exit;
        } else {
            $error = "Няма права за създаване на PDF файла. Провери правата на папка 'delivery_notes/'.";
            exit;
        }
    }
}

// Функция за генериране на номер на фактура
function generateInvoiceNumber($conn) {
    $stmt = mysqli_prepare($conn, "SELECT MAX(CAST(SUBSTRING(invoice_number, 4) AS UNSIGNED)) as last_number FROM invoices");
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    $last_number = $row['last_number'] ? $row['last_number'] : 0;
    mysqli_stmt_close($stmt);
    return "INV" . str_pad($last_number + 1, 6, '0', STR_PAD_LEFT);
}

// Функция за генериране на номер на Стокова Разписка
function generateDeliveryNoteNumber($conn) {
    $stmt = mysqli_prepare($conn, "SELECT MAX(CAST(SUBSTRING(note_number, 5) AS UNSIGNED)) as last_number FROM delivery_notes");
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    $last_number = $row['last_number'] ? $row['last_number'] : 0;
    mysqli_stmt_close($stmt);
    return "NOTE" . str_pad($last_number + 1, 6, '0', STR_PAD_LEFT);
}

// Функция за генериране на PDF фактура
function generatePDF($pdf, $client, $orders, $type, $payment_method) {
    $pdf->AddPage();
    $pdf->AddFont('DejaVu', '', 'DejaVuSans.php');
    if (file_exists('fpdf/font/DejaVuSans-Bold.php')) {
        $pdf->AddFont('DejaVu', 'B', 'DejaVuSans-Bold.php');
    }

    // Заглавна лента
    $pdf->SetFillColor(100, 149, 237);
    $pdf->Rect(0, 0, 210, 40, 'F');
    if (file_exists('uploads/logo.png')) {
        $pdf->Image('uploads/logo.png', 10, -10, 40);
    }
    $pdf->SetFont('DejaVu', 'B', 18);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->Cell(0, 10, '', 0, 1);
    $pdf->Cell(0, 10, iconv('UTF-8', 'windows-1251', "Фактура"), 0, 1, 'C');
    
    // Номер и тип на фактурата
    $pdf->Cell(0, 10, iconv('UTF-8', 'windows-1251', "№ " . $GLOBALS['invoice_number']), 0, 1, 'C');
    $pdf->Cell(0, 10, iconv('UTF-8', 'windows-1251', $type == 'Original' ? "Оригинал" : "Копие"), 0, 1, 'C');

    // Данни за фирмите
    $pdf->Ln(10);
    $pdf->SetFont('DejaVu', '', 10);
    $pdf->SetTextColor(50, 50, 50);

    // Доставчик
    $pdf->SetXY(10, 60);
    $pdf->SetFillColor(240, 240, 240);
    $pdf->Rect(10, 60, 90, 40, 'F');
    $pdf->SetXY(15, 62);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "Доставчик:"), 0, 1);
    $pdf->SetX(15);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "Твоята фирма ООД"), 0, 1);
    $pdf->SetX(15);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "ЕИК: 123456789"), 0, 1);
    $pdf->SetX(15);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "Адрес: ул. Примерна 1, София"), 0, 1);
    $pdf->SetX(15);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "ДДС №: BG123456789"), 0, 1);

    // Получател
    $pdf->SetXY(110, 60);
    $pdf->Rect(110, 60, 90, 40, 'F');
    $pdf->SetXY(115, 62);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "Получател:"), 0, 1);
    $pdf->SetX(115);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', $client['company_name']), 0, 1);
    $pdf->SetX(115);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "Телефон: " . $client['phone']), 0, 1);
    $pdf->SetX(115);
    if ($client['eik']) {
        $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "ЕИК: " . $client['eik']), 0, 1);
    }
    $pdf->SetX(115);
    if ($client['address']) {
        $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "Адрес: " . $client['address']), 0, 1);
    }

    // Дата и начин на плащане
    $pdf->Ln(10);
    $pdf->SetX(10);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "Дата на издаване: " . date('d.m.Y')), 0, 1);
    $pdf->SetX(10);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "Начин на плащане: " . ($payment_method == 'Cash' ? 'В Брой' : ($payment_method == 'Card' ? 'Карта' : 'Платежно нареждане'))), 0, 1);

    // Таблица с поръчки
    $pdf->Ln(10);
    $table_width = 200;
    $left_margin = (210 - $table_width) / 2;
    $pdf->SetX($left_margin);

    $pdf->SetFont('DejaVu', 'B', 8);
    $pdf->SetFillColor(240, 240, 240);
    $pdf->Cell(60, 12, iconv('UTF-8', 'windows-1251', 'Продукт'), 1, 0, 'C', true);
    $pdf->Cell(30, 12, iconv('UTF-8', 'windows-1251', 'Количество'), 1, 0, 'C', true);
    $pdf->Cell(30, 12, iconv('UTF-8', 'windows-1251', 'Ед. цена без ДДС'), 1, 0, 'C', true);
    $pdf->Cell(40, 12, iconv('UTF-8', 'windows-1251', 'Стойност без ДДС'), 1, 0, 'C', true);
    $pdf->Cell(40, 12, iconv('UTF-8', 'windows-1251', 'Върнати галони'), 1, 1, 'C', true);

    $pdf->SetFont('DejaVu', '', 8);
    $pdf->SetTextColor(50, 50, 50);

    $total_without_vat = 0;
    $vat_rate = 0.20;

    foreach ($orders as $order) {
        $pdf->SetX($left_margin);
        $unit_price = ($order['product'] == 'Кафе') ? 5.00 : 2.00; // Примерни цени
        $value_without_vat = $unit_price * $order['quantity'];
        $total_without_vat += $value_without_vat;

        $pdf->Cell(60, 12, iconv('UTF-8', 'windows-1251', $order['product']), 1, 0, 'C');
        $pdf->Cell(30, 12, $order['quantity'], 1, 0, 'C');
        $pdf->Cell(30, 12, number_format($unit_price, 2, ',', '') . chr(235) . chr(226), 1, 0, 'C');
        $pdf->Cell(40, 12, number_format($value_without_vat, 2, ',', '') . chr(235) . chr(226), 1, 0, 'C');
        $pdf->Cell(40, 12, $order['returned_gallons'] ?? '-', 1, 1, 'C');
    }

    // Обобщение
    $pdf->Ln(5);
    $pdf->SetX($left_margin);
    $pdf->Cell(130, 8, iconv('UTF-8', 'windows-1251', 'Обща стойност без ДДС:'), 0, 0, 'R');
    $pdf->Cell(70, 8, number_format($total_without_vat, 2, ',', '') . chr(235) . chr(226), 0, 1, 'R');
    $pdf->SetX($left_margin);
    $pdf->Cell(130, 8, iconv('UTF-8', 'windows-1251', 'ДДС (20%):'), 0, 0, 'R');
    $pdf->Cell(70, 8, number_format($total_without_vat * $vat_rate, 2, ',', '') . chr(235) . chr(226), 0, 1, 'R');
    $pdf->SetX($left_margin);
    $pdf->Cell(130, 8, iconv('UTF-8', 'windows-1251', 'Общо за плащане:'), 0, 0, 'R');
    $pdf->Cell(70, 8, number_format($total_without_vat * (1 + $vat_rate), 2, ',', '') . chr(235) . chr(226), 0, 1, 'R');

    // Подпис и печат
    $pdf->Ln(15);
    $pdf->SetX($left_margin);
    $pdf->Cell(100, 8, iconv('UTF-8', 'windows-1251', "Подпис: ____________________"), 0, 0, 'L');
    $pdf->Cell(100, 8, iconv('UTF-8', 'windows-1251', "Печат: ____________________"), 0, 1, 'R');

    // Долен колонтитул
    $pdf->Ln(10);
    $pdf->SetFillColor(100, 149, 237);
    $pdf->Rect(0, $pdf->GetY(), 210, 15, 'F');
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('DejaVu', '', 10);
    $pdf->Cell(0, 15, iconv('UTF-8', 'windows-1251', "Всички цени са в лева с включено ДДС"), 0, 1, 'C', true);

    // Запис на PDF файла
    $file_path = "invoices/invoice_$GLOBALS[invoice_number]" . ($type == 'Copy' ? '_copy' : '') . ".pdf";
    $invoices_dir = 'invoices';
    if (!is_dir($invoices_dir)) {
        if (!mkdir($invoices_dir, 0777, true)) {
            throw new Exception("Не може да се създаде папка за фактури. Провери правата.");
        }
    }
    if (is_writable($invoices_dir)) {
        $pdf->Output('F', $file_path);
    } else {
        throw new Exception("Няма права за създаване на PDF файла. Провери правата на папка 'invoices/'.");
    }
}

// Функция за генериране на Стокова Разписка
function generateDeliveryNote($pdf, $client, $orders) {
    $pdf->AddPage();
    $pdf->AddFont('DejaVu', '', 'DejaVuSans.php');
    if (file_exists('fpdf/font/DejaVuSans-Bold.php')) {
        $pdf->AddFont('DejaVu', 'B', 'DejaVuSans-Bold.php');
    }

    // Заглавна лента
    $pdf->SetFillColor(144, 238, 144); // Светлозелен фон за Стокова Разписка
    $pdf->Rect(0, 0, 210, 40, 'F');
    if (file_exists('uploads/logo.png')) {
        $pdf->Image('uploads/logo.png', 10, -10, 40);
    }
    $pdf->SetFont('DejaVu', 'B', 18);
    $pdf->SetTextColor(0, 0, 0); // Черен текст за контраст
    $pdf->Cell(0, 10, '', 0, 1);
    $pdf->Cell(0, 10, iconv('UTF-8', 'windows-1251', "Стокова Разписка"), 0, 1, 'C');
    $pdf->Cell(0, 10, iconv('UTF-8', 'windows-1251', "№ " . $GLOBALS['note_number']), 0, 1, 'C');

    // Данни за клиента
    $pdf->Ln(10);
    $pdf->SetFont('DejaVu', '', 10);
    $pdf->SetTextColor(50, 50, 50);

    // Получател
    $pdf->SetXY(10, 60);
    $pdf->SetFillColor(240, 240, 240);
    $pdf->Rect(10, 60, 190, 40, 'F');
    $pdf->SetXY(15, 62);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "Получател:"), 0, 1);
    $pdf->SetX(15);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', $client['company_name']), 0, 1);
    $pdf->SetX(15);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "Телефон: " . $client['phone']), 0, 1);
    $pdf->SetX(15);
    if ($client['eik']) {
        $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "ЕИК: " . $client['eik']), 0, 1);
    }
    $pdf->SetX(15);
    if ($client['address']) {
        $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "Адрес: " . $client['address']), 0, 1);
    }

    // Дата
    $pdf->Ln(10);
    $pdf->SetX(10);
    $pdf->Cell(0, 6, iconv('UTF-8', 'windows-1251', "Дата на издаване: " . date('d.m.Y')), 0, 1);

    // Таблица с поръчки
    $pdf->Ln(10);
    $table_width = 200;
    $left_margin = (210 - $table_width) / 2;
    $pdf->SetX($left_margin);

    $pdf->SetFont('DejaVu', 'B', 8);
    $pdf->SetFillColor(240, 240, 240);
    $pdf->Cell(60, 12, iconv('UTF-8', 'windows-1251', 'Продукт'), 1, 0, 'C', true);
    $pdf->Cell(30, 12, iconv('UTF-8', 'windows-1251', 'Количество'), 1, 0, 'C', true);
    $pdf->Cell(40, 12, iconv('UTF-8', 'windows-1251', 'Върнати галони'), 1, 0, 'C', true);
    $pdf->Cell(70, 12, iconv('UTF-8', 'windows-1251', 'Забележка'), 1, 1, 'C', true);

    $pdf->SetFont('DejaVu', '', 8);
    $pdf->SetTextColor(50, 50, 50);

    foreach ($orders as $order) {
        $pdf->SetX($left_margin);
        $pdf->Cell(60, 12, iconv('UTF-8', 'windows-1251', $order['product']), 1, 0, 'C');
        $pdf->Cell(30, 12, $order['quantity'], 1, 0, 'C');
        $pdf->Cell(40, 12, $order['returned_gallons'] ?? '-', 1, 0, 'C');
        $pdf->Cell(70, 12, '', 1, 1, 'C'); // Празна забележка, може да се разшири
    }

    // Подпис и печат
    $pdf->Ln(15);
    $pdf->SetX($left_margin);
    $pdf->Cell(100, 8, iconv('UTF-8', 'windows-1251', "Подпис: ____________________"), 0, 0, 'L');
    $pdf->Cell(100, 8, iconv('UTF-8', 'windows-1251', "Печат: ____________________"), 0, 1, 'R');

    // Долен колонтитул
    $pdf->Ln(10);
    $pdf->SetFillColor(144, 238, 144);
    $pdf->Rect(0, $pdf->GetY(), 210, 15, 'F');
    $pdf->SetTextColor(0, 0, 0);
    $pdf->SetFont('DejaVu', '', 10);
    $pdf->Cell(0, 15, iconv('UTF-8', 'windows-1251', "Стоковата разписка е за единствено еднократна употреба"), 0, 1, 'C', true);
}

?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📄 Управление на фактури и разписки</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200 p-4">
    <div class="container mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold mb-2 text-center text-gray-700">📄 Управление на фактури и разписки</h1>
        <?php include 'menu.php'; ?>

        <h2 class="text-xl font-semibold mt-6">👤 Избери клиент</h2>
        <?php if ($error) { ?>
            <p class="text-red-500 text-center mb-4"><?php echo $error; ?></p>
        <?php } else { ?>
            <div class="flex flex-col gap-4">
                <div class="relative flex flex-col gap-2 w-full md:w-1/3 mx-auto">
                    <input type="text" id="client-search-invoice" placeholder="👥 Търси клиент" class="border p-3 rounded-lg shadow w-full" required>
                    <input type="hidden" id="client-id-invoice">
                    <ul id="client-suggestions-invoice" class="absolute bg-white border rounded-lg w-full max-h-40 overflow-y-auto hidden top-16 z-10"></ul>
                </div>
                <?php if ($client) { ?>
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-700">Избран клиент: <?php echo htmlspecialchars($client['company_name']); ?></h3>
                        <a href="?client_id=" class="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition">Промени клиент</a>
                    </div>

                    <h3 class="text-lg font-semibold mt-4">📋 Поръчки на клиента:</h3>
                    <table class="min-w-full bg-white border border-gray-300 rounded-lg">
                        <thead class="bg-gray-800 text-white">
                            <tr>
                                <th class="p-2 border-b border-r text-center"><input type="checkbox" id="select_all_orders" class="form-checkbox h-5 w-5 text-blue-600"></th>
                                <th class="p-2 border-b border-r text-center">📅 Дата</th>
                                <th class="p-2 border-b border-r text-center">📦 Продукт</th>
                                <th class="p-2 border-b border-r text-center">🛒 Количество</th>
                                <th class="p-2 border-b border-r text-center">♻️ Върнати галони</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($orders as $order) { ?>
                                <tr class="hover:bg-gray-100">
                                    <td class="p-2 border-b border-r text-center">
                                        <input type="checkbox" name="order_ids[]" value="<?php echo $order['id']; ?>" class="order_checkbox form-checkbox h-5 w-5 text-blue-600">
                                    </td>
                                    <td class="p-2 border-b border-r text-center"><?php echo date('d.m.Y', strtotime($order['order_date'])); ?></td>
                                    <td class="p-2 border-b border-r text-center"><?php echo htmlspecialchars($order['product']); ?></td>
                                    <td class="p-2 border-b border-r text-center"><?php echo $order['quantity']; ?></td>
                                    <td class="p-2 border-b border-r text-center"><?php echo $order['returned_gallons'] ?? '-'; ?></td>
                                </tr>
                            <?php } ?>
                        </tbody>
                    </table>

                    <div class="mt-4 flex flex-col gap-4">
                        <div>
                            <label for="payment_method" class="block text-gray-700">💰 Начин на плащане:</label>
                            <select id="payment_method" name="payment_method" class="border p-3 rounded-lg shadow w-full">
                                <option value="Cash">В Брой</option>
                                <option value="Card">Карта</option>
                                <option value="BankTransfer">Платежно нареждане</option>
                            </select>
                        </div>
                        <div class="flex gap-4">
                            <button type="submit" name="generate_invoice" form="invoice_form" class="bg-green-500 text-white p-3 rounded-lg shadow hover:bg-green-600 transition">💰 Генерирай Фактура</button>
                            <button type="submit" name="generate_delivery_note" form="invoice_form" class="bg-blue-500 text-white p-3 rounded-lg shadow hover:bg-blue-600 transition">📜 Генерирай Стокова Разписка</button>
                        </div>
                    </div>
                <?php } ?>
            </div>
        <?php } ?>
    </div>

    <form id="invoice_form" method="POST" class="hidden">
        <input type="hidden" name="client_id" value="<?php echo $client_id ?? ''; ?>">
    </form>

    <script src="scripts.js"></script>
    <script>
        // Търсачка за клиенти
        document.getElementById('client-search-invoice').addEventListener('input', function() {
            const query = this.value;
            if (query.length > 2) {
                fetch('fetch_clients.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'search=' + encodeURIComponent(query)
                })
                .then(response => response.json())
                .then(data => {
                    const suggestions = document.getElementById('client-suggestions-invoice');
                    suggestions.innerHTML = '';
                    data.forEach(client => {
                        const li = document.createElement('li');
                        li.textContent = client.name;
                        li.className = 'p-2 hover:bg-gray-200 cursor-pointer';
                        li.onclick = () => {
                            document.getElementById('client-search-invoice').value = client.name;
                            document.getElementById('client-id-invoice').value = client.id;
                            window.location.href = '?client_id=' + client.id;
                            suggestions.classList.add('hidden');
                        };
                        suggestions.appendChild(li);
                    });
                    suggestions.classList.remove('hidden');
                })
                .catch(error => console.error('Грешка при търсенето на клиенти:', error));
            }
        });

        // Скриване на предложения при клик извън
        document.addEventListener('click', function(e) {
            if (!document.getElementById('client-search-invoice').contains(e.target)) {
                document.getElementById('client-suggestions-invoice').classList.add('hidden');
            }
        });

        // Селектиране на всички поръчки
        $('#select_all_orders').on('change', function() {
            const isChecked = $(this).is(':checked');
            $('.order_checkbox').prop('checked', isChecked);
        });

        // Подаваме формата при натискане на бутоните
        $('button[name="generate_invoice"], button[name="generate_delivery_note"]').on('click', function(e) {
            e.preventDefault();
            const form = $('#invoice_form');
            form.empty();
            form.append('<input type="hidden" name="client_id" value="' + $('#client-id-invoice').val() + '">');
            if ($(this).attr('name') === 'generate_invoice') {
                const orderIds = $('.order_checkbox:checked').map(function() {
                    return this.value;
                }).get();
                if (orderIds.length > 0) {
                    form.append('<input type="hidden" name="order_ids[]" value="' + orderIds.join('", value="') + '">');
                    form.append('<input type="hidden" name="payment_method" value="' + $('#payment_method').val() + '">');
                    form.submit();
                } else {
                    alert('Моля, селектирайте поне една поръчка за фактура.');
                }
            } else {
                const orderIds = $('.order_checkbox:checked').map(function() {
                    return this.value;
                }).get();
                if (orderIds.length > 0) {
                    form.append('<input type="hidden" name="order_ids[]" value="' + orderIds.join('", value="') + '">');
                    form.submit();
                } else {
                    alert('Моля, селектирайте поне една поръчка за Стокова Разписка.');
                }
            }
        });
    </script>
    <?php include 'footer.php'; ?>
</body>
</html>