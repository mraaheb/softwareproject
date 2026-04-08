<?php
require_once "../config.php";

if (!isset($_SESSION["user_id"]) || $_SESSION["role"] !== "patient") {
    header("Location: ../login/login.php");
    exit;
}

$user_id = $_SESSION["user_id"];
$full_name = $_SESSION["full_name"];

$message = "";
$message_type = "";
$success = false;

$profile = [
    "wheelchair" => 0,
    "oxygen" => 0,
    "companion" => 0,
    "notes" => ""
];

$profile_stmt = $conn->prepare("SELECT wheelchair, oxygen, companion, notes FROM profiles WHERE patient_id = ? LIMIT 1");
$profile_stmt->bind_param("i", $user_id);
$profile_stmt->execute();
$profile_result = $profile_stmt->get_result();

if ($profile_result->num_rows > 0) {
    $profile = $profile_result->fetch_assoc();
}

$pickup = "";
$destination = "";
$appt_date = "";
$appt_time = "";
$wheelchair = 0;
$oxygen = 0;
$companion = 0;
$notes = "";
$escort_required = 0;

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $pickup = trim($_POST["pickup"] ?? "");
    $destination = trim($_POST["destination"] ?? "");
    $appt_date = $_POST["appt_date"] ?? "";
    $appt_time = $_POST["appt_time"] ?? "";

    $wheelchair = isset($_POST["wheelchair"]) ? 1 : 0;
    $oxygen = isset($_POST["oxygen"]) ? 1 : 0;
    $companion = isset($_POST["companion"]) ? 1 : 0;
    $notes = trim($_POST["notes"] ?? "");
    $escort_required = isset($_POST["escort_required"]) ? 1 : 0;

    if (empty($pickup) || empty($destination) || empty($appt_date) || empty($appt_time)) {
        $message = "Please fill in all required fields. / الرجاء تعبئة جميع الحقول المطلوبة";
        $message_type = "error";
    } else {
        $appointment_datetime = $appt_date . " " . $appt_time . ":00";

        $insert_request = $conn->prepare("
            INSERT INTO requests (
                patient_id,
                pickup_location,
                destination,
                appointment_datetime,
                wheelchair,
                oxygen,
                companion,
                escort_required,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Requested')
        ");

        $insert_request->bind_param(
            "isssiiii",
            $user_id,
            $pickup,
            $destination,
            $appointment_datetime,
            $wheelchair,
            $oxygen,
            $companion,
            $escort_required
        );

        if ($insert_request->execute()) {
            $request_id = $insert_request->insert_id;

            $insert_status = $conn->prepare("
                INSERT INTO trip_status (request_id, status, updated_by)
                VALUES (?, 'Requested', ?)
            ");
            $insert_status->bind_param("ii", $request_id, $user_id);
            $insert_status->execute();

            $message = "Request submitted successfully. / تم إرسال الطلب بنجاح";
            $message_type = "success";
            $success = true;

            $pickup = "";
            $destination = "";
            $appt_date = "";
            $appt_time = "";
            $wheelchair = 0;
            $oxygen = 0;
            $companion = 0;
            $notes = "";
            $escort_required = 0;
        } else {
            $message = "Failed to submit request. / فشل إرسال الطلب";
            $message_type = "error";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Adud — Create Request</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="createReq.css">
    <style>
        .system-message {
            padding: 14px 16px;
            border-radius: 12px;
            margin-bottom: 18px;
            font-size: 14px;
            font-weight: 600;
        }
        .system-message.success {
            background: #e8f7ee;
            border: 1px solid #b7e3c9;
            color: #256b45;
        }
        .system-message.error {
            background: #fdecec;
            border: 1px solid #f3c2c2;
            color: #a33a3a;
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

        <a class="nav-item active" href="../createReq/createReq.php">
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

        <a class="nav-item" href="../medical-profile/medical-profile.php">
            <span class="icon">👤</span>
            <div class="nav-item-content">
                <span>Medical Profile</span>
                <span class="label-ar">الملف الطبي</span>
            </div>
        </a>
    </div>

    <div class="sidebar-footer">
        <div class="user-card">
            <div class="user-avatar">
                <?php echo htmlspecialchars(mb_substr($full_name, 0, 1)); ?>
            </div>
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
        <div class="topbar-text">
            <h1>New Transport Request / طلب نقل جديد</h1>
            <p>Fill in the details below to submit your transport request</p>
        </div>

        <button class="back-btn" onclick="location.href='../dashboard/dashboard.php'">
            ← Back / رجوع
        </button>
    </div>

    <?php if (!empty($message)): ?>
        <div class="system-message <?php echo $message_type; ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <?php if ($profile_result->num_rows > 0): ?>
        <div class="autofill-banner" id="autofillBanner">
            <span class="icon">✨</span>
            <p id="autofillText">
                <strong>Medical profile found!</strong>
                We can auto-fill your mobility requirements. / تم العثور على ملفك الطبي
            </p>
            <button class="apply-btn" type="button" id="applyBtn" onclick="applyProfile()">Apply / تطبيق</button>
        </div>
    <?php endif; ?>

    <form method="POST" action="">
        <div class="form-card">
            <div class="form-card-header">
                <div class="step-icon">📍</div>
                <div>
                    <h2>Trip Details / تفاصيل الرحلة</h2>
                    <p>Enter pickup, destination, date and time</p>
                </div>
            </div>

            <div class="form-body">
                <div class="form-grid">
                    <div class="field">
                        <label>Pickup Location <span>/ موقع الاستلام</span></label>
                        <input type="text" name="pickup" placeholder="e.g. King Fahad District, Riyadh" id="pickup"
                               value="<?php echo htmlspecialchars($pickup); ?>"/>
                    </div>

                    <div class="field">
                        <label>Destination <span>/ الوجهة</span></label>
                        <input type="text" name="destination" placeholder="e.g. King Saud Medical City" id="destination"
                               value="<?php echo htmlspecialchars($destination); ?>"/>
                    </div>

                    <div class="field">
                        <label>Appointment Date <span>/ تاريخ الموعد</span></label>
                        <input type="date" name="appt_date" id="apptDate"
                               value="<?php echo htmlspecialchars($appt_date); ?>"/>
                    </div>

                    <div class="field">
                        <label>Appointment Time <span>/ وقت الموعد</span></label>
                        <input type="time" name="appt_time" id="apptTime"
                               value="<?php echo htmlspecialchars($appt_time); ?>"/>
                    </div>
                </div>

                <div class="section-divider">
                    <span>♿ Mobility Requirements / متطلبات التنقل</span>
                </div>

                <div class="mobility-grid">
                    <div class="mobility-option <?php echo $wheelchair ? 'checked' : ''; ?>" onclick="toggleMobility(this)" id="wheelchairOpt">
                        <input type="checkbox" name="wheelchair" id="wheelchair" <?php echo $wheelchair ? 'checked' : ''; ?>/>
                        <div class="mobility-icon">♿</div>
                        <div class="mobility-label">Wheelchair</div>
                        <div class="mobility-label-ar">كرسي متحرك</div>
                        <div class="mobility-check">✓</div>
                    </div>

                    <div class="mobility-option <?php echo $oxygen ? 'checked' : ''; ?>" onclick="toggleMobility(this)" id="oxygenOpt">
                        <input type="checkbox" name="oxygen" id="oxygen" <?php echo $oxygen ? 'checked' : ''; ?>/>
                        <div class="mobility-icon">🫁</div>
                        <div class="mobility-label">Oxygen Support</div>
                        <div class="mobility-label-ar">دعم أكسجين</div>
                        <div class="mobility-check">✓</div>
                    </div>

                    <div class="mobility-option <?php echo $companion ? 'checked' : ''; ?>" onclick="toggleMobility(this)" id="companionOpt">
                        <input type="checkbox" name="companion" id="companion" <?php echo $companion ? 'checked' : ''; ?>/>
                        <div class="mobility-icon">🤝</div>
                        <div class="mobility-label">Companion Seat</div>
                        <div class="mobility-label-ar">مقعد مرافق</div>
                        <div class="mobility-check">✓</div>
                    </div>
                </div>

                <div class="field full-field">
                    <label>Additional Notes <span>/ ملاحظات إضافية (اختياري)</span></label>
                    <textarea name="notes" id="notes" placeholder="Any additional mobility or medical notes..."><?php echo htmlspecialchars($notes); ?></textarea>
                </div>

                <div class="section-divider">
                    <span>🏥 Hospital Escort / مرافق مستشفى</span>
                </div>

                <div class="escort-banner <?php echo $escort_required ? 'active' : ''; ?>" onclick="toggleEscort(this)" id="escortBanner">
                    <input type="checkbox" name="escort_required" id="escort_required" style="display:none;" <?php echo $escort_required ? 'checked' : ''; ?>>
                    <div class="escort-checkbox" id="escortCheck"><?php echo $escort_required ? '✓' : ''; ?></div>
                    <div class="escort-text">
                        <h4>Request Hospital Escort Service / طلب خدمة المرافق</h4>
                        <p>
                            A registered escort will meet the patient at the hospital entrance and guide them to the clinic.
                            / سيلتقي مرافق مسجل بالمريض عند مدخل المستشفى
                        </p>
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <button class="btn-cancel-form" type="button" onclick="location.href='../dashboard/dashboard.php'">
                    Cancel / إلغاء
                </button>
                <button class="btn-submit" type="submit">
                    Submit Request / إرسال الطلب ✓
                </button>
            </div>
        </div>
    </form>
</main>

<div class="modal-overlay <?php echo $success ? 'show' : ''; ?>" id="successModal">
    <div class="modal-box">
        <div class="modal-icon">✅</div>
        <div class="modal-title" id="modalTitle">Request Submitted! / تم إرسال الطلب</div>
        <p class="modal-sub" id="modalSub">
            Your transport request has been submitted successfully with status <strong>Requested</strong>.
            A service provider will review it shortly.
        </p>
        <button class="modal-btn" onclick="goAfterSave()">
            Go to Dashboard / الرئيسية
        </button>
    </div>
</div>

<script>
    const profileData = {
        wheelchair: <?php echo !empty($profile["wheelchair"]) ? 'true' : 'false'; ?>,
        oxygen: <?php echo !empty($profile["oxygen"]) ? 'true' : 'false'; ?>,
        companion: <?php echo !empty($profile["companion"]) ? 'true' : 'false'; ?>,
        notes: <?php echo json_encode($profile["notes"] ?? ""); ?>
    };

    function qs(id) {
        return document.getElementById(id);
    }

    function toggleMobility(el) {
        if (!el) return;
        el.classList.toggle('checked');
        const cb = el.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = el.classList.contains('checked');
    }

    function toggleEscort(el) {
        if (!el) return;
        el.classList.toggle('active');

        const hiddenCb = qs('escort_required');
        const check = qs('escortCheck');

        if (hiddenCb) {
            hiddenCb.checked = el.classList.contains('active');
        }

        if (check) {
            check.textContent = el.classList.contains('active') ? '✓' : '';
        }
    }

    function applyProfile() {
        [
            ['wheelchair', 'wheelchairOpt'],
            ['oxygen', 'oxygenOpt'],
            ['companion', 'companionOpt']
        ].forEach(([key, id]) => {
            const el = qs(id);
            if (!el) return;

            const checkbox = el.querySelector('input[type="checkbox"]');
            const shouldBeChecked = !!profileData[key];

            if (shouldBeChecked) {
                el.classList.add('checked');
                if (checkbox) checkbox.checked = true;
            }
        });

        if (qs('notes') && !qs('notes').value.trim()) {
            qs('notes').value = profileData.notes || '';
        }

        if (qs('autofillText')) {
            qs('autofillText').innerHTML =
                '<strong>✓ Profile applied!</strong> Your medical profile has been applied successfully.';
        }

        if (qs('applyBtn')) {
            qs('applyBtn').style.display = 'none';
        }
    }

    function goAfterSave() {
        window.location.href = '../dashboard/dashboard.php';
    }
</script>
</body>
</html>
