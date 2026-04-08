
<?php
require_once "../config.php";

$message = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $role = trim($_POST["role"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $password = $_POST["password"] ?? "";

    if (empty($role) || empty($email) || empty($password)) {
        $message = "Enter email and password / أدخل البريد وكلمة المرور";
    } else {
        if ($role === "provider") {
            $stmt = $conn->prepare("SELECT id, full_name, email, password_hash FROM service_providers WHERE email = ?");
            $stmt->bind_param("s", $email);
        } else {
            $stmt = $conn->prepare("SELECT id, full_name, email, password_hash FROM patient_guardians WHERE email = ?");
            $stmt->bind_param("s", $email);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();

            if (password_verify($password, $user["password_hash"])) {
                $_SESSION["user_id"] = $user["id"];
                $_SESSION["full_name"] = $user["full_name"];
                $_SESSION["email"] = $user["email"];
                $_SESSION["role"] = $role;

                if ($role === "provider") {
                    header("Location: ../provider-dashboard/provider-dashboard.php");
                } else {
                    header("Location: ../dashboard/dashboard.php");
                }
                exit;
            } else {
                $message = "Incorrect password / كلمة المرور غير صحيحة";
            }
        } else {
            $message = "User not found / المستخدم غير موجود";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login - ADUD</title>

<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="login.css">

<style>
.error-message {
  background: #fdecec;
  color: #a33a3a;
  border: 1px solid #f3c2c2;
  padding: 12px 14px;
  border-radius: 12px;
  margin-bottom: 18px;
  font-size: 14px;
  font-weight: 600;
}
</style>
</head>

<body>

<div class="container">

    <div class="left">
        <img src="../../images/logo.png" class="logo" alt="ADUD Logo">
        <h1>عضد</h1>
        <p>Medical transport platform</p>
    </div>

    <div class="right">
        <h2>Welcome Back</h2>

        <?php if (!empty($message)): ?>
            <div class="error-message">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="">
            <label>Role</label>
            <select id="role" name="role">
                <option value="patient" <?php echo (($_POST["role"] ?? "") === "patient") ? "selected" : ""; ?>>Patient</option>
                <option value="provider" <?php echo (($_POST["role"] ?? "") === "provider") ? "selected" : ""; ?>>Provider</option>
            </select>

            <label>Email</label>
            <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($_POST["email"] ?? ""); ?>">

            <label>Password</label>
            <input type="password" id="password" name="password">

            <button type="submit">Login</button>

            <p class="link">
                Don't have account?
                <a href="../register/register.php">Register</a>
            </p>
        </form>
    </div>

</div>

</body>
</html>