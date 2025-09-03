<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include 'db_connect.php';

// Извличане на всички Стокови Разписки от базата
$stmt = mysqli_prepare($conn, "SELECT dn.id, dn.note_number, dn.note_date, c.company_name FROM delivery_notes dn LEFT JOIN clients c ON dn.client_id = c.id ORDER BY dn.note_date DESC");
mysqli_stmt_execute($stmt);
$notes_result = mysqli_stmt_get_result($stmt);
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📜 Списък на Стокови Разписки</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200 p-4">
    <div class="container mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold mb-2 text-center text-gray-700">📜 Списък на Стокови Разписки</h1>
        <?php include 'menu.php'; ?>

        <div class="mt-6 overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead class="bg-gray-800 text-white">
                    <tr>
                        <th class="p-2 border-b border-r text-center">📄 Номер на разписка</th>
                        <th class="p-2 border-b border-r text-center">👤 Клиент</th>
                        <th class="p-2 border-b border-r text-center">📅 Дата</th>
                        <th class="p-2 border-b text-center">Действия</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while ($note = mysqli_fetch_assoc($notes_result)) { ?>
                        <tr class="hover:bg-gray-100">
                            <td class="p-2 border-b border-r text-center"><?php echo htmlspecialchars($note['note_number']); ?></td>
                            <td class="p-2 border-b border-r text-center"><?php echo htmlspecialchars($note['company_name']); ?></td>
                            <td class="p-2 border-b border-r text-center"><?php echo date('d.m.Y', strtotime($note['note_date'])); ?></td>
                            <td class="p-2 border-b text-center">
                                <a href="invoice.php?note_id=<?php echo $note['id']; ?>" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">🔄 Ретринирай</a>
                            </td>
                        </tr>
                    <?php } ?>
                </tbody>
            </table>
        </div>
    </div>

    <?php include 'footer.php'; ?>
    <script>
        // Логика за репринтиране на Стокови Разписки ще се добави в invoice.php
    </script>
</body>
</html>