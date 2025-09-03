<?php
ini_set('display_errors', 0);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
date_default_timezone_set('Europe/Sofia');

if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Моля, влезте в системата']);
    exit;
}

include 'db_connect.php';
if (!$conn) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Грешка при свързване с базата']);
    exit;
}

error_log("POST data: " . json_encode($_POST));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $client_id = isset($_POST['client_id']) ? (int)$_POST['client_id'] : null;
        $order_ids = isset($_POST['order_ids']) ? array_filter($_POST['order_ids'], 'is_numeric') : [];
        if (!$client_id || empty($order_ids)) {
            throw new Exception("Моля, изберете клиент и поне една поръчка.");
        }
        $order_ids_str = implode(',', $order_ids);
        error_log("Generated order_ids_str: " . $order_ids_str);

        $document_type = $_POST['document_type'] ?? 'Invoice';
        $vat_rate = floatval($_POST['vat_rate'] ?? 0.00);
        $invoice_date = date('Y-m-d');
        $invoice_number = ($document_type === 'Invoice' ? 'INV' : 'DN') . date('Ymd') . sprintf('%03d', mysqli_num_rows(mysqli_query($conn, "SELECT * FROM invoices WHERE document_type = '$document_type'")) + 1);
        $payment_method = $_POST['payment_method'] ?? 'Cash';

        $subtotal = 0;
        $products = [];
        $placeholders = implode(',', array_fill(0, count($order_ids), '?'));
        $orders_query = "SELECT product, quantity, custom_price FROM orders WHERE id IN ($placeholders)";
        $stmt = mysqli_prepare($conn, $orders_query);
        if (!$stmt) {
            throw new Exception("Грешка при подготовка на заявка: " . mysqli_error($conn));
        }
        mysqli_stmt_bind_param($stmt, str_repeat('i', count($order_ids)), ...$order_ids);
        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception("Грешка при изпълнение на заявка: " . mysqli_stmt_error($stmt));
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
            error_log("Added product: " . $order['product']);
        }
        mysqli_stmt_close($stmt);

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

        // Ръчен запис с ескейпване за сигурност
        $types = ['Original', 'Copy'];
        foreach ($types as $type) {
            $query = "INSERT INTO invoices (client_id, invoice_number, invoice_date, invoice_type, order_ids, total_amount, vat_rate, payment_method, document_type) 
                      VALUES ('" . mysqli_real_escape_string($conn, $client_id) . "', 
                              '" . mysqli_real_escape_string($conn, $invoice_number) . "', 
                              '" . mysqli_real_escape_string($conn, $invoice_date) . "', 
                              '" . mysqli_real_escape_string($conn, $type) . "', 
                              '" . mysqli_real_escape_string($conn, $order_ids_str) . "', 
                              '" . mysqli_real_escape_string($conn, $total_amount) . "', 
                              '" . mysqli_real_escape_string($conn, $vat_rate) . "', 
                              '" . mysqli_real_escape_string($conn, $payment_method) . "', 
                              '" . mysqli_real_escape_string($conn, $document_type) . "')";
            if (!mysqli_query($conn, $query)) {
                throw new Exception("Грешка при запис: " . mysqli_error($conn));
            }
        }

        $invoice_id = mysqli_insert_id($conn); // Взимаме ID на последния запис
        $check_query = "SELECT order_ids FROM invoices WHERE id = ?";
        $check_stmt = mysqli_prepare($conn, $check_query);
        mysqli_stmt_bind_param($check_stmt, "i", $invoice_id);
        mysqli_stmt_execute($check_stmt);
        $check_result = mysqli_stmt_get_result($check_stmt);
        $saved_order_ids = mysqli_fetch_assoc($check_result)['order_ids'];
        error_log("Saved order_ids in DB: " . $saved_order_ids);
        mysqli_stmt_close($check_stmt);

        $update_stmt = mysqli_prepare($conn, "UPDATE orders SET invoiced = 1 WHERE id IN ($placeholders)");
        if (!$update_stmt) {
            throw new Exception("Грешка при подготовка на обновяване: " . mysqli_error($conn));
        }
        mysqli_stmt_bind_param($update_stmt, str_repeat('i', count($order_ids)), ...$order_ids);
        if (!mysqli_stmt_execute($update_stmt)) {
            throw new Exception("Грешка при обновяване: " . mysqli_stmt_error($update_stmt));
        }
        mysqli_stmt_close($update_stmt);

        $_SESSION['invoice_number'] = $invoice_number;
        $_SESSION['document_type'] = $document_type;
        $_SESSION['invoice_type'] = 'Original';
        $_SESSION['products'] = $products;
        $_SESSION['subtotal'] = $subtotal;
        $_SESSION['vat_amount'] = $vat_amount;
        $_SESSION['total_amount'] = $total_amount;
        $_SESSION['client_id'] = $client_id;
        $_SESSION['order_ids'] = $order_ids_str;
        $_SESSION['invoice_date'] = $invoice_date;
        $_SESSION['payment_method'] = $payment_method;
        $_SESSION['vat_rate'] = $vat_rate;
        $_SESSION['company'] = $company;

        error_log("Generated invoice: $invoice_number, orders: " . json_encode($products));
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'invoice_number' => $invoice_number, 'document_type' => $document_type]);
        exit;
    } catch (Exception $e) {
        error_log("Error in generate_invoice: " . $e->getMessage());
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

header('Content-Type: application/json');
echo json_encode(['success' => false, 'error' => 'Невалидна заявка']);
exit;
?>