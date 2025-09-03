<?php
// Проверка за бял интервал – увери се, че няма празни редове или интервали преди този таг!

include 'db_connect.php';

header('Content-Type: application/json');

// Извличане на продукти според типа (Кафе или Вода)
$product_type = isset($_GET['type']) ? $_GET['type'] : '';
$products = [];

if ($product_type) {
    $stmt = mysqli_prepare($conn, "SELECT id, name, type, price FROM products WHERE type = ? ORDER BY name");
    mysqli_stmt_bind_param($stmt, "s", $product_type);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    while ($product = mysqli_fetch_assoc($result)) {
        $products[] = $product;
    }
    mysqli_stmt_close($stmt);
}

echo json_encode($products);