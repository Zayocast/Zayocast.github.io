<?php
include 'db_connect.php';

$page = isset($_POST['page']) ? (int)$_POST['page'] : 1;
$search_term = isset($_POST['search']) ? $_POST['search'] : '';
$sort_order = isset($_POST['sort']) ? $_POST['sort'] : 'desc';
$orders_per_page = 10;
$start = ($page - 1) * $orders_per_page;

$search_term_wildcard = "%" . $search_term . "%";
$sort_sql = $sort_order === 'asc' ? 'ASC' : 'DESC';

$query = "SELECT o.id, c.company_name, c.phone, o.order_date, o.product, o.quantity, o.returned_gallons, o.status 
          FROM orders o 
          JOIN clients c ON o.client_id = c.id 
          " . ($search_term ? "WHERE c.company_name LIKE ?" : "") . " 
          ORDER BY 
            CASE WHEN o.status IS NULL AND DATEDIFF(CURDATE(), o.order_date) > 40 THEN 0 ELSE 1 END, 
            o.order_date $sort_sql 
          LIMIT ?, ?";

$stmt = mysqli_prepare($conn, $query);
if ($search_term) {
    mysqli_stmt_bind_param($stmt, "sii", $search_term_wildcard, $start, $orders_per_page);
} else {
    mysqli_stmt_bind_param($stmt, "ii", $start, $orders_per_page);
}
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

$orders = [];
while ($row = mysqli_fetch_assoc($result)) {
    $days_diff = (strtotime(date('Y-m-d')) - strtotime($row['order_date'])) / (60 * 60 * 24);
    $status = $row['status'] ?: ($days_diff > 40 ? 'ПОЗВЪНИ' : 'ОК');
    $bg_class = ($status === 'ПОЗВЪНИ' && $days_diff > 40) ? 'bg-red-200' : 'bg-white';
    
    $orders[] = [
        'id' => $row['id'],
        'company_name' => $row['company_name'],
        'phone' => $row['phone'],
        'product' => $row['product'] === 'Вода' ? '💧 Вода' : '☕ Кафе',
        'quantity' => $row['quantity'],
        'returned_gallons' => $row['returned_gallons'],
        'order_date' => date('d.m.Y', strtotime($row['order_date'])),
        'status' => $status,
        'bg_class' => $bg_class
    ];
}

mysqli_stmt_close($stmt);
echo json_encode($orders);
exit;
?>