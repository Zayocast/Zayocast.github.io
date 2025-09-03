<?php
session_start();
include 'db_connect.php';

if (!isset($_SESSION['offer_html']) || !isset($_SESSION['offer_number']) || !isset($_GET['offer_number']) || $_GET['offer_number'] !== $_SESSION['offer_number']) {
    header("Location: offer.php");
    exit;
}

$html = $_SESSION['offer_html'];

// Обработка на изпращане на имейл (записване в локален файл вместо изпращане)
if (isset($_POST['send_email']) && isset($_POST['recipient_email']) && !empty(trim($_POST['recipient_email']))) {
    $recipient_email = trim($_POST['recipient_email']);
    
    // Валидация на имейл адреса
    if (!filter_var($recipient_email, FILTER_VALIDATE_EMAIL)) {
        echo "<script>alert('Грешка: Въведете валиден имейл адрес.');</script>";
    } else {
        // Генериране на PDF за прикачване
        $pdf_path = sys_get_temp_dir() . "/Offer_" . $_SESSION['offer_number'] . ".pdf";
        $pdf_content = $_POST['pdf_content']; // Получаваме PDF данните от JavaScript
        file_put_contents($pdf_path, base64_decode($pdf_content));

        // Създаване на директория за имейли, ако не съществува
        $email_dir = __DIR__ . '/emails';
        if (!is_dir($email_dir)) {
            mkdir($email_dir, 0777, true);
        }

        // Подготовка на съдържанието на имейла
        $subject = "Оферта за доставка на Кафе и Вода от Vodazamen.com";
        $message = "Здравейте,\n\nПрикачваме оферта № " . $_SESSION['offer_number'] . " за ваша информация.\n\nПоздрави,\nVodazamen Manager";
        $boundary = md5(uniqid(time()));
        $headers = "From: Vodazamen Manager <info@vodazamen.com>\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";

        // Текстовата част на имейла
        $body = "--$boundary\r\n";
        $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
        $body .= $message . "\r\n";

        // Прикачване на PDF
        $file_content = file_get_contents($pdf_path);
        $file_encoded = chunk_split(base64_encode($file_content));
        $body .= "--$boundary\r\n";
        $body .= "Content-Type: application/pdf; name=\"Offer_" . $_SESSION['offer_number'] . ".pdf\"\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n";
        $body .= "Content-Disposition: attachment; filename=\"Offer_" . $_SESSION['offer_number'] . ".pdf\"\r\n\r\n";
        $body .= $file_encoded . "\r\n";
        $body .= "--$boundary--";

        // Записване на имейла като текстов файл и PDF прикачен файл
        $email_file = $email_dir . "/email_" . $_SESSION['offer_number'] . "_" . time() . ".txt";
        $email_content = "To: $recipient_email\nSubject: $subject\nHeaders:\n$headers\n\nBody:\n$body";
        file_put_contents($email_file, $email_content);
        copy($pdf_path, $email_dir . "/Offer_" . $_SESSION['offer_number'] . "_" . time() . ".pdf");

        echo "<script>alert('Офертата беше „изпратена“ успешно на $recipient_email! Проверете папка emails в директорията на проекта.');</script>";

        unlink($pdf_path); // Изтриваме временния файл
    }
}

// Добавяне на HTML с бутон за печат, запазване като PDF и изпращане по имейл
$styled_html = '
<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Оферта № ' . htmlspecialchars($_SESSION['offer_number']) . '</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <style>
        /* Стилове за всички режими (екран и PDF) */
        .box {
            border: 1px solid #000;
            padding: 8px;
            margin-bottom: 8px;
        }
        .logo {
            max-width: 240px; /* За екрана */
            height: auto;
            display: block;
            margin: 0 auto 5px auto;
        }
        @media print {
            .no-print {
                display: none !important;
            }
            body { margin: 0; padding: 0; }
            .container { width: 100%; margin: 0; padding: 0; }
            table { border-collapse: collapse; width: 100%; border: 1px solid #000; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; }
            th { background-color: #000; color: white; }
            td { color: black; }
            .box { border: 1px solid #000; padding: 8px; margin-bottom: 8px; }
            h1 { text-align: center; font-size: 18px; font-weight: bold; margin: 10px 0; }
            .logo { 
                width: 200px; /* Фиксиран размер за печат */
                max-width: 200px;
                height: auto;
                display: block;
                margin: 0 auto 5px auto;
            }
        }
    </style>
</head>
<body class="bg-white">
    <div class="container mx-auto p-4">
        <div class="flex justify-center gap-4 mb-4 no-print">
            <button class="print-button bg-blue-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition duration-200" onclick="window.print()">🖨️ Печат</button>
            <button class="save-pdf-button bg-green-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-green-600 transition duration-200" onclick="saveAsPDF()">💾 Запази като PDF</button>
            <button class="email-button bg-purple-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-purple-600 transition duration-200" onclick="showEmailForm()">📧 Изпрати по имейл</button>
        </div>
        <div id="email-form" class="no-print mb-4 hidden">
            <form method="POST" action="view_offer.php?offer_number=' . urlencode($_SESSION['offer_number']) . '" class="flex flex-col gap-4">
                <div>
                    <label for="recipient-email" class="block text-sm font-medium text-gray-700">📧 Въведете имейл адрес</label>
                    <input type="email" name="recipient_email" id="recipient-email" placeholder="Въведете имейл адрес" value="Все още не работи!!!" class="border p-3 rounded-lg shadow w-full mt-1" required>
                </div>
                <input type="hidden" name="pdf_content" id="pdf-content">
                <div class="flex flex-col items-center gap-2">
                    <button type="submit" name="send_email" class="bg-purple-500 text-white p-3 rounded-lg shadow hover:bg-purple-600 transition">📤 Изпрати</button>
                    <span class="text-xs text-gray-500">Имейл функционалността все още не е активна</span>
                </div>
            </form>
        </div>
        <img src="newlogo2.png" alt="Logo" class="logo">
        ' . $html . '
    </div>
    <script>
        function generatePDFForEmail() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const element = document.querySelector(".container");
            const buttons = document.querySelector(".no-print");
            const logo = document.querySelector(".logo");
            const emailForm = document.querySelector("#email-form");

            // Временно скриване на бутоните, формата за имейл и задаване на размер на логото за PDF
            buttons.style.display = "none";
            if (emailForm) emailForm.style.display = "none";
            logo.style.width = "180px";
            logo.style.maxWidth = "180px";

            return html2canvas(element, {
                scale: 2,
                useCORS: true
            }).then(canvas => {
                // Възстановяване на елементите
                buttons.style.display = "";
                if (emailForm) emailForm.style.display = "";
                logo.style.width = "";
                logo.style.maxWidth = "";

                const imgData = canvas.toDataURL("image/png");
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                let heightLeft = pdfHeight;
                let position = 0;

                doc.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
                heightLeft -= doc.internal.pageSize.getHeight();

                while (heightLeft >= 0) {
                    position = heightLeft - pdfHeight;
                    doc.addPage();
                    doc.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
                    heightLeft -= doc.internal.pageSize.getHeight();
                }

                // Връщане на PDF данните за изпращане по имейл
                return doc.output("datauristring").split(",")[1];
            }).catch(error => {
                buttons.style.display = "";
                if (emailForm) emailForm.style.display = "";
                logo.style.width = "";
                logo.style.maxWidth = "";
                console.error("Грешка при генериране на PDF:", error);
                alert("Възникна грешка при генерирането на PDF. Моля, опитайте отново.");
                throw error;
            });
        }

        function saveAsPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const element = document.querySelector(".container");
            const buttons = document.querySelector(".no-print");
            const logo = document.querySelector(".logo");
            const emailForm = document.querySelector("#email-form");

            buttons.style.display = "none";
            if (emailForm) emailForm.style.display = "none";
            logo.style.width = "180px";
            logo.style.maxWidth = "180px";

            html2canvas(element, {
                scale: 2,
                useCORS: true
            }).then(canvas => {
                buttons.style.display = "";
                if (emailForm) emailForm.style.display = "";
                logo.style.width = "";
                logo.style.maxWidth = "";

                const imgData = canvas.toDataURL("image/png");
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                let heightLeft = pdfHeight;
                let position = 0;

                doc.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
                heightLeft -= doc.internal.pageSize.getHeight();

                while (heightLeft >= 0) {
                    position = heightLeft - pdfHeight;
                    doc.addPage();
                    doc.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
                    heightLeft -= doc.internal.pageSize.getHeight();
                }

                doc.save("Offer_" + "' . htmlspecialchars($_SESSION['offer_number']) . '.pdf");
            }).catch(error => {
                buttons.style.display = "";
                if (emailForm) emailForm.style.display = "";
                logo.style.width = "";
                logo.style.maxWidth = "";
                console.error("Грешка при запазване на PDF:", error);
                alert("Възникна грешка при запазването на PDF. Моля, опитайте отново.");
            });
        }

        function showEmailForm() {
            const emailForm = document.getElementById("email-form");
            emailForm.classList.toggle("hidden");
            if (!emailForm.classList.contains("hidden")) {
                generatePDFForEmail().then(pdfContent => {
                    document.getElementById("pdf-content").value = pdfContent;
                });
            }
        }
    </script>
</body>
</html>';

// Извеждане на HTML
echo $styled_html;

// Изчистване на сесията след показване
unset($_SESSION['offer_html']);
unset($_SESSION['offer_number']);
?>