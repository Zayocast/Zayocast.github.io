<?php
session_start();
include 'db_connect.php';

ini_set('memory_limit', '12288M');
ini_set('max_execution_time', '2700');
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', 'error_log.txt');

// Пагинация настройки
$products_per_page = 40;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $products_per_page;

// Брой продукти за пагинация
$total_products_query = "SELECT COUNT(*) as total FROM products";
$total_result = mysqli_query($conn, $total_products_query);
$total_products = mysqli_fetch_assoc($total_result)['total'];
$total_pages = ceil($total_products / $products_per_page);

// Функция за генериране на уникален номер за оферта
function generateOfferNumber($client_id) {
    $timestamp = date('YmdHis');
    return "OFR{$client_id}{$timestamp}";
}

// AJAX заявка за търсене на продукти
if (isset($_GET['ajax']) && $_GET['ajax'] == '2' && isset($_GET['search_products'])) {
    $search = mysqli_real_escape_string($conn, $_GET['search_products']);
    $query = "SELECT * FROM products WHERE name LIKE ? OR category LIKE ? OR type LIKE ? LIMIT ?, ?";
    $search_wildcard = "%" . $search . "%";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "sssii", $search_wildcard, $search_wildcard, $search_wildcard, $offset, $products_per_page);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $products = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $products[] = $row;
    }
    echo json_encode($products);
    exit;
}

// AJAX заявка за търсене на клиенти
if (isset($_GET['ajax']) && $_GET['ajax'] == '1' && isset($_GET['search'])) {
    $search = mysqli_real_escape_string($conn, $_GET['search']);
    $query = "SELECT id, company_name FROM clients WHERE company_name LIKE ?";
    $search_wildcard = "%" . $search . "%";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "s", $search_wildcard);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $suggestions = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $suggestions[] = [
            'label' => $row['company_name'],
            'value' => $row['id']
        ];
    }
    echo json_encode($suggestions);
    exit;
}

// Взимане на данните на фирмата
$company_query = "SELECT * FROM company_details LIMIT 1";
$company_result = mysqli_query($conn, $company_query);
if (!$company_result) {
    die("Грешка при взимане на данни за фирмата: " . mysqli_error($conn));
}
$company = mysqli_fetch_assoc($company_result);
if (!$company) {
    $company = [
        'company_name' => 'Vodazamen Manager',
        'eic' => '',
        'address' => 'Пазарджик, България',
        'vat_number' => '',
        'phone' => '0879101771',
        'email' => 'info@vodazamen.com',
        'logo_path' => ''
    ];
}

// Генериране на оферта
if (isset($_POST['generate_offer']) && isset($_POST['client_id']) && !empty($_POST['client_id']) && is_numeric($_POST['client_id']) && isset($_POST['products'])) {
    $client_id = (int)$_POST['client_id'];
    $selected_products = $_POST['products'];
    $custom_prices = $_POST['custom_prices'] ?? [];

    if (count($selected_products) > 1000) {
        die("Грешка: Максималният брой избрани продукти е 1000.");
    }

    $stmt = mysqli_prepare($conn, "SELECT company_name FROM clients WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $client_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $client = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if ($client) {
        $offer_date = date('Y-m-d');
        $offer_number = generateOfferNumber($client_id);
        $items = implode(',', $selected_products);

        $stmt = mysqli_prepare($conn, "INSERT INTO offers (client_id, offer_date, items) VALUES (?, ?, ?)");
        mysqli_stmt_bind_param($stmt, "iss", $client_id, $offer_date, $items);
        if (!mysqli_stmt_execute($stmt)) {
            die("Грешка при запис на оферта: " . mysqli_stmt_error($stmt));
        }
        $offer_id = mysqli_insert_id($conn);
        mysqli_stmt_close($stmt);

        $html = generateOfferHTML($client_id, $offer_number, $offer_date, $selected_products, $custom_prices, $company);
        $_SESSION['offer_html'] = $html;
        $_SESSION['offer_number'] = $offer_number;

        header("Location: view_offer.php?offer_number=" . urlencode($offer_number));
        exit;
    }
}

// Функция за генериране на HTML за офертата с персонализирани цени
function generateOfferHTML($client_id, $offer_number, $offer_date, $selected_products, $custom_prices, $company) {
    global $conn;
    $client_query = "SELECT company_name FROM clients WHERE id = ?";
    $stmt = mysqli_prepare($conn, $client_query);
    mysqli_stmt_bind_param($stmt, "i", $client_id);
    mysqli_stmt_execute($stmt);
    $client = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    $products_query = "SELECT id, name, type, category, price, image_path FROM products WHERE id IN (" . implode(',', array_fill(0, count($selected_products), '?')) . ")";
    $stmt = mysqli_prepare($conn, $products_query);
    mysqli_stmt_bind_param($stmt, str_repeat('i', count($selected_products)), ...$selected_products);
    mysqli_stmt_execute($stmt);
    $products_result = mysqli_stmt_get_result($stmt);

    $products = [];
    while ($product = mysqli_fetch_assoc($products_result)) {
        $product['price'] = isset($custom_prices[$product['id']]) && $custom_prices[$product['id']] !== '' ? (float)$custom_prices[$product['id']] : $product['price'];
        $products[] = $product;
    }
    mysqli_stmt_close($stmt);

    ob_start();
?>
<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Оферта № <?php echo $offer_number; ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @media print {
            body { margin: 0; padding: 0; }
            .container { width: 100%; margin: 0; padding: 0; }
            table { border-collapse: collapse; width: 100%; border: 1px solid #000; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; }
            th { background-color: #000; color: white; }
            td { color: black; }
            .box { border: 1px solid #000; padding: 8px; margin-bottom: 8px; }
            h1 { text-align: center; font-size: 18px; font-weight: bold; margin: 10px 0; }
            .no-print { display: none; }
        }
        .container { padding: 16px; max-width: 800px; margin: 0 auto; }
        table { border-collapse: collapse; width: 100%; border: 1px solid #d1d5db; }
        th, td { border: 1px solid #d1d5db; padding: 8px; }
        th { background-color: #000; color: white; font-weight: bold; }
    </style>
</head>
<body class="bg-white">
    <div class="container">
        <h1 class="text-xl font-bold mb-2 text-center">Оферта за доставка</h1>
        <div class="text-center mb-2">Номер: <?php echo $offer_number; ?></div>
        <div class="text-center mb-2">Дата: <?php echo date('d.m.Y', strtotime($offer_date)); ?></div>
        <div class="flex justify-between mb-2">
            <div class="box w-1/2 mr-2">
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
            <div class="box w-1/2 ml-2">
                <p><strong>Получател</strong></p>
                <p><?php echo htmlspecialchars($client['company_name']); ?></p>
            </div>
        </div>
        <table class="min-w-full mb-2">
            <thead>
                <tr>
                    <th class="p-2 border text-center">№</th>
                    <th class="p-2 border text-center">Вид</th>
                    <th class="p-2 border text-center">Снимка</th>
                    <th class="p-2 border text-center">Продукт</th>
                    <th class="p-2 border text-center">Цена (лв.)</th>
                </tr>
            </thead>
            <tbody>
                <?php $i = 1; foreach ($products as $product): ?>
                    <tr>
                        <td class="p-2 border text-center"><?php echo $i++; ?></td>
                        <td class="p-2 border text-center"><?php echo htmlspecialchars($product['category'] == 'Вода' ? $product['type'] : $product['category']); ?></td>
                        <td class="p-2 border text-center">
                            <?php if (file_exists($product['image_path'])): ?>
                                <img src="<?php echo htmlspecialchars($product['image_path']); ?>" alt="<?php echo htmlspecialchars($product['name']); ?>" class="w-12 h-12 mx-auto">
                            <?php else: ?>
                                Без снимка
                            <?php endif; ?>
                        </td>
                        <td class="p-2 border text-center"><?php echo htmlspecialchars($product['name']); ?></td>
                        <td class="p-2 border text-center"><?php echo number_format($product['price'], 2, '.', ''); ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <div class="box text-center mb-2">
            <p>Всички цени са крайни с включено ДДС</p>
        </div>
    </div>
</body>
</html>
<?php
    return ob_get_clean();
}

// Останалата част от кода (HTML интерфейс)
$clients_query = "SELECT * FROM clients";
$clients_result = mysqli_query($conn, $clients_query);

$coffee_query = "SELECT * FROM products WHERE category='Кафе' LIMIT $offset, $products_per_page";
$spring_water_query = "SELECT * FROM products WHERE category='Вода' AND type='Изворна' LIMIT $offset, $products_per_page";
$mineral_water_query = "SELECT * FROM products WHERE category='Вода' AND type='Минерална' LIMIT $offset, $products_per_page";
$table_water_query = "SELECT * FROM products WHERE category='Вода' AND type='Трапезна' LIMIT $offset, $products_per_page";
$deionized_water_query = "SELECT * FROM products WHERE category='Вода' AND type='Дейонизирана вода' LIMIT $offset, $products_per_page";

$coffee_result = mysqli_query($conn, $coffee_query);
$spring_water_result = mysqli_query($conn, $spring_water_query);
$mineral_water_result = mysqli_query($conn, $mineral_water_query);
$table_water_result = mysqli_query($conn, $table_water_query);
$deionized_water_result = mysqli_query($conn, $deionized_water_query);

// Кеширане на първоначалните продукти в JSON за JavaScript
$initial_products = [];
$queries = [
    'Кафе' => $coffee_result,
    'Вода Изворна' => $spring_water_result,
    'Вода Минерална' => $mineral_water_result,
    'Вода Трапезна' => $table_water_result,
    'Вода Дейонизирана' => $deionized_water_result
];
foreach ($queries as $category => $result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $initial_products[] = $row;
    }
}
$initial_products_json = json_encode($initial_products);
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💼 Генериране на оферта</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js"></script>
    <style>
        .truncate-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .product-tile {
            width: 200px;
            height: 250px;
            padding: 8px;
            margin: 6px;
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            transition: all 0.3s ease;
        }
        .product-tile:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transform: scale(1.03);
        }
        .product-tile.selected {
            background-color: #f0fdf4;
            border-color: #10b981;
        }
        .product-tile img {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 8px;
        }
        .product-tile .category-icon {
            font-size: 24px;
            margin-bottom: 4px;
        }
        .product-details {
            flex-grow: 1;
            font-size: 13px;
            line-height: 1.3;
        }
        .product-details .name {
            font-weight: 600;
            color: #1f2937;
        }
        .product-details .category {
            color: #6b7280;
        }
        .price-container {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .price {
            font-size: 14px;
            font-weight: 500;
            color: #2563eb;
        }
        .custom-price-panel {
            display: none;
            margin-top: 4px;
        }
        .custom-price-panel.visible {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .custom-price-input {
            width: 60px;
            padding: 3px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 12px;
        }
        .confirm-price-btn {
            padding: 2px 6px;
            background-color: #10b981;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 10px;
            cursor: pointer;
        }
        .confirm-price-btn:hover {
            background-color: #059669;
        }
        .product-group {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
        }
        .input-field {
            width: 100%;
            padding: 8px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 16px;
        }
        .input-field.focused {
            box-shadow: 0 0 8px rgba(31, 41, 55, 0.3);
            transition: box-shadow 0.2s;
        }
    </style>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200 p-4">
    <div class="container mx-auto bg-white p-6 rounded-lg shadow-lg">
        <?php include 'head.php'; ?>
        <?php include 'menu.php'; ?>

        <!-- Генериране на оферта -->
        <h2 class="text-xl font-semibold mt-6">💼 Генериране на оферта</h2>
        <form method="POST" action="offer.php" target="_blank" class="flex flex-col gap-4">
            <div class="relative">
                <h3 class="text-lg font-semibold mb-2">👥 Клиент</h3>
                <input type="text" id="client-search-offer" placeholder="Търси по име..." class="input-field" required>
                <input type="hidden" name="client_id" id="client-id-offer">
            </div>
            <div class="flex flex-col gap-6">
                <h3 class="text-lg font-semibold text-gray-700">📦 Избери продукти:</h3>
                
                <!-- Търсачка за продукти -->
                <div class="mb-4">
                    <input type="text" id="product-search" placeholder="🔍 Търси продукти..." class="border p-3 rounded-lg shadow w-full">
                </div>

                <!-- Контейнер за динамично показване на продуктите -->
                <div id="products-container" class="flex flex-col gap-6">
                    <!-- Група Кафе -->
                    <div class="mb-6">
                        <h4 class="text-md font-semibold text-gray-600 mb-2">☕ Кафе</h4>
                        <div class="product-group" data-category="Кафе"></div>
                    </div>

                    <!-- Група Вода Изворна -->
                    <div class="mb-6">
                        <h4 class="text-md font-semibold text-gray-600 mb-2">🌊 Вода Изворна</h4>
                        <div class="product-group" data-category="Вода Изворна"></div>
                    </div>

                    <!-- Група Вода Минерална -->
                    <div class="mb-6">
                        <h4 class="text-md font-semibold text-gray-600 mb-2">💧 Вода Минерална</h4>
                        <div class="product-group" data-category="Вода Минерална"></div>
                    </div>

                    <!-- Група Вода Трапезна -->
                    <div class="mb-6">
                        <h4 class="text-md font-semibold text-gray-600 mb-2">🍽️ Вода Трапезна</h4>
                        <div class="product-group" data-category="Вода Трапезна"></div>
                    </div>

                    <!-- Група Вода Дейонизирана -->
                    <div class="mb-6">
                        <h4 class="text-md font-semibold text-gray-600 mb-2">⚗️ Вода Дейонизирана</h4>
                        <div class="product-group" data-category="Вода Дейонизирана"></div>
                    </div>

                    <!-- Пагинация -->
                    <div class="flex justify-center gap-2">
                        <?php if ($page > 1): ?>
                            <a href="?page=<?php echo $page - 1; ?>" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">⬅️ Предишна</a>
                        <?php endif; ?>
                        <span class="p-2">📄 Страница <?php echo $page; ?> от <?php echo $total_pages; ?></span>
                        <?php if ($page < $total_pages): ?>
                            <a href="?page=<?php echo $page + 1; ?>" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">Следваща ➡️</a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            <div class="flex flex-col items-center gap-2">
                <button type="submit" name="generate_offer" class="bg-blue-500 text-white p-3 rounded-lg shadow hover:bg-blue-600 transition">📜 Генерирай</button>
            </div>
        </form>
    </div>
    <script>
    $(document).ready(function() {
        // Кеширане на първоначалните продукти от PHP
        let initialProducts = <?php echo $initial_products_json; ?>;
        let selectedProducts = new Set();
        let customPrices = {};

        // Инициализация на autocomplete за клиенти
        const clients = [
            <?php
            mysqli_data_seek($clients_result, 0);
            while ($row = mysqli_fetch_assoc($clients_result)) {
                echo "{ label: '" . addslashes($row['company_name']) . "', value: '" . $row['id'] . "' },";
            }
            mysqli_free_result($clients_result);
            ?>
        ];
        $("#client-search-offer").autocomplete({
            source: function(request, response) {
                const term = request.term.toLowerCase();
                const filtered = clients.filter(client => client.label.toLowerCase().includes(term));
                response(filtered.length ? filtered : [{ label: "Няма намерени клиенти", value: null }]);
            },
            select: function(event, ui) {
                if (ui.item.value === null) {
                    $("#client-search-offer").val('');
                    $("#client-id-offer").val('');
                    return false;
                }
                $("#client-search-offer").val(ui.item.label);
                $("#client-id-offer").val(ui.item.value);
                return false;
            },
            minLength: 2
        });

        // Запазване на текущо избраните продукти и показване на полето за цена
        $('body').on('change', 'input[name="products[]"]', function() {
            let productId = $(this).val();
            let tile = $(this).closest('.product-tile');
            let panel = tile.find('.custom-price-panel');
            
            if ($(this).is(':checked')) {
                selectedProducts.add(productId);
                tile.addClass('selected');
                panel.addClass('visible');
            } else {
                selectedProducts.delete(productId);
                tile.removeClass('selected');
                panel.removeClass('visible');
            }
        });

        // Запазване на персонализираните цени при потвърждение
        $('body').on('click', '.confirm-price-btn', function() {
            let productId = $(this).closest('.product-tile').data('id');
            let input = $(this).siblings('.custom-price-input');
            let value = input.val();
            if (value !== '') {
                customPrices[productId] = value;
                $(this).closest('.price-container').find('.price').text(Number(value).toFixed(2) + ' Лв.');
            }
        });

        // Функция за генериране на HTML за продукти
        function renderProducts(products) {
            $('#products-container .product-group').empty();
            let categories = {
                'Кафе': [],
                'Вода Изворна': [],
                'Вода Минерална': [],
                'Вода Трапезна': [],
                'Вода Дейонизирана': []
            };

            products.forEach(product => {
                let categoryKey = product.category === 'Кафе' ? 'Кафе' : `Вода ${product.type}`;
                if (categories[categoryKey]) {
                    categories[categoryKey].push(product);
                }
            });

            for (let [category, items] of Object.entries(categories)) {
                let container = $(`#products-container .product-group[data-category="${category}"]`);
                items.forEach(product => {
                    let isChecked = selectedProducts.has(product.id.toString()) ? 'checked' : '';
                    let customPrice = customPrices[product.id] || '';
                    let displayPrice = customPrice ? Number(customPrice).toFixed(2) : Number(product.price).toFixed(2);
                    let inputVisible = isChecked ? 'visible' : '';
                    let productHtml = `
                        <label class="product-tile ${isChecked ? 'selected' : ''}" data-id="${product.id}">
                            <input type="checkbox" name="products[]" value="${product.id}" class="form-checkbox h-4 w-4 text-blue-600" ${isChecked}>
                            <img src="${product.image_path}" alt="${product.name}">
                            <span class="category-icon">${getCategoryIcon(category)}</span>
                            <div class="product-details">
                                <span class="name">${product.name}</span>
                                <span class="category">${product.type || product.category}</span>
                            </div>
                            <div class="price-container">
                                <span class="price">${displayPrice} Лв.</span>
                                <div class="custom-price-panel ${inputVisible}">
                                    <input type="number" name="custom_prices[${product.id}]" class="custom-price-input" placeholder="${Number(product.price).toFixed(2)}" step="0.01" min="0" value="${customPrice}">
                                    <button type="button" class="confirm-price-btn">✔️</button>
                                </div>
                            </div>
                        </label>`;
                    container.append(productHtml);
                });
            }
        }

        // Търсене на продукти в реално време
        $('#product-search').on('input', function() {
            let query = $(this).val();
            if (query.length >= 1) {
                $.ajax({
                    url: 'offer.php',
                    method: 'GET',
                    data: { 
                        search_products: query,
                        ajax: 2
                    },
                    dataType: 'json',
                    success: function(products) {
                        renderProducts(products);
                    },
                    error: function(xhr, status, error) {
                        console.error('Грешка при търсенето на продукти:', error);
                    }
                });
            } else {
                renderProducts(initialProducts);
            }
        });

        // Първоначално зареждане на продуктите
        renderProducts(initialProducts);

        // Помощна функция за икони на категориите
        function getCategoryIcon(category) {
            const icons = {
                'Кафе': '☕',
                'Вода Изворна': '🌊',
                'Вода Минерална': '💧',
                'Вода Трапезна': '🍽️',
                'Вода Дейонизирана': '⚗️'
            };
            return icons[category] || '';
        }
    });
    </script>
    <?php include 'footer.php'; ?>
</body>
</html>