<?php
session_start();
date_default_timezone_set('Europe/Sofia');

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

include 'db_connect.php';

// Извличане на клиентите
$clients_query = "SELECT id, company_name FROM clients ORDER BY company_name";
$clients_result = mysqli_query($conn, $clients_query);
if (!$clients_result) {
    die("Грешка при заявка за клиенти: " . mysqli_error($conn));
}
$clients = [];
while ($row = mysqli_fetch_assoc($clients_result)) {
    $clients[] = $row;
}

// Извличане на продуктите с подреждане по sort_order
$products_query = "SELECT id, name, category, price, image_path FROM products WHERE category IN ('Кафе', 'Вода') ORDER BY sort_order ASC";
$products_result = mysqli_query($conn, $products_query);
if (!$products_result) {
    die("Грешка при заявка за продукти: " . mysqli_error($conn));
}
$products = [];
while ($row = mysqli_fetch_assoc($products_result)) {
    $products[] = $row;
}
mysqli_free_result($products_result);

// Обработка на добавяне на поръчка
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_order'])) {
    $client_id = isset($_POST['client_id']) && is_numeric($_POST['client_id']) ? (int)$_POST['client_id'] : 0;
    $order_date_input = $_POST['order_date'] ?? '';
    $order_items = isset($_POST['order_items']) && is_array($_POST['order_items']) ? $_POST['order_items'] : [];
    $comment = isset($_POST['comment']) ? trim($_POST['comment']) : null;

    // Валидация
    if (empty($client_id)) {
        $error_message = "Грешка: Клиентът не е избран.";
    } elseif (empty($order_items)) {
        $error_message = "Грешка: Няма добавени продукти.";
    } else {
        // Преобразуване на датата от "dd-mm-yyyy" в "YYYY-MM-DD"
        $date_parts = explode('-', $order_date_input);
        if (count($date_parts) == 3 && checkdate($date_parts[1], $date_parts[0], $date_parts[2])) {
            $order_date = sprintf("%s-%s-%s", $date_parts[2], $date_parts[1], $date_parts[0]);
        } else {
            $order_date = date('Y-m-d');
            $error_message = "Невалидна дата, използва се днешна: $order_date.";
        }

        // Проверка дали клиентът съществува
        $stmt = mysqli_prepare($conn, "SELECT id FROM clients WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "i", $client_id);
        mysqli_stmt_execute($stmt);
        $client_exists = mysqli_stmt_get_result($stmt)->num_rows > 0;
        mysqli_stmt_close($stmt);

        if (!$client_exists) {
            $error_message = "Невалиден клиент (ID: $client_id).";
        } else {
            mysqli_begin_transaction($conn);
            $inserted = false;
            $last_order_id = 0;

            try {
                $stmt = mysqli_prepare($conn, "INSERT INTO orders (client_id, order_date, product, quantity, returned_gallons, custom_price, status, invoiced, comment) VALUES (?, ?, ?, ?, ?, ?, 'Въведени', 0, ?)");
                if ($stmt === false) {
                    throw new Exception("Грешка при подготовка на SQL заявката: " . mysqli_error($conn));
                }

                foreach ($order_items as $index => $item) {
                    $product_name = isset($item['product']) ? trim($item['product']) : '';
                    $quantity = isset($item['quantity']) && is_numeric($item['quantity']) ? (int)$item['quantity'] : 0;
                    $returned_gallons = isset($item['returned_gallons']) && is_numeric($item['returned_gallons']) ? (int)$item['returned_gallons'] : 0;
                    $custom_price = isset($item['custom_price']) && $item['custom_price'] !== '' && is_numeric($item['custom_price']) ? (float)$item['custom_price'] : null;

                    // Проверка дали продуктът съществува
                    $stmt_check = mysqli_prepare($conn, "SELECT name FROM products WHERE name = ?");
                    mysqli_stmt_bind_param($stmt_check, "s", $product_name);
                    mysqli_stmt_execute($stmt_check);
                    $product_exists = mysqli_stmt_get_result($stmt_check)->num_rows > 0;
                    mysqli_stmt_close($stmt_check);

                    if (!$product_exists || empty($product_name) || $quantity <= 0) {
                        throw new Exception("Невалиден продукт или количество за ред #$index.");
                    }

                    mysqli_stmt_bind_param($stmt, "issisds", $client_id, $order_date, $product_name, $quantity, $returned_gallons, $custom_price, $comment);
                    if (!mysqli_stmt_execute($stmt)) {
                        throw new Exception("Грешка при вмъкване на продукт: " . mysqli_stmt_error($stmt));
                    }
                    $last_order_id = mysqli_insert_id($conn);
                    $inserted = true;
                }
                mysqli_stmt_close($stmt);

                if ($inserted) {
                    mysqli_commit($conn);
                    // Изчистване на localStorage
                    echo '<script>localStorage.removeItem("orderItems"); localStorage.removeItem("clientData"); localStorage.removeItem("orderDate"); document.getElementById("client-search").value = ""; document.getElementById("client-id").value = "";</script>';
                    // Редирект с параметри
                    $is_future_date = strtotime($order_date) > strtotime(date('Y-m-d'));
                    $redirect_params = http_build_query([
                        'page' => 1,
                        'sort_by' => 'default',
                        'show_future' => $is_future_date ? '1' : '0',
                        'search_client' => ''
                    ]);
                    header("Location: index.php?$redirect_params#order_$last_order_id");
                    exit;
                } else {
                    throw new Exception("Няма добавени валидни продукти.");
                }
            } catch (Exception $e) {
                mysqli_rollback($conn);
                $error_message = $e->getMessage();
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💧📋 Vodazamen Manager – Добавяне на поръчка</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
    <style>
        .container { padding: 16px; max-width: 1200px; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .product-card { 
            background-color: white; 
            padding: 16px; 
            border-radius: 8px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
            cursor: move; 
            transition: transform 0.2s, box-shadow 0.2s; 
            position: relative;
            overflow: hidden;
        }
        .product-card:hover { 
            transform: scale(1.05); 
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
        }
        .product-card.water { border-left: 4px solid #1e40af; }
        .product-card.coffee { border-left: 4px solid #7c2d12; }
        .product-card .category-icon { font-size: 24px; margin-bottom: 8px; text-align: center; }
        .product-card .product-image { 
            width: 80px; 
            height: 80px; 
            object-fit: cover; 
            border-radius: 50%; 
            margin: 0 auto 8px; 
            display: block;
            border: 1px solid #e5e7eb;
        }
        .product-card.hidden { display: none; }
        .order-table { width: 100%; border-collapse: collapse; margin-top: 24px; margin-bottom: 24px; }
        .order-table th, .order-table td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
        .order-table tr { transition: background-color 0.3s; }
        .order-table tr.added { background-color: #e6fffa; }
        .modal { 
            display: none; 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0,0,0,0.5); 
            justify-content: center; 
            align-items: center; 
            z-index: 1000; 
        }
        .modal-content { 
            background: white; 
            padding: 24px; 
            border-radius: 8px; 
            width: 90%; 
            max-width: 400px; 
            margin: auto; 
            max-height: 80vh; 
            overflow-y: auto; 
        }
        .input-field { width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px; }
        .input-field.focused { box-shadow: 0 0 8px rgba(31, 41, 55, 0.3); transition: box-shadow 0.2s; }
        .btn { padding: 8px 16px; border-radius: 6px; }
        .filter-btn { padding: 8px 16px; margin-right: 8px; border-radius: 6px; background-color: #e5e7eb; color: #374151; transition: all 0.2s; }
        .filter-btn.active, .filter-btn:hover { background-color: #1F2937; color: white; }
        .bg-blue-500, .bg-green-500, .bg-red-500 { background-color: #1F2937 !important; }
        .bg-blue-500:hover, .bg-green-500:hover, .bg-red-500:hover { background-color: #374151 !important; }
        .text-white { color: white !important; }
        @media (max-width: 640px) {
            .product-grid { grid-template-columns: 1fr; }
            .modal-content { width: 90%; max-width: 350px; }
            .product-card { padding: 12px; }
            .product-image { width: 60px; height: 60px; }
            .input-field { font-size: 14px; }
            .btn, .filter-btn { font-size: 14px; padding: 6px 12px; }
        }
    </style>
</head>
<body class="bg-gray-100 p-4">
    <div class="container mx-auto bg-white rounded-lg shadow-lg">
        <?php include 'head.php'; ?>
        <?php include 'menu.php'; ?>
        <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">📦 Нова поръчка</h2>
        <?php if (isset($error_message)): ?>
            <div class="text-red-500 mb-4 text-center"><?php echo htmlspecialchars($error_message, ENT_QUOTES, 'UTF-8'); ?></div>
        <?php endif; ?>

        <form method="POST" id="order-form">
            <input type="hidden" name="add_order" value="1">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label for="client-search" class="block text-sm font-medium text-gray-700">👥 Клиент</label>
                    <input type="text" id="client-search" placeholder="Търси по име..." class="input-field" required>
                    <input type="hidden" name="client_id" id="client-id">
                </div>
                <div>
                    <label for="order-date" class="block text-sm font-medium text-gray-700">📅 Дата</label>
                    <input type="text" name="order_date" id="order-date" placeholder="ДД-ММ-ГГГГ" class="input-field" required>
                </div>
            </div>
            <div class="mb-6">
                <label for="comment" class="block text-sm font-medium text-gray-700">📝 Допълнителна информация (по избор)</label>
                <textarea name="comment" id="comment" class="input-field" rows="4" placeholder="Напр. Закарай нова машина!"></textarea>
            </div>

            <h3 class="text-lg font-semibold mb-4">Текуща поръчка</h3>
            <table class="order-table">
                <thead>
                    <tr>
                        <th>📦 Продукт</th>
                        <th>📏 Количество</th>
                        <th>💸 Цена</th>
                        <th>♻️ Върнати галони</th>
                        <th>⚙️ Действия</th>
                    </tr>
                </thead>
                <tbody id="order-body"></tbody>
            </table>

            <div class="flex justify-between mt-4 mb-6">
                <button type="button" id="clear-order" class="bg-red-500 text-white btn hover:bg-red-600">Изчисти поръчката</button>
                <button type="submit" name="add_order" class="bg-green-500 text-white btn hover:bg-green-600">📦 Добави поръчка</button>
            </div>
            <div id="hidden-fields"></div>

            <h3 class="text-lg font-semibold mb-4">Избери продукти</h3>
            <div class="mb-6">
                <label for="product-search" class="block text-sm font-medium text-gray-700">🕵️‍♂️ Търсене по продукт</label>
                <input type="text" id="product-search" placeholder="Напр. Девин..." class="input-field" autocomplete="off">
            </div>
            <p class="text-sm text-gray-600 mb-4">👉 Плъзгайте продуктите, за да промените реда им.</p>
            <div class="mb-4">
                <button type="button" class="filter-btn active" data-filter="all">Всички</button>
                <button type="button" class="filter-btn" data-filter="Вода">💧 Вода</button>
                <button type="button" class="filter-btn" data-filter="Кафе">☕ Кафе</button>
            </div>
            <div class="product-grid sortable" id="product-grid">
                <?php foreach ($products as $product): ?>
                    <div class="product-card <?php echo $product['category'] === 'Вода' ? 'water' : 'coffee'; ?>" 
                         data-id="<?php echo $product['id']; ?>" 
                         data-category="<?php echo htmlspecialchars($product['category'], ENT_QUOTES, 'UTF-8'); ?>" 
                         data-product='<?php echo htmlspecialchars(json_encode($product, JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE), ENT_QUOTES, 'UTF-8'); ?>'>
                        <?php if (!empty($product['image_path']) && file_exists($product['image_path'])): ?>
                            <img src="<?php echo htmlspecialchars($product['image_path'], ENT_QUOTES, 'UTF-8'); ?>" 
                                 alt="<?php echo htmlspecialchars($product['name'], ENT_QUOTES, 'UTF-8'); ?>" 
                                 class="product-image">
                        <?php else: ?>
                            <div class="category-icon"><?php echo $product['category'] === 'Вода' ? '💧' : '☕'; ?></div>
                        <?php endif; ?>
                        <h4 class="text-md font-medium text-center"><?php echo htmlspecialchars($product['name'], ENT_QUOTES, 'UTF-8'); ?></h4>
                        <p class="text-sm text-gray-600 text-center">Цена: <?php echo number_format($product['price'], 2); ?> лв.</p>
                    </div>
                <?php endforeach; ?>
            </div>
        </form>

        <div id="details-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <h3 id="modal-title" class="text-lg font-bold mb-4"></h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium">📏 Количество</label>
                        <input type="number" id="modal-quantity" min="1" value="1" class="input-field" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">💸 Персонализирана цена (по избор)</label>
                        <input type="number" id="modal-custom-price" min="0" step="0.01" class="input-field" placeholder="Остави празно за стандартна цена">
                    </div>
                    <div id="returned-gallons-section" style="display: none;">
                        <label class="block text-sm font-medium">♻️ Върнати галони</label>
                        <input type="number" id="modal-returned-gallons" min="0" value="0" class="input-field">
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-6">
                    <button id="modal-cancel" class="bg-gray-300 text-gray-700 btn hover:bg-gray-400">Отказ</button>
                    <button id="modal-save" class="bg-blue-500 text-white btn hover:bg-blue-600">Запази</button>
                </div>
            </div>
        </div>
    </div>

    <?php include 'footer.php'; ?>

    <script>
        let orderItems = [];
        let currentProduct = null;
        let editIndex = -1;

        $(document).ready(function() {
            // Инициализация на datepicker с днешна дата
            $("#order-date").datepicker({
                dateFormat: "dd-mm-yy",
                changeMonth: true,
                changeYear: true,
                yearRange: "2020:+1",
                maxDate: "+1Y"
            }).val(localStorage.getItem('orderDate') || $.datepicker.formatDate('dd-mm-yy', new Date()));

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
            $("#client-search").autocomplete({
                source: function(request, response) {
                    const term = request.term.toLowerCase();
                    const filtered = clients.filter(client => client.label.toLowerCase().includes(term));
                    response(filtered.length ? filtered : [{ label: "Няма намерени клиенти", value: null }]);
                },
                select: function(event, ui) {
                    if (ui.item.value === null) {
                        $("#client-search").val('');
                        $("#client-id").val('');
                        localStorage.removeItem('clientData');
                        return false;
                    }
                    $("#client-search").val(ui.item.label);
                    $("#client-id").val(ui.item.value);
                    localStorage.setItem('clientData', JSON.stringify({ label: ui.item.label, value: ui.item.value }));
                    return false;
                },
                minLength: 2
            });

            // Възстановяване на клиент
            const savedClient = localStorage.getItem('clientData');
            if (savedClient) {
                const clientData = JSON.parse(savedClient);
                $("#client-search").val(clientData.label);
                $("#client-id").val(clientData.value);
            }

            // Запазване на датата при промяна
            $("#order-date").on('change', function() {
                localStorage.setItem('orderDate', $(this).val());
            });

            // Филтриране на продукти
            $('.filter-btn').on('click', function() {
                $('.filter-btn').removeClass('active');
                $(this).addClass('active');
                const filter = $(this).data('filter');
                $('.product-card').each(function() {
                    const category = $(this).data('category');
                    $(this).toggle(filter === 'all' || category === filter);
                });
            });

            // Инициализация на SortableJS за product-grid
            const sortable = new Sortable(document.getElementById('product-grid'), {
                animation: 150,
                ghostClass: 'bg-blue-100',
                onEnd: function(evt) {
                    const order = sortable.toArray();
                    $.ajax({
                        url: 'products.php',
                        method: 'POST',
                        data: {
                            action: 'update_order',
                            product_id: order[0],
                            order: JSON.stringify(order)
                        },
                        dataType: 'json',
                        success: function(response) {
                            if (!response.success) {
                                console.error('Грешка при запазване на реда:', response.message);
                            }
                        },
                        error: function() {
                            console.error('Грешка при комуникация със сървъра.');
                        }
                    });
                }
            });

            // Търсене по продукт
            $('#product-search').on('input', function() {
                const searchTerm = $(this).val().toLowerCase();
                $('.product-card').each(function() {
                    const productName = $(this).find('h4').text().toLowerCase();
                    $(this).toggle(productName.includes(searchTerm));
                });
            });

            // Клик на продукт
            $('.product-card').on('click', function(e) {
                // Предотвратяваме задействането на клик събитието при плъзгане
                if (e.originalEvent.detail === 0) return; // Игнорираме събития, генерирани от SortableJS
                currentProduct = JSON.parse($(this).attr('data-product'));
                if (!currentProduct || !currentProduct.name || !currentProduct.category || isNaN(parseFloat(currentProduct.price))) {
                    alert('Грешка при зареждане на продукта.');
                    return;
                }
                editIndex = -1;
                $('#modal-title').text(`Добави ${currentProduct.name}`);
                $('#modal-quantity').val(1);
                $('#modal-custom-price').val('');
                $('#modal-returned-gallons').val(0);
                $('#returned-gallons-section').toggle(currentProduct.category === 'Вода');
                $('#details-modal').css('display', 'flex');
            });

            // Скрол за количество
            $('#modal-quantity').on('wheel', function(e) {
                e.preventDefault();
                const currentVal = parseInt($(this).val(), 10) || 1;
                const delta = e.originalEvent.deltaY < 0 ? 1 : -1;
                const newVal = Math.max(1, currentVal + delta);
                $(this).val(newVal);
                $(this).addClass('focused');
                setTimeout(() => $(this).removeClass('focused'), 200);
            });

            // Скрол за върнати галони
            $('#modal-returned-gallons').on('wheel', function(e) {
                e.preventDefault();
                const currentVal = parseInt($(this).val(), 10) || 0;
                const delta = e.originalEvent.deltaY < 0 ? 1 : -1;
                const newVal = Math.max(0, currentVal + delta);
                $(this).val(newVal);
                $(this).addClass('focused');
                setTimeout(() => $(this).removeClass('focused'), 200);
            });

            // Затваряне на модал
            $('#modal-cancel').on('click', function() {
                $('#details-modal').css('display', 'none');
                currentProduct = null;
                editIndex = -1;
            });

            // Запазване от модал
            $('#modal-save').on('click', function() {
                if (!currentProduct || !currentProduct.name || !currentProduct.category || isNaN(parseFloat(currentProduct.price))) {
                    alert('Грешка: Няма избран продукт или данните са невалидни.');
                    return;
                }

                const quantityInput = $('#modal-quantity').val().trim();
                const quantity = parseInt(quantityInput, 10);
                const customPriceInput = $('#modal-custom-price').val().trim();
                const customPrice = customPriceInput !== '' ? parseFloat(customPriceInput) : null;
                const returnedGallonsInput = $('#modal-returned-gallons').val().trim();
                const returnedGallons = currentProduct.category === 'Вода' ? (parseInt(returnedGallonsInput, 10) || 0) : 0;

                if (isNaN(quantity) || quantity <= 0) {
                    alert('Моля, въведете количество поне 1.');
                    return;
                }
                if (customPrice !== null && (isNaN(customPrice) || customPrice < 0)) {
                    alert('Персонализираната цена не може да бъде отрицателна.');
                    return;
                }
                if (currentProduct.category === 'Вода' && (isNaN(returnedGallons) || returnedGallons < 0)) {
                    alert('Върнатите галони не могат да бъдат отрицателни.');
                    return;
                }

                const item = {
                    product: currentProduct.name,
                    category: currentProduct.category,
                    quantity: quantity,
                    custom_price: customPrice,
                    returned_gallons: returnedGallons,
                    price: parseFloat(currentProduct.price)
                };

                if (editIndex >= 0) {
                    orderItems[editIndex] = item;
                } else {
                    orderItems.push(item);
                }
                localStorage.setItem('orderItems', JSON.stringify(orderItems));
                renderOrderTable();
                $('#details-modal').css('display', 'none');
                currentProduct = null;
                editIndex = -1;
            });

            // Изчистване на поръчката
            $('#clear-order').on('click', function() {
                orderItems = [];
                localStorage.setItem('orderItems', JSON.stringify(orderItems));
                renderOrderTable();
            });

            // Submit форма
            $('#order-form').on('submit', function() {
                if (!orderItems.length) {
                    alert('Добавете поне един продукт към поръчката.');
                    return false;
                }
                if (!$('#client-id').val()) {
                    alert('Моля, изберете клиент.');
                    return false;
                }
                if (!$('#order-date').val()) {
                    alert('Моля, изберете дата.');
                    return false;
                }
                const hidden = $('#hidden-fields');
                hidden.empty();
                orderItems.forEach((item, index) => {
                    const customPriceValue = item.custom_price !== null ? item.custom_price : '';
                    hidden.append(`
                        <input type="hidden" name="order_items[${index}][product]" value="${item.product}">
                        <input type="hidden" name="order_items[${index}][quantity]" value="${item.quantity}">
                        <input type="hidden" name="order_items[${index}][custom_price]" value="${customPriceValue}">
                        <input type="hidden" name="order_items[${index}][returned_gallons]" value="${item.returned_gallons}">
                    `);
                });
                return true;
            });

            // Първоначално зареждане
            <?php if (!isset($error_message)): ?>
                localStorage.removeItem('orderItems');
                localStorage.removeItem('clientData');
                localStorage.removeItem('orderDate');
                orderItems = [];
                $("#client-search").val('');
                $("#client-id").val('');
            <?php else: ?>
                const stored = localStorage.getItem('orderItems');
                if (stored) {
                    orderItems = JSON.parse(stored);
                }
            <?php endif; ?>
            renderOrderTable();
        });

        function renderOrderTable() {
            const body = $('#order-body');
            body.empty();
            orderItems.forEach((item, index) => {
                const price = item.custom_price !== null ? item.custom_price : item.price;
                body.append(`
                    <tr class="added">
                        <td>${item.product}</td>
                        <td>${item.quantity}</td>
                        <td>${price.toFixed(2)} лв.</td>
                        <td>${item.returned_gallons}</td>
                        <td>
                            <button type="button" class="text-blue-500 mr-2" onclick="editItem(${index})">✏️</button>
                            <button type="button" class="text-red-500" onclick="removeItem(${index})">❌</button>
                        </td>
                    </tr>
                `);
            });
            setTimeout(() => $('.order-table tr.added').removeClass('added'), 1000);
        }

        function editItem(index) {
            currentProduct = { 
                name: orderItems[index].product, 
                category: orderItems[index].category, 
                price: orderItems[index].price 
            };
            editIndex = index;
            $('#modal-title').text(`Редактирай ${currentProduct.name}`);
            $('#modal-quantity').val(orderItems[index].quantity);
            $('#modal-custom-price').val(orderItems[index].custom_price !== null ? orderItems[index].custom_price : '');
            $('#modal-returned-gallons').val(orderItems[index].returned_gallons);
            $('#returned-gallons-section').toggle(currentProduct.category === 'Вода');
            $('#details-modal').css('display', 'flex');
        }

        function removeItem(index) {
            orderItems.splice(index, 1);
            localStorage.setItem('orderItems', JSON.stringify(orderItems));
            renderOrderTable();
        }
    </script>
</body>
</html>