
<?php
require_once "../config.php";

if (!isset($_SESSION["user_id"])) {
    header("Location: ../login/login.php");
    exit;
}

$user_id = $_SESSION["user_id"];

$request_id = intval($_GET["id"] ?? 0);
$message = "";

// جلب الطلب
$stmt = $conn->prepare("SELECT * FROM requests WHERE id = ? AND patient_id = ?");
$stmt->bind_param("ii", $request_id, $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows !== 1) {
    header("Location: ../dashboard/dashboard.php");
    exit;
}

$request = $result->fetch_assoc();

// إذا الحالة ليست Requested → رجوع
if ($request["status"] !== "Requested") {
    header("Location: ../dashboard/dashboard.php");
    exit;
}

// تحديث البيانات
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $pickup = trim($_POST["pickup"]);
    $destination = trim($_POST["destination"]);
    $appt_date = $_POST["appt_date"];
    $appt_time = $_POST["appt_time"];

    $appointment_datetime = $appt_date . " " . $appt_time . ":00";

    $wheelchair = isset($_POST["wheelchair"]) ? 1 : 0;
    $oxygen = isset($_POST["oxygen"]) ? 1 : 0;
    $companion = isset($_POST["companion"]) ? 1 : 0;
    $escort_required = isset($_POST["escort_required"]) ? 1 : 0;

    $update = $conn->prepare("
        UPDATE requests SET
            pickup_location = ?,
            destination = ?,
            appointment_datetime = ?,
            wheelchair = ?,
            oxygen = ?,
            companion = ?,
            escort_required = ?
        WHERE id = ?
    ");

    $update->bind_param(
        "sssiiiii",
        $pickup,
        $destination,
        $appointment_datetime,
        $wheelchair,
        $oxygen,
        $companion,
        $escort_required,
        $request_id
    );

    if ($update->execute()) {
        header("Location: ../dashboard/dashboard.php");
        exit;
    } else {
        $message = "Update failed";
    }
}

// تقسيم التاريخ
$dt = strtotime($request["appointment_datetime"]);
$date = date("Y-m-d", $dt);
$time = date("H:i", $dt);
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Edit Request</title>
</head>
<body>

<h2>Edit Request</h2>

<?php if ($message): ?>
    <p><?php echo $message; ?></p>
<?php endif; ?>

<form method="POST">
    <input type="text" name="pickup" value="<?php echo htmlspecialchars($request["pickup_location"]); ?>"><br><br>

    <input type="text" name="destination" value="<?php echo htmlspecialchars($request["destination"]); ?>"><br><br>

    <input type="date" name="appt_date" value="<?php echo $date; ?>"><br><br>

    <input type="time" name="appt_time" value="<?php echo $time; ?>"><br><br>

    <label>
        <input type="checkbox" name="wheelchair" <?php echo $request["wheelchair"] ? "checked" : ""; ?>>
        Wheelchair
    </label><br>

    <label>
        <input type="checkbox" name="oxygen" <?php echo $request["oxygen"] ? "checked" : ""; ?>>
        Oxygen
    </label><br>

    <label>
        <input type="checkbox" name="companion" <?php echo $request["companion"] ? "checked" : ""; ?>>
        Companion
    </label><br>

    <label>
        <input type="checkbox" name="escort_required" <?php echo $request["escort_required"] ? "checked" : ""; ?>>
        Escort
    </label><br><br>

    <button type="submit">Update</button>
</form>

<br>
<a href="../dashboard/dashboard.php">Back</a>

</body>
</html>