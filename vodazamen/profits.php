<?php
session_start();
date_default_timezone_set('Europe/Sofia');
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

include 'db_connect.php';

// Обработка на филтъра за период
$start_date = isset($_GET['start_date']) && !empty($_GET['start_date']) ? $_GET['start_date'] : null;
$end_date = isset($_GET['end_date']) && !empty($_GET['end_date']) ? $_GET['end_date'] : null;

// Валидация на датите
if ($start_date && !DateTime::createFromFormat('Y-m-d', $start_date)) {
    $start_date = null;
}
if ($end_date && !DateTime::createFromFormat('Y-m-d', $end_date)) {
    $end_date = null;
}

$where_clause = "WHERE o.status IN ('Платено', 'Доставено (Не платено)', 'Доставено')";
$params = [];
$param_types = "";

if ($start_date) {
    $where_clause .= " AND o.order_date >= ?";
    $params[] = $start_date;
    $param_types .= "s";
}
if ($end_date) {
    $where_clause .= " AND o.order_date <= ?";
    $params[] = $end_date;
    $param_types .= "s";
}

// Заявка за изчисляване на печалбите по продукти и категории
$profits_query = "SELECT COALESCE(p.category, 'Некатегоризирано') as category, 
                         COALESCE(o.product, 'Неизвестен продукт') as product_name, 
                         SUM(CASE WHEN o.status = 'Платено' THEN o.quantity ELSE 0 END) as paid_quantity,
                         SUM(CASE WHEN o.status IN ('Доставено (Не платено)', 'Доставено') THEN o.quantity ELSE 0 END) as unpaid_quantity,
                         SUM(CASE WHEN o.status = 'Платено' THEN o.quantity * COALESCE(o.custom_price, o.unit_price, p.price, 0) ELSE 0 END) as total_profit,
                         SUM(CASE WHEN o.status IN ('Доставено (Не платено)', 'Доставено') THEN o.quantity * COALESCE(o.custom_price, o.unit_price, p.price, 0) ELSE 0 END) as unpaid_total,
                         SUM(CASE WHEN o.status = 'Платено' AND p.cost_price IS NOT NULL AND p.cost_price > 0 
                                 THEN o.quantity * p.cost_price ELSE 0 END) as total_cost,
                         SUM(CASE WHEN o.status = 'Платено' AND p.cost_price IS NOT NULL AND p.cost_price > 0 
                                 THEN o.quantity * (COALESCE(o.custom_price, o.unit_price, p.price, 0) - p.cost_price) 
                                 ELSE 0 END) as net_profit,
                         SUM(CASE WHEN o.status IN ('Доставено (Не платено)', 'Доставено') AND p.cost_price IS NOT NULL AND p.cost_price > 0 
                                 THEN o.quantity * (COALESCE(o.custom_price, o.unit_price, p.price, 0) - p.cost_price) 
                                 ELSE 0 END) as unpaid_net_profit
                  FROM orders o
                  LEFT JOIN products p ON o.product = p.name
                  $where_clause
                  GROUP BY p.category, o.product
                  ORDER BY p.category, o.product";
$stmt = mysqli_prepare($conn, $profits_query);

if (!empty($params)) {
    mysqli_stmt_bind_param($stmt, $param_types, ...$params);
}
mysqli_stmt_execute($stmt);
$profits_result = mysqli_stmt_get_result($stmt);

// Инициализиране на масив за печалбите
$profits = [
    'Кафе' => ['products' => [], 'total' => 0.0, 'net_total' => 0.0],
    'Вода' => ['products' => [], 'total' => 0.0, 'net_total' => 0.0],
    'Некатегоризирано' => ['products' => [], 'total' => 0.0, 'net_total' => 0.0]
];

// Обща сума за неплатени поръчки и чиста печалба
$total_unpaid = 0.0;
$total_net_profit = 0.0;
$total_unpaid_net_profit = 0.0;

// Попълване на печалбите от заявката
while ($row = mysqli_fetch_assoc($profits_result)) {
    $category = $row['category'] ?? 'Некатегоризирано';
    if (!isset($profits[$category])) {
        $profits[$category] = ['products' => [], 'total' => 0.0, 'net_total' => 0.0];
    }
    $profits[$category]['products'][] = [
        'name' => $row['product_name'],
        'paid_quantity' => (int)$row['paid_quantity'],
        'unpaid_quantity' => (int)$row['unpaid_quantity'],
        'total_profit' => (float)$row['total_profit'],
        'unpaid_total' => (float)$row['unpaid_total'],
        'total_cost' => (float)$row['total_cost'],
        'net_profit' => (float)$row['net_profit'],
        'unpaid_net_profit' => (float)$row['unpaid_net_profit']
    ];
    $profits[$category]['total'] += (float)$row['total_profit'];
    $profits[$category]['net_total'] += (float)$row['net_profit'];
    $total_unpaid += (float)$row['unpaid_total'];
    $total_net_profit += (float)$row['net_profit'];
    $total_unpaid_net_profit += (float)$row['unpaid_net_profit'];
}
mysqli_stmt_close($stmt);

// Обща сума за платени поръчки
$total_sum = array_sum(array_column($profits, 'total'));
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vodazamen Manager – Печалби</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        @media print {
            body { margin: 0; }
            .container { width: 100%; margin: 0; padding: 0; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 14px; }
            th { background-color: #1F2937; color: white; }
            td { color: black; }
            h1 { text-align: center; font-size: 24px; margin: 20px 0; }
            .category-total { font-weight: bold; background-color: #e5e7eb; }
            .unpaid { color: red; }
            .net-profit { color: green; }
            .no-cost { color: gray; font-style: italic; }
        }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #d1d5db; padding: 8px; white-space: normal; }
        th { background-color: #1F2937; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #F9FAFB; color: black; }
        tr:nth-child(odd) { background-color: #FFFFFF; color: black; }
        .category-total { font-weight: bold; background-color: #e5e7eb; }
        .unpaid { color: red; }
        .net-profit { color: green; }
        .no-cost { color: gray; font-style: italic; }
        .bg-blue-500, .bg-green-500 { background-color: #1F2937 !important; }
        .bg-blue-500:hover, .bg-green-500:hover { background-color: #374151 !important; }
        .text-white { color: white !important; }
        .filters-container { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
        .filter-dates { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .input-field { padding: 6px; font-size: 14px; border-radius: 6px; border: 1px solid #d1d5db; width: 100%; max-width: 200px; }
        label { font-size: 12px; color: #374151; margin-bottom: 2px; }
        .no-data { text-align: center; color: #b91c1c; font-style: italic; }
        @media (max-width: 640px) {
            table { display: block; overflow-x: auto; white-space: nowrap; min-width: 100%; }
            th, td { font-size: 10px; padding: 4px; line-height: 1.2; }
            .filters-container { flex-direction: column; gap: 8px; align-items: stretch; }
            .filter-dates { flex-direction: column; gap: 4px; align-items: flex-start; }
            .input-field { max-width: none; width: 100%; }
            button { font-size: 12px; padding: 4px; }
        }
    </style>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200">
    <div class="container mx-auto bg-white rounded-lg shadow-lg w-full sm:w-11/12 md:w-11/12 lg:w-11/12">
        <?php include 'head.php'; ?>
        <?php include 'menu.php'; ?>

        <h2 class="text-2xl font-semibold mt-6 text-center">💰 Печалби по продукти и категории</h2>

        <div class="filters-container">
            <div class="filter-dates">
                <div class="field-container">
                    <label>📅 Начална дата</label>
                    <input type="date" id="start_date" name="start_date" class="input-field" value="<?php echo htmlspecialchars($start_date ?? ''); ?>">
                </div>
                <div class="field-container">
                    <label>📅 Крайна дата</label>
                    <input type="date" id="end_date" name="end_date" class="input-field" value="<?php echo htmlspecialchars($end_date ?? ''); ?>">
                </div>
                <button id="apply_filter" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">🔍 Приложи филтър</button>
                <button id="clear_filter" class="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition">🗑️ Изчисти филтър</button>
            </div>
        </div>

        <div>
            <?php if (empty($profits['Кафе']['products']) && empty($profits['Вода']['products']) && empty($profits['Некатегоризирано']['products'])) { ?>
                <p class="no-data">Няма налични данни за избрания период или няма доставени поръчки.</p>
            <?php } else { ?>
                <table class="bg-white border border-gray-300 rounded-lg shadow-md">
                    <thead>
                        <tr class="bg-gray-800 text-white">
                            <th class="p-3 border-b border-r text-center">📌 Категория</th>
                            <th class="p-3 border-b border-r text-center">📦 Продукт</th>
                            <th class="p-3 border-b border-r text-center">📏 Количество</th>
                            <th class="p-3 border-b border-r text-center">💸 Доставна цена (лв.)</th>
                            <th class="p-3 border-b border-r text-center">💰 Продажна цена (лв.)</th>
                            <th class="p-3 border-b text-center net-profit">🤑 Чиста печалба (лв.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach (array_keys($profits) as $category) { ?>
                            <?php if (!empty($profits[$category]['products'])) { ?>
                                <?php foreach ($profits[$category]['products'] as $product) { ?>
                                    <tr class="hover:bg-gray-50 transition">
                                        <td class="p-3 border-b border-r text-center">
                                            <?php echo $category === 'Кафе' ? '☕ Кафе' : ($category === 'Вода' ? '💧 Вода' : '📋 Некатегоризирано'); ?>
                                        </td>
                                        <td class="p-3 border-b border-r text-left"><?php echo htmlspecialchars($product['name']); ?></td>
                                        <td class="p-3 border-b border-r text-center">
                                            <?php echo $product['paid_quantity'] > 0 ? $product['paid_quantity'] . ' бр.' : ''; ?>
                                            <?php if ($product['unpaid_quantity'] > 0) { ?>
                                                <span class="unpaid"><?php echo ($product['paid_quantity'] > 0 ? ' (+' : '') . $product['unpaid_quantity'] . ' неплатени' . ($product['paid_quantity'] > 0 ? ')' : ''); ?></span>
                                            <?php } ?>
                                        </td>
                                        <td class="p-3 border-b border-r text-center <?php echo $product['total_cost'] > 0 ? '' : 'no-cost'; ?>" 
                                            title="<?php echo $product['total_cost'] > 0 ? 'Обща доставна цена за ' . $product['paid_quantity'] . ' бр.' : 'Няма зададена доставна цена'; ?>">
                                            <?php echo $product['total_cost'] > 0 ? number_format($product['total_cost'], 2, '.', '') . ' лв.' : 'Няма'; ?>
                                        </td>
                                        <td class="p-3 border-b border-r text-center" 
                                            title="Обща продажна цена за <?php echo $product['paid_quantity']; ?> бр.<?php echo $product['total_profit'] > 0 ? ' (вкл. персонализирана цена, ако е приложима)' : ''; ?>">
                                            <?php echo number_format($product['total_profit'], 2, '.', '') . ' лв.'; ?>
                                        </td>
                                        <td class="p-3 border-b text-center net-profit <?php echo $product['net_profit'] > 0 ? '' : 'no-cost'; ?>" 
                                            title="<?php echo $product['net_profit'] > 0 ? 'Чиста печалба за ' . $product['paid_quantity'] . ' бр.' : 'Няма зададена доставна цена'; ?>">
                                            <?php echo $product['net_profit'] > 0 ? number_format($product['net_profit'], 2, '.', '') . ' лв.' : 'Няма'; ?>
                                        </td>
                                    </tr>
                                <?php } ?>
                                <tr class="category-total">
                                    <td class="p-3 border-b border-r text-center">
                                        <?php echo $category === 'Кафе' ? '☕ Общо Кафе' : ($category === 'Вода' ? '💧 Общо Вода' : '📋 Общо Некатегоризирано'); ?>
                                    </td>
                                    <td class="p-3 border-b border-r text-center" colspan="2"></td>
                                    <td class="p-3 border-b border-r text-center <?php echo $profits[$category]['total'] > 0 ? '' : 'no-cost'; ?>">
                                        <?php echo $profits[$category]['total'] > 0 ? number_format($profits[$category]['total'], 2, '.', '') . ' лв.' : 'Няма'; ?>
                                    </td>
                                    <td class="p-3 border-b border-r text-center">
                                        <?php echo number_format($profits[$category]['total'], 2, '.', '') . ' лв.'; ?>
                                    </td>
                                    <td class="p-3 border-b text-center net-profit <?php echo $profits[$category]['net_total'] > 0 ? '' : 'no-cost'; ?>">
                                        <?php echo $profits[$category]['net_total'] > 0 ? number_format($profits[$category]['net_total'], 2, '.', '') . ' лв.' : 'Няма'; ?>
                                    </td>
                                </tr>
                            <?php } ?>
                        <?php } ?>
                        <tr class="category-total font-bold">
                            <td class="p-3 border-b border-r text-center">💸 Общо всичко</td>
                            <td class="p-3 border-b border-r text-center" colspan="2"></td>
                            <td class="p-3 border-b border-r text-center <?php echo $total_sum > 0 ? '' : 'no-cost'; ?>">
                                <?php echo $total_sum > 0 ? number_format($total_sum, 2, '.', '') . ' лв.' : 'Няма'; ?>
                            </td>
                            <td class="p-3 border-b border-r text-center">
                                <?php echo number_format($total_sum, 2, '.', '') . ' лв.'; ?>
                            </td>
                            <td class="p-3 border-b text-center net-profit <?php echo $total_net_profit > 0 ? '' : 'no-cost'; ?>">
                                <?php echo $total_net_profit > 0 ? number_format($total_net_profit, 2, '.', '') . ' лв.' : 'Няма'; ?>
                            </td>
                        </tr>
                        <?php if ($total_unpaid > 0) { ?>
                            <tr class="category-total font-bold">
                                <td class="p-3 border-b border-r text-center">💰 Общо за събиране</td>
                                <td class="p-3 border-b border-r text-center" colspan="4"></td>
                                <td class="p-3 border-b text-center unpaid" title="Обща сума за събиране от неплатени поръчки">
                                    <?php echo number_format($total_unpaid, 2, '.', '') . ' лв.'; ?>
                                    <?php if ($total_unpaid_net_profit > 0) { ?>
                                        <span class="net-profit"> ( <?php echo number_format($total_unpaid_net_profit, 2, '.', '') . ' лв.'; ?>)</span>
                                    <?php } else { ?>
                                        <span class="no-cost"> (Няма)</span>
                                    <?php } ?>
                                </td>
                            </tr>
                        <?php } ?>
                    </tbody>
                </table>
            <?php } ?>
        </div>
    </div>

    <?php include 'footer.php'; ?>

    <script src="scripts.js"></script>
    <script>
        $(document).ready(function() {
            $('#apply_filter').on('click', function() {
                const start_date = $('#start_date').val();
                const end_date = $('#end_date').val();
                const url = new URL(window.location.href);
                if (start_date) url.searchParams.set('start_date', start_date);
                else url.searchParams.delete('start_date');
                if (end_date) url.searchParams.set('end_date', end_date);
                else url.searchParams.delete('end_date');
                window.location.href = url.toString();
            });

            $('#clear_filter').on('click', function() {
                const url = new URL(window.location.href);
                url.searchParams.delete('start_date');
                url.searchParams.delete('end_date');
                window.location.href = url.toString();
            });
        });
    </script>
</body>
</html>