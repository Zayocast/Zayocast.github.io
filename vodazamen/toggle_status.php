<?php
include 'db_connect.php';

if (isset($_POST['order_id'])) {
    $order_id = (int)$_POST['order_id'];
    $stmt = mysqli_prepare($conn, "UPDATE orders SET status = 'ОК' WHERE id = ? AND (status IS NULL OR status = 'ПОЗВЪНИ')");
    mysqli_stmt_bind_param($stmt, "i", $order_id);
    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
    mysqli_stmt_close($stmt);
    exit;
}
?>