<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

ob_start();

include 'db_connect.php';

// Проверка дали колоните 'iban', 'bank', 'bank_code', 'coffee_machine_count', 'water_dispenser_count' съществуват
$result = mysqli_query($conn, "SHOW COLUMNS FROM `clients` LIKE 'iban'");
if (mysqli_num_rows($result) == 0) {
    $query = "ALTER TABLE `clients` ADD COLUMN `iban` VARCHAR(34) DEFAULT NULL AFTER `address_details`";
    mysqli_query($conn, $query);
}

$result = mysqli_query($conn, "SHOW COLUMNS FROM `clients` LIKE 'bank'");
if (mysqli_num_rows($result) == 0) {
    $query = "ALTER TABLE `clients` ADD COLUMN `bank` VARCHAR(255) DEFAULT NULL AFTER `iban`";
    mysqli_query($conn, $query);
}

$result = mysqli_query($conn, "SHOW COLUMNS FROM `clients` LIKE 'bank_code'");
if (mysqli_num_rows($result) == 0) {
    $query = "ALTER TABLE `clients` ADD COLUMN `bank_code` VARCHAR(20) DEFAULT NULL AFTER `bank`";
    mysqli_query($conn, $query);
}

$result = mysqli_query($conn, "SHOW COLUMNS FROM `clients` LIKE 'coffee_machine_count'");
if (mysqli_num_rows($result) == 0) {
    $query = "ALTER TABLE `clients` ADD COLUMN `coffee_machine_count` INT DEFAULT 0 AFTER `bank_code`";
    mysqli_query($conn, $query);
}

$result = mysqli_query($conn, "SHOW COLUMNS FROM `clients` LIKE 'water_dispenser_count'");
if (mysqli_num_rows($result) == 0) {
    $query = "ALTER TABLE `clients` ADD COLUMN `water_dispenser_count` INT DEFAULT 0 AFTER `coffee_machine_count`";
    mysqli_query($conn, $query);
}

// Проверка дали таблицата `iban_banks` съществува
$result = mysqli_query($conn, "SHOW TABLES LIKE 'iban_banks'");
if (mysqli_num_rows($result) == 0) {
    $query = "CREATE TABLE `iban_banks` (
        `id` INT(11) NOT NULL AUTO_INCREMENT,
        `bank_code` VARCHAR(4) NOT NULL,
        `bank_name` VARCHAR(255) NOT NULL,
        `bic` VARCHAR(11) NOT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `bank_code` (`bank_code`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci";
    mysqli_query($conn, $query);

    // Добавяне на примерни данни за български банки
    $sample_data = [
        ['BNBG', 'Уникредит Bулбанк', 'UNCRBGSF'],
        ['DSKB', 'ДСК Банк', 'DSKBBGSF'],
        ['FINV', 'Първа инвестиционна банка', 'FINVBGSF'],
        ['RZBB', 'Райфайзенбанк България', 'RZBBBGSF'],
        ['SBUB', 'Сбербанк България', 'BULBBGSF'],
        ['BPBA', 'Българска пощенска банка', 'BPBABGSF'],
        ['UNBB', 'Обединена българска банка', 'UNBBBGSF'],
        ['PCBB', 'ПроКредит Банк', 'PCBBBGSF'],
        ['OTPB', 'ОТП Банк', 'OTPBBGSF'],
        ['CECO', 'Централна кооперативна банка', 'CECOBGSF'],
        ['HEBA', 'ЕйчДиБи Банк', 'HEBABGSF'],
        ['SEM0', 'Синтемо Банк', 'SEMOBGSF']
    ];
    foreach ($sample_data as $data) {
        mysqli_query($conn, "INSERT INTO `iban_banks` (`bank_code`, `bank_name`, `bic`) VALUES ('{$data[0]}', '{$data[1]}', '{$data[2]}')");
    }
}

// Добавяне на нов клиент
if (isset($_POST['add_client'])) {
    $company_name = mysqli_real_escape_string($conn, $_POST['company_name']);
    $phone = mysqli_real_escape_string($conn, $_POST['phone']);
    $eik = mysqli_real_escape_string($conn, $_POST['eik'] ?? '');
    $address = mysqli_real_escape_string($conn, $_POST['address']);
    $address_details = mysqli_real_escape_string($conn, $_POST['address_details'] ?? '');
    $iban = mysqli_real_escape_string($conn, $_POST['iban'] ?? '');
    $bank = mysqli_real_escape_string($conn, $_POST['bank'] ?? '');
    $bank_code = mysqli_real_escape_string($conn, $_POST['bank_code'] ?? '');
    $coffee_machine_count = (int)($_POST['coffee_machine_count'] ?? 0);
    $water_dispenser_count = (int)($_POST['water_dispenser_count'] ?? 0);

    $stmt = mysqli_prepare($conn, "INSERT INTO clients (company_name, phone, eik, address, address_details, iban, bank, bank_code, coffee_machine_count, water_dispenser_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    mysqli_stmt_bind_param($stmt, "ssssssssii", $company_name, $phone, $eik, $address, $address_details, $iban, $bank, $bank_code, $coffee_machine_count, $water_dispenser_count);
    if (mysqli_stmt_execute($stmt)) {
        header("Location: add_client.php?message=Клиентът е добавен успешно.");
    } else {
        $error = "Грешка при добавяне на клиента: " . mysqli_error($conn);
    }
    mysqli_stmt_close($stmt);
    exit;
}

// Проверка за действие (изтриване, редактиране или обновяване на брой машини/диспенсъри) чрез AJAX
if (isset($_POST['action']) && isset($_POST['client_id'])) {
    $client_id = (int)$_POST['client_id'];
    $action = $_POST['action'];

    if ($action == 'delete') {
        // Изтриване на свързани записи и клиент
        $stmt = mysqli_prepare($conn, "DELETE FROM offers WHERE client_id = ?");
        mysqli_stmt_bind_param($stmt, "i", $client_id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);

        $stmt = mysqli_prepare($conn, "DELETE FROM orders WHERE client_id = ?");
        mysqli_stmt_bind_param($stmt, "i", $client_id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);

        $stmt = mysqli_prepare($conn, "DELETE FROM invoices WHERE client_id = ?");
        mysqli_stmt_bind_param($stmt, "i", $client_id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);

        $stmt = mysqli_prepare($conn, "DELETE FROM clients WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "i", $client_id);
        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => 'Клиентът и всички свързани записи са изтрити успешно.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Грешка при изтриване на клиента: ' . mysqli_error($conn)]);
        }
        mysqli_stmt_close($stmt);
        exit;
    } elseif ($action == 'edit') {
        $company_name = mysqli_real_escape_string($conn, $_POST['company_name']);
        $phone = mysqli_real_escape_string($conn, $_POST['phone']);
        $eik = mysqli_real_escape_string($conn, $_POST['eik'] ?? '');
        $address = mysqli_real_escape_string($conn, $_POST['address']);
        $address_details = mysqli_real_escape_string($conn, $_POST['address_details'] ?? '');
        $iban = mysqli_real_escape_string($conn, $_POST['iban'] ?? '');
        $bank = mysqli_real_escape_string($conn, $_POST['bank'] ?? '');
        $bank_code = mysqli_real_escape_string($conn, $_POST['bank_code'] ?? '');
        $coffee_machine_count = (int)($_POST['coffee_machine_count'] ?? 0);
        $water_dispenser_count = (int)($_POST['water_dispenser_count'] ?? 0);

        $stmt = mysqli_prepare($conn, "UPDATE clients SET company_name = ?, phone = ?, eik = ?, address = ?, address_details = ?, iban = ?, bank = ?, bank_code = ?, coffee_machine_count = ?, water_dispenser_count = ? WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "ssssssssiii", $company_name, $phone, $eik, $address, $address_details, $iban, $bank, $bank_code, $coffee_machine_count, $water_dispenser_count, $client_id);
        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => 'Клиентът е редактиран успешно.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Грешка при редактиране на клиента: ' . mysqli_error($conn)]);
        }
        mysqli_stmt_close($stmt);
        exit;
    } elseif ($action == 'update_count') {
        $field = $_POST['field'];
        $value = (int)$_POST['value'];
        if (in_array($field, ['coffee_machine_count', 'water_dispenser_count'])) {
            $stmt = mysqli_prepare($conn, "UPDATE clients SET $field = ? WHERE id = ?");
            mysqli_stmt_bind_param($stmt, "ii", $value, $client_id);
            if (mysqli_stmt_execute($stmt)) {
                echo json_encode(['success' => true, 'message' => 'Броят е обновен успешно.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Грешка при обновяване на броя: ' . mysqli_error($conn)]);
            }
            mysqli_stmt_close($stmt);
        } else {
            echo json_encode(['success' => false, 'message' => 'Невалидно поле за обновяване.']);
        }
        exit;
    }
}

// Извличане на всички клиенти за показване (или филтриране чрез AJAX)
$search_query = "";
if (isset($_GET['search']) && !empty($_GET['search'])) {
    $search = mysqli_real_escape_string($conn, $_GET['search']);
    $search_query = " WHERE company_name LIKE '%$search%'";
}
$query = "SELECT * FROM clients" . $search_query;
$result = mysqli_query($conn, $query);
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>👥 Управление на клиенти</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        #edit-modal .modal-content {
            max-height: 80vh;
            overflow-y: auto;
        }
        select.count-select {
            width: 80px;
            padding: 2px;
            border-radius: 4px;
            border: 1px solid #d1d5db;
        }
    </style>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200 p-4">
    <div class="container mx-auto bg-white p-6 rounded-lg shadow-lg">
        <?php include 'head.php'; ?>
        <?php include 'menu.php'; ?>
        <?php if (isset($error)) { ?>
            <p class="text-red-500 text-center mb-4">❌ <?php echo $error; ?></p>
        <?php } elseif (isset($_GET['message'])) { ?>
            <p class="text-green-500 text-center mb-4">✅ <?php echo htmlspecialchars($_GET['message']); ?></p>
        <?php } ?>

        <!-- Форма за добавяне на нов клиент -->
        <div class="mt-6 max-w-4xl mx-auto">
            <h2 class="text-xl font-semibold mb-4">➕ Добави нов клиент</h2>
            <form method="POST" class="flex flex-row gap-4 items-center flex-wrap">
                <div class="flex-1 min-w-[200px] flex-grow">
                    <label for="company_name" class="sr-only">Име на фирмата</label>
                    <input type="text" id="company_name" name="company_name" placeholder="👤 Име на фирмата" class="border p-2 rounded-lg w-full" required>
                </div>
                <div class="flex-1 min-w-[200px] flex-grow">
                    <label for="phone" class="sr-only">Телефон</label>
                    <input type="text" id="phone" name="phone" placeholder="📞 Телефон" class="border p-2 rounded-lg w-full" required>
                </div>
                <div class="flex-1 min-w-[200px] flex-grow">
                    <label for="eik" class="sr-only">ЕИК</label>
                    <input type="text" id="eik" name="eik" placeholder="🔢 ЕИК" class="border p-2 rounded-lg w-full">
                </div>
                <div class="flex-1 min-w-[200px] flex-grow">
                    <label for="address" class="sr-only">Адрес</label>
                    <input type="text" id="address" name="address" placeholder="🏠 Адрес" class="border p-2 rounded-lg w-full" required>
                </div>
                <div class="flex-1 min-w-[200px] flex-grow">
                    <label for="address_details" class="sr-only">Допълнителна информация за адреса</label>
                    <input type="text" id="address_details" name="address_details" placeholder="📍 Допълнителна информация за адреса (напр. След магазина на Иван до входа на гаража)" class="border p-2 rounded-lg w-full">
                </div>
                <div class="flex-1 min-w-[200px] flex-grow">
                    <label for="iban" class="sr-only">IBAN</label>
                    <input type="text" id="iban" name="iban" placeholder="💳 IBAN" class="border p-2 rounded-lg w-full" oninput="fetchIbanInfo(this.value)">
                </div>
                <div class="flex-1 min-w-[200px] flex-grow">
                    <label for="bank" class="sr-only">Банка</label>
                    <input type="text" id="bank" name="bank" placeholder="🏦 Банка" class="border p-2 rounded-lg w-full" readonly>
                </div>
                <div class="flex-1 min-w-[200px] flex-grow">
                    <label for="bank_code" class="sr-only">Банков код</label>
                    <input type="text" id="bank_code" name="bank_code" placeholder="🔑 Банков код" class="border p-2 rounded-lg w-full" readonly>
                </div>
                <div class="flex-1 min-w-[200px] flex-grow">
                    <label for="coffee_machine_count" class="block text-gray-700">☕ Брой кафе машини</label>
                    <select id="coffee_machine_count" name="coffee_machine_count" class="border p-2 rounded-lg w-full">
                        <?php for ($i = 0; $i <= 20; $i++) { ?>
                            <option value="<?php echo $i; ?>"><?php echo $i; ?></option>
                        <?php } ?>
                    </select>
                </div>
                <div class="flex-1 min-w-[200px] flex-grow">
                    <label for="water_dispenser_count" class="block text-gray-700">💧 Брой диспенсъри</label>
                    <select id="water_dispenser_count" name="water_dispenser_count" class="border p-2 rounded-lg w-full">
                        <?php for ($i = 0; $i <= 20; $i++) { ?>
                            <option value="<?php echo $i; ?>"><?php echo $i; ?></option>
                        <?php } ?>
                    </select>
                </div>
                <button type="submit" name="add_client" value="1" class="bg-green-500 text-white p-3 rounded-lg shadow hover:bg-green-600 transition">➕ Добави</button>
            </form>
        </div>

        <!-- Търсачка за клиенти -->
        <div class="mt-6 max-w-md mx-auto">
            <h3 class="text-lg font-semibold mb-2">🕵️‍♂️ Търсене по клиент</h3>
            <input type="text" id="client-search" class="border p-2 rounded-lg w-full" autocomplete="off">
        </div>

        <!-- Списък с клиенти -->
        <div class="mt-6 overflow-x-auto">
            <h2 class="text-xl font-semibold mb-4">📋 Списък с клиенти</h2>
            <table class="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead class="bg-gray-800 text-white">
                    <tr>
                        <th class="p-2 border-b border-r text-center">№</th>
                        <th class="p-2 border-b border-r text-center">👤 Име на фирмата</th>
                        <th class="p-2 border-b border-r text-center">📞 Телефон</th>
                        <th class="p-2 border-b border-r text-center">🔢 ЕИК</th>
                        <th class="p-2 border-b border-r text-center">🏠 Адрес</th>
                        <th class="p-2 border-b border-r text-center">📍 Допълнителна информация</th>
                        <th class="p-2 border-b border-r text-center">💳 IBAN</th>
                        <th class="p-2 border-b border-r text-center">🏦 Банка</th>
                        <th class="p-2 border-b border-r text-center">🔑 Банков код</th>
                        <th class="p-2 border-b border-r text-center">☕ Кафе машини</th>
                        <th class="p-2 border-b border-r text-center">💧 Диспенсъри</th>
                        <th class="p-2 border-b text-center">Действия</th>
                    </tr>
                </thead>
                <tbody id="clients-body">
                    <?php 
                    $row_number = 1; // Инициализираме брояча за номера на редовете
                    while ($row = mysqli_fetch_assoc($result)) { ?>
                        <tr class="hover:bg-gray-100" data-id="<?php echo $row['id']; ?>">
                            <td class="p-2 border-b border-r text-center"><?php echo $row_number; ?></td>
                            <td class="p-2 border-b border-r text-center"><?php echo htmlspecialchars($row['company_name']); ?></td>
                            <td class="p-2 border-b border-r text-center"><?php echo htmlspecialchars($row['phone']); ?></td>
                            <td class="p-2 border-b border-r text-center"><?php echo htmlspecialchars($row['eik'] ?? '-'); ?></td>
                            <td class="p-2 border-b border-r text-center"><?php echo htmlspecialchars($row['address']); ?></td>
                            <td class="p-2 border-b border-r text-center"><?php echo htmlspecialchars($row['address_details'] ?? '-'); ?></td>
                            <td class="p-2 border-b border-r text-center"><?php echo htmlspecialchars($row['iban'] ?? '-'); ?></td>
                            <td class="p-2 border-b border-r text-center"><?php echo htmlspecialchars($row['bank'] ?? '-'); ?></td>
                            <td class="p-2 border-b border-r text-center"><?php echo htmlspecialchars($row['bank_code'] ?? '-'); ?></td>
                            <td class="p-2 border-b border-r text-center">
                                <select class="count-select coffee-machine-count" data-client-id="<?php echo $row['id']; ?>">
                                    <?php for ($i = 0; $i <= 20; $i++) { ?>
                                        <option value="<?php echo $i; ?>" <?php echo $row['coffee_machine_count'] == $i ? 'selected' : ''; ?>><?php echo $i; ?></option>
                                    <?php } ?>
                                </select>
                            </td>
                            <td class="p-2 border-b border-r text-center">
                                <select class="count-select water-dispenser-count" data-client-id="<?php echo $row['id']; ?>">
                                    <?php for ($i = 0; $i <= 20; $i++) { ?>
                                        <option value="<?php echo $i; ?>" <?php echo $row['water_dispenser_count'] == $i ? 'selected' : ''; ?>><?php echo $i; ?></option>
                                    <?php } ?>
                                </select>
                            </td>
                            <td class="p-2 border-b text-center">
                                <button class="edit-btn text-blue-500 hover:text-blue-700 mr-2" data-client-id="<?php echo $row['id']; ?>">✏️ Редактиране</button>
                                <button class="delete-btn text-red-500 hover:text-red-700" data-client-id="<?php echo $row['id']; ?>">🗑️ Изтрий</button>
                            </td>
                        </tr>
                    <?php 
                    $row_number++; // Увеличаваме брояча за следващия ред
                    } ?>
                </tbody>
            </table>
        </div>

        <!-- Модал за редактиране на клиент -->
        <div id="edit-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full modal-content">
                <h3 class="text-lg font-bold mb-4">✏️ Редактиране на клиент</h3>
                <form id="edit-form" class="flex flex-col gap-4">
                    <input type="hidden" id="edit-client-id" name="client_id">
                    <div>
                        <label for="edit-company_name" class="block text-gray-700">👤 Име на фирмата:</label>
                        <input type="text" id="edit-company_name" name="company_name" class="border p-2 rounded-lg w-full" required>
                    </div>
                    <div>
                        <label for="edit-phone" class="block text-gray-700">📞 Телефон:</label>
                        <input type="text" id="edit-phone" name="phone" class="border p-2 rounded-lg w-full" required>
                    </div>
                    <div>
                        <label for="edit-eik" class="block text-gray-700">🔢 ЕИК:</label>
                        <input type="text" id="edit-eik" name="eik" class="border p-2 rounded-lg w-full">
                    </div>
                    <div>
                        <label for="edit-address" class="block text-gray-700">🏠 Адрес:</label>
                        <input type="text" id="edit-address" name="address" class="border p-2 rounded-lg w-full" required>
                    </div>
                    <div>
                        <label for="edit-address_details" class="block text-gray-700">📍 Допълнителна информация за адреса:</label>
                        <input type="text" id="edit-address_details" name="address_details" class="border p-2 rounded-lg w-full" placeholder="На пр. След магазина на Иван до входа на гаража">
                    </div>
                    <div>
                        <label for="edit-iban" class="block text-gray-700">💳 IBAN:</label>
                        <input type="text" id="edit-iban" name="iban" class="border p-2 rounded-lg w-full" oninput="fetchIbanInfo(this.value)">
                    </div>
                    <div>
                        <label for="edit-bank" class="block text-gray-700">🏦 Банка:</label>
                        <input type="text" id="edit-bank" name="bank" class="border p-2 rounded-lg w-full" readonly>
                    </div>
                    <div>
                        <label for="edit-bank_code" class="block text-gray-700">🔑 Банков код:</label>
                        <input type="text" id="edit-bank_code" name="bank_code" class="border p-2 rounded-lg w-full" readonly>
                    </div>
                    <div>
                        <label for="edit-coffee_machine_count" class="block text-gray-700">☕ Брой кафе машини:</label>
                        <select id="edit-coffee_machine_count" name="coffee_machine_count" class="border p-2 rounded-lg w-full">
                            <?php for ($i = 0; $i <= 10; $i++) { ?>
                                <option value="<?php echo $i; ?>"><?php echo $i; ?></option>
                            <?php } ?>
                        </select>
                    </div>
                    <div>
                        <label for="edit-water_dispenser_count" class="block text-gray-700">💧 Брой диспенсъри:</label>
                        <select id="edit-water_dispenser_count" name="water_dispenser_count" class="border p-2 rounded-lg w-full">
                            <?php for ($i = 0; $i <= 10; $i++) { ?>
                                <option value="<?php echo $i; ?>"><?php echo $i; ?></option>
                            <?php } ?>
                        </select>
                    </div>
                    <div class="flex gap-4">
                        <button type="submit" id="save-edit" class="bg-green-500 text-white p-3 rounded-lg shadow hover:bg-green-600 transition">✅ Запази</button>
                        <button type="button" id="cancel-edit" class="bg-gray-500 text-white p-3 rounded-lg shadow hover:bg-gray-600 transition">❌ Откажи</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        $(document).ready(function() {
            // Търсачка в реално време
            $('#client-search').on('input', function() {
                let search = $(this).val();
                $.ajax({
                    url: 'add_client.php',
                    method: 'GET',
                    data: { search: search },
                    success: function(response) {
                        let html = $(response).find('#clients-body').html();
                        $('#clients-body').html(html);
                        setupEventListeners();
                    },
                    error: function(xhr, status, error) {
                        console.error('Грешка при търсенето:', error);
                    }
                });
            });

            // Обновяване на брой кафе машини или диспенсъри директно в таблицата
            function setupCountSelectListeners() {
                $('.coffee-machine-count, .water-dispenser-count').off('change').on('change', function() {
                    let clientId = $(this).data('client-id');
                    let field = $(this).hasClass('coffee-machine-count') ? 'coffee_machine_count' : 'water_dispenser_count';
                    let value = $(this).val();

                    $.ajax({
                        url: 'add_client.php',
                        method: 'POST',
                        data: {
                            action: 'update_count',
                            client_id: clientId,
                            field: field,
                            value: value
                        },
                        dataType: 'json',
                        success: function(response) {
                            if (!response.success) {
                                // Връщане на предишната стойност при грешка
                                $(this).val($(this).data('prev-value'));
                            }
                        },
                        error: function(xhr, status, error) {
                            console.error('Грешка при обновяване на броя:', error);
                            $(this).val($(this).data('prev-value'));
                        }
                    });

                    // Запазване на текущата стойност за връщане при грешка
                    $(this).data('prev-value', value);
                });
            }

            // Отваряне на модал за редактиране
            function setupEditButtonListeners() {
                $('.edit-btn').off('click').on('click', function() {
                    let row = $(this).closest('tr');
                    let id = row.data('id');
                    let company_name = row.find('td').eq(1).text();
                    let phone = row.find('td').eq(2).text();
                    let eik = row.find('td').eq(3).text() === '-' ? '' : row.find('td').eq(3).text();
                    let address = row.find('td').eq(4).text();
                    let address_details = row.find('td').eq(5).text() === '-' ? '' : row.find('td').eq(5).text();
                    let iban = row.find('td').eq(6).text() === '-' ? '' : row.find('td').eq(6).text();
                    let bank = row.find('td').eq(7).text() === '-' ? '' : row.find('td').eq(7).text();
                    let bank_code = row.find('td').eq(8).text() === '-' ? '' : row.find('td').eq(8).text();
                    let coffee_machine_count = row.find('.coffee-machine-count').val();
                    let water_dispenser_count = row.find('.water-dispenser-count').val();

                    $('#edit-client-id').val(id);
                    $('#edit-company_name').val(company_name);
                    $('#edit-phone').val(phone);
                    $('#edit-eik').val(eik);
                    $('#edit-address').val(address);
                    $('#edit-address_details').val(address_details);
                    $('#edit-iban').val(iban);
                    $('#edit-bank').val(bank);
                    $('#edit-bank_code').val(bank_code);
                    $('#edit-coffee_machine_count').val(coffee_machine_count);
                    $('#edit-water_dispenser_count').val(water_dispenser_count);
                    $('#edit-modal').removeClass('hidden');
                });
            }

            // Запазване на редактираните данни чрез бутона
            $('#save-edit').on('click', function(e) {
                e.preventDefault();
                let id = $('#edit-client-id').val();
                let data = {
                    action: 'edit',
                    client_id: id,
                    company_name: $('#edit-company_name').val(),
                    phone: $('#edit-phone').val(),
                    eik: $('#edit-eik').val() || '',
                    address: $('#edit-address').val(),
                    address_details: $('#edit-address_details').val() || '',
                    iban: $('#edit-iban').val() || '',
                    bank: $('#edit-bank').val() || '',
                    bank_code: $('#edit-bank_code').val() || '',
                    coffee_machine_count: $('#edit-coffee_machine_count').val(),
                    water_dispenser_count: $('#edit-water_dispenser_count').val()
                };

                $.ajax({
                    url: 'add_client.php',
                    method: 'POST',
                    data: data,
                    dataType: 'json',
                    success: function(response) {
                        if (response.success) {
                            let row = $('#clients-body tr[data-id="' + id + '"]');
                            row.find('td').eq(1).text(data.company_name);
                            row.find('td').eq(2).text(data.phone);
                            row.find('td').eq(3).text(data.eik || '-');
                            row.find('td').eq(4).text(data.address);
                            row.find('td').eq(5).text(data.address_details || '-');
                            row.find('td').eq(6).text(data.iban || '-');
                            row.find('td').eq(7).text(data.bank || '-');
                            row.find('td').eq(8).text(data.bank_code || '-');
                            row.find('.coffee-machine-count').val(data.coffee_machine_count);
                            row.find('.water-dispenser-count').val(data.water_dispenser_count);
                            $('#edit-modal').addClass('hidden');
                            alert(response.message);
                        } else {
                            alert(response.message);
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('Грешка при редактиране:', error);
                        alert('Грешка при редактиране на клиента. Моля, опитайте отново.');
                    }
                });
            });

            // Затваряне на модала
            $('#cancel-edit').on('click', function() {
                $('#edit-modal').addClass('hidden');
            });

            // Изтриване на клиент
            function setupDeleteButtonListeners() {
                $('.delete-btn').off('click').on('click', function() {
                    let id = $(this).data('client-id');
                    if (confirm('Сигурни ли сте, че искате да изтриете този клиент?')) {
                        $.ajax({
                            url: 'add_client.php',
                            method: 'POST',
                            data: {
                                action: 'delete',
                                client_id: id
                            },
                            dataType: 'json',
                            success: function(response) {
                                if (response.success) {
                                    $('#clients-body tr[data-id="' + id + '"]').remove();
                                    // Обновяване на номерата на редовете след изтриване
                                    $('#clients-body tr').each(function(index) {
                                        $(this).find('td').eq(0).text(index + 1);
                                    });
                                    alert(response.message);
                                } else {
                                    alert(response.message);
                                }
                            },
                            error: function(xhr, status, error) {
                                console.error('Грешка при изтриване:', error);
                                alert('Грешка при изтриване на клиента. Моля, опитайте отново.');
                            }
                        });
                    }
                });
            }

            // Подновяване на събитията след AJAX актуализация
            function setupEventListeners() {
                setupEditButtonListeners();
                setupDeleteButtonListeners();
                setupCountSelectListeners();
            }

            // Инициализиране на събитията при зареждане на страницата
            setupEventListeners();

            // Функция за извличане на информация за IBAN
            window.fetchIbanInfo = function(iban) {
                if (iban.length >= 8) {
                    $.ajax({
                        url: 'get_iban_info.php',
                        method: 'POST',
                        data: { iban: iban },
                        dataType: 'json',
                        success: function(response) {
                            if (response.success) {
                                $('#bank').val(response.bank || '');
                                $('#bank_code').val(response.bank_code || '');
                                $('#edit-bank').val(response.bank || '');
                                $('#edit-bank_code').val(response.bank_code || '');
                            } else {
                                alert('Не можахме да намерим информация за този IBAN: ' + response.message);
                                $('#bank').val('');
                                $('#bank_code').val('');
                                $('#edit-bank').val('');
                                $('#edit-bank_code').val('');
                            }
                        },
                        error: function(xhr, status, error) {
                            console.error('Грешка при извличане на информация за IBAN:', error);
                            alert('Грешка при извличане на информация за IBAN. Моля, опитайте отново.');
                            $('#bank').val('');
                            $('#bank_code').val('');
                            $('#edit-bank').val('');
                            $('#edit-bank_code').val('');
                        }
                    });
                } else {
                    $('#bank').val('');
                    $('#bank_code').val('');
                    $('#edit-bank').val('');
                    $('#edit-bank_code').val('');
                }
            };
        });
    </script>
    <?php include 'footer.php'; ?>
</body>
</html>