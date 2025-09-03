<?php
include 'db_connect.php';

$search_term = isset($_POST['search']) ? $_POST['search'] : '';
$search_term_wildcard = "%" . $search_term . "%";

$query = "SELECT 
            c.company_name, 
            COUNT(o.id) as order_count, 
            SUM(o.quantity) as total_quantity, 
            SUM(o.returned_gallons) as returned,
            SUM(CASE WHEN o.product = 'Кафе' THEN o.quantity ELSE 0 END) as coffee_quantity,
            SUM(CASE WHEN o.product = 'Вода' THEN o.quantity ELSE 0 END) as water_quantity
          FROM clients c 
          LEFT JOIN orders o ON c.id = o.client_id 
          " . ($search_term ? "WHERE c.company_name LIKE ?" : "") . " 
          GROUP BY c.id";

$stmt = mysqli_prepare($conn, $query);
if ($search_term) {
    mysqli_stmt_bind_param($stmt, "s", $search_term_wildcard);
}
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

$stats = [];
while ($row = mysqli_fetch_assoc($result)) {
    $stats[] = [
        'company_name' => $row['company_name'],
        'order_count' => $row['order_count'],
        'total_quantity' => $row['total_quantity'] ?: 0,
        'coffee_quantity' => $row['coffee_quantity'] ?: 0,
        'water_quantity' => $row['water_quantity'] ?: 0,
        'returned' => $row['returned'] ?: 0
    ];
}

mysqli_stmt_close($stmt);
echo json_encode($stats);
exit;
?>