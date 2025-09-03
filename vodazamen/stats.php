<?php
include 'db_connect.php';

// Ако е AJAX заявка, извличаме само тялото на таблицата
if (isset($_GET['ajax']) && $_GET['ajax'] == '1') {
    $search_term = isset($_GET['search']) ? $_GET['search'] : '';
    $sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default';
    $search_term_wildcard = "%" . $search_term . "%";

    $order_by_clause = "ORDER BY c.company_name ASC"; // По подразбиране сортиране по име на клиента

    if ($sort_by == 'order_count_asc') {
        $order_by_clause = "ORDER BY order_count ASC";
    } elseif ($sort_by == 'order_count_desc') {
        $order_by_clause = "ORDER BY order_count DESC";
    } elseif ($sort_by == 'total_quantity_asc') {
        $order_by_clause = "ORDER BY total_quantity ASC";
    } elseif ($sort_by == 'total_quantity_desc') {
        $order_by_clause = "ORDER BY total_quantity DESC";
    } elseif ($sort_by == 'coffee_quantity_asc') {
        $order_by_clause = "ORDER BY coffee_quantity ASC";
    } elseif ($sort_by == 'coffee_quantity_desc') {
        $order_by_clause = "ORDER BY coffee_quantity DESC";
    } elseif ($sort_by == 'water_quantity_asc') {
        $order_by_clause = "ORDER BY water_quantity ASC";
    } elseif ($sort_by == 'water_quantity_desc') {
        $order_by_clause = "ORDER BY water_quantity DESC";
    } elseif ($sort_by == 'returned_asc') {
        $order_by_clause = "ORDER BY returned ASC";
    } elseif ($sort_by == 'returned_desc') {
        $order_by_clause = "ORDER BY returned DESC";
    }

    $query = "SELECT 
                c.company_name, 
                COUNT(o.id) as order_count, 
                SUM(o.quantity) as total_quantity, 
                SUM(o.returned_gallons) as returned,
                SUM(CASE WHEN p.category = 'Кафе' THEN o.quantity ELSE 0 END) as coffee_quantity,
                SUM(CASE WHEN p.category = 'Вода' THEN o.quantity ELSE 0 END) as water_quantity
              FROM clients c 
              LEFT JOIN orders o ON c.id = o.client_id 
              LEFT JOIN products p ON o.product = p.name 
              " . ($search_term ? "WHERE c.company_name LIKE ?" : "") . " 
              GROUP BY c.id 
              $order_by_clause";

    $stmt = mysqli_prepare($conn, $query);
    if ($search_term) {
        mysqli_stmt_bind_param($stmt, "s", $search_term_wildcard);
    }
    mysqli_stmt_execute($stmt);
    $stats_result = mysqli_stmt_get_result($stmt);

    ob_start();
    while ($row = mysqli_fetch_assoc($stats_result)) { ?>
        <tr>
            <td class="p-3 border-b border-r text-center"><?php echo htmlspecialchars($row['company_name']); ?></td>
            <td class="p-3 border-b border-r text-center"><?php echo $row['order_count']; ?></td>
            <td class="p-3 border-b border-r text-center"><?php echo $row['total_quantity'] ?: 0; ?></td>
            <td class="p-3 border-b border-r text-center"><?php echo $row['coffee_quantity'] ?: 0; ?></td>
            <td class="p-3 border-b border-r text-center"><?php echo $row['water_quantity'] ?: 0; ?></td>
            <td class="p-3 border-b text-center"><?php echo $row['returned'] ?: 0; ?></td>
        </tr>
    <?php }
    echo ob_get_clean();
    exit;
}

// Ако не е AJAX, извличаме за първоначално показване
$search_term = isset($_GET['search']) ? $_GET['search'] : '';
$sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default';
$search_term_wildcard = "%" . $search_term . "%";

$order_by_clause = "ORDER BY c.company_name ASC"; // По подразбиране сортиране по име на клиента

if ($sort_by == 'order_count_asc') {
    $order_by_clause = "ORDER BY order_count ASC";
} elseif ($sort_by == 'order_count_desc') {
    $order_by_clause = "ORDER BY order_count DESC";
} elseif ($sort_by == 'total_quantity_asc') {
    $order_by_clause = "ORDER BY total_quantity ASC";
} elseif ($sort_by == 'total_quantity_desc') {
    $order_by_clause = "ORDER BY total_quantity DESC";
} elseif ($sort_by == 'coffee_quantity_asc') {
    $order_by_clause = "ORDER BY coffee_quantity ASC";
} elseif ($sort_by == 'coffee_quantity_desc') {
    $order_by_clause = "ORDER BY coffee_quantity DESC";
} elseif ($sort_by == 'water_quantity_asc') {
    $order_by_clause = "ORDER BY water_quantity ASC";
} elseif ($sort_by == 'water_quantity_desc') {
    $order_by_clause = "ORDER BY water_quantity DESC";
} elseif ($sort_by == 'returned_asc') {
    $order_by_clause = "ORDER BY returned ASC";
} elseif ($sort_by == 'returned_desc') {
    $order_by_clause = "ORDER BY returned DESC";
}

$query = "SELECT 
            c.company_name, 
            COUNT(o.id) as order_count, 
            SUM(o.quantity) as total_quantity, 
            SUM(o.returned_gallons) as returned,
            SUM(CASE WHEN p.category = 'Кафе' THEN o.quantity ELSE 0 END) as coffee_quantity,
            SUM(CASE WHEN p.category = 'Вода' THEN o.quantity ELSE 0 END) as water_quantity
          FROM clients c 
          LEFT JOIN orders o ON c.id = o.client_id 
          LEFT JOIN products p ON o.product = p.name 
          " . ($search_term ? "WHERE c.company_name LIKE ?" : "") . " 
          GROUP BY c.id 
          $order_by_clause";

$stmt = mysqli_prepare($conn, $query);
if ($search_term) {
    mysqli_stmt_bind_param($stmt, "s", $search_term_wildcard);
}
mysqli_stmt_execute($stmt);
$stats_result = mysqli_stmt_get_result($stmt);
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Статистика</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        .bg-custom-dark { background-color: rgb(31 41 55); }
        .hover\:bg-custom-dark-hover:hover { background-color: rgb(55 65 81); } /* По-тъмен нюанс за ховър */
    </style>
</head>
<body class="flex justify-center items-start min-h-screen p-4 bg-gradient-to-r from-gray-100 to-gray-200">
    <div class="container mx-auto bg-white p-6 rounded-lg shadow-lg">
         <?php include 'head.php'; ?>
        <?php include 'menu.php'; ?>

        <div class="mb-6">
            <h2 class="text-xl font-semibold">🔍 Търсене по клиент</h2>
            <div class="mt-2 max-w-md mx-auto">
                <input type="text" id="client-search-stats" placeholder="📝 Търсене по име" value="<?php echo htmlspecialchars($search_term); ?>" 
                       class="border p-3 rounded-lg w-full" autocomplete="off">
            </div>
        </div>

        <div class="mt-4">
            <h2 class="text-xl font-semibold mb-2">📊 Сортиране</h2>
            <div class="flex gap-4 items-center flex-wrap mb-4">
                <a href="?sort_by=default" class="bg-custom-dark text-white p-2 rounded-lg hover:bg-custom-dark-hover transition <?php echo $sort_by == 'default' ? 'font-bold' : ''; ?>">📋 По подразбиране</a>
                <a href="?sort_by=order_count_asc" class="bg-custom-dark text-white p-2 rounded-lg hover:bg-custom-dark-hover transition <?php echo $sort_by == 'order_count_asc' ? 'font-bold' : ''; ?>">📦 Брой поръчки ↑</a>
                <a href="?sort_by=order_count_desc" class="bg-custom-dark text-white p-2 rounded-lg hover:bg-custom-dark-hover transition <?php echo $sort_by == 'order_count_desc' ? 'font-bold' : ''; ?>">📦 Брой поръчки ↓</a>
                <a href="?sort_by=total_quantity_asc" class="bg-custom-dark text-white p-2 rounded-lg hover:bg-custom-dark-hover transition <?php echo $sort_by == 'total_quantity_asc' ? 'font-bold' : ''; ?>">📊 Общо количество ↑</a>
                <a href="?sort_by=total_quantity_desc" class="bg-custom-dark text-white p-2 rounded-lg hover:bg-custom-dark-hover transition <?php echo $sort_by == 'total_quantity_desc' ? 'font-bold' : ''; ?>">📊 Общо количество ↓</a>
                <a href="?sort_by=coffee_quantity_asc" class="bg-custom-dark text-white p-2 rounded-lg hover:bg-custom-dark-hover transition <?php echo $sort_by == 'coffee_quantity_asc' ? 'font-bold' : ''; ?>">☕ Кафе ↑</a>
                <a href="?sort_by=coffee_quantity_desc" class="bg-custom-dark text-white p-2 rounded-lg hover:bg-custom-dark-hover transition <?php echo $sort_by == 'coffee_quantity_desc' ? 'font-bold' : ''; ?>">☕ Кафе ↓</a>
                <a href="?sort_by=water_quantity_asc" class="bg-custom-dark text-white p-2 rounded-lg hover:bg-custom-dark-hover transition <?php echo $sort_by == 'water_quantity_asc' ? 'font-bold' : ''; ?>">💧 Вода ↑</a>
                <a href="?sort_by=water_quantity_desc" class="bg-custom-dark text-white p-2 rounded-lg hover:bg-custom-dark-hover transition <?php echo $sort_by == 'water_quantity_desc' ? 'font-bold' : ''; ?>">💧 Вода ↓</a>
                <a href="?sort_by=returned_asc" class="bg-custom-dark text-white p-2 rounded-lg hover:bg-custom-dark-hover transition <?php echo $sort_by == 'returned_asc' ? 'font-bold' : ''; ?>">🔙 Върнати галони ↑</a>
                <a href="?sort_by=returned_desc" class="bg-custom-dark text-white p-2 rounded-lg hover:bg-custom-dark-hover transition <?php echo $sort_by == 'returned_desc' ? 'font-bold' : ''; ?>">🔙 Върнати галони ↓</a>
            </div>
        </div>

        <div class="mt-6">
            <h2 class="text-xl font-semibold">📈 Статистика</h2>
            <table class="min-w-full bg-white border border-gray-300 rounded-lg" id="stats-table">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="p-3 border-b border-r text-center">👤 Клиент</th>
                        <th class="p-3 border-b border-r text-center">📦 Брой поръчки</th>
                        <th class="p-3 border-b border-r text-center">📊 Общо количество</th>
                        <th class="p-3 border-b border-r text-center">☕ Кафе</th>
                        <th class="p-3 border-b border-r text-center">💧 Вода</th>
                        <th class="p-3 border-b text-center">🔙 Върнати галони</th>
                    </tr>
                </thead>
                <tbody id="stats-table-body">
                    <?php while ($row = mysqli_fetch_assoc($stats_result)) { ?>
                        <tr>
                            <td class="p-3 border-b border-r text-center"><?php echo htmlspecialchars($row['company_name']); ?></td>
                            <td class="p-3 border-b border-r text-center"><?php echo $row['order_count']; ?></td>
                            <td class="p-3 border-b border-r text-center"><?php echo $row['total_quantity'] ?: 0; ?></td>
                            <td class="p-3 border-b border-r text-center"><?php echo $row['coffee_quantity'] ?: 0; ?></td>
                            <td class="p-3 border-b border-r text-center"><?php echo $row['water_quantity'] ?: 0; ?></td>
                            <td class="p-3 border-b text-center"><?php echo $row['returned'] ?: 0; ?></td>
                        </tr>
                    <?php } ?>
                </tbody>
            </table>
        </div>
        <?php include 'footer.php'; ?>
    </div>
    
    <script>
        $(document).ready(function() {
            // Търсачка в реално време, подобно на index.php
            $('#client-search-stats').on('input', function() {
                let search = $(this).val();
                $.ajax({
                    url: 'stats.php',
                    method: 'GET',
                    data: { 
                        search: search,
                        ajax: 1,
                        sort_by: '<?php echo $sort_by; ?>'
                    },
                    success: function(response) {
                        $('#stats-table-body').html(response);
                    },
                    error: function(xhr, status, error) {
                        console.error('Грешка при търсенето:', error);
                    }
                });
            });
        });
    </script>
</body>
</html>