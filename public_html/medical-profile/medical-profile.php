<?php
require_once "../config.php";

if (!isset($_SESSION["user_id"]) || $_SESSION["role"] !== "patient") {
    header("Location: ../login/login.php");
    exit;
}

$user_id = $_SESSION["user_id"];
$session_name = $_SESSION["full_name"] ?? "User";
$session_email = $_SESSION["email"] ?? "";

$message = "";
$show_toast = false;

// جلب بيانات المستخدم
$user_stmt = $conn->prepare("SELECT full_name, email, phone FROM patient_guardians WHERE id = ? LIMIT 1");
$user_stmt->bind_param("i", $user_id);
$user_stmt->execute();
$user_result = $user_stmt->get_result();

if ($user_result->num_rows !== 1) {
    header("Location: ../logout.php");
    exit;
}

$user = $user_result->fetch_assoc();

$full_name = $user["full_name"] ?? "";
$email = $user["email"] ?? "";
$phone = $user["phone"] ?? "";

// جلب الملف الطبي
$profile_stmt = $conn->prepare("SELECT dob, wheelchair, oxygen, companion, notes FROM profiles WHERE patient_id = ? LIMIT 1");
$profile_stmt->bind_param("i", $user_id);
$profile_stmt->execute();
$profile_result = $profile_stmt->get_result();

$dob = "";
$wheelchair = 0;
$oxygen = 0;
$companion = 0;
$notes = "";

if ($profile_result->num_rows > 0) {
    $profile = $profile_result->fetch_assoc();
    $dob = $profile["dob"] ?? "";
    $wheelchair = (int)($profile["wheelchair"] ?? 0);
    $oxygen = (int)($profile["oxygen"] ?? 0);
    $companion = (int)($profile["companion"] ?? 0);
    $notes = $profile["notes"] ?? "";
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $full_name = trim($_POST["full_name"] ?? "");
    $phone = trim($_POST["phone"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $dob = trim($_POST["dob"] ?? "");
    $notes = trim($_POST["notes"] ?? "");

    $wheelchair = isset($_POST["wheelchair"]) ? 1 : 0;
    $oxygen = isset($_POST["oxygen"]) ? 1 : 0;
    $companion = isset($_POST["companion"]) ? 1 : 0;

    if (empty($full_name) || empty($phone) || empty($email) || empty($dob)) {
        $message = "Please fill in all required fields. / الرجاء تعبئة جميع الحقول المطلوبة";
    } else {
        $update_user = $conn->prepare("
            UPDATE patient_guardians
            SET full_name = ?, email = ?, phone = ?
            WHERE id = ?
        ");
        $update_user->bind_param("sssi", $full_name, $email, $phone, $user_id);
        $update_user->execute();

        $_SESSION["full_name"] = $full_name;
        $_SESSION["email"] = $email;

        $check_profile = $conn->prepare("SELECT id FROM profiles WHERE patient_id = ? LIMIT 1");
        $check_profile->bind_param("i", $user_id);
        $check_profile->execute();
        $check_profile_result = $check_profile->get_result();

        if ($check_profile_result->num_rows > 0) {
            $update_profile = $conn->prepare("
                UPDATE profiles
                SET dob = ?, wheelchair = ?, oxygen = ?, companion = ?, notes = ?
                WHERE patient_id = ?
            ");
            $update_profile->bind_param("siiisi", $dob, $wheelchair, $oxygen, $companion, $notes, $user_id);
            $update_profile->execute();
        } else {
            $insert_profile = $conn->prepare("
                INSERT INTO profiles (patient_id, dob, wheelchair, oxygen, companion, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $insert_profile->bind_param("isiiis", $user_id, $dob, $wheelchair, $oxygen, $companion, $notes);
            $insert_profile->execute();
        }

        $show_toast = true;
    }
}

$avatar_letter = mb_substr($full_name ?: $session_name, 0, 1);
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Adud — Medical Profile</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="medical-profile.css">
    <style>
        .system-message {
            padding: 14px 16px;
            border-radius: 12px;
            margin-bottom: 18px;
            font-size: 14px;
            font-weight: 600;
            background: #fdecec;
            border: 1px solid #f3c2c2;
            color: #a33a3a;
        }
        .hidden-checkbox {
            display: none;
        }
    </style>
</head>
<body>

<aside class="sidebar">
    <div class="sidebar-brand">
        <div class="logo-box">
            <img src="../../images/logo.png" alt="ADUD Logo">
        </div>
        <div class="brand-text">
            <div class="ar">عضد</div>
            <div class="en">ADUD</div>
        </div>
    </div>

    <div class="nav-section">
        <div class="nav-section-label">Main / الرئيسية</div>

        <a class="nav-item" href="../dashboard/dashboard.php">
            <span class="icon">🏠</span>
            <div class="nav-item-content">
                <span>Dashboard</span>
                <span class="label-ar">الرئيسية</span>
            </div>
        </a>

        <a class="nav-item" href="../createReq/createReq.php">
            <span class="icon">➕</span>
            <div class="nav-item-content">
                <span>New Request</span>
                <span class="label-ar">طلب جديد</span>
            </div>
        </a>

        <a class="nav-item" href="../track-trip/track-trip.php">
            <span class="icon">📍</span>
            <div class="nav-item-content">
                <span>Track Trip</span>
                <span class="label-ar">تتبع الرحلة</span>
            </div>
        </a>

        <a class="nav-item" href="../trip-history/trip-history.php">
            <span class="icon">📋</span>
            <div class="nav-item-content">
                <span>Trip History</span>
                <span class="label-ar">سجل الرحلات</span>
            </div>
        </a>
    </div>

    <div class="nav-section">
        <div class="nav-section-label">Account / الحساب</div>

        <a class="nav-item active" href="medical-profile.php">
            <span class="icon">👤</span>
            <div class="nav-item-content">
                <span>Medical Profile</span>
                <span class="label-ar">الملف الطبي</span>
            </div>
        </a>
    </div>

    <div class="sidebar-footer">
        <div class="user-card">
            <div class="user-avatar"><?php echo htmlspecialchars($avatar_letter); ?></div>
            <div class="user-info">
                <div class="name"><?php echo htmlspecialchars($full_name); ?></div>
                <div class="role">Patient / Guardian</div>
            </div>
        </div>

        <button class="logout-btn" onclick="location.href='../logout.php'">
            🚪 Logout / تسجيل الخروج
        </button>
    </div>
</aside>

<main class="main">
    <div class="topbar">
        <div>
            <h1>Medical Profile / الملف الطبي</h1>
            <p>Manage your personal and mobility requirements / أدر معلوماتك ومتطلبات التنقل</p>
        </div>
    </div>

    <?php if (!empty($message)): ?>
        <div class="system-message">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <div class="profile-grid">
        <div class="profile-summary">
            <div class="avatar-big"><?php echo htmlspecialchars($avatar_letter); ?></div>
            <div class="profile-name"><?php echo htmlspecialchars($full_name); ?></div>
            <div class="profile-role">Patient / مريض</div>
            <div class="profile-badge">✓ Profile Complete</div>

            <div class="info-rows">
                <div class="info-row">
                    <span class="info-icon">📧</span>
                    <span class="info-label">Email</span>
                    <span class="info-val"><?php echo htmlspecialchars($email); ?></span>
                </div>

                <div class="info-row">
                    <span class="info-icon">📱</span>
                    <span class="info-label">Phone</span>
                    <span class="info-val"><?php echo htmlspecialchars($phone); ?></span>
                </div>

                <div class="info-row">
                    <span class="info-icon">🎂</span>
                    <span class="info-label">DOB</span>
                    <span class="info-val"><?php echo htmlspecialchars($dob ?: '—'); ?></span>
                </div>

                <div class="info-row">
                    <span class="info-icon">♿</span>
                    <span class="info-label">Wheelchair</span>
                    <span class="info-val <?php echo $wheelchair ? 'highlight-green' : 'highlight-gray'; ?>">
                        <?php echo $wheelchair ? '✓ Required' : '✗ Not needed'; ?>
                    </span>
                </div>

                <div class="info-row">
                    <span class="info-icon">🤝</span>
                    <span class="info-label">Companion</span>
                    <span class="info-val <?php echo $companion ? 'highlight-green' : 'highlight-gray'; ?>">
                        <?php echo $companion ? '✓ Required' : '✗ Not needed'; ?>
                    </span>
                </div>

                <div class="info-row">
                    <span class="info-icon">🫁</span>
                    <span class="info-label">Oxygen</span>
                    <span class="info-val <?php echo $oxygen ? 'highlight-green' : 'highlight-gray'; ?>">
                        <?php echo $oxygen ? '✓ Required' : '✗ Not needed'; ?>
                    </span>
                </div>
            </div>
        </div>

        <div class="profile-card">
            <div class="card-header">
                <div>
                    <h2>Profile Details / تفاصيل الملف</h2>
                    <p>Your details auto-fill future transport requests</p>
                </div>
                <button class="edit-btn" id="editBtn" type="button" onclick="toggleEdit()">✏️ Edit / تعديل</button>
            </div>

            <form method="POST" action="">
                <div class="card-body">
                    <div class="section-label">Personal Information / المعلومات الشخصية</div>

                    <div class="form-grid2">
                        <div class="field">
                            <label>Full Name / الاسم</label>
                            <input type="text" name="full_name" value="<?php echo htmlspecialchars($full_name); ?>" id="fname" disabled/>
                        </div>

                        <div class="field">
                            <label>Phone / الهاتف</label>
                            <input type="tel" name="phone" value="<?php echo htmlspecialchars($phone); ?>" id="phone" disabled/>
                        </div>

                        <div class="field">
                            <label>Email / البريد</label>
                            <input type="email" name="email" value="<?php echo htmlspecialchars($email); ?>" id="email" disabled/>
                        </div>

                        <div class="field">
                            <label>Date of Birth / تاريخ الميلاد</label>
                            <input type="date" name="dob" value="<?php echo htmlspecialchars($dob); ?>" id="dob" disabled/>
                        </div>
                    </div>

                    <div class="section-label">Mobility Requirements / متطلبات التنقل</div>

                    <div class="mobility-grid">
                        <div class="mobility-option <?php echo $wheelchair ? 'checked' : ''; ?> disabled" id="wheelchairOpt" onclick="toggleMobility(this)">
                            <input class="hidden-checkbox" type="checkbox" name="wheelchair" id="wheelchair" <?php echo $wheelchair ? 'checked' : ''; ?>>
                            <div class="mobility-icon">♿</div>
                            <div class="mobility-label">Wheelchair</div>
                            <div class="mobility-label-ar">كرسي متحرك</div>
                            <div class="mobility-check"><?php echo $wheelchair ? '✓' : ''; ?></div>
                        </div>

                        <div class="mobility-option <?php echo $oxygen ? 'checked' : ''; ?> disabled" id="oxygenOpt" onclick="toggleMobility(this)">
                            <input class="hidden-checkbox" type="checkbox" name="oxygen" id="oxygen" <?php echo $oxygen ? 'checked' : ''; ?>>
                            <div class="mobility-icon">🫁</div>
                            <div class="mobility-label">Oxygen Support</div>
                            <div class="mobility-label-ar">دعم أكسجين</div>
                            <div class="mobility-check"><?php echo $oxygen ? '✓' : ''; ?></div>
                        </div>

                        <div class="mobility-option <?php echo $companion ? 'checked' : ''; ?> disabled" id="companionOpt" onclick="toggleMobility(this)">
                            <input class="hidden-checkbox" type="checkbox" name="companion" id="companion" <?php echo $companion ? 'checked' : ''; ?>>
                            <div class="mobility-icon">🤝</div>
                            <div class="mobility-label">Companion Seat</div>
                            <div class="mobility-label-ar">مقعد مرافق</div>
                            <div class="mobility-check"><?php echo $companion ? '✓' : ''; ?></div>
                        </div>
                    </div>

                    <div class="section-label">Additional Notes / ملاحظات إضافية</div>

                    <div class="field">
                        <textarea name="notes" id="notes" disabled><?php echo htmlspecialchars($notes); ?></textarea>
                    </div>
                </div>

                <div class="card-footer" id="formFooter" style="display:none;">
                    <button class="btn-cancel-form" type="button" onclick="cancelEdit()">Cancel / إلغاء</button>
                    <button class="btn-save" type="submit">Save Changes / حفظ التغييرات</button>
                </div>
            </form>
        </div>
    </div>
</main>

<div class="success-toast <?php echo $show_toast ? 'show' : ''; ?>" id="toast">
    ✅ Profile saved successfully! / تم حفظ الملف بنجاح
</div>

<script>
function getEl(id) {
  return document.getElementById(id);
}

function setInputsDisabled(disabled) {
  ['fname', 'phone', 'email', 'dob', 'notes'].forEach(id => {
    const el = getEl(id);
    if (el) el.disabled = disabled;
  });

  ['wheelchairOpt', 'oxygenOpt', 'companionOpt'].forEach(id => {
    const el = getEl(id);
    if (!el) return;
    if (disabled) {
      el.classList.add('disabled');
    } else {
      el.classList.remove('disabled');
    }
  });
}

function toggleEdit() {
  setInputsDisabled(false);

  const editBtn = getEl('editBtn');
  const formFooter = getEl('formFooter');

  if (editBtn) editBtn.style.display = 'none';
  if (formFooter) formFooter.style.display = 'flex';
}

function cancelEdit() {
  window.location.reload();
}

function toggleMobility(el) {
  if (!el || el.classList.contains('disabled')) return;

  el.classList.toggle('checked');

  const chk = el.querySelector('.mobility-check');
  const hiddenCb = el.querySelector('input[type="checkbox"]');

  if (hiddenCb) {
    hiddenCb.checked = el.classList.contains('checked');
  }

  if (chk) {
    chk.textContent = el.classList.contains('checked') ? '✓' : '';
  }
}

<?php if ($show_toast): ?>
setTimeout(() => {
  const toast = getEl('toast');
  if (toast) toast.classList.remove('show');
}, 3000);
<?php endif; ?>
</script>

</body>
</html>