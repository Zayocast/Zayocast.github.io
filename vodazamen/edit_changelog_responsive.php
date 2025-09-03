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

// Проверка за валиден индекс
$index = isset($_GET['index']) ? (int)$_GET['index'] : -1;
if ($index < 0 || $index >= count($changelog)) {
    $message = "⚠️ Грешка: Промяната не е намерена.";
    $entry = null;
} else {
    $entry = $changelog[$index];
}

// Обработка на редакция
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['new_entry']) && $entry !== null) {
    $new_content = trim($_POST['new_entry']);
    if (!empty($new_content)) {
        $changelog[$index] = [
            "timestamp" => date("Y-m-d H:i"),
            "content" => $new_content
        ];
        saveChangelog($changelog);
        $message = "✅ Промяната е редактирана успешно.";
        $entry = $changelog[$index];
    } else {
        $message = "⚠️ Моля, попълнете съдържание.";
    }
}
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="UTF-8">
    <title>✏️ Редактиране на промяна - Vodazamen Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://unpkg.com/trix@2.0.8/dist/trix.css" rel="stylesheet">
    <script src="https://unpkg.com/trix@2.0.8/dist/trix.umd.min.js"></script>
    <script src="https://unpkg.com/emoji-picker-element@^1.0.0/index.js" type="module"></script>
    <style>
        trix-toolbar .trix-button-group {
            display: flex;
            gap: 4px;
            margin-bottom: 8px;
        }
        trix-toolbar .trix-button {
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 6px;
            font-size: 14px;
            cursor: pointer;
        }
        trix-toolbar .trix-button:hover {
            background-color: #e5e7eb;
        }
        trix-editor {
            background-color: #f9fafb;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 12px;
            min-height: 200px;
            font-size: 18px;
            line-height: 1.3;
        }
        trix-editor ul {
            list-style-type: disc;
            padding-left: 40px;
            margin: 8px 0;
        }
        trix-editor li {
            margin-bottom: 4px;
        }
        emoji-picker {
            width: 100%;
            max-width: 400px;
            margin-top: 8px;
            --background: #f9fafb;
            --border-color: #d1d5db;
            --button-hover-background: #e5e7eb;
        }
        @media (max-width: 640px) {
            trix-editor {
                font-size: 16px;
                min-height: 150px;
            }
            trix-editor ul {
                padding-left: 30px;
            }
            .container {
                padding: 12px;
            }
        }
    </style>

    <style>
    /* Responsive forms and buttons */
    body {
        padding: 10px;
        box-sizing: border-box;
    }

    form, .form-container {
        width: 100%;
        max-width: 100%;
    }

    input[type="text"], input[type="date"], input[type="number"], textarea, select {
        width: 100%;
        box-sizing: border-box;
        padding: 10px;
        margin: 5px 0;
        font-size: 16px;
    }

    button, input[type="submit"] {
        padding: 10px 15px;
        font-size: 16px;
        width: 100%;
        margin-top: 10px;
    }

    table {
        width: 100%;
        overflow-x: auto;
        display: block;
        font-size: 14px;
    }

    @media screen and (min-width: 600px) {
        button, input[type="submit"] {
            width: auto;
        }
    }
    </style>
    
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200 p-4 min-h-screen">
<div class="container mx-auto bg-gradient-to-r from-white to-gray-50 p-4 sm:p-6 rounded-2xl shadow-sm">
    <?php include 'head.php'; ?>
    <?php include 'menu.php'; ?>

    <h1 class="text-3xl sm:text-4xl font-extrabold mb-4 text-center text-indigo-900">
        ✏️ Редактиране на промяна
    </h1>

    <?php if (!empty($message)): ?>
        <div class="mb-2 p-3 rounded-2xl <?php echo strpos($message, 'успешно') !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'; ?> text-lg">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <?php if ($entry === null): ?>
        <p class="text-center text-gray-500 italic text-lg">Промяната не е намерена. <a href="changelog.php" class="text-indigo-600 hover:underline">Върни се обратно</a>.</p>
    <?php else: ?>
        <form method="POST" class="mt-2">
            <label for="new_entry" class="block text-lg font-semibold mb-1 text-gray-700">Текст на промяната:</label>
            <input type="hidden" name="new_entry" id="new_entry" value="<?php echo htmlspecialchars($entry['content']); ?>">
            <trix-editor input="new_entry" class="mb-2"></trix-editor>
            <emoji-picker class="emoji-picker"></emoji-picker>

            <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition duration-200 ease-in-out transform hover:scale-105 mt-2 text-lg">
                💾 Запази промяната
            </button>
            <a href="changelog.php" class="inline-block bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition duration-200 ease-in-out transform hover:scale-105 mt-2 text-lg ml-2">
                ⬅️ Назад
            </a>
        </form>
    <?php endif; ?>
</div>

<?php include 'footer.php'; ?>

<script>
    document.addEventListener('trix-initialize', function(e) {
        const editor = e.target;
        const toolbar = editor.toolbarElement;

        // Премахваме предишни бутони и добавяме само необходимите
        const buttonGroup = toolbar.querySelector('.trix-button-group--text-tools');
        buttonGroup.innerHTML = `
            <button type="button" class="trix-button trix-button--bold" data-trix-attribute="bold" title="Удебелен">B</button>
            <button type="button" class="trix-button trix-button--italic" data-trix-attribute="italic" title="Курсив">I</button>
            <button type="button" class="trix-button trix-button--bullet" data-trix-attribute="bullet" title="Булет списък">•</button>
        `;
    });

    document.querySelector('emoji-picker').addEventListener('emoji-click', event => {
        const editor = document.querySelector('trix-editor');
        editor.editor.insertString(event.detail.unicode);
    });
</script>
</body>
</html>