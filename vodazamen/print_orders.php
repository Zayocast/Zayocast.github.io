<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$orders = [];
if (isset($_POST['orders'])) {
    $orders = json_decode($_POST['orders'], true);
}

function formatProducts($productHtml) {
    $products = [];

    if (!empty($productHtml)) {
        if (preg_match_all('/<li>(.*?)<\/li>/s', $productHtml, $matches)) {
            $products = $matches[1];
        }
    }

    $output = '<div class="grid grid-cols-1 gap-0 text-xs">';
    if (!empty($products)) {
        $output .= '<div class="flex flex-col text-[10px]">';
        $output .= '<ul class="list-disc pl-2 m-0">';
        foreach ($products as $product) {
            $product = preg_replace('/\s*\(\d+\.\d+\s*лв\.\/бр\.\)/', '', $product);
            $output .= "<li>$product</li>";
        }
        $output .= '</ul>';
        $output .= '</div>';
    } else {
        $output .= '<span class="text-gray-500 italic text-[10px]">Няма продукти</span>';
    }
    $output .= '</div>';

    return $output ?: '';
}

function summarizeAllProducts($orders) {
    $productSummary = [];
    
    foreach ($orders as $order) {
        if (!empty($order['product']) && is_string($order['product'])) {
            if (preg_match_all('/<li>(.*?)<\/li>/s', $order['product'], $matches)) {
                $allProducts = $matches[1];
                foreach ($allProducts as $product) {
                    if (preg_match('/(.+?)\s*-\s*(\d+)\s*бр\./', $product, $match)) {
                        $productName = trim($match[1]);
                        $quantity = (int)$match[2];
                        $key = $productName;

                        if (isset($productSummary[$key])) {
                            $productSummary[$key]['quantity'] += $quantity;
                        } else {
                            $productSummary[$key] = [
                                'name' => $productName,
                                'quantity' => $quantity
                            ];
                        }
                    }
                }
            }
        }
    }

    // Сортиране по име
    uasort($productSummary, function($a, $b) {
        return strcmp($a['name'], $b['name']);
    });

    return $productSummary;
}
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Поръчки за разнос</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
    <style>
        @media print {
            body { margin: 0; padding: 1mm; }
            .container { width: 100% !important; margin: 0; padding: 0; }
            table { 
                border-collapse: collapse; 
                width: 100% !important; 
                table-layout: fixed; 
                font-size: 9px !important;
            }
            th, td { 
                border: 1px solid #000; 
                padding: 2px; 
                text-align: center; 
                line-height: 1.1; 
                word-wrap: break-word; 
                min-width: 0;
            }
            th { 
                background-color: #1F2937; 
                color: white; 
                font-weight: bold;
                font-size: 9px !important;
            }
            td { color: black; }
            h1, h2 { 
                text-align: center; 
                font-size: 12px; 
                margin: 2px 0; 
            }
            .product-cell ul { 
                padding-left: 5px; 
                margin: 0; 
            }
            .product-cell li { 
                padding: 0; 
                margin: 0; 
                font-size: 9px !important; 
            }
            .sr-only { 
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                border: 0;
            }
            th, td:nth-child(2), td:nth-child(3), td:nth-child(4), td:nth-child(6), td:nth-child(7), td:nth-child(8), td:nth-child(9) { 
                width: 8%; 
            }
            th:nth-child(5), td:nth-child(5) { 
                width: 30%; 
            }
            th:nth-child(10), td:nth-child(10) { 
                width: 14%; 
            }
            td:first-child, th:first-child { 
                display: table-cell !important; 
                width: 5% !important; 
            }
            #sort-message, #print-button { 
                display: none !important; 
            }
            .product-summary-table {
                margin: 10px auto 0 auto;
                width: 100% !important;
                font-size: 9px !important;
            }
            .product-summary-table th, .product-summary-table td {
                border: 1px solid #000;
                padding: 2px;
                text-align: center;
            }
        }
        .container { padding: 4px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #d1d5db; padding: 4px; font-size: 12px; }
        th { background-color: #1F2937; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #F9FAFB; color: black; }
        tr:nth-child(odd) { background-color: #FFFFFF; color: black; }
        .hover\:bg-gray-50:hover { background-color: #F3F4F6; }
        .product-cell { min-width: 120px; white-space: normal; }
        .product-cell ul { list-style-type: disc; padding-left: 16px; margin: 0; }
        .product-cell li { padding: 0; margin: 0; font-size: 10px; }
        .sortable-chosen { 
            background-color: #e0e0e0; 
            border: 2px dashed #666; 
            cursor: grabbing; 
        }
        .sortable-ghost { 
            opacity: 0.5; 
            background-color: #f0f0f0; 
        }
        tr:hover { 
            cursor: move; 
            background-color: #f5f5f5; 
        }
        .product-summary-table {
            margin: 20px auto 0 auto;
            width: 100%;
            font-size: 12px;
        }
        .product-summary-table th, .product-summary-table td {
            border: 1px solid #d1d5db;
            padding: 4px;
            text-align: center;
        }
        .product-summary-table th.sortable:hover {
            background-color: #374151;
            cursor: pointer;
        }
        .product-summary-table th.sortable.asc::after {
            content: ' ↑';
        }
        .product-summary-table th.sortable.desc::after {
            content: ' ↓';
        }
    </style>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200 p-2">
    <div class="container mx-auto bg-white rounded-lg shadow-lg">
        <h1 class="text-sm font-bold mb-2 text-center text-gray-700">🚚 Поръчки за разнос – <?php echo date('d.m.Y'); ?></h1>
        <p id="sort-message" class="text-center text-xs text-gray-600 mb-2">Плъзнете редовете, за да подредите поръчките, след което натиснете "Печат".</p>
        <button id="print-button" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition mb-2 block mx-auto">🖨️ Печат</button>
        <table class="min-w-full bg-white border border-gray-300 rounded-lg shadow-md" id="sortable-table">
            <thead>
                <tr class="bg-gray-800 text-white">
                    <th class="p-1 border-b border-r text-center text-[9px]">№</th>
                    <th class="p-1 border-b border-r text-center text-[9px]">👤 Клиент</th>
                    <th class="p-1 border-b border-r text-center text-[9px]">📞 Номер</th>
                    <th class="p-1 border-b border-r text-center text-[9px]">📅 Дата</th>
                    <th class="p-1 border-b border-r text-center text-[9px]">📦 Продукти</th>
                    <th class="p-1 border-b border-r text-center text-[9px]">♻️ Върн. г.</th>
                    <th class="p-1 border-b border-r text-center text-[9px]">🏠 Адрес</th>
                    <th class="p-1 border-b border-r text-center text-[9px]">📍 Доп. инфо</th>
                    <th class="p-1 border-b border-r text-center text-[9px]">📝 Доп. информация</th>
                    <th class="p-1 border-b text-center text-[9px]">💰 Цена</th>
                </tr>
            </thead>
            <tbody id="sortable-body">
                <?php if (!empty($orders)) { ?>
                    <?php foreach ($orders as $index => $order) { ?>
                        <tr class="hover:bg-gray-50 transition">
                            <td class="p-1 border-b border-r text-center text-[10px] order-number"><?php echo (int)$index + 1; ?></td>
                            <td class="p-1 border-b border-r text-center text-[10px]"><?php echo htmlspecialchars($order['client']); ?></td>
                            <td class="p-1 border-b border-r text-center text-[10px]"><?php echo htmlspecialchars($order['phone']); ?></td>
                            <td class="p-1 border-b border-r text-center text-[10px]"><?php echo htmlspecialchars($order['date']); ?></td>
                            <td class="p-1 border-b border-r text-left product-cell text-[10px]">
                                <?php echo formatProducts($order['product']); ?>
                            </td>
                            <td class="p-1 border-b border-r text-center text-[10px]"><?php echo htmlspecialchars($order['returned_gallons']); ?></td>
                            <td class="p-1 border-b border-r text-center text-[10px]"><?php echo htmlspecialchars($order['address']); ?></td>
                            <td class="p-1 border-b border-r text-center text-[10px]"><?php echo htmlspecialchars($order['address_details']); ?></td>
                            <td class="p-1 border-b border-r text-center text-[10px]"><?php echo !empty($order['comment']) ? htmlspecialchars($order['comment']) : '-'; ?></td>
                            <td class="p-1 border-b text-center text-[10px]"><?php echo number_format($order['total_price'], 2, '.', '') . ' лв.'; ?></td>
                        </tr>
                    <?php } ?>
                <?php } else { ?>
                    <tr>
                        <td colspan="10" class="p-1 text-center text-[10px]">Няма избрани поръчки за принтиране.</td>
                    </tr>
                <?php } ?>
            </tbody>
        </table>

        <?php
        $productSummary = summarizeAllProducts($orders);
        if (!empty($productSummary)) {
            $counter = 1;
        ?>
            <h2 class="text-sm font-bold mt-4 mb-2 text-center text-gray-700">📦 Продукти за товарене</h2>
            <table class="product-summary-table bg-white border border-gray-300 rounded-lg shadow-md" id="product-summary-table">
                <thead>
                    <tr class="bg-gray-800 text-white">
                        <th class="p-1 border-b border-r text-center text-[9px]">№</th>
                        <th class="p-1 border-b border-r text-center text-[9px] sortable" data-sort="name">📦 Продукт</th>
                        <th class="p-1 border-b text-center text-[9px] sortable" data-sort="quantity">📏 Бройка</th>
                    </tr>
                </thead>
                <tbody id="product-summary-body">
                    <?php foreach ($productSummary as $product) { ?>
                        <tr data-quantity="<?php echo (int)$product['quantity']; ?>" data-name="<?php echo htmlspecialchars($product['name']); ?>">
                            <td class="p-1 border-b border-r text-center text-[10px] product-number"><?php echo $counter++; ?></td>
                            <td class="p-1 border-b border-r text-center text-[10px]"><?php echo htmlspecialchars($product['name']); ?></td>
                            <td class="p-1 border-b text-center text-[10px]"><?php echo (int)$product['quantity'] . ' бр.'; ?></td>
                        </tr>
                    <?php } ?>
                </tbody>
            </table>
        <?php } ?>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const tbody = document.getElementById('sortable-body');
            if (tbody && tbody.children.length > 1) {
                new Sortable(tbody, {
                    animation: 150,
                    handle: 'tr',
                    ghostClass: 'sortable-ghost',
                    chosenClass: 'sortable-chosen',
                    onEnd: function(evt) {
                        console.log('Редът е преместен от позиция ' + evt.oldIndex + ' на ' + evt.newIndex);
                        const rows = tbody.querySelectorAll('tr');
                        rows.forEach((row, index) => {
                            const numberCell = row.querySelector('.order-number');
                            if (numberCell) {
                                numberCell.textContent = index + 1;
                            }
                        });
                    }
                });
            }

            const productTable = document.getElementById('product-summary-table');
            const productTbody = document.getElementById('product-summary-body');
            if (productTable && productTbody) {
                const sortableHeaders = productTable.querySelectorAll('th.sortable');
                let currentSort = { column: 'name', direction: 'asc' };

                sortableHeaders.forEach(header => {
                    header.addEventListener('click', function() {
                        const column = this.getAttribute('data-sort');
                        if (currentSort.column === column) {
                            currentSort.direction = currentSort.direction === 'desc' ? 'asc' : 'desc';
                        } else {
                            currentSort = { column, direction: column === 'quantity' ? 'desc' : 'asc' };
                        }

                        sortableHeaders.forEach(h => {
                            h.classList.remove('asc', 'desc');
                            if (h.getAttribute('data-sort') === column) {
                                h.classList.add(currentSort.direction);
                            }
                        });

                        const rows = Array.from(productTbody.querySelectorAll('tr'));
                        rows.sort((a, b) => {
                            let aValue = column === 'quantity' ? parseInt(a.getAttribute('data-quantity')) || 0 : a.getAttribute('data-name').toLowerCase();
                            let bValue = column === 'quantity' ? parseInt(b.getAttribute('data-quantity')) || 0 : b.getAttribute('data-name').toLowerCase();
                            if (column === 'quantity') {
                                return currentSort.direction === 'desc' ? bValue - aValue : aValue - bValue;
                            } else {
                                return currentSort.direction === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
                            }
                        });

                        productTbody.innerHTML = '';
                        rows.forEach((row, index) => {
                            const numberCell = row.querySelector('.product-number');
                            if (numberCell) {
                                numberCell.textContent = index + 1;
                            }
                            productTbody.appendChild(row);
                        });
                    });
                });
            }

            const printButton = document.getElementById('print-button');
            if (printButton) {
                printButton.addEventListener('click', function() {
                    window.print();
                });
            }
        });
    </script>
</body>
</html>