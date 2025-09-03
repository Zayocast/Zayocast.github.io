<?php
include 'db_connect.php';

$products_per_page = 40;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $products_per_page;

$total_products_query = "SELECT COUNT(*) as total FROM products";
$total_result = mysqli_query($conn, $total_products_query);
$total_products = mysqli_fetch_assoc($total_result)['total'];
$total_pages = ceil($total_products / $products_per_page);

// Добавяне на продукт
if (isset($_POST['add_product'])) {
    $name = $_POST['product_name'];
    $type = isset($_POST['product_type']) ? $_POST['product_type'] : '';
    $category = $_POST['product_category'];
    $price = $_POST['product_price'];
    $cost_price = $_POST['cost_price'];
    $image = $_FILES['product_image'];

    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    $max_size = 5 * 1024 * 1024;
    $error = '';

    if (in_array($image['type'], $allowed_types) && $image['size'] <= $max_size && $image['error'] == UPLOAD_ERR_OK) {
        $target_dir = "uploads/";
        if (!is_dir($target_dir)) {
            mkdir($target_dir, 0777, true);
        }
        $file_extension = pathinfo($image['name'], PATHINFO_EXTENSION);
        $target_file = $target_dir . uniqid() . '.' . $file_extension;
        if (move_uploaded_file($image["tmp_name"], $target_file)) {
            $stmt = mysqli_prepare($conn, "INSERT INTO products (name, type, category, price, cost_price, image_path, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $sort_order = 0;
            mysqli_stmt_bind_param($stmt, "sssddsi", $name, $type, $category, $price, $cost_price, $target_file, $sort_order);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        } else {
            $error = "Грешка при качване на файла.";
        }
    } else {
        $error = "Невалиден файл. Разрешени са само JPEG, PNG или GIF до 5MB.";
    }
}

// AJAX обработка за редактиране, изтриване и сортиране
if (isset($_POST['action']) && isset($_POST['product_id'])) {
    header('Content-Type: application/json');
    $product_id = (int)$_POST['product_id'];
    $action = $_POST['action'];

    if ($action == 'get_product') {
        $stmt = mysqli_prepare($conn, "SELECT name, category, type, price, cost_price, image_path FROM products WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "i", $product_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $product = mysqli_fetch_assoc($result);
        mysqli_stmt_close($stmt);
        echo json_encode(['success' => true, 'product' => $product]);
        exit;
    }
    if ($action == 'edit') {
        $name = mysqli_real_escape_string($conn, $_POST['product_name']);
        $old_name_query = "SELECT name FROM products WHERE id = ?";
        $old_stmt = mysqli_prepare($conn, $old_name_query);
        mysqli_stmt_bind_param($old_stmt, "i", $product_id);
        mysqli_stmt_execute($old_stmt);
        $old_result = mysqli_stmt_get_result($old_stmt);
        $old_name = mysqli_fetch_assoc($old_result)['name'];
        mysqli_stmt_close($old_stmt);

        $type = isset($_POST['product_type']) ? mysqli_real_escape_string($conn, $_POST['product_type']) : '';
        $category = mysqli_real_escape_string($conn, $_POST['product_category']);
        $price = (float)$_POST['product_price'];
        $cost_price = (float)$_POST['cost_price'];

        $sql = "UPDATE products SET name = ?, type = ?, category = ?, price = ?, cost_price = ?";
        $types = "sssdd";
        $params = [$name, $type, $category, $price, $cost_price];

        if (isset($_FILES['product_image']) && $_FILES['product_image']['error'] == UPLOAD_ERR_OK) {
            $image = $_FILES['product_image'];
            $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
            $max_size = 5 * 1024 * 1024;

            if (in_array($image['type'], $allowed_types) && $image['size'] <= $max_size) {
                $target_dir = "Uploads/";
                if (!is_dir($target_dir)) {
                    mkdir($target_dir, 0777, true);
                }
                $file_extension = pathinfo($image['name'], PATHINFO_EXTENSION);
                $target_file = $target_dir . uniqid() . '.' . $file_extension;

                if (move_uploaded_file($image["tmp_name"], $target_file)) {
                    $old_image_stmt = mysqli_prepare($conn, "SELECT image_path FROM products WHERE id = ?");
                    mysqli_stmt_bind_param($old_image_stmt, "i", $product_id);
                    mysqli_stmt_execute($old_image_stmt);
                    $old_image_result = mysqli_stmt_get_result($old_image_stmt);
                    $old_image = mysqli_fetch_assoc($old_image_result)['image_path'];
                    mysqli_stmt_close($old_image_stmt);
                    if (file_exists($old_image)) {
                        unlink($old_image);
                    }

                    $sql .= ", image_path = ?";
                    $types .= "s";
                    $params[] = $target_file;
                } else {
                    echo json_encode(['success' => false, 'message' => 'Грешка при качване на новата снимка.']);
                    exit;
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Невалиден файл. Разрешени са само JPEG, PNG или GIF до 5MB.']);
                exit;
            }
        }

        $sql .= " WHERE id = ?";
        $types .= "i";
        $params[] = $product_id;

        $stmt = mysqli_prepare($conn, $sql);
        if (!$stmt) {
            echo json_encode(['success' => false, 'message' => 'Грешка при подготовка на заявката: ' . mysqli_error($conn)]);
            exit;
        }

        mysqli_stmt_bind_param($stmt, $types, ...$params);
        if (mysqli_stmt_execute($stmt)) {
            if ($old_name !== $name) {
                $update_orders = "UPDATE orders SET product = ? WHERE product = ?";
                $update_stmt = mysqli_prepare($conn, $update_orders);
                mysqli_stmt_bind_param($update_stmt, "ss", $name, $old_name);
                mysqli_stmt_execute($update_stmt);
                mysqli_stmt_close($update_stmt);
            }
            echo json_encode(['success' => true, 'message' => 'Продуктът е редактиран успешно.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Грешка при изпълнение на заявката: ' . mysqli_stmt_error($stmt)]);
        }
        mysqli_stmt_close($stmt);
        exit;
    } elseif ($action == 'delete') {
        $stmt = mysqli_prepare($conn, "SELECT image_path FROM products WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "i", $product_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $old_image = mysqli_fetch_assoc($result)['image_path'];
        mysqli_stmt_close($stmt);

        if (file_exists($old_image)) unlink($old_image);

        $stmt = mysqli_prepare($conn, "DELETE FROM products WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "i", $product_id);
        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => 'Продуктът е изтрит успешно.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Грешка при изтриване: ' . mysqli_error($conn)]);
        }
        mysqli_stmt_close($stmt);
        exit;
    } elseif ($action == 'update_order') {
        $order = json_decode($_POST['order'], true);
        $stmt = mysqli_prepare($conn, "UPDATE products SET sort_order = ? WHERE id = ?");
        foreach ($order as $index => $id) {
            mysqli_stmt_bind_param($stmt, "ii", $index, $id);
            mysqli_stmt_execute($stmt);
        }
        mysqli_stmt_close($stmt);
        echo json_encode(['success' => true, 'message' => 'Редът на продуктите е запазен.']);
        exit;
    }
}

$stmt = mysqli_prepare($conn, "SELECT * FROM products ORDER BY sort_order ASC LIMIT ?, ?");
mysqli_stmt_bind_param($stmt, "ii", $offset, $products_per_page);
mysqli_stmt_execute($stmt);
$products_result = mysqli_stmt_get_result($stmt);
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📦 Управление на продукти</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js" integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200 p-4">
    <div class="container mx-auto bg-white p-6 rounded-lg shadow-lg">
         <?php include 'head.php'; ?>
        <?php include 'menu.php'; ?>

        <?php if (isset($error)) { ?>
            <p class="text-red-500 text-center mb-4">⚠️ <?php echo $error; ?></p>
        <?php } ?>

        <h2 class="text-xl font-semibold mt-6">➕ Добавяне на продукт</h2>
        <form method="POST" enctype="multipart/form-data" class="flex flex-col gap-4 mb-6">
            <input type="text" name="product_name" placeholder="📝 Име на продукта" class="border p-3 rounded-lg shadow" required>
            <select name="product_category" id="product-category-add" class="border p-3 rounded-lg shadow" required onchange="toggleTypeField('add')">
                <option value="Кафе">☕ Кафе</option>
                <option value="Вода">💧 Вода</option>
            </select>
            <select name="product_type" id="product-type-add" class="border p-3 rounded-lg shadow">
                <option value="Минерална">💧 Минерална</option>
                <option value="Изворна">🌊 Изворна</option>
                <option value="Трапезна">🍽️ Трапезна</option>
                <option value="Дейонизирана вода">⚗️ Дейонизирана вода</option>
            </select>
            <input type="number" name="product_price" step="0.01" placeholder="💰 Цена (лв.)" class="border p-3 rounded-lg shadow" required>
            <input type="number" name="cost_price" step="0.01" placeholder="💸 Доставна цена (лв.)" class="border p-3 rounded-lg shadow" required>
            <input type="file" name="product_image" accept="image/*" class="border p-3 rounded-lg shadow" required>
            <button type="submit" name="add_product" class="bg-blue-500 text-white p-3 rounded-lg shadow hover:bg-blue-600 transition">➕ Добави</button>
        </form>

        <h2 class="text-xl font-semibold mt-6 flex items-center gap-2">
            ✏️ Редактиране на продукти
            <button id="toggle-edit" class="bg-gray-500 text-white p-1 rounded hover:bg-gray-600 transition">👁️ Скрий</button>
        </h2>
        <p class="text-sm text-gray-600 mb-4">👉 Плъзгайте продуктите, за да промените реда им.</p>
        <div id="edit-products" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-4 sortable">
            <?php while ($row = mysqli_fetch_assoc($products_result)) { ?>
                <div class="bg-gray-50 p-2 rounded-lg shadow border border-gray-200 relative cursor-move" id="product-<?php echo $row['id']; ?>" data-id="<?php echo $row['id']; ?>">
                    <img src="<?php echo $row['image_path']; ?>" alt="<?php echo $row['name']; ?>" class="w-12 h-12 object-cover rounded-full mx-auto mb-1">
                    <p class="text-center text-sm font-semibold text-gray-800 truncate"><?php echo $row['name']; ?></p>
                    <p class="text-center text-xs text-gray-600">
                        <?php 
                            if ($row['category'] == 'Кафе') {
                                echo '☕ Кафе';
                            } else {
                                switch ($row['type']) {
                                    case 'Минерална':
                                        echo '💧 Минерална';
                                        break;
                                    case 'Изворна':
                                        echo '🌊 Изворна';
                                        break;
                                    case 'Трапезна':
                                        echo '🍽️ Трапезна';
                                        break;
                                    case 'Дейонизирана вода':
                                        echo '⚗️ Дейонизирана вода';
                                        break;
                                    default:
                                        echo '💧 ' . $row['type'];
                                }
                            }
                        ?>
                    </p>
                    <p class="text-center text-xs text-blue-600"><?php echo number_format($row['price'], 2); ?> лв.</p>
                    <div class="mt-1">
                        <button class="edit-btn bg-yellow-500 text-white text-xs p-1 rounded-lg hover:bg-yellow-600 transition w-full">✏️ Ред.</button>
                    </div>
                </div>
            <?php } ?>
        </div>

        <div class="mt-6 flex justify-center gap-2">
            <?php if ($page > 1): ?>
                <a href="?page=<?php echo $page - 1; ?>" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">⬅️ Предишна</a>
            <?php endif; ?>
            <span class="p-2">📄 Страница <?php echo $page; ?> от <?php echo $total_pages; ?></span>
            <?php if ($page < $total_pages): ?>
                <a href="?page=<?php echo $page + 1; ?>" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">Следваща ➡️</a>
            <?php endif; ?>
        </div>

        <!-- Модал за редактиране на продукт -->
        <div id="edit-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 class="text-lg font-bold mb-4">✏️ Редактиране на продукт</h3>
                <form id="edit-form" enctype="multipart/form-data" class="flex flex-col gap-4">
                    <input type="hidden" id="edit-product-id" name="product_id">
                    <div>
                        <label for="edit-product_name" class="block text-gray-700">📝 Име на продукта:</label>
                        <input type="text" id="edit-product_name" name="product_name" class="border p-2 rounded-lg w-full" required>
                    </div>
                    <div>
                        <label for="edit-product_category" class="block text-gray-700">📦 Категория:</label>
                        <select id="edit-product_category" name="product_category" class="border p-2 rounded-lg w-full" required onchange="toggleEditTypeField()">
                            <option value="Кафе">☕ Кафе</option>
                            <option value="Вода">💧 Вода</option>
                        </select>
                    </div>
                    <div id="edit-type-container">
                        <label for="edit-product_type" class="block text-gray-700">💧 Тип:</label>
                        <select id="edit-product_type" name="product_type" class="border p-2 rounded-lg w-full">
                            <option value="Минерална">💧 Минерална</option>
                            <option value="Изворна">🌊 Изворна</option>
                            <option value="Трапезна">🍽️ Трапезна</option>
                            <option value="Дейонизирана вода">⚗️ Дейонизирана вода</option>
                        </select>
                    </div>
                    <div>
                        <label for="edit-product_price" class="block text-gray-700">💰 Цена (лв.):</label>
                        <input type="number" id="edit-product_price" name="product_price" step="0.01" class="border p-2 rounded-lg w-full" required>
                    </div>
                    <div>
                        <label for="edit-cost_price" class="block text-gray-700">💸 Доставна цена (лв.):</label>
                        <input type="number" id="edit-cost_price" name="cost_price" step="0.01" class="border p-2 rounded-lg w-full" required>
                    </div>
                    <div>
                        <label for="edit-product_image" class="block text-gray-700">🖼️ Снимка:</label>
                        <input type="file" id="edit-product_image" name="product_image" accept="image/*" class="border p-2 rounded-lg w-full">
                    </div>
                    <div class="flex gap-4">
                        <button type="submit" id="save-edit" class="bg-green-500 text-white p-3 rounded-lg shadow hover:bg-green-600 transition">✅ Запази</button>
                        <button type="button" id="delete-product" class="bg-red-500 text-white p-3 rounded-lg shadow hover:bg-red-600 transition">🗑️ Изтрий</button>
                        <button type="button" id="cancel-edit" class="bg-gray-500 text-white p-3 rounded-lg shadow hover:bg-gray-600 transition">❌ Откажи</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        function toggleTypeField(id) {
            const category = id === 'add' ? document.getElementById('product-category-add').value : document.querySelector(`#form-${id} select[name='product_category']`).value;
            const typeField = id === 'add' ? document.getElementById('product-type-add') : document.getElementById(`product-type-${id}`);
            if (category === 'Кафе') {
                typeField.style.display = 'none';
                typeField.value = '';
            } else {
                typeField.style.display = 'block';
            }
        }

        function toggleEditTypeField() {
            const category = $('#edit-product_category').val();
            const typeContainer = $('#edit-type-container');
            if (category === 'Кафе') {
                typeContainer.hide();
                $('#edit-product_type').val('');
            } else {
                typeContainer.show();
            }
        }

        $(document).ready(function() {
            $('#toggle-edit').on('click', function() {
                const editSection = $('#edit-products');
                if (editSection.hasClass('hidden')) {
                    editSection.removeClass('hidden');
                    $(this).text('👁️ Скрий');
                } else {
                    editSection.addClass('hidden');
                    $(this).text('👁️ Покажи');
                }
            });

            // Инициализиране на SortableJS
            const sortable = new Sortable(document.getElementById('edit-products'), {
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
                            if (response.success) {
                                alert(response.message);
                            } else {
                                alert('Грешка при запазване на реда.');
                            }
                        },
                        error: function() {
                            alert('Грешка при комуникация със сървъра.');
                        }
                    });
                }
            });

            $('.edit-btn').on('click', function() {
                const productDiv = $(this).closest('div[data-id]');
                const id = productDiv.data('id');
                $.ajax({
                    url: 'products.php',
                    method: 'POST',
                    data: { action: 'get_product', product_id: id },
                    dataType: 'json',
                    success: function(data) {
                        if (data.success) {
                            const name = data.product.name;
                            const category = data.product.category;
                            const type = data.product.type || '';
                            const price = data.product.price;
                            const cost_price = data.product.cost_price;
                            const image = data.product.image_path;

                            $('#edit-product-id').val(id);
                            $('#edit-product_name').val(name);
                            $('#edit-product_category').val(category);
                            $('#edit-product_type').val(type);
                            $('#edit-product_price').val(price);
                            $('#edit-cost_price').val(cost_price);
                            toggleEditTypeField();
                            $('#edit-modal').removeClass('hidden');
                        } else {
                            alert('Грешка при зареждане на данните за продукта.');
                        }
                    },
                    error: function() {
                        alert('Грешка при комуникация със сървъра.');
                    }
                });
            });

            $('#save-edit').on('click', function(e) {
                e.preventDefault();
                const formData = new FormData($('#edit-form')[0]);
                formData.append('action', 'edit');

                $.ajax({
                    url: 'products.php',
                    method: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    dataType: 'json',
                    success: function(response) {
                        if (response.success) {
                            const id = $('#edit-product-id').val();
                            const productDiv = $(`#product-${id}`);
                            const name = $('#edit-product_name').val();
                            const category = $('#edit-product_category').val();
                            const type = $('#edit-product_type').val();
                            const price = $('#edit-product_price').val();
                            const imageInput = $('#edit-product_image')[0].files[0];

                            productDiv.find('p').eq(0).text(name);
                            productDiv.find('p').eq(1).text(
                                category === 'Кафе' ? '☕ Кафе' : 
                                type === 'Минерална' ? '💧 Минерална' : 
                                type === 'Изворна' ? '🌊 Изворна' : 
                                type === 'Трапезна' ? '🍽️ Трапезна' : 
                                type === 'Дейонизирана вода' ? '⚗️ Дейонизирана вода' : '💧 ' + type
                            );
                            productDiv.find('p').eq(2).text(Number(price).toFixed(2) + ' лв.');
                            if (imageInput) {
                                const reader = new FileReader();
                                reader.onload = function(e) {
                                    productDiv.find('img').attr('src', e.target.result);
                                };
                                reader.readAsDataURL(imageInput);
                            }
                            $('#edit-modal').addClass('hidden');
                            alert(response.message);
                        } else {
                            alert(response.message);
                        }
                    },
                    error: function() {
                        alert('Грешка при комуникация със сървъра. Моля, опитайте отново.');
                    }
                });
            });

            $('#delete-product').on('click', function() {
                const id = $('#edit-product-id').val();
                if (confirm('Сигурен ли си, че искаш да изтриеш този продукт?')) {
                    $.ajax({
                        url: 'products.php',
                        method: 'POST',
                        data: {
                            action: 'delete',
                            product_id: id
                        },
                        dataType: 'json',
                        success: function(response) {
                            if (response.success) {
                                $(`#product-${id}`).remove();
                                $('#edit-modal').addClass('hidden');
                                alert(response.message);
                            } else {
                                alert(response.message);
                            }
                        },
                        error: function() {
                            alert('Грешка при изтриване на продукта. Моля, опитайте отново.');
                        }
                    });
                }
            });

            $('#cancel-edit').on('click', function() {
                $('#edit-modal').addClass('hidden');
            });
        });
    </script>
    <?php include 'footer.php'; ?>
</body>
</html>