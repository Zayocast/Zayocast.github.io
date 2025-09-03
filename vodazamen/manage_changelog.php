<?php

function loadChangelog() {
    $file = __DIR__ . '/changelog.json';
    if (file_exists($file)) {
        $data = file_get_contents($file);
        return json_decode($data, true) ?: [];
    }
    return [];
}

function saveChangelog($array) {
    $file = __DIR__ . '/changelog.json';
    file_put_contents($file, json_encode($array, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$changelog = loadChangelog();
$message = "";

// Обработка на изтриване
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_index'])) {
    $index = (int)$_POST['delete_index'];
    if (isset($changelog[$index])) {
        array_splice($changelog, $index, 1);
        saveChangelog($changelog);
        $message = "✅ Промяната е изтрита успешно.";
    } else {
        $message = "⚠️ Грешка: Промяната не е намерена.";
    }
}
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8" />
    <title>⚙️ Управление на промени - Vodazamen Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .changelog-content ul {
            list-style-type: disc;
            padding-left: 40px;
            margin: 8px 0;
        }
        .changelog-content li {
            margin-bottom: 4px;
        }
        @media (max-width: 640px) {
            .changelog-content ul {
                padding-left: 30px;
            }
        }
    </style>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200 p-4 min-h-screen">
    <?php include 'head.php'; ?>
    <?php include 'menu.php'; ?>

    <div class="w-full max-w-full px-4 sm:px-6">
        <h1 class="text-3xl sm:text-4xl font-extrabold mb-4 text-center text-indigo-900">
            ⚙️ Управление на промени
        </h1>

        <?php if (!empty($message)): ?>
            <div class="mb-2 p-3 rounded-2xl <?php echo strpos($message, 'успешно') !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'; ?> text-lg">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <div class="text-center mb-4">
            <a href="add_changelog.php" class="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition duration-200 ease-in-out transform hover:scale-105">
                ➕ Добави промяна
            </a>
            <a href="changelog.php" class="inline-block bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition duration-200 ease-in-out transform hover:scale-105">
                ⬅️ Обратно към историята
            </a>
        </div>

        <?php if (empty($changelog)): ?>
            <p class="text-center text-gray-500 italic text-lg">Все още няма записани промени.</p>
        <?php else: ?>
            <div class="flex flex-col gap-1 items-center">
                <?php foreach ($changelog as $index => $entry): ?>
                    <div class="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl shadow-sm p-4 w-full sm:w-11/12 md:w-4/5 lg:w-3/4">
                        <div class="text-lg font-semibold text-gray-700 select-none">
                            🛠️ Vodazamen Manager Changelog – #<?php echo count($changelog) - $index; ?>
                        </div>
                        <div class="text-gray-600 text-lg font-semibold flex items-center gap-1 mt-0.5">
                            🕒 
                            <time datetime="<?php echo htmlspecialchars($entry['timestamp']); ?>" class="text-gray-800 text-lg font-bold">
                                <?php echo htmlspecialchars(date("d.m.Y H:i", strtotime($entry['timestamp']))); ?>
                            </time>
                        </div>
                        <div class="text-base text-gray-400 italic select-none mt-0.5 mb-1">
                            Автор: Администратор
                        </div>
                        <div class="text-gray-800 text-lg font-medium leading-tight changelog-content">
                            <?php echo htmlspecialchars_decode($entry['content']); ?>
                        </div>
                        <div class="mt-2 flex gap-2">
                            <a href="edit_changelog.php?index=<?php echo $index; ?>" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-lg shadow-sm transition duration-200 ease-in-out transform hover:scale-105 text-base">
                                ✏️ Редактирай
                            </a>
                            <form method="POST" onsubmit="return confirm('Сигурен ли сте, че искате да изтриете тази промяна?');">
                                <input type="hidden" name="delete_index" value="<?php echo $index; ?>">
                                <button type="submit" class="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-lg shadow-sm transition duration-200 ease-in-out transform hover:scale-105 text-base">
                                    🗑️ Изтрий
                                </button>
                            </form>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <?php include 'footer.php'; ?>
</body>
</html>