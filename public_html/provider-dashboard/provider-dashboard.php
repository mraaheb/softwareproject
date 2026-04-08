<?php
require_once "../config.php";

if (!isset($_SESSION["user_id"]) || $_SESSION["role"] !== "provider") {
    header("Location: ../login/login.php");
    exit;
}

$provider_id = $_SESSION["user_id"];
$provider_display_name = $_SESSION["full_name"] ?? "Service Provider";

$provider_stmt = $conn->prepare("SELECT full_name, provider_name, email, is_verified FROM service_providers WHERE id = ? LIMIT 1");
$provider_stmt->bind_param("i", $provider_id);
$provider_stmt->execute();
$provider_result = $provider_stmt->get_result();

if ($provider_result->num_rows !== 1) {
    header("Location: ../logout.php");
    exit;
}

$provider = $provider_result->fetch_assoc();
$provider_name = !empty($provider["provider_name"]) ? $provider["provider_name"] : $provider["full_name"];
$_SESSION["full_name"] = $provider_name;

$toast_message = "";
$toast_type = "success";

function add_trip_history_if_final($conn, $request_id, $final_status) {
    if (!in_array($final_status, ['Completed', 'Cancelled', 'Rejected'])) {
        return;
    }

    $check_stmt = $conn->prepare("SELECT id FROM trip_history WHERE request_id = ? LIMIT 1");
    $check_stmt->bind_param("i", $request_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows > 0) {
        $update_stmt = $conn->prepare("UPDATE trip_history SET final_status = ?, closed_at = NOW() WHERE request_id = ?");
        $update_stmt->bind_param("si", $final_status, $request_id);
        $update_stmt->execute();
    } else {
        $insert_stmt = $conn->prepare("INSERT INTO trip_history (request_id, final_status, summary) VALUES (?, ?, ?)");
        $summary = "Finalized by service provider";
        $insert_stmt->bind_param("iss", $request_id, $final_status, $summary);
        $insert_stmt->execute();
    }
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $action = $_POST["action"] ?? "";

    if ($action === "add_guardian") {
        $guardian_name = trim($_POST["guardian_name"] ?? "");
        $guardian_phone = trim($_POST["guardian_phone"] ?? "");
        $guardian_notes = trim($_POST["guardian_notes"] ?? "");

        if (!empty($guardian_name) && !empty($guardian_phone)) {
            $insert_guardian = $conn->prepare("
                INSERT INTO escorts (provider_id, full_name, phone, notes, is_available)
                VALUES (?, ?, ?, ?, 1)
            ");
            $insert_guardian->bind_param("isss", $provider_id, $guardian_name, $guardian_phone, $guardian_notes);
            $insert_guardian->execute();

            $toast_message = "Guardian added successfully / تم إضافة المرافق بنجاح";
            $toast_type = "success";
        } else {
            $toast_message = "Please enter guardian name and phone / الرجاء إدخال اسم المرافق ورقم الجوال";
            $toast_type = "error";
        }
    }

    if ($action === "assign_guardian") {
        $request_id = (int)($_POST["request_id"] ?? 0);
        $escort_id = !empty($_POST["escort_id"]) ? (int)$_POST["escort_id"] : null;

        $check_request = $conn->prepare("SELECT id, status FROM requests WHERE id = ? LIMIT 1");
        $check_request->bind_param("i", $request_id);
        $check_request->execute();
        $request_result = $check_request->get_result();

        if ($request_result->num_rows === 1) {
            if ($escort_id === null) {
                $update_req = $conn->prepare("UPDATE requests SET escort_id = NULL WHERE id = ?");
                $update_req->bind_param("i", $request_id);
                $update_req->execute();
            } else {
                $check_escort = $conn->prepare("SELECT id FROM escorts WHERE id = ? AND provider_id = ? LIMIT 1");
                $check_escort->bind_param("ii", $escort_id, $provider_id);
                $check_escort->execute();
                $escort_result = $check_escort->get_result();

                if ($escort_result->num_rows === 1) {
                    $update_req = $conn->prepare("UPDATE requests SET escort_id = ? WHERE id = ?");
                    $update_req->bind_param("ii", $escort_id, $request_id);
                    $update_req->execute();
                }
            }

            $toast_message = "Guardian assigned / تم تعيين المرافق";
            $toast_type = "success";
        }
    }

    if ($action === "accept_request") {
        $request_id = (int)($_POST["request_id"] ?? 0);

        $check_stmt = $conn->prepare("SELECT id, status FROM requests WHERE id = ? LIMIT 1");
        $check_stmt->bind_param("i", $request_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();

        if ($check_result->num_rows === 1) {
            $req = $check_result->fetch_assoc();

            if ($req["status"] === "Requested") {
                $update_stmt = $conn->prepare("
                    UPDATE requests
                    SET status = 'Assigned', provider_id = ?
                    WHERE id = ?
                ");
                $update_stmt->bind_param("ii", $provider_id, $request_id);
                $update_stmt->execute();

                $status_stmt = $conn->prepare("
                    INSERT INTO trip_status (request_id, status, updated_by)
                    VALUES (?, 'Assigned', ?)
                ");
                $status_stmt->bind_param("ii", $request_id, $provider_id);
                $status_stmt->execute();

                $toast_message = "Request accepted / تم قبول الطلب";
                $toast_type = "success";
            }
        }
    }

    if ($action === "reject_request") {
        $request_id = (int)($_POST["request_id"] ?? 0);

        $check_stmt = $conn->prepare("SELECT id, status FROM requests WHERE id = ? LIMIT 1");
        $check_stmt->bind_param("i", $request_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();

        if ($check_result->num_rows === 1) {
            $req = $check_result->fetch_assoc();

            if ($req["status"] === "Requested") {
                $update_stmt = $conn->prepare("
                    UPDATE requests
                    SET status = 'Rejected', provider_id = ?
                    WHERE id = ?
                ");
                $update_stmt->bind_param("ii", $provider_id, $request_id);
                $update_stmt->execute();

                $status_stmt = $conn->prepare("
                    INSERT INTO trip_status (request_id, status, updated_by)
                    VALUES (?, 'Rejected', ?)
                ");
                $status_stmt->bind_param("ii", $request_id, $provider_id);
                $status_stmt->execute();

                add_trip_history_if_final($conn, $request_id, 'Rejected');

                $toast_message = "Request rejected / تم رفض الطلب";
                $toast_type = "error";
            }
        }
    }

    if ($action === "update_status") {
        $request_id = (int)($_POST["request_id"] ?? 0);
        $new_status = trim($_POST["new_status"] ?? "");

        $allowed_statuses = ['Assigned', 'Picked Up', 'Arrived', 'Completed', 'Cancelled'];

        if (in_array($new_status, $allowed_statuses, true)) {
            $check_stmt = $conn->prepare("
                SELECT id, status, provider_id
                FROM requests
                WHERE id = ? AND provider_id = ?
                LIMIT 1
            ");
            $check_stmt->bind_param("ii", $request_id, $provider_id);
            $check_stmt->execute();
            $check_result = $check_stmt->get_result();

            if ($check_result->num_rows === 1) {
                $req = $check_result->fetch_assoc();
                $current_status = $req["status"];

                $allowed_order = ['Assigned', 'Picked Up', 'Arrived', 'Completed', 'Cancelled'];
                $current_index = array_search($current_status, $allowed_order, true);
                $next_index = array_search($new_status, $allowed_order, true);

                $valid_transition = false;

                if ($new_status === 'Cancelled') {
                    $valid_transition = in_array($current_status, ['Assigned', 'Picked Up', 'Arrived'], true);
                } elseif ($current_index !== false && $next_index !== false && $next_index >= $current_index) {
                    $valid_transition = true;
                }

                if ($valid_transition) {
                    $update_stmt = $conn->prepare("UPDATE requests SET status = ? WHERE id = ?");
                    $update_stmt->bind_param("si", $new_status, $request_id);
                    $update_stmt->execute();

                    $status_stmt = $conn->prepare("
                        INSERT INTO trip_status (request_id, status, updated_by)
                        VALUES (?, ?, ?)
                    ");
                    $status_stmt->bind_param("isi", $request_id, $new_status, $provider_id);
                    $status_stmt->execute();

                    if (in_array($new_status, ['Completed', 'Cancelled'], true)) {
                        add_trip_history_if_final($conn, $request_id, $new_status);
                    }

                    $toast_message = "Status updated to {$new_status}";
                    $toast_type = "success";
                } else {
                    $toast_message = "Status must follow workflow order / يجب اتباع تسلسل الحالات";
                    $toast_type = "error";
                }
            }
        }
    }
}

// counts
$new_count = 0;
$active_count = 0;

$count_new_stmt = $conn->prepare("SELECT COUNT(*) AS total FROM requests WHERE status = 'Requested'");
$count_new_stmt->execute();
$new_count_result = $count_new_stmt->get_result();
if ($new_count_result->num_rows > 0) {
    $new_count = (int)$new_count_result->fetch_assoc()["total"];
}

$count_active_stmt = $conn->prepare("
    SELECT COUNT(*) AS total
    FROM requests
    WHERE provider_id = ? AND status IN ('Assigned', 'Picked Up', 'Arrived')
");
$count_active_stmt->bind_param("i", $provider_id);
$count_active_stmt->execute();
$active_count_result = $count_active_stmt->get_result();
if ($active_count_result->num_rows > 0) {
    $active_count = (int)$active_count_result->fetch_assoc()["total"];
}

// escorts
$escorts = [];
$escort_stmt = $conn->prepare("
    SELECT id, full_name, phone, notes, is_available
    FROM escorts
    WHERE provider_id = ?
    ORDER BY id DESC
");
$escort_stmt->bind_param("i", $provider_id);
$escort_stmt->execute();
$escort_result = $escort_stmt->get_result();
while ($row = $escort_result->fetch_assoc()) {
    $escorts[] = $row;
}

// incoming requests
$incoming_requests = [];
$incoming_stmt = $conn->prepare("
    SELECT
        r.id,
        r.pickup_location,
        r.destination,
        r.appointment_datetime,
        r.wheelchair,
        r.oxygen,
        r.companion,
        r.escort_required,
        r.escort_id,
        r.status,
        pg.full_name AS patient_name,
        pg.phone AS patient_phone
    FROM requests r
    INNER JOIN patient_guardians pg ON pg.id = r.patient_id
    WHERE r.status = 'Requested'
    ORDER BY r.created_at DESC
");
$incoming_stmt->execute();
$incoming_result = $incoming_stmt->get_result();
while ($row = $incoming_result->fetch_assoc()) {
    $incoming_requests[] = $row;
}

// active trips
$active_trips = [];
$active_stmt = $conn->prepare("
    SELECT
        r.id,
        r.pickup_location,
        r.destination,
        r.appointment_datetime,
        r.status,
        r.escort_id,
        pg.full_name AS patient_name,
        e.full_name AS escort_name
    FROM requests r
    INNER JOIN patient_guardians pg ON pg.id = r.patient_id
    LEFT JOIN escorts e ON e.id = r.escort_id
    WHERE r.provider_id = ? AND r.status IN ('Assigned', 'Picked Up', 'Arrived')
    ORDER BY r.updated_at DESC
");
$active_stmt->bind_param("i", $provider_id);
$active_stmt->execute();
$active_result = $active_stmt->get_result();
while ($row = $active_result->fetch_assoc()) {
    $active_trips[] = $row;
}

function mobilityText($row) {
    $items = [];
    if (!empty($row["wheelchair"])) $items[] = "Wheelchair";
    if (!empty($row["oxygen"])) $items[] = "Oxygen";
    if (!empty($row["companion"])) $items[] = "Companion";
    return !empty($items) ? implode(", ", $items) : "None";
}

function statusPillClass($status) {
    switch ($status) {
        case "Assigned":
            return "pill-assigned";
        case "Picked Up":
        case "Arrived":
            return "pill-pickedup";
        case "Completed":
            return "pill-completed";
        case "Cancelled":
        case "Rejected":
            return "pill-cancelled";
        default:
            return "pill-assigned";
    }
}

$avatar_letter = mb_substr($provider_name, 0, 1);
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Adud — Service Provider Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="provider-dashboard.css">
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

    <div class="provider-badge">🔑 Service Provider</div>

    <div class="nav-section">
        <div class="nav-section-label">Main / الرئيسية</div>

        <a class="nav-item active" href="../provider-dashboard/provider-dashboard.php">
            <span class="icon">🏠</span>
            <div class="nav-item-content">
                <span>Provider Dashboard</span>
                <span class="label-ar">لوحة المزود</span>
            </div>
        </a>

        <a class="nav-item" href="../track-trip/provider-track-trip.php">
            <span class="icon">📍</span>
            <div class="nav-item-content">
                <span>Track Trip</span>
                <span class="label-ar">تتبع الرحلة</span>
            </div>
        </a>

        <a class="nav-item" href="../trip-history/provider-trip-history.php">
            <span class="icon">📋</span>
            <div class="nav-item-content">
                <span>Trip History</span>
                <span class="label-ar">سجل الرحلات</span>
            </div>
        </a>
    </div>

    <div class="sidebar-footer">
        <div class="user-card">
            <div class="user-avatar"><?php echo htmlspecialchars($avatar_letter); ?></div>
            <div class="user-info">
                <div class="name"><?php echo htmlspecialchars($provider_name); ?></div>
                <div class="role">Service Provider ✓</div>
            </div>
        </div>

        <button class="logout-btn" onclick="window.location.href='../logout.php'">
            🚪 Logout / تسجيل الخروج
        </button>
    </div>
</aside>

<main class="main">
    <div class="topbar">
        <div>
            <h1>Provider Dashboard / لوحة مزود الخدمة</h1>
            <p>Manage incoming requests and active trips</p>
        </div>
    </div>

    <div class="stats-row">
        <div class="stat-card">
            <div class="stat-top">
                <div class="stat-icon green">📥</div>
            </div>
            <div class="stat-value" id="count-new"><?php echo $new_count; ?></div>
            <div class="stat-label">New Requests</div>
            <div class="stat-label-ar">طلبات جديدة</div>
        </div>

        <div class="stat-card">
            <div class="stat-top">
                <div class="stat-icon gold">🚐</div>
            </div>
            <div class="stat-value" id="count-active"><?php echo $active_count; ?></div>
            <div class="stat-label">Active Trips</div>
            <div class="stat-label-ar">رحلات نشطة</div>
        </div>
    </div>

    <div class="panel">
        <div class="panel-header">
            <div>
                <h2>📥 Incoming Requests / الطلبات الواردة</h2>
                <p>Review and accept or reject transport requests</p>
            </div>
        </div>
        <div class="requests-list" id="requests-container">
            <?php if (empty($incoming_requests)): ?>
                <p>No incoming requests / لا توجد طلبات واردة</p>
            <?php else: ?>
                <?php foreach ($incoming_requests as $r): ?>
                    <?php $dt = strtotime($r["appointment_datetime"]); ?>
                    <div class="req-card new-req">
                        <div class="req-title">#<?php echo htmlspecialchars($r["id"]); ?> • <?php echo htmlspecialchars($r["pickup_location"]); ?> → <?php echo htmlspecialchars($r["destination"]); ?></div>
                        <div class="req-meta">
                            Patient: <?php echo htmlspecialchars($r["patient_name"]); ?><br>
                            Phone: <?php echo htmlspecialchars($r["patient_phone"]); ?><br>
                            Date: <?php echo date("Y-m-d", $dt); ?> — <?php echo date("H:i", $dt); ?><br>
                            Mobility: <?php echo htmlspecialchars(mobilityText($r)); ?><br>
                            Escort needed: <?php echo !empty($r["escort_required"]) ? 'Yes' : 'No'; ?>
                        </div>

                        <div style="margin-top: 12px;">
                            <label style="font-size:12px;font-weight:700;">Assign Guardian / تعيين مرافق</label>
                            <form method="POST" action="" style="margin-top:6px;">
                                <input type="hidden" name="action" value="assign_guardian">
                                <input type="hidden" name="request_id" value="<?php echo (int)$r["id"]; ?>">
                                <select
                                    name="escort_id"
                                    onchange="this.form.submit()"
                                    style="width:100%;padding:10px;border:1.5px solid #e3e8e5;border-radius:10px;font-family:inherit;"
                                >
                                    <option value="">None</option>
                                    <?php foreach ($escorts as $escort): ?>
                                        <option value="<?php echo (int)$escort["id"]; ?>" <?php echo ((int)($r["escort_id"] ?? 0) === (int)$escort["id"]) ? "selected" : ""; ?>>
                                            <?php echo htmlspecialchars($escort["full_name"]); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </form>
                        </div>

                        <div class="req-actions">
                            <form method="POST" action="">
                                <input type="hidden" name="action" value="reject_request">
                                <input type="hidden" name="request_id" value="<?php echo (int)$r["id"]; ?>">
                                <button class="btn-reject" type="submit">✗ Reject</button>
                            </form>

                            <form method="POST" action="">
                                <input type="hidden" name="action" value="accept_request">
                                <input type="hidden" name="request_id" value="<?php echo (int)$r["id"]; ?>">
                                <button class="btn-accept" type="submit">✓ Accept</button>
                            </form>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

    <div class="panel">
        <div class="panel-header">
            <div>
                <h2>🚐 Active Trips / الرحلات النشطة</h2>
                <p>Update trip status as they progress</p>
            </div>
        </div>
        <div id="active-trips-container">
            <?php if (empty($active_trips)): ?>
                <div class="requests-list">
                    <p>No active trips / لا توجد رحلات نشطة</p>
                </div>
            <?php else: ?>
                <div class="requests-list">
                    <?php foreach ($active_trips as $trip): ?>
                        <?php $dt = strtotime($trip["appointment_datetime"]); ?>
                        <div class="trip-row">
                            <div class="trip-route-sm"><?php echo htmlspecialchars($trip["pickup_location"]); ?> → <?php echo htmlspecialchars($trip["destination"]); ?></div>
                            <div class="trip-meta-sm">
                                #<?php echo htmlspecialchars($trip["id"]); ?> • <?php echo date("Y-m-d", $dt); ?> — <?php echo date("H:i", $dt); ?><br>
                                Patient: <?php echo htmlspecialchars($trip["patient_name"]); ?><br>
                                Guardian: <?php echo !empty($trip["escort_name"]) ? htmlspecialchars($trip["escort_name"]) : "None"; ?>
                            </div>

                            <div class="req-actions">
                                <span class="status-pill <?php echo statusPillClass($trip["status"]); ?>">
                                    <span class="dot"></span><?php echo htmlspecialchars($trip["status"]); ?>
                                </span>
                                <button class="btn-update" type="button" onclick="openUpdateModal(<?php echo (int)$trip['id']; ?>)">
                                    Update Status
                                </button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <div class="panel">
        <div class="panel-header">
            <div>
                <h2>🏥 Guardians / المرافقون</h2>
                <p>Add guardians and assign them to trips when needed</p>
            </div>
        </div>

        <div class="requests-list">
            <form method="POST" action="" class="guardian-form">
                <input type="hidden" name="action" value="add_guardian">
                <input id="guardianName" name="guardian_name" type="text" placeholder="Guardian Name / اسم المرافق">
                <input id="guardianPhone" name="guardian_phone" type="text" placeholder="Phone / الجوال">
                <input id="guardianNotes" name="guardian_notes" type="text" placeholder="Notes / ملاحظات">
                <button class="btn-accept" type="submit">+ Add Guardian</button>
            </form>

            <div id="guardians-container">
                <?php if (empty($escorts)): ?>
                    <p>No guardians yet / لا يوجد مرافقون بعد</p>
                <?php else: ?>
                    <?php foreach ($escorts as $escort): ?>
                        <div class="guardian-list-item">
                            <div class="guardian-title"><?php echo htmlspecialchars($escort["full_name"]); ?></div>
                            <div class="guardian-meta">
                                <?php echo htmlspecialchars($escort["phone"]); ?> •
                                <?php echo !empty($escort["notes"]) ? htmlspecialchars($escort["notes"]) . " • " : ""; ?>
                                <?php echo !empty($escort["is_available"]) ? "Available" : "Unavailable"; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>
</main>

<div class="modal-overlay" id="updateModal">
    <div class="modal-box">
        <div class="modal-title">Update Trip Status / تحديث حالة الرحلة</div>
        <div class="modal-label">Select new status / اختر الحالة الجديدة:</div>

        <div class="status-options">
            <div class="status-option" onclick="selectStatus(this,'Assigned')">
                <input type="radio" name="st">
                <label>🟡 Assigned / تم التعيين</label>
            </div>

            <div class="status-option" onclick="selectStatus(this,'Picked Up')">
                <input type="radio" name="st">
                <label>🔵 Picked Up / تم الاستلام</label>
            </div>

            <div class="status-option" onclick="selectStatus(this,'Arrived')">
                <input type="radio" name="st">
                <label>🟢 Arrived / تم الوصول</label>
            </div>

            <div class="status-option" onclick="selectStatus(this,'Completed')">
                <input type="radio" name="st">
                <label>✅ Completed / مكتمل</label>
            </div>

            <div class="status-option" onclick="selectStatus(this,'Cancelled')">
                <input type="radio" name="st">
                <label>❌ Cancelled / ملغي</label>
            </div>
        </div>

        <div class="modal-actions">
            <button class="btn-modal-cancel" type="button" onclick="closeUpdateModal()">Cancel / إلغاء</button>
            <button class="btn-modal-save" type="button" onclick="saveStatus()">Save / حفظ</button>
        </div>
    </div>
</div>

<form id="statusForm" method="POST" action="" style="display:none;">
    <input type="hidden" name="action" value="update_status">
    <input type="hidden" name="request_id" id="status_request_id">
    <input type="hidden" name="new_status" id="status_new_value">
</form>

<div class="toast <?php echo !empty($toast_message) ? 'show ' . htmlspecialchars($toast_type) : ''; ?>" id="toast">
    <?php echo htmlspecialchars($toast_message); ?>
</div>

<script>
let currentEditingId = null;
let tempSelectedStatus = '';

function openUpdateModal(id) {
  currentEditingId = id;
  tempSelectedStatus = '';

  document.querySelectorAll('.status-option').forEach(option => {
    option.classList.remove('selected');
    const input = option.querySelector('input');
    if (input) input.checked = false;
  });

  document.getElementById('updateModal').classList.add('show');
}

function selectStatus(el, value) {
  document.querySelectorAll('.status-option').forEach(option => {
    option.classList.remove('selected');
    const input = option.querySelector('input');
    if (input) input.checked = false;
  });

  el.classList.add('selected');
  const radio = el.querySelector('input');
  if (radio) radio.checked = true;

  tempSelectedStatus = value;
}

function saveStatus() {
  if (!tempSelectedStatus) {
    alert('Please select a status / الرجاء اختيار الحالة');
    return;
  }

  document.getElementById('status_request_id').value = currentEditingId;
  document.getElementById('status_new_value').value = tempSelectedStatus;
  document.getElementById('statusForm').submit();
}

function closeUpdateModal() {
  document.getElementById('updateModal').classList.remove('show');
}

setTimeout(() => {
  const toast = document.getElementById('toast');
  if (toast) toast.classList.remove('show');
}, 3000);
</script>
</body>
</html>