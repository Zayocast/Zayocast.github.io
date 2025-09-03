<?php
session_start();
date_default_timezone_set('Europe/Sofia');

include 'db_connect.php';

$invoice_number = $_GET['invoice_number'] ?? $_SESSION['invoice_number'] ?? '';
$document_type = $_GET['document_type'] ?? $_SESSION['document_type'] ?? 'Invoice';
$invoice_type = $_GET['invoice_type'] ?? $_SESSION['invoice_type'] ?? 'Original';

if (empty($invoice_number) || empty($document_type)) {
    die("Грешка: Липсващи параметри.");
}

$query = "SELECT i.*, c.company_name, c.eik, c.address, c.address_details, c.iban, c.bank, c.bank_code, c.phone 
          FROM invoices i 
          LEFT JOIN clients c ON i.client_id = c.id 
          WHERE i.invoice_number = ? AND i.document_type = ? AND i.invoice_type = ?";
$stmt = mysqli_prepare($conn, $query);
if (!$stmt) {
    die("Грешка при подготовка на заявка: " . mysqli_error($conn));
}
mysqli_stmt_bind_param($stmt, "sss", $invoice_number, $document_type, $invoice_type);
if (!mysqli_stmt_execute($stmt)) {
    die("Грешка при изпълнение на заявка: " . mysqli_stmt_error($stmt));
}
$invoice = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
mysqli_stmt_close($stmt);

if (!$invoice) {
    die("Документът не е намерен.");
}

$client_id = $invoice['client_id'];
$order_ids = $invoice['order_ids'];
$invoice_date = $invoice['invoice_date'];
$payment_method = $invoice['payment_method'];
$vat_rate = $invoice['vat_rate'];
$client = [
    'company_name' => $invoice['company_name'],
    'eik' => $invoice['eik'],
    'address' => $invoice['address'],
    'address_details' => $invoice['address_details'],
    'iban' => $invoice['iban'],
    'bank' => $invoice['bank'],
    'bank_code' => $invoice['bank_code'],
    'phone' => $invoice['phone']
];

$subtotal = 0;
$products = [];
$order_ids_exploded = explode(',', $order_ids); // Създаване на променлива преди array_filter
$order_ids_array = array_filter($order_ids_exploded, function($value) {
    return is_numeric(trim($value));
});
error_log("Raw order_ids from DB: " . $order_ids);
error_log("Parsed order_ids_array: " . json_encode($order_ids_array));

$order_details = []; // Масив за детайли за поръчките (дати и IDs)

if (!empty($order_ids_array)) {
    $placeholders = implode(',', array_fill(0, count($order_ids_array), '?'));
    $orders_query = "SELECT id, product, quantity, custom_price, order_date FROM orders WHERE id IN ($placeholders)";
    $stmt = mysqli_prepare($conn, $orders_query);
    if (!$stmt) {
        die("Грешка при подготовка на заявка за поръчки: " . mysqli_error($conn));
    }
    mysqli_stmt_bind_param($stmt, str_repeat('i', count($order_ids_array)), ...array_map('intval', $order_ids_array));
    if (!mysqli_stmt_execute($stmt)) {
        die("Грешка при изпълнение на заявка за поръчки: " . mysqli_stmt_error($stmt));
    }
    $orders_result = mysqli_stmt_get_result($stmt);

    while ($order = mysqli_fetch_assoc($orders_result)) {
        $product_name = $order['product'];
        $price = $order['custom_price'] ?? mysqli_fetch_assoc(mysqli_query($conn, "SELECT price FROM products WHERE name = '" . mysqli_real_escape_string($conn, $product_name) . "'"))['price'] ?? 0;
        $item_total = $price * $order['quantity'];
        $subtotal += $item_total;
        $products[] = [
            'product' => $order['product'],
            'quantity' => $order['quantity'],
            'price' => $price,
            'item_total' => $item_total
        ];
        $order_details[] = [
            'id' => $order['id'],
            'date' => date('d.m.Y', strtotime($order['order_date']))
        ];
        error_log("Fetched product: " . $order['product'] . ", Quantity: " . $order['quantity'] . ", Price: " . $price);
    }
    mysqli_stmt_close($stmt);
} else {
    error_log("No valid order IDs found in: " . $order_ids);
}

$vat_amount = $subtotal * ($vat_rate / 100);
$total_amount = $subtotal + $vat_amount;

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

$_SESSION['invoice_number'] = $invoice_number;
$_SESSION['document_type'] = $document_type;
$_SESSION['invoice_type'] = $invoice_type;
$_SESSION['products'] = $products;
$_SESSION['subtotal'] = $subtotal;
$_SESSION['vat_amount'] = $vat_amount;
$_SESSION['total_amount'] = $total_amount;
$_SESSION['client_id'] = $client_id;
$_SESSION['order_ids'] = $order_ids;
$_SESSION['invoice_date'] = $invoice_date;
$_SESSION['payment_method'] = $payment_method;
$_SESSION['vat_rate'] = $vat_rate;
$_SESSION['company'] = $company;

function translatePaymentMethod($method) {
    $paymentTranslations = [
        'Cash' => 'Брой',
        'BankTransfer' => 'Банков превод',
        'Card' => 'Карта'
    ];
    return $paymentTranslations[$method] ?? $method;
}

function numberToWords($amount) {
    $units = ['', 'един', 'два', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'];
    $teens = ['десет', 'единадесет', 'дванадесет', 'тринадесет', 'четиринадесет', 'петнадесет', 'шестнадесет', 'седемнадесет', 'осемнадесет', 'деветнадесет'];
    $tens = ['', '', 'двадесет', 'тридесет', 'четиридесет', 'петдесет', 'шестдесет', 'седемдесет', 'осемдесет', 'деветдесет'];
    $hundreds = ['', 'сто', 'двеста', 'триста', 'четиристотин', 'петстотин', 'шестстотин', 'седемстотин', 'осемстотин', 'деветстотин'];
    $thousands = ['хиляди', 'хиляда']; // 0 за много, 1 за една
    $millions = ['милиона', 'милион'];

    $intPart = floor($amount); // Цяла част
    $decPart = round(($amount - $intPart) * 100); // Стотинки

    if ($intPart == 0) {
        $words = 'нула лева';
    } else {
        $words = '';
        $number = $intPart;
        $groups = [];

        // Разделяне на числото на групи по три цифри (хиляди, милиони и т.н.)
        while ($number > 0) {
            $groups[] = $number % 1000;
            $number = floor($number / 1000);
        }

        for ($i = 0; $i < count($groups); $i++) {
            $group = $groups[$i];
            if ($group == 0) continue;

            $group_words = '';
            $hundreds_part = floor($group / 100);
            $tens_part = floor(($group % 100) / 10);
            $units_part = $group % 10;

            if ($hundreds_part > 0) {
                $group_words .= $hundreds[$hundreds_part];
                if ($tens_part > 0 || $units_part > 0) $group_words .= ' и ';
            }

            if ($tens_part > 0) {
                if ($tens_part == 1) {
                    $group_words .= $teens[$units_part];
                } else {
                    $group_words .= $tens[$tens_part];
                    if ($units_part > 0) $group_words .= ' и ' . $units[$units_part];
                }
            } elseif ($units_part > 0) {
                $group_words .= $units[$units_part];
            }

            // Добавяне на хиляди или милиони
            if ($i == 1) { // Хиляди
                if ($group == 1) {
                    $group_words = 'една ' . $thousands[1];
                } elseif ($group > 1 && $group < 5) {
                    $group_words .= ' ' . $thousands[1];
                } else {
                    $group_words .= ' ' . $thousands[0];
                }
            } elseif ($i == 2) { // Милиони
                if ($group == 1) {
                    $group_words .= ' ' . $millions[1];
                } else {
                    $group_words .= ' ' . $millions[0];
                }
            }

            $words = $group_words . ($words ? ' ' . $words : '');
        }

        // Специален случай за "един лев"
        if ($intPart == 1) {
            $words = 'един лев';
        } else {
            $words .= ' лева';
        }
    }

    // Обработка на стотинки
    if ($decPart > 0) {
        $words .= ' и ';
        if ($decPart == 1) {
            $words .= 'една стотинка';
        } else {
            $dec_tens = floor($decPart / 10);
            $dec_units = $decPart % 10;

            if ($dec_tens > 0) {
                if ($dec_tens == 1) {
                    $words .= $teens[$dec_units];
                } else {
                    $words .= $tens[$dec_tens];
                    if ($dec_units > 0) $words .= ' и ' . $units[$dec_units];
                }
            } elseif ($dec_units > 0) {
                $words .= $units[$dec_units];
            }
            $words .= ' стотинки';
        }
    }

    return ucfirst(trim($words));
}
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $document_type === 'Invoice' ? 'Фактура' : 'Стокова Разписка'; ?> № <?php echo $invoice_number; ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @media print {
            body { margin: 0; padding: 0; }
            .container { width: 100%; margin: 0; padding: 0; }
            table { border-collapse: collapse; width: 100%; border: 1px solid #000; }
            th, td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px; line-height: 1.1; }
            th { background-color: #000; color: white; }
            td { color: black; }
            .box { border: 1px solid #000; padding: 4px; margin-bottom: 4px; }
            h1 { text-align: center; font-size: 14px; font-weight: bold; margin: 5px 0; }
            .invoice-type { font-size: 12px; font-weight: bold; text-align: center; margin: 2px 0; }
            .signature { border-top: 1px solid #000; text-align: center; padding-top: 5px; margin-top: 10px; font-size: 10px; }
            .no-print { display: none; }
            .logo { 
                width: 200px; /* Фиксиран размер за печат */
                max-width: 200px;
                height: auto;
                display: block;
                margin: 0 auto 5px auto;
            }
        }
        .container { padding: 8px; max-width: 800px; margin: 0 auto; }
        table { border-collapse: collapse; width: 100%; border: 1px solid #d1d5db; }
        th, td { border: 1px solid #d1d5db; padding: 8px; }
        th { background-color: #000; color: white; font-weight: bold; }
        .bg-gray-50 { background-color: #F9FAFB; }
        .box { border: 1px solid #d1d5db; padding: 8px; margin-bottom: 8px; }
        .flex-container { display: flex; justify-content: space-between; gap: 4px; }
        .left-column, .right-column { width: 49%; }
        .logo {
            max-width: 240px; /* За екрана */
            height: auto;
            display: block;
            margin: 0 auto 5px auto;
        }
    </style>
</head>
<body class="bg-white">
    <div class="container mx-auto p-4">
        <button class="print-button mb-4 bg-blue-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition duration-200 no-print" onclick="window.print()">🖨️ Печат</button>
    </div>
    <div class="container">
        <img src="newlogo2.png" alt="Logo" class="logo">
        <h1 class="text-base font-bold mb-1 text-center"><?php echo $document_type === 'Invoice' ? 'Фактура' : 'Стокова Разписка'; ?></h1>
        <div class="text-center mb-1 text-xs">Номер: <?php echo $invoice_number; ?></div>
        <?php if ($document_type === 'Invoice' && $invoice_type === 'Original'): ?>
            <div class="text-center text-red-600 font-bold mb-1 text-xs">ОРИГИНАЛ</div>
        <?php elseif ($invoice_type === 'Copy'): ?>
            <div class="text-center text-blue-600 font-bold mb-1 text-xs">КОПИЕ</div>
        <?php endif; ?>
        <div class="flex justify-between mb-1">
            <div class="box w-1/2 mr-1 text-xs">
                <p><strong>Доставчик</strong></p>
                <p><?php echo htmlspecialchars($company['company_name']); ?></p>
                <?php if (!empty($company['vat_number'])): ?>
                    <p>ДДС №: <?php echo htmlspecialchars($company['vat_number']); ?></p>
                <?php endif; ?>
                <?php if (!empty($company['eic'])): ?>
                    <p>ЕИК: <?php echo htmlspecialchars($company['eic']); ?></p>
                <?php endif; ?>
                <p>Адрес: <?php echo htmlspecialchars($company['address']); ?></p>
                <p>Телефон: <?php echo htmlspecialchars($company['phone']); ?></p>
                <p>Имейл: <?php echo htmlspecialchars($company['email']); ?></p>
            </div>
            <div class="box w-1/2 ml-1 text-xs">
                <p><strong>Получател</strong></p>
                <p><?php echo htmlspecialchars($client['company_name']); ?></p>
                <?php if (!empty($client['eik'])): ?>
                    <p>ЕИК/ЕГН: <?php echo htmlspecialchars($client['eik']); ?></p>
                <?php endif; ?>
                <p>Адрес: <?php echo htmlspecialchars($client['address'] . ' ' . $client['address_details']); ?></p>
                <p>Телефон: <?php echo htmlspecialchars($client['phone']); ?></p>
            </div>
        </div>
        <table class="min-w-full mb-1">
            <thead>
                <tr>
                    <th class="p-2 border text-center text-xs">№</th>
                    <th class="p-2 border text-center text-xs">Наименование на стоката/услугата</th>
                    <th class="p-2 border text-center text-xs">Мярка</th>
                    <th class="p-2 border text-center text-xs">Количество</th>
                    <th class="p-2 border text-center text-xs">Ед. цена</th>
                    <th class="p-2 border text-center text-xs">Сума</th>
                </tr>
            </thead>
            <tbody>
                <?php $i = 1; foreach ($products as $product): ?>
                    <tr>
                        <td class="p-2 border text-center text-xs"><?php echo $i++; ?></td>
                        <td class="p-2 border text-center text-xs"><?php echo htmlspecialchars($product['product']); ?></td>
                        <td class="p-2 border text-center text-xs">бр.</td>
                        <td class="p-2 border text-center text-xs"><?php echo $product['quantity']; ?></td>
                        <td class="p-2 border text-center text-xs"><?php echo number_format($product['price'], 2, '.', ''); ?></td>
                        <td class="p-2 border text-center text-xs"><?php echo number_format($product['item_total'], 2, '.', ''); ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <div class="box text-right mb-1 text-xs">
            <p>Данъчна основа: <?php echo number_format($subtotal, 2, '.', '') . ' лв.'; ?></p>
            <p>ДДС <?php echo $vat_rate; ?>%: <?php echo number_format($vat_amount, 2, '.', '') . ' лв.'; ?></p>
            <p>Сума за плащане: <?php echo number_format($total_amount, 2, '.', '') . ' лв.'; ?></p>
        </div>
        <div class="box mb-1 text-xs">
            <p><strong>Словом:</strong> <?php echo numberToWords($total_amount); ?></p>
        </div>
        <div class="box mb-1 text-xs">
            <p><strong>Относно Поръчки:</strong> 
                <?php if (!empty($order_details)): ?>
                    <?php echo htmlspecialchars(implode(', ', array_map(function($detail) {
                        return "Поръчка № {$detail['id']} от {$detail['date']}";
                    }, $order_details))); ?>
                <?php else: ?>
                    Няма налични данни за поръчки.
                <?php endif; ?>
            </p>
        </div>
        <div class="box mb-1 flex-container text-xs">
            <div class="left-column">
                <p>Дата на данъчното събитие: <?php echo date('d.m.Y', strtotime($invoice_date)); ?></p>
                <p>Основание за ненач. на ДДС:</p>
                <p>Място на сделката: Пазарджик</p>
            </div>
            <div class="right-column">
                <p>Начин на плащане: <?php echo translatePaymentMethod($payment_method); ?></p>
                <p>IBAN: <?php echo htmlspecialchars($client['iban'] ?? ''); ?></p>
                <p>Банка: <?php echo htmlspecialchars($client['bank'] ?? ''); ?></p>
                <p>Банков код: <?php echo htmlspecialchars($client['bank_code'] ?? ''); ?></p>
            </div>
        </div>
        <div class="flex justify-between mb-1 text-xs">
            <div class="signature">
                <p>Получател: ____________________</p>
            </div>
            <div class="signature">
                <p>Съставител: ____________________</p>
            </div>
        </div>
        <p class="text-center text-xs mb-1">Съгласно чл. 6, ал.1 от Закона за счетоводството, чл. 114 от ЗДДС, чл. 78 от ППЗДДС, печатът и подписът не са задължителни реквизити на данъчната фактура.</p>
    </div>
</body>
</html>