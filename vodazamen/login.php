<?php
session_start();

if (isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

include 'db_connect.php';

if (isset($_POST['login'])) {
    $username = $_POST['username'];
    $password = $_POST['password'];

    $stmt = mysqli_prepare($conn, "SELECT * FROM users WHERE username = ?");
    mysqli_stmt_bind_param($stmt, "s", $username);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    if ($result && mysqli_num_rows($result) > 0) {
        $user = mysqli_fetch_assoc($result);
        if (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            header("Location: index.php");
            exit;
        } else {
            $error = "Грешна парола!";
        }
    } else {
        $error = "Няма такъв потребител!";
    }
    mysqli_stmt_close($stmt);
}
?>

<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔒 Вход</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-r from-gray-100 to-gray-200 p-4">
    <div class="container mx-auto bg-white p-6 rounded-lg shadow-lg max-w-md mt-20">
        <h1 class="text-3xl font-bold mb-4 text-center text-gray-700">🔒 Вход</h1>
        <?php if (isset($error)) { ?>
            <p class="text-red-500 text-center mb-4"><?php echo $error; ?></p>
        <?php } ?>
        <form method="POST" class="flex flex-col gap-4">
            <input type="text" name="username" placeholder="👤 Потребител" class="border p-3 rounded-lg shadow" required>
            <input type="password" name="password" placeholder="🔑 Парола" class="border p-3 rounded-lg shadow" required>
            <button type="submit" name="login" class="bg-blue-500 text-white p-3 rounded-lg shadow hover:bg-blue-600 transition">🔓 Влез</button>
        </form>
    </div>
    <?php include 'footer.php'; ?>
</body>
</html>