<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include 'db_connect.php';

$error = "";
$success = "";
$client = null;
$products = []; // Съдържа всички продукти от products.php
$selected_products = []; // Съдържа избраните продукти за поръчка

// Проверка за клиент чрез GET
$client_id = isset($_GET['client_id']) && !empty($_GET['client_id']) && is_numeric($_GET['client_id']) ? (int)$_GET['client_id'] : null;

if ($client_id) {
    // Извличане на данни за клиента
    $stmt = mysqli_prepare($conn, "SELECT company_name, phone, eik, address FROM clients WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $client_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $client = mysqli_fetch_assoc($result);

    if (!$client) {
        $error = "Клиентът не е намерен. Моля, провери дали ID-то е валидно или добави клиент в базата.";
    }
} else {
    echo "<!-- Няма client_id в URL-а -->";
}

// Извличане на всички продукти от products.php
$stmt = mysqli_prepare($conn, "SELECT name, type, price FROM products ORDER BY name");
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
while ($product = mysqli_fetch_assoc($result)) {
    $products[$product['type']][] = $product;
}
mysqli_stmt_close($stmt);

// Обработка на добавяне на поръчка
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_order'])) {
    $client_id = (int)$_POST['client_id'];
    $products = isset($_POST['products']) ? $_POST['products'] : [];
    $quantities = isset($_POST['quantities']) ? $_POST['quantities'] : [];
    $returned_gallons = isset($_POST['returned_gallons']) ? $_POST['returned_gallons'] : [];

    if (empty($products) || empty($quantities)) {
        $error = "Моля, изберете поне един продукт и количество.";
    } else {
        try {
            // Започваме транзакция, за да добавим всички продукти в една поръчка
            mysqli_begin_transaction($conn);

            foreach ($products as $index => $product_name) {
                $quantity = (int)$quantities[$index];
                $returned_gallon = isset($returned_gallons[$index]) && !empty($returned_gallons[$index]) ? (float)$returned_gallons[$index] : 0;

                if ($quantity > 0) {
                    $stmt = mysqli_prepare($conn, "INSERT INTO orders (client_id, product, quantity, returned_gallons, order_date) VALUES (?, ?, ?, ?, NOW())");
                    mysqli_stmt_bind_param($stmt, "isid", $client_id, $product_name, $quantity, $returned_gallon);
                    if (!mysqli_stmt_execute($stmt)) {
                        throw new Exception("Грешка при добавяне на поръчка: " . mysqli_error($conn));
                    }
                    mysqli_stmt_close($stmt);
                }
            }

            mysqli_commit($conn);
            $success = "Поръчката е добавена успешно.";
            echo "<script>alert('$success'); window.location.href = 'index.php';</script>";
            exit;
        } catch (Exception $e) {
            mysqli_rollback($conn);
            $error = "Грешка при добавяне на поръчка: " . $e->getMessage();
            echo "<script>alert('$error');</script>";
        }
    }
}

// Обработка на избрания тип продукт (Кафе или Вода)
$product_type = isset($_GET['product_type']) ? $_GET['product_type'] : '';
if ($product_type && !in_array($product_type, ['Кафе', 'Вода'])) {
    $product_type = ''; // Негоден тип – връщаме празен
}

?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🛒 Добавяне на поръчка</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200 p-4">
    <div class="container mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold mb-2 text-center text-gray-700">🛒 Добавяне на поръчка</h1>
        <?php include 'menu.php'; ?>

        <h2 class="text-xl font-semibold mt-6">👤 Избери клиент</h2>
        <?php if ($error) { ?>
            <p class="text-red-500 text-center mb-4"><?php echo $error; ?></p>
        <?php } elseif (isset($success)) { ?>
            <p class="text-green-500 text-center mb-4"><?php echo $success; ?></p>
        <?php } ?>

        <div class="flex flex-col gap-4">
            <!-- Търсачката винаги се показва -->
            <div class="relative flex flex-col gap-2 w-full md:w-1/3 mx-auto">
                <input type="text" id="client-search-order" placeholder="👥 Търси клиент" class="border p-3 rounded-lg shadow w-full" required>
                <input type="hidden" id="client-id-order">
                <ul id="client-suggestions-order" class="absolute bg-white border rounded-lg w-full max-h-40 overflow-y-auto hidden top-16 z-10"></ul>
            </div>

            <!-- Падащо меню за клиенти -->
            <div class="w-full md:w-1/3 mx-auto">
                <select id="client-dropdown-order" class="border p-3 rounded-lg shadow w-full" onchange="updateClientFromDropdownOrder(this.value)">
                    <option value="">👥 Изберете клиент</option>
                    <?php
                    $stmt = mysqli_prepare($conn, "SELECT id, company_name FROM clients ORDER BY company_name");
                    mysqli_stmt_execute($stmt);
                    $clients_result = mysqli_stmt_get_result($stmt);
                    while ($client_option = mysqli_fetch_assoc($clients_result)) { ?>
                        <option value="<?php echo $client_option['id']; ?>" <?php echo ($client_id == $client_option['id']) ? 'selected' : ''; ?>><?php echo htmlspecialchars($client_option['company_name']); ?></option>
                    <?php }
                    mysqli_stmt_close($stmt);
                    ?>
                </select>
            </div>

            <?php if ($client) { ?>
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-gray-700">Избран клиент: <?php echo htmlspecialchars($client['company_name']); ?></h3>
                    <a href="?client_id=" class="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition">Промени клиент</a>
                </div>

                <h3 class="text-lg font-semibold mt-4">📦 Избери продукт и количество</h3>
                <form method="POST" action="" class="space-y-4">
                    <input type="hidden" name="client_id" value="<?php echo $client_id; ?>">
                    
                    <!-- Избор на тип продукт (Кафе или Вода) -->
                    <div class="w-full md:w-1/3 mx-auto">
                        <select id="product-type" name="product_type" class="border p-3 rounded-lg shadow w-full" onchange="filterProducts(this.value)">
                            <option value="">📦 Изберете тип продукт</option>
                            <option value="Кафе" <?php echo ($product_type === 'Кафе') ? 'selected' : ''; ?>>Кафе</option>
                            <option value="Вода" <?php echo ($product_type === 'Вода') ? 'selected' : ''; ?>>Вода</option>
                        </select>
                    </div>

                    <!-- Динамична форма за добавяне на продукти -->
                    <div id="products-container" class="space-y-4 mt-4">
                        <!-- Тук ще се добавят динамично полетата за продукти -->
                    </div>

                    <!-- Бутон за добавяне на нов продукт в поръчката -->
                    <button type="button" id="add-product" class="bg-blue-500 text-white p-3 rounded-lg shadow hover:bg-blue-600 transition w-full md:w-1/3 mx-auto">➕ Добави още продукт</button>

                    <!-- Бутон за изпращане на поръчката -->
                    <button type="submit" name="add_order" class="bg-green-500 text-white p-3 rounded-lg shadow hover:bg-green-600 transition w-full md:w-1/3 mx-auto">🛒 Добави поръчка</button>
                </form>
            <?php } else { ?>
                <p class="text-gray-500 text-center">Моля, използвайте търсачката или падащото меню, за да изберете клиент.</p>
            <?php } ?>
        </div>
    </div>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        // Търсачка за клиенти
        document.getElementById('client-search-order').addEventListener('input', function() {
            const query = this.value;
            if (query.length > 2) {
                fetch('fetch_clients.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'search=' + encodeURIComponent(query)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    const suggestions = document.getElementById('client-suggestions-order');
                    suggestions.innerHTML = '';
                    if (data.length > 0) {
                        data.forEach(client => {
                            const li = document.createElement('li');
                            li.textContent = client.name;
                            li.className = 'p-2 hover:bg-gray-200 cursor-pointer';
                            li.onclick = () => {
                                document.getElementById('client-search-order').value = client.name;
                                document.getElementById('client-id-order').value = client.id;
                                document.getElementById('client-dropdown-order').value = client.id; // Синхронизиране с дропдаун
                                window.location.href = '?client_id=' + client.id;
                                suggestions.classList.add('hidden');
                            };
                            suggestions.appendChild(li);
                        });
                        suggestions.classList.remove('hidden');
                    } else {
                        suggestions.classList.add('hidden');
                        console.log('Няма намерени клиенти за: ' + query);
                    }
                })
                .catch(error => {
                    console.error('Грешка при търсенето на клиенти:', error);
                    alert('Грешка при търсенето на клиенти. Моля, провери връзката с базата или файла fetch_clients.php.');
                });
            } else {
                document.getElementById('client-suggestions-order').classList.add('hidden');
            }
        });

        // Скриване на предложения при клик извън
        document.addEventListener('click', function(e) {
            if (!document.getElementById('client-search-order').contains(e.target)) {
                document.getElementById('client-suggestions-order').classList.add('hidden');
            }
        });

        // Обновяване на клиента чрез дропдаун
        function updateClientFromDropdownOrder(clientId) {
            if (clientId) {
                document.getElementById('client-id-order').value = clientId;
                const selectedClient = document.querySelector('#client-dropdown-order option[value="' + clientId + '"]').text;
                document.getElementById('client-search-order').value = selectedClient;
                window.location.href = '?client_id=' + clientId;
            }
        }

        // Функция за филтриране на продукти според типа (Кафе или Вода)
        function filterProducts(type) {
            const container = document.getElementById('products-container');
            container.innerHTML = '';

            if (!type) return;

            // Извличане на продукти от PHP масива вместо AJAX
            const availableProducts = <?php echo json_encode($products); ?>;
            const filteredProducts = availableProducts[type] || [];

            if (filteredProducts.length > 0) {
                filteredProducts.forEach((product, index) => {
                    const productDiv = document.createElement('div');
                    productDiv.className = 'flex flex-col md:flex-row gap-4 items-center';
                    
                    productDiv.innerHTML = `
                        <select name="products[]" class="border p-2 rounded-lg shadow w-full md:w-1/3">
                            <option value="">📦 Изберете продукт</option>
                            <option value="${product.name}">${product.name}</option>
                        </select>
                        <input type="number" name="quantities[]" placeholder="🛒 Количество" class="border p-2 rounded-lg shadow w-full md:w-1/3" min="1" required>
                        ${type === 'Вода' ? `<input type="number" name="returned_gallons[]" placeholder="♽ Върнати галони" class="border p-2 rounded-lg shadow w-full md:w-1/3" step="0.1">` : ''}
                        <button type="button" class="bg-red-500 text-white p-2 rounded-lg shadow hover:bg-red-600 transition w-full md:w-1/4" onclick="removeProduct(this)">❌ Премахни</button>
                    `;
                    container.appendChild(productDiv);
                });
            } else {
                container.innerHTML = '<p class="text-red-500">Няма налични продукти за този тип.</p>';
            }
        }

        // Функция за добавяне на нов продукт в поръчката
        document.getElementById('add-product').addEventListener('click', function() {
            const type = document.getElementById('product-type').value;
            if (!type) {
                alert('Моля, изберете тип продукт преди да добавите нов продукт.');
                return;
            }

            const availableProducts = <?php echo json_encode($products); ?>;
            const filteredProducts = availableProducts[type] || [];

            const container = document.getElementById('products-container');
            const productDiv = document.createElement('div');
            productDiv.className = 'flex flex-col md:flex-row gap-4 items-center';
            
            productDiv.innerHTML = `
                <select name="products[]" class="border p-2 rounded-lg shadow w-full md:w-1/3">
                    <option value="">📦 Изберете продукт</option>
                    ${filteredProducts.map(product => `<option value="${product.name}">${product.name}</option>`).join('')}
                </select>
                <input type="number" name="quantities[]" placeholder="🛒 Количество" class="border p-2 rounded-lg shadow w-full md:w-1/3" min="1" required>
                ${type === 'Вода' ? `<input type="number" name="returned_gallons[]" placeholder="♽ Върнати галони" class="border p-2 rounded-lg shadow w-full md:w-1/3" step="0.1">` : ''}
                <button type="button" class="bg-red-500 text-white p-2 rounded-lg shadow hover:bg-red-600 transition w-full md:w-1/4" onclick="removeProduct(this)">❌ Премахни</button>
            `;
            container.appendChild(productDiv);
        });

        // Функция за премахване на продукт от поръчката
        function removeProduct(button) {
            button.parentElement.remove();
        }

        // Инициализиране на филтъра с текущия тип продукт, ако има
        document.addEventListener('DOMContentLoaded', function() {
            const productType = '<?php echo htmlspecialchars($product_type); ?>';
            if (productType) {
                filterProducts(productType);
            }

            const clientId = '<?php echo $client_id ?? ''; ?>';
            if (clientId) {
                document.getElementById('client-id-order').value = clientId;
                const selectedClient = document.querySelector('#client-dropdown-order option[value="' + clientId + '"]');
                if (selectedClient) {
                    document.getElementById('client-search-order').value = selectedClient.text;
                    document.getElementById('client-dropdown-order').value = clientId;
                }
            }
        });
    </script>
    <?php include 'footer.php'; ?>
</body>
</html>