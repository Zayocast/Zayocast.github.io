<?php
include 'db_connect.php';

if (isset($_GET['client_id']) && is_numeric($_GET['client_id'])) {
    $client_id = (int)$_GET['client_id'];
    $stmt = mysqli_prepare($conn, "SELECT o.order_date, o.product, o.quantity, o.returned_gallons FROM orders o WHERE o.client_id = ?");
    mysqli_stmt_bind_param($stmt, "i", $client_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
}

$clients_query = "SELECT * FROM clients";
$clients = mysqli_query($conn, $clients_query);
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔍 Търсене по клиент</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200 p-4">
    <div class="container mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold mb-2 text-center text-gray-700">☕ Управление на клиенти и поръчки 📋</h1>
        <?php include 'menu.php'; ?>
        <h2 class="text-xl font-semibold mt-6">🔍 Търсене по клиент</h2>
        <form method="GET" class="flex flex-col md:flex-row gap-4 mb-6">
            <select name="client_id" class="border p-3 rounded-lg shadow w-full md:w-1/3" required>
                <option value="">👥 Изберете клиент</option>
                <?php while ($row = mysqli_fetch_assoc($clients)) { ?>
                    <option value="<?php echo $row['id']; ?>"><?php echo $row['company_name']; ?></option>
                <?php } ?>
            </select>
            <button type="submit" class="bg-blue-500 text-white p-3 rounded-lg shadow hover:bg-blue-600 transition">🔎 Търси</button>
        </form>
        <?php if (isset($result)) { ?>
            <table class="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="p-3 border-b border-r text-center">📅 Дата</th>
                        <th class="p-3 border-b border-r text-center">📦 Продукт</th>
                        <th class="p-3 border-b border-r text-center">📏 Количество</th>
                        <th class="p-3 border-b text-center">♻️ Върнати галони</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while ($row = mysqli_fetch_assoc($result)) { ?>
                        <tr class="hover:bg-gray-50">
                            <td class="p-3 border-b border-r text-center"><?php echo date('d.m.Y', strtotime($row['order_date'])); ?></td>
                            <td class="p-3 border-b border-r text-center"><?php echo $row['product']; ?></td>
                            <td class="p-3 border-b border-r text-center"><?php echo $row['quantity']; ?></td>
                            <td class="p-3 border-b text-center"><?php echo $row['returned_gallons'] ?? '-'; ?></td>
                        </tr>
                    <?php } ?>
                </tbody>
            </table>
        <?php } ?>
    </div>
</body>
</html>