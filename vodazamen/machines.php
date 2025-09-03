<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

ob_start();

include 'db_connect.php';

// Добавяне на нови колони в таблицата, ако не съществуват
$alter_query = "ALTER TABLE clients 
    ADD COLUMN IF NOT EXISTS coffee_machine_description TEXT,
    ADD COLUMN IF NOT EXISTS water_dispenser_description TEXT";
mysqli_query($conn, $alter_query);

// Извличане на данни за клиенти и техните машини
$search_query = "";
if (isset($_GET['search']) && !empty($_GET['search'])) {
    $search = mysqli_real_escape_string($conn, $_GET['search']);
    $search_query = " WHERE company_name LIKE '%$search%'";
}
$query = "SELECT id, company_name, coffee_machine_count, water_dispenser_count, 
          coffee_machine_description, water_dispenser_description 
          FROM clients" . $search_query;
$result = mysqli_query($conn, $query);

// Изчисляване на общо брой кафе машини и диспенсъри
$total_coffee_machines = 0;
$total_water_dispensers = 0;
$clients_data = [];
while ($row = mysqli_fetch_assoc($result)) {
    if ($row['coffee_machine_count'] > 0 || $row['water_dispenser_count'] > 0) {
        $clients_data[] = $row;
        $total_coffee_machines += $row['coffee_machine_count'];
        $total_water_dispensers += $row['water_dispenser_count'];
    }
}

// Обработка на AJAX заявка за обновяване на данни
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['client_id'])) {
    // Почистване на буфера за изход, за да избегнем нежелан HTML
    ob_clean();

    header('Content-Type: application/json');

    $client_id = mysqli_real_escape_string($conn, $_POST['client_id']);
    $coffee_machine_count = (int)$_POST['coffee_machine_count'];
    $water_dispenser_count = (int)$_POST['water_dispenser_count'];
    $coffee_machine_description = mysqli_real_escape_string($conn, $_POST['coffee_machine_description'] ?? '');
    $water_dispenser_description = mysqli_real_escape_string($conn, $_POST['water_dispenser_description'] ?? '');

    $update_query = "UPDATE clients SET 
        coffee_machine_count = ?, 
        water_dispenser_count = ?, 
        coffee_machine_description = ?, 
        water_dispenser_description = ? 
        WHERE id = ?";
    $stmt = mysqli_prepare($conn, $update_query);
    mysqli_stmt_bind_param($stmt, "iissi", 
        $coffee_machine_count, 
        $water_dispenser_count, 
        $coffee_machine_description, 
        $water_dispenser_description, 
        $client_id
    );
    
    if (mysqli_stmt_execute($stmt)) {
        echo json_encode([
            'status' => 'success',
            'coffee_machine_count' => $coffee_machine_count,
            'water_dispenser_count' => $water_dispenser_count,
            'coffee_machine_description' => $coffee_machine_description,
            'water_dispenser_description' => $water_dispenser_description
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
    }
    mysqli_stmt_close($stmt);
    exit;
}
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>☕💧 Управление на машини</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        select.count-select {
            width: 80px;
            padding: 2px;
            border-radius: 4px;
            border: 1px solid #d1d5db;
        }
        .dropdown-content {
            display: none;
            background-color: #f9fafb;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 12px;
            margin-top: 4px;
            margin-bottom: 4px;
            transition: all 0.3s ease;
            overflow: hidden;
        }
        .dropdown-content input, .dropdown-content textarea {
            width: 100%;
            padding: 4px;
            margin-bottom: 8px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
        }
        .dropdown-content button {
            background-color: #3b82f6;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
        }
        .dropdown-content button:hover {
            background-color: #2563eb;
        }
        .row-expanded .dropdown-content {
            display: block;
        }
        .row-expanded {
            background-color: #e5e7eb;
        }
        .tooltip {
            position: absolute;
            background-color: #1f2937;
            color: white;
            padding: 12px;
            border-radius: 6px;
            font-size: 16px;
            z-index: 10;
            max-width: 400px;
            white-space: pre-wrap;
            line-height: 1.5;
        }
    </style>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200 p-4">
    <div class="container mx-auto bg-white p-6 rounded-lg shadow-lg">
        <?php include 'head.php'; ?>
        <?php include 'menu.php'; ?>

        <!-- Търсачка за клиенти -->
        <div class="mt-6 max-w-md mx-auto">
            <h3 class="text-lg font-semibold mb-2">🕵️‍♂️ Търсене по клиент</h3>
            <input type="text" id="client-search" class="border p-2 rounded-lg w-full" autocomplete="off">
        </div>

        <!-- Списък с машини -->
        <div class="mt-6 overflow-x-auto">
            <h2 class="text-xl font-semibold mb-4">📋 Списък с машини</h2>
            <table class="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead class="bg-gray-800 text-white">
                    <tr>
                        <th class="p-2 border-b border-r text-center">👤 Клиент</th>
                        <th class="p-2 border-b border-r text-center">☕ Кафе машини</th>
                        <th class="p-2 border-b text-center">💧 Диспенсъри</th>
                    </tr>
                </thead>
                <tbody id="machines-body">
                    <?php foreach ($clients_data as $row) { ?>
                        <tr class="hover:bg-gray-100 cursor-pointer" data-client-id="<?php echo $row['id']; ?>">
                            <td class="p-2 border-b border-r text-center"><?php echo htmlspecialchars($row['company_name']); ?></td>
                            <td class="p-2 border-b border-r text-center coffee-machine-count" 
                                data-description="<?php echo htmlspecialchars($row['coffee_machine_description'] ?? ''); ?>">
                                <?php echo $row['coffee_machine_count']; ?>
                            </td>
                            <td class="p-2 border-b text-center water-dispenser-count" 
                                data-description="<?php echo htmlspecialchars($row['water_dispenser_description'] ?? ''); ?>">
                                <?php echo $row['water_dispenser_count']; ?>
                            </td>
                        </tr>
                        <tr class="dropdown-row" data-client-id="<?php echo $row['id']; ?>">
                            <td colspan="3" class="p-0 border-b">
                                <div class="dropdown-content">
                                    <h4 class="font-semibold mb-2">Редактиране на <?php echo htmlspecialchars($row['company_name']); ?></h4>
                                    <label class="block mb-1">Кафе машини:</label>
                                    <input type="number" class="coffee-machine-count-input" value="<?php echo $row['coffee_machine_count']; ?>" min="0">
                                    <label class="block mb-1 mt-2">Описание на кафе машини:</label>
                                    <textarea class="coffee-machine-description-input" rows="4"><?php echo $row['coffee_machine_description'] ?? ''; ?></textarea>
                                    <label class="block mb-1 mt-2">Диспенсъри:</label>
                                    <input type="number" class="water-dispenser-count-input" value="<?php echo $row['water_dispenser_count']; ?>" min="0">
                                    <label class="block mb-1 mt-2">Описание на диспенсъри:</label>
                                    <textarea class="water-dispenser-description-input" rows="4"><?php echo $row['water_dispenser_description'] ?? ''; ?></textarea>
                                    <button class="save-btn mt-2" data-client-id="<?php echo $row['id']; ?>">Запази</button>
                                </div>
                            </td>
                        </tr>
                    <?php } ?>
                    <!-- Обобщение -->
                    <tr class="bg-gray-200 font-bold">
                        <td class="p-2 border-b border-r text-center">Общо</td>
                        <td class="p-2 border-b border-r text-center"><?php echo $total_coffee_machines; ?> ☕</td>
                        <td class="p-2 border-b text-center"><?php echo $total_water_dispensers; ?> 💧</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        $(document).ready(function() {
            // Търсачка в реално време
            $('#client-search').on('input', function() {
                let search = $(this).val();
                $.ajax({
                    url: 'machines.php',
                    method: 'GET',
                    data: { search: search },
                    success: function(response) {
                        let html = $(response).find('#machines-body').html();
                        $('#machines-body').html(html);
                        bindRowClicks();
                        bindSaveButtons();
                        bindTooltipEvents();
                    },
                    error: function(xhr, status, error) {
                        console.error('Грешка при търсенето:', error);
                        alert('Грешка при търсене на клиенти: ' + error);
                    }
                });
            });

            // Функция за свързване на клик събития за редовете
            function bindRowClicks() {
                $('tr[data-client-id]').off('click').on('click', function(e) {
                    // Проверка дали кликът е върху елемент от падащото меню
                    if ($(e.target).closest('.dropdown-content').length) {
                        return; // Не прави нищо, ако кликът е в падащото меню
                    }

                    let clientId = $(this).data('client-id');
                    let dropdownRow = $(`tr.dropdown-row[data-client-id="${clientId}"]`);
                    let isExpanded = $(this).hasClass('row-expanded');

                    // Затваряне на всички други отворени редове
                    $('tr[data-client-id]').removeClass('row-expanded');
                    $('.dropdown-row .dropdown-content').slideUp(300);

                    // Превключване на текущия ред
                    if (!isExpanded) {
                        $(this).addClass('row-expanded');
                        dropdownRow.find('.dropdown-content').slideDown(300);
                    }
                });
            }

            // Функция за показване на tooltip при mouseover
            function bindTooltipEvents() {
                $('.coffee-machine-count, .water-dispenser-count').off('mouseenter mouseleave').on({
                    mouseenter: function() {
                        let description = $(this).data('description');
                        if (description && description.trim() !== '') {
                            // Преобразуване на \n и \\n в <br> за HTML
                            let formattedDescription = description
                                .replace(/\\n/g, '<br>')
                                .replace(/\n/g, '<br>');
                            let tooltip = $('<div class="tooltip"></div>').html(formattedDescription);
                            $('body').append(tooltip);
                            tooltip.css({
                                top: $(this).offset().top + $(this).outerHeight() + 5,
                                left: $(this).offset().left
                            });
                        }
                    },
                    mouseleave: function() {
                        $('.tooltip').remove();
                    }
                });
            }

            // Функция за свързване на бутоните за запазване
            function bindSaveButtons() {
                $('.save-btn').off('click').on('click', function() {
                    let client_id = $(this).data('client-id');
                    let dropdownRow = $(`tr.dropdown-row[data-client-id="${client_id}"]`);
                    let coffee_machine_count = dropdownRow.find('.coffee-machine-count-input').val();
                    let water_dispenser_count = dropdownRow.find('.water-dispenser-count-input').val();
                    let coffee_machine_description = dropdownRow.find('.coffee-machine-description-input').val();
                    let water_dispenser_description = dropdownRow.find('.water-dispenser-description-input').val();

                    $.ajax({
                        url: 'machines.php',
                        method: 'POST',
                        data: {
                            client_id: client_id,
                            coffee_machine_count: coffee_machine_count,
                            water_dispenser_count: water_dispenser_count,
                            coffee_machine_description: coffee_machine_description,
                            water_dispenser_description: water_dispenser_description
                        },
                        dataType: 'json',
                        success: function(response) {
                            if (response.status === 'success') {
                                // Актуализиране на реда в таблицата без презареждане
                                let mainRow = $(`tr[data-client-id="${client_id}"]`);
                                mainRow.find('.coffee-machine-count')
                                    .text(response.coffee_machine_count)
                                    .data('description', response.coffee_machine_description);
                                mainRow.find('.water-dispenser-count')
                                    .text(response.water_dispenser_count)
                                    .data('description', response.water_dispenser_description);
                                alert('Данните бяха обновени успешно!');
                                // Затваряне на падащото меню
                                mainRow.removeClass('row-expanded');
                                dropdownRow.find('.dropdown-content').slideUp(300);
                            } else {
                                alert('Грешка при обновяване: ' + response.message);
                            }
                        },
                        error: function(xhr, status, error) {
                            console.error('Грешка при запазване:', error, xhr.responseText);
                            alert('Грешка при запазване на данните: ' + error);
                        }
                    });
                });
            }

            bindRowClicks();
            bindSaveButtons();
            bindTooltipEvents();
        });
    </script>
    <?php include 'footer.php'; ?>
</body>
</html>