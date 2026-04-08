<?php
require_once "../config.php";

if (!isset($_SESSION["user_id"]) || $_SESSION["role"] !== "patient") {
    header("Location: ../login/login.php");
    exit;
}

$patient_id = $_SESSION["user_id"];
$patient_name = $_SESSION["full_name"] ?? "Patient";

$request_id = (int)($_GET["id"] ?? 0);
$request = null;
$timeline = [];

if ($request_id > 0) {
    $stmt = $conn->prepare("
        SELECT
            r.id,
            r.pickup_location,
            r.destination,
            r.appointment_datetime,
            r.status,
            r.escort_required,
            r.wheelchair,
            r.oxygen,
            r.companion,
            sp.provider_name,
            sp.full_name AS provider_full_name,
            e.full_name AS escort_name,
            e.phone AS escort_phone,
            e.notes AS escort_notes
        FROM requests r
        LEFT JOIN service_providers sp ON sp.id = r.provider_id
        LEFT JOIN escorts e ON e.id = r.escort_id
        WHERE r.id = ? AND r.patient_id = ?
        LIMIT 1
    ");
    $stmt->bind_param("ii", $request_id, $patient_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $request = $result->fetch_assoc();
    }
}

if (!$request) {
    $stmt = $conn->prepare("
        SELECT
            r.id,
            r.pickup_location,
            r.destination,
            r.appointment_datetime,
            r.status,
            r.escort_required,
            r.wheelchair,
            r.oxygen,
            r.companion,
            sp.provider_name,
            sp.full_name AS provider_full_name,
            e.full_name AS escort_name,
            e.phone AS escort_phone,
            e.notes AS escort_notes
        FROM requests r
        LEFT JOIN service_providers sp ON sp.id = r.provider_id
        LEFT JOIN escorts e ON e.id = r.escort_id
        WHERE r.patient_id = ?
        ORDER BY r.updated_at DESC, r.id DESC
        LIMIT 1
    ");
    $stmt->bind_param("i", $patient_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $request = $result->fetch_assoc();
        $request_id = (int)$request["id"];
    }
}

if ($request) {
    $timeline_stmt = $conn->prepare("
        SELECT status, created_at
        FROM trip_status
        WHERE request_id = ?
        ORDER BY id ASC
    ");
    $timeline_stmt->bind_param("i", $request_id);
    $timeline_stmt->execute();
    $timeline_result = $timeline_stmt->get_result();

    while ($row = $timeline_result->fetch_assoc()) {
        $timeline[] = $row;
    }
}

function getStatusArabic($status) {
    switch ($status) {
        case 'Requested': return 'تم الطلب';
        case 'Assigned': return 'تم التعيين';
        case 'Picked Up': return 'تم الاستلام';
        case 'Arrived': return 'تم الوصول';
        case 'Completed': return 'مكتمل';
        case 'Cancelled': return 'ملغي';
        case 'Rejected': return 'مرفوض';
        default: return $status ?: '—';
    }
}

function getStatusNoteFallback($status) {
    switch ($status) {
        case 'Requested':
            return 'Transport request submitted successfully';
        case 'Assigned':
            return 'Driver is assigned and preparing for pickup';
        case 'Picked Up':
            return 'Patient has been picked up';
        case 'Arrived':
            return 'Patient arrived at destination';
        case 'Completed':
            return 'Trip completed successfully';
        case 'Cancelled':
            return 'Trip has been cancelled';
        case 'Rejected':
            return 'Trip has been rejected';
        default:
            return 'Status updated';
    }
}

function getStatusThemeClass($status) {
    if ($status === 'Completed') return 'completed';
    if ($status === 'Cancelled' || $status === 'Rejected') return 'cancelled';
    return 'assigned';
}

function formatTimeValue($datetime) {
    if (!$datetime) return '—';
    return date("Y-m-d — H:i", strtotime($datetime));
}

function formatTimelineTime($datetime) {
    if (!$datetime) return '⏳ Pending';
    return date("Y-m-d H:i", strtotime($datetime));
}

function mobilityItems($request) {
    $items = [];
    if (!empty($request["wheelchair"])) $items[] = "♿ Wheelchair";
    if (!empty($request["oxygen"])) $items[] = "🫁 Oxygen";
    if (!empty($request["companion"])) $items[] = "🤝 Companion";
    return $items;
}

$avatar_letter = mb_substr($patient_name, 0, 1);
$current_status = $request["status"] ?? "";
$current_status_note = !empty($timeline) ? getStatusNoteFallback($current_status) : "Current workflow status";
$mobility = $request ? mobilityItems($request) : [];

$provider_name_display = "Pending assignment";
if (!empty($request["provider_name"])) {
    $provider_name_display = $request["provider_name"];
} elseif (!empty($request["provider_full_name"])) {
    $provider_name_display = $request["provider_full_name"];
}

$timeline_map = [];
foreach ($timeline as $item) {
    $timeline_map[$item["status"]] = $item;
}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Adud — Track Trip</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="track-trip.css">
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

        <a class="nav-item active" href="../track-trip/track-trip.php<?php echo $request_id ? '?id=' . urlencode((string)$request_id) : ''; ?>">
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
            <div class="user-avatar"><?php echo htmlspecialchars($avatar_letter); ?></div>
            <div class="user-info">
                <div class="name"><?php echo htmlspecialchars($patient_name); ?></div>
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
            <h1>Track Trip / تتبع الرحلة</h1>
            <p>Live status updates for your active transport request</p>
        </div>

        <button class="back-btn" onclick="location.href='../dashboard/dashboard.php'">
            ← Back / رجوع
        </button>
    </div>

    <?php if (!$request): ?>
        <div class="info-card">
            <div class="card-body">
                <p>No trip found / لا توجد رحلة</p>
            </div>
        </div>
    <?php else: ?>
    <div class="track-grid">
        <section>
            <div class="info-card">
                <div class="card-header">
                    <h2>Request Details / تفاصيل الطلب</h2>
                    <p>Active transport request</p>
                </div>

                <div class="card-body">
                    <div class="req-id"># Request <?php echo htmlspecialchars($request["id"]); ?></div>

                    <div class="detail-row">
                        <div class="detail-icon">📍</div>
                        <div class="detail-info">
                            <div class="label">Pickup / الاستلام</div>
                            <div class="value"><?php echo htmlspecialchars($request["pickup_location"] ?: "—"); ?></div>
                        </div>
                    </div>

                    <div class="detail-row">
                        <div class="detail-icon">🏥</div>
                        <div class="detail-info">
                            <div class="label">Destination / الوجهة</div>
                            <div class="value"><?php echo htmlspecialchars($request["destination"] ?: "—"); ?></div>
                        </div>
                    </div>

                    <div class="detail-row">
                        <div class="detail-icon">📅</div>
                        <div class="detail-info">
                            <div class="label">Date &amp; Time / التاريخ والوقت</div>
                            <div class="value"><?php echo htmlspecialchars(formatTimeValue($request["appointment_datetime"])); ?></div>
                        </div>
                    </div>

                    <div class="detail-row">
                        <div class="detail-icon">🚐</div>
                        <div class="detail-info">
                            <div class="label">Service Provider / مزود الخدمة</div>
                            <div class="value"><?php echo htmlspecialchars($provider_name_display); ?></div>
                        </div>
                    </div>

                    <div class="status-current <?php echo htmlspecialchars(getStatusThemeClass($current_status)); ?>">
                        <div class="status-dot"></div>
                        <div class="status-text">
                            <div class="main-st"><?php echo htmlspecialchars($current_status . " / " . getStatusArabic($current_status)); ?></div>
                            <div class="sub-st"><?php echo htmlspecialchars($current_status_note); ?></div>
                        </div>
                    </div>

                    <div class="mobility-section">
                        <div class="section-title">Mobility Requirements</div>
                        <div class="mobility-tags">
                            <?php if (empty($mobility)): ?>
                                <span class="mob-tag">No special requirements</span>
                            <?php else: ?>
                                <?php foreach ($mobility as $tag): ?>
                                    <span class="mob-tag"><?php echo htmlspecialchars($tag); ?></span>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                    </div>

                    <div class="escort-info">
                        <?php if (!empty($request["escort_name"])): ?>
                            <h4>🏥 Hospital Escort Assigned / تم تعيين مرافق</h4>
                            <div class="escort-row"><span>Name:</span> <?php echo htmlspecialchars($request["escort_name"]); ?></div>
                            <div class="escort-row"><span>Phone:</span> <?php echo htmlspecialchars($request["escort_phone"] ?: "—"); ?></div>
                            <div class="escort-row"><span>Notes:</span> <?php echo htmlspecialchars($request["escort_notes"] ?: "—"); ?></div>
                        <?php elseif (!empty($request["escort_required"])): ?>
                            <h4>🏥 Hospital Escort / المرافق</h4>
                            <div class="escort-row"><span>Status:</span> Waiting for assignment</div>
                        <?php else: ?>
                            <h4>🏥 Hospital Escort / المرافق</h4>
                            <div class="escort-row"><span>Status:</span> Not requested</div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </section>

        <section class="timeline-card">
            <div class="card-header">
                <h2>Trip Timeline / الجدول الزمني للرحلة</h2>
                <p>All status updates with timestamps</p>
            </div>

            <div class="timeline-body">
                <div class="timeline">
                    <?php
                    $workflow = ['Requested', 'Assigned', 'Picked Up', 'Arrived', 'Completed'];
                    foreach ($workflow as $status):
                        $item = $timeline_map[$status] ?? null;
                        $is_current = ($current_status === $status);
                        $is_done = ($item && !$is_current);
                        $is_pending = !$item;
                    ?>
                        <div class="timeline-item">
                            <div class="tl-dot <?php echo $is_done ? 'done' : ($is_current ? 'active' : 'pending'); ?>">
                                <?php echo $is_done ? '✓' : ($is_current ? '●' : ''); ?>
                            </div>
                            <div class="tl-content">
                                <div class="tl-title <?php echo $is_current ? 'active-text' : ($is_pending ? 'pending-text' : ''); ?>">
                                    <?php echo htmlspecialchars($status . ' / ' . getStatusArabic($status) . ($is_current ? ' ← Current' : '')); ?>
                                </div>
                                <div class="tl-sub"><?php echo htmlspecialchars(getStatusNoteFallback($status)); ?></div>
                                <div class="tl-time <?php echo $is_pending ? 'pending-time' : ''; ?>">
                                    <?php echo $item ? htmlspecialchars(formatTimelineTime($item["created_at"])) : '⏳ Pending'; ?>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>

                    <?php if (in_array($current_status, ['Cancelled', 'Rejected'], true)): ?>
                        <?php $cancel_item = $timeline_map[$current_status] ?? null; ?>
                        <div class="timeline-item">
                            <div class="tl-dot done">✕</div>
                            <div class="tl-content">
                                <div class="tl-title" style="color:#c53030;">
                                    <?php echo htmlspecialchars($current_status . ' / ' . getStatusArabic($current_status)); ?>
                                </div>
                                <div class="tl-sub"><?php echo htmlspecialchars(getStatusNoteFallback($current_status)); ?></div>
                                <div class="tl-time"><?php echo $cancel_item ? htmlspecialchars(formatTimelineTime($cancel_item["created_at"])) : '—'; ?></div>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </section>
    </div>
    <?php endif; ?>
</main>
</body>
</html>
