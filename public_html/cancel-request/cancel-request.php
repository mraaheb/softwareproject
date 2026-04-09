
<?php
require_once "../config.php";

if (!isset($_SESSION["user_id"])) {
    header("Location: ../login/login.php");
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $request_id = intval($_POST["request_id"]);
    $user_id = $_SESSION["user_id"];

    // نتأكد أن الطلب يخص المستخدم
    $check = $conn->prepare("SELECT status FROM requests WHERE id = ? AND patient_id = ?");
    $check->bind_param("ii", $request_id, $user_id);
    $check->execute();
    $result = $check->get_result();

    if ($result->num_rows === 1) {
        $row = $result->fetch_assoc();
        $status = $row["status"];

        // نسمح بالإلغاء فقط إذا الحالة Requested
        if ($status === "Requested") {

            // تحديث الحالة
            $update = $conn->prepare("UPDATE requests SET status = 'Cancelled' WHERE id = ?");
            $update->bind_param("i", $request_id);
            $update->execute();

            // إضافة إلى trip_status
            $insert_status = $conn->prepare("
                INSERT INTO trip_status (request_id, status, updated_by)
                VALUES (?, 'Cancelled', ?)
            ");
            $insert_status->bind_param("ii", $request_id, $user_id);
            $insert_status->execute();
        }
    }
}

header("Location: ../dashboard/dashboard.php");
exit;