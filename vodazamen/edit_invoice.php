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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['edit_invoice'])) {
        $invoice_id = (int)$_POST['invoice_id'];
        $new_type = $_POST['new_type'] === 'Invoice' ? 'Invoice' : 'DeliveryNote';

        $query = "UPDATE invoices SET document_type = ? WHERE id = ? OR (invoice_number = (SELECT invoice_number FROM invoices WHERE id = ?) AND invoice_type = 'Copy')";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param($stmt, "sii", $new_type, $invoice_id, $invoice_id);
        if (mysqli_stmt_execute($stmt)) {
            header('Content-Type: application/json');
            echo json_encode(['success' => true]);
        } else {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Грешка при промяна: ' . mysqli_stmt_error($stmt)]);
        }
        mysqli_stmt_close($stmt);
        exit;
    }

    if (isset($_POST['delete_invoice'])) {
        $invoice_id = (int)$_POST['invoice_id'];

        // Вземаме order_ids за да върнем invoiced = 0
        $query = "SELECT order_ids FROM invoices WHERE id = ?";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param($stmt, "i", $invoice_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $order_ids = mysqli_fetch_assoc($result)['order_ids'];
        mysqli_stmt_close($stmt);

        // Изтриване на записите (Original и Copy)
        $query = "DELETE FROM invoices WHERE id = ? OR (invoice_number = (SELECT invoice_number FROM (SELECT invoice_number FROM invoices WHERE id = ?) AS tmp) AND invoice_type = 'Copy')";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param($stmt, "ii", $invoice_id, $invoice_id);
        if (mysqli_stmt_execute($stmt)) {
            // Връщане на invoiced = 0 за поръчките
            $order_ids_array = explode(',', $order_ids);
            if (!empty($order_ids_array)) {
                $placeholders = implode(',', array_fill(0, count($order_ids_array), '?'));
                $update_query = "UPDATE orders SET invoiced = 0 WHERE id IN ($placeholders)";
                $update_stmt = mysqli_prepare($conn, $update_query);
                mysqli_stmt_bind_param($update_stmt, str_repeat('i', count($order_ids_array)), ...array_map('intval', $order_ids_array));
                mysqli_stmt_execute($update_stmt);
                mysqli_stmt_close($update_stmt);
            }
            header('Content-Type: application/json');
            echo json_encode(['success' => true]);
        } else {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Грешка при изтриване: ' . mysqli_stmt_error($stmt)]);
        }
        mysqli_stmt_close($stmt);
        exit;
    }
}

header('Content-Type: application/json');
echo json_encode(['success' => false, 'error' => 'Невалидна заявка']);
exit;
?>