
<?php
require_once "../config.php";

if (!isset($_SESSION["user_id"]) || $_SESSION["role"] !== "patient") {
    header("Location: ../login/login.php");
    exit;
}

$patient_id = $_SESSION["user_id"];
$patient_name = $_SESSION["full_name"] ?? "Patient";

$trips = [];

$stmt = $conn->prepare("
    SELECT
        r.id,
        r.pickup_location,
        r.destination,
        r.appointment_datetime,
        r.status,
        r.wheelchair,
        r.oxygen,
        r.companion,
        r.updated_at,
        r.created_at,
        sp.provider_name,
        sp.full_name AS provider_full_name,
        e.full_name AS escort_name,
        th.closed_at,
        th.summary
    FROM requests r
    LEFT JOIN service_providers sp ON sp.id = r.provider_id
    LEFT JOIN escorts e ON e.id = r.escort_id
    LEFT JOIN trip_history th ON th.request_id = r.id
    WHERE r.patient_id = ? AND r.status IN ('Completed', 'Cancelled', 'Rejected')
    ORDER BY COALESCE(th.closed_at, r.updated_at, r.created_at) DESC, r.id DESC
");
$stmt->bind_param("i", $patient_id);
$stmt->execute();
$result = $stmt->get_result();

while ($row = $result->fetch_assoc()) {
    $timeline = [];

    $timeline_stmt = $conn->prepare("
        SELECT status, created_at
        FROM trip_status
        WHERE request_id = ?
        ORDER BY id ASC
    ");
    $timeline_stmt->bind_param("i", $row["id"]);
    $timeline_stmt->execute();
    $timeline_result = $timeline_stmt->get_result();

    while ($tl = $timeline_result->fetch_assoc()) {
        $timeline[] = $tl;
    }

    $row["timeline"] = $timeline;
    $trips[] = $row;
}

function status_class($status) {
    return $status === 'Completed' ? 'pill-completed' : 'pill-cancelled';
}

function status_label($status) {
    if ($status === 'Completed') return 'Completed ✓';
    if ($status === 'Cancelled') return 'Cancelled ✗';
    if ($status === 'Rejected') return 'Rejected ✗';
    return $status;
}

function provider_display_name($trip) {
    if (!empty($trip["provider_name"])) return $trip["provider_name"];
    if (!empty($trip["provider_full_name"])) return $trip["provider_full_name"];
    return "—";
}

function fmt_date_only($datetime) {
    if (!$datetime) return '—';
    return date("Y-m-d", strtotime($datetime));
}

function fmt_time_only($datetime) {
    if (!$datetime) return '—';
    return date("H:i", strtotime($datetime));
}

function fmt_datetime($datetime) {
    if (!$datetime) return '—';
    return date("Y-m-d H:i", strtotime($datetime));
}

function mobility_list($trip) {
    $items = [];
    if (!empty($trip["wheelchair"])) $items[] = "Wheelchair";
    if (!empty($trip["oxygen"])) $items[] = "Oxygen";
    if (!empty($trip["companion"])) $items[] = "Companion";
    return $items;
}

$avatar_letter = mb_substr($patient_name, 0, 1);
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Adud — Trip History</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="trip-history.css">
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

        <a class="nav-item active" href="../trip-history/trip-history.php">
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
            <h1>Trip History / سجل الرحلات</h1>
            <p>View all completed and cancelled trips / عرض جميع الرحلات المكتملة والملغاة</p>
        </div>
    </div>

    <div class="filters-bar">
        <div class="search-box">
            <span>🔍</span>
            <input
                type="text"
                id="searchInput"
                placeholder="Search by destination... / ابحث بالوجهة"
                oninput="filterTrips()"
            />
        </div>

        <select class="filter-select" id="statusFilter" onchange="filterTrips()">
            <option value="">All Status / كل الحالات</option>
            <option value="completed">Completed / مكتمل</option>
            <option value="cancelled">Cancelled / ملغي</option>
            <option value="rejected">Rejected / مرفوض</option>
        </select>

        <input type="date" class="filter-select" id="dateFilter" onchange="filterTrips()"/>

        <button class="btn-clear" onclick="clearFilters()">Clear / مسح</button>
    </div>

    <div class="trips-list" id="tripsList">
        <?php foreach ($trips as $trip): ?>
            <?php $mobility = mobility_list($trip); ?>
            <div
                class="trip-card"
                data-id="<?php echo (int)$trip["id"]; ?>"
                data-pickup="<?php echo htmlspecialchars(strtolower($trip["pickup_location"] ?? "")); ?>"
                data-destination="<?php echo htmlspecialchars(strtolower($trip["destination"] ?? "")); ?>"
                data-status="<?php echo htmlspecialchars($trip["status"]); ?>"
                data-date="<?php echo htmlspecialchars(fmt_date_only($trip["appointment_datetime"])); ?>"
                onclick="showDetail(<?php echo (int)$trip['id']; ?>)"
            >
                <div class="trip-card-top">
                    <span class="trip-id">#<?php echo htmlspecialchars($trip["id"]); ?></span>
                    <span class="trip-date">📅 <?php echo htmlspecialchars(fmt_date_only($trip["appointment_datetime"])); ?> — <?php echo htmlspecialchars(fmt_time_only($trip["appointment_datetime"])); ?></span>
                </div>

                <div class="trip-route">
                    <span class="route-point">📍 <?php echo htmlspecialchars($trip["pickup_location"] ?: '—'); ?></span>
                    <span class="route-arrow">→</span>
                    <span class="route-point">🏥 <?php echo htmlspecialchars($trip["destination"] ?: '—'); ?></span>
                </div>

                <div class="trip-card-bottom">
                    <div class="trip-meta">
                        <?php foreach ($mobility as $item): ?>
                            <span class="meta-chip"><?php echo htmlspecialchars($item); ?></span>
                        <?php endforeach; ?>

                        <?php if (!empty($trip["escort_name"])): ?>
                            <span class="meta-chip">🏥 Escort</span>
                        <?php endif; ?>
                    </div>

                    <span class="status-pill <?php echo status_class($trip["status"]); ?>">
                        <span class="dot"></span>
                        <?php echo htmlspecialchars(status_label($trip["status"])); ?>
                    </span>
                </div>
            </div>
        <?php endforeach; ?>
    </div>

    <div class="empty-state" id="emptyState" style="display:none;">
        <div class="empty-icon">📭</div>
        <h3>No trips found / لا توجد رحلات</h3>
        <p>Try adjusting your filters / جرّب تغيير الفلاتر</p>
    </div>
</main>

<div class="modal-overlay" id="detailModal">
    <div class="modal-box">
        <div class="modal-header">
            <h3>Trip Details / تفاصيل الرحلة</h3>
            <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div id="modalContent"></div>
    </div>
</div>

<script>
const tripsData = <?php
echo json_encode(array_map(function($trip) {
    return [
        "id" => (int)$trip["id"],
        "pickup_location" => $trip["pickup_location"] ?? "",
        "destination" => $trip["destination"] ?? "",
        "appointment_date" => fmt_date_only($trip["appointment_datetime"]),
        "appointment_time" => fmt_time_only($trip["appointment_datetime"]),
        "provider_name" => provider_display_name($trip),
        "escort_name" => $trip["escort_name"] ?? "",
        "status" => $trip["status"] ?? "",
        "summary" => $trip["summary"] ?? "",
        "updated_at" => fmt_datetime($trip["updated_at"] ?? ""),
        "closed_at" => fmt_datetime($trip["closed_at"] ?? ""),
        "mobility" => mobility_list($trip),
        "timeline" => array_map(function($item) {
            return [
                "status" => $item["status"] ?? "",
                "time" => fmt_datetime($item["created_at"] ?? "")
            ];
        }, $trip["timeline"] ?? [])
    ];
}, $trips), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>;

function filterTrips() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const status = document.getElementById('statusFilter').value;
    const date = document.getElementById('dateFilter').value;

    const cards = document.querySelectorAll('.trip-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const pickup = card.dataset.pickup || '';
        const destination = card.dataset.destination || '';
        const cardStatus = card.dataset.status || '';
        const cardDate = card.dataset.date || '';

        const matchesQuery =
            !query ||
            pickup.includes(query) ||
            destination.includes(query);

        const matchesStatus =
            !status || cardStatus.toLowerCase() === status.toLowerCase();

        const matchesDate =
            !date || cardDate === date;

        const shouldShow = matchesQuery && matchesStatus && matchesDate;
        card.style.display = shouldShow ? '' : 'none';

        if (shouldShow) visibleCount++;
    });

    document.getElementById('emptyState').style.display = visibleCount === 0 ? 'block' : 'none';
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFilter').value = '';
    filterTrips();
}

function showDetail(id) {
    const trip = tripsData.find(item => item.id === id);
    if (!trip) return;

    const statusColor = trip.status === 'Completed' ? '#2F855A' : '#C53030';
    const summary = trip.summary || (trip.timeline.length ? trip.timeline[trip.timeline.length - 1].status : '—');

    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="modal-detail-row">
            <div>
                <div class="modal-label">Request ID</div>
                <div class="modal-val">#${trip.id}</div>
            </div>
        </div>

        <div class="modal-detail-row">
            <div>
                <div class="modal-label">Pickup</div>
                <div class="modal-val">${trip.pickup_location || '—'}</div>
            </div>
        </div>

        <div class="modal-detail-row">
            <div>
                <div class="modal-label">Destination</div>
                <div class="modal-val">${trip.destination || '—'}</div>
            </div>
        </div>

        <div class="modal-detail-row">
            <div>
                <div class="modal-label">Date & Time</div>
                <div class="modal-val">${trip.appointment_date || '—'} — ${trip.appointment_time || '—'}</div>
            </div>
        </div>

        <div class="modal-detail-row">
            <div>
                <div class="modal-label">Provider</div>
                <div class="modal-val">${trip.provider_name || '—'}</div>
            </div>
        </div>

        <div class="modal-detail-row">
            <div>
                <div class="modal-label">Escort</div>
                <div class="modal-val">${trip.escort_name || 'None'}</div>
            </div>
        </div>

        <div class="modal-detail-row">
            <div>
                <div class="modal-label">Mobility</div>
                <div class="modal-val">${trip.mobility.length ? trip.mobility.join(', ') : '—'}</div>
            </div>
        </div>

        <div class="modal-detail-row">
            <div>
                <div class="modal-label">Status</div>
                <div class="modal-val" style="color:${statusColor}">
                    ${trip.status || '—'}
                </div>
            </div>
        </div>

        <div class="modal-detail-row">
            <div>
                <div class="modal-label">Summary</div>
                <div class="modal-val">${summary}</div>
            </div>
        </div>

        <div class="modal-detail-row">
            <div>
                <div class="modal-label">Closed At</div>
                <div class="modal-val">${trip.closed_at || '—'}</div>
            </div>
        </div>
    `;

    document.getElementById('detailModal').classList.add('show');
}

function closeModal() {
    document.getElementById('detailModal').classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
    filterTrips();
});
</script>
</body>
</html>