<?php
header('Content-Type: application/json');

include 'db_connect.php'; // Включва връзката към базата данни

$iban = isset($_POST['iban']) ? trim($_POST['iban']) : '';

if (empty($iban)) {
    echo json_encode(['success' => false, 'message' => 'IBAN не е предоставен.']);
    exit;
}

// Базова валидация на IBAN (пример за България)
if (strlen($iban) !== 22 || strpos($iban, 'BG') !== 0) {
    echo json_encode(['success' => false, 'message' => 'Невалиден IBAN за България. IBAN трябва да е 22 символа и да започва с "BG".']);
    exit;
}

// Извличане на банкен код от IBAN (позиции 5 до 8 за България)
$bank_code = substr($iban, 4, 4);

if (strlen($bank_code) < 4) {
    echo json_encode(['success' => false, 'message' => 'Невалиден IBAN.']);
    exit;
}

// Проверка в таблицата `iban_banks` за съответствие на банкен код
$query = "SELECT bank_name, bic FROM iban_banks WHERE bank_code = ?";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "s", $bank_code);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if ($result && mysqli_num_rows($result) > 0) {
    $bank_info = mysqli_fetch_assoc($result);
    echo json_encode([
        'success' => true,
        'bank' => $bank_info['bank_name'],
        'bank_code' => $bank_info['bic']
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Информация за IBAN не е намерена в базата данни.']);
}

mysqli_stmt_close($stmt);
exit;