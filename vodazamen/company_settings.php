<?php
session_start();
date_default_timezone_set('Europe/Sofia');
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

include 'db_connect.php';

if (isset($_POST['update_company'])) {
    $company_name = mysqli_real_escape_string($conn, $_POST['company_name']);
    $eic = mysqli_real_escape_string($conn, $_POST['eic']);
    $vat_number = mysqli_real_escape_string($conn, $_POST['vat_number']);
    $address = mysqli_real_escape_string($conn, $_POST['address']);
    $phone = mysqli_real_escape_string($conn, $_POST['phone']);
    $email = mysqli_real_escape_string($conn, $_POST['email']);

    // Обработка на качване на лого
    $logo_path = '';
    if (!empty($_FILES['logo']['name'])) {
        $target_dir = "uploads/logo/";
        $target_file = $target_dir . basename($_FILES['logo']['name']);
        if (move_uploaded_file($_FILES['logo']['tmp_name'], $target_file)) {
            $logo_path = $target_file;
        }
    }

    // Проверка дали фирмата вече съществува
    $company_query = "SELECT * FROM company_details LIMIT 1";
    $company_result = mysqli_query($conn, $company_query);
    if (mysqli_num_rows($company_result) > 0) {
        // Актуализация на съществуващите данни
        $stmt = mysqli_prepare($conn, "UPDATE company_details SET company_name = ?, eic = ?, address = ?, vat_number = ?, phone = ?, email = ?, logo_path = ? WHERE id = 1");
        mysqli_stmt_bind_param($stmt, "sssssss", $company_name, $eic, $address, $vat_number, $phone, $email, $logo_path);
    } else {
        // Създаване на нови данни
        $stmt = mysqli_prepare($conn, "INSERT INTO company_details (company_name, eic, address, vat_number, phone, email, logo_path) VALUES (?, ?, ?, ?, ?, ?, ?)");
        mysqli_stmt_bind_param($stmt, "sssssss", $company_name, $eic, $address, $vat_number, $phone, $email, $logo_path);
    }
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    header("Location: invoice.php?success=1");
    exit;
}

header("Location: invoice.php");
exit;