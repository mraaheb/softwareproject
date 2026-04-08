<?php
require_once "../config.php";

$message = "";
$message_type = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name = trim($_POST["name"] ?? "");
    $role = trim($_POST["role"] ?? "patient");
    $email = trim($_POST["email"] ?? "");
    $password = $_POST["password"] ?? "";

    if (empty($name) || empty($email) || empty($password) || empty($role)) {
        $message = "Fill all fields";
        $message_type = "error";
    } else {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $message = "Invalid email format";
            $message_type = "error";
        } else {
            $password_hash = password_hash($password, PASSWORD_DEFAULT);

            if ($role === "patient") {
                $phone = trim($_POST["phone"] ?? "");
                $dob = trim($_POST["dob"] ?? "");
                $wheelchair = isset($_POST["wheelchair"]) ? 1 : 0;
                $oxygen = isset($_POST["oxygen"]) ? 1 : 0;
                $companion = isset($_POST["companion"]) ? 1 : 0;

                if (empty($phone) || empty($dob)) {
                    $message = "Complete medical info";
                    $message_type = "error";
                } else {
                    $check_stmt = $conn->prepare("SELECT id FROM patient_guardians WHERE email = ? LIMIT 1");
                    $check_stmt->bind_param("s", $email);
                    $check_stmt->execute();
                    $check_result = $check_stmt->get_result();

                    if ($check_result->num_rows > 0) {
                        $message = "Email already exists";
                        $message_type = "error";
                    } else {
                        $insert_user = $conn->prepare("
                            INSERT INTO patient_guardians (full_name, email, password_hash, phone)
                            VALUES (?, ?, ?, ?)
                        ");
                        $insert_user->bind_param("ssss", $name, $email, $password_hash, $phone);

                        if ($insert_user->execute()) {
                            $patient_id = $insert_user->insert_id;

                            $insert_profile = $conn->prepare("
                                INSERT INTO profiles (patient_id, dob, wheelchair, oxygen, companion, notes)
                                VALUES (?, ?, ?, ?, ?, '')
                            ");
                            $insert_profile->bind_param("isiii", $patient_id, $dob, $wheelchair, $oxygen, $companion);
                            $insert_profile->execute();

                            $_SESSION["user_id"] = $patient_id;
                            $_SESSION["full_name"] = $name;
                            $_SESSION["email"] = $email;
                            $_SESSION["role"] = "patient";

                            header("Location: ../medical-profile/medical-profile.php");
                            exit;
                        } else {
                            $message = "Registration failed";
                            $message_type = "error";
                        }
                    }
                }
            } elseif ($role === "provider") {
                $check_stmt = $conn->prepare("SELECT id FROM service_providers WHERE email = ? LIMIT 1");
                $check_stmt->bind_param("s", $email);
                $check_stmt->execute();
                $check_result = $check_stmt->get_result();

                if ($check_result->num_rows > 0) {
                    $message = "Email already exists";
                    $message_type = "error";
                } else {
                    $provider_name = $name;
                    $license_number = "P-" . time();

                    $insert_provider = $conn->prepare("
                        INSERT INTO service_providers (full_name, email, password_hash, provider_name, license_number, is_verified)
                        VALUES (?, ?, ?, ?, ?, 1)
                    ");
                    $insert_provider->bind_param("sssss", $name, $email, $password_hash, $provider_name, $license_number);

                    if ($insert_provider->execute()) {
                        $provider_id = $insert_provider->insert_id;

                        $_SESSION["user_id"] = $provider_id;
                        $_SESSION["full_name"] = $provider_name;
                        $_SESSION["email"] = $email;
                        $_SESSION["role"] = "provider";

                        header("Location: ../provider-dashboard/provider-dashboard.php");
                        exit;
                    } else {
                        $message = "Registration failed";
                        $message_type = "error";
                    }
                }
            } else {
                $message = "Invalid role";
                $message_type = "error";
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Adud — Register</title>

  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="register.css"/>

  <style>
    .system-message {
      margin-bottom: 16px;
      padding: 12px 14px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
    }

    .system-message.error {
      background: #fdecec;
      color: #a33a3a;
      border: 1px solid #f3c2c2;
    }

    .system-message.success {
      background: #e8f7ee;
      color: #256b45;
      border: 1px solid #b7e3c9;
    }
  </style>
</head>

<body>

<div class="container">

  <div class="left">
    <img src="../../images/logo.png" class="logo" alt="Adud Logo"/>
    <h1>عضد</h1>
    <p>Medical transport platform</p>

    <div class="features">
      <span>Safe & Secure</span>
      <span>Easy Booking</span>
      <span>Smart Profile</span>
    </div>
  </div>

  <div class="right">

    <h2>Create Account</h2>

    <?php if (!empty($message)): ?>
      <div class="system-message <?php echo htmlspecialchars($message_type); ?>">
        <?php echo htmlspecialchars($message); ?>
      </div>
    <?php endif; ?>

    <form method="POST" action="">
      <label>Full Name</label>
      <input type="text" id="name" name="name" value="<?php echo htmlspecialchars($_POST["name"] ?? ""); ?>"/>

      <label>Role</label>
      <div class="role-group">
        <label class="role-card">
          <input type="radio" name="role" value="patient" <?php echo (($_POST["role"] ?? "patient") === "patient") ? "checked" : ""; ?>>
          <div class="role-title">Patient</div>
        </label>

        <label class="role-card">
          <input type="radio" name="role" value="provider" <?php echo (($_POST["role"] ?? "") === "provider") ? "checked" : ""; ?>>
          <div class="role-title">Provider</div>
        </label>
      </div>

      <label>Email</label>
      <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($_POST["email"] ?? ""); ?>"/>

      <label>Password</label>
      <input type="password" id="password" name="password"/>

      <div id="patientFields">
        <h3>Medical Information</h3>

        <label>Phone</label>
        <input type="text" id="phone" name="phone" value="<?php echo htmlspecialchars($_POST["phone"] ?? ""); ?>"/>

        <label>Date of Birth</label>
        <input type="date" id="dob" name="dob" value="<?php echo htmlspecialchars($_POST["dob"] ?? ""); ?>"/>

        <h4>Mobility Requirements</h4>

        <div class="mobility-grid">
          <label class="mobility-card">
            <input type="checkbox" id="wheelchair" name="wheelchair" <?php echo isset($_POST["wheelchair"]) ? "checked" : ""; ?>/>
            <div class="icon">♿</div>
            <div>Wheelchair</div>
          </label>

          <label class="mobility-card">
            <input type="checkbox" id="oxygen" name="oxygen" <?php echo isset($_POST["oxygen"]) ? "checked" : ""; ?>/>
            <div class="icon">🫁</div>
            <div>Oxygen</div>
          </label>

          <label class="mobility-card">
            <input type="checkbox" id="companion" name="companion" <?php echo isset($_POST["companion"]) ? "checked" : ""; ?>/>
            <div class="icon">🤝</div>
            <div>Companion</div>
          </label>
        </div>
      </div>

      <button type="submit">Register</button>

      <p class="link">
        Already have an account?
        <a href="../login/login.php">Login</a>
      </p>
    </form>

  </div>
</div>

<script>
const patientFields = document.getElementById("patientFields");

function getRole() {
  const selected = document.querySelector('input[name="role"]:checked');
  return selected ? selected.value : "patient";
}

function togglePatient() {
  if (getRole() === "patient") {
    patientFields.style.display = "block";
  } else {
    patientFields.style.display = "none";
  }
}

document.querySelectorAll('input[name="role"]').forEach(r => {
  r.addEventListener("change", togglePatient);
});

togglePatient();
</script>

</body>
</html>