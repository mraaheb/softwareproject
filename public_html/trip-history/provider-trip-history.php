
<?php
require_once "../config.php";

if (!isset($_SESSION["user_id"]) || $_SESSION["role"] !== "provider") {
    header("Location: ../login/login.php");
    exit;
}

$provider_id = $_SESSION["user_id"];
$provider_name = $_SESSION["full_name"] ?? "Provider";

$provider_stmt = $conn->prepare("SELECT full_name, provider_name FROM service_providers WHERE id = ? LIMIT 1");
$provider_stmt->bind_param("i", $provider_id);
$provider_stmt->execute();
$provider_result = $provider_stmt->get_result();

if ($provider_result->num_rows === 1) {
    $provider_row = $provider_result->fetch_assoc();
    $provider_name = !empty($provider_row["provider_name"]) ? $provider_row["provider_name"] : $provider_row["full_name"];
    $_SESSION["full_name"] = $provider_name;
}

$trips = [];

$stmt = $conn->prepare("
    SELECT
        r.id,
        r.pickup_location,
        r.destination,
        r.appointment_datetime,
        r.status,
        r.updated_at,
        r.created_at,
        pg.full_name AS patient_name,
        e.full_name AS escort_name,
        sp.provider_name,
        sp.full_name AS provider_full_name,
        th.closed_at,
        th.summary
    FROM requests r
    INNER JOIN patient_guardians pg ON pg.id = r.patient_id
    LEFT JOIN escorts e ON e.id = r.escort_id
    LEFT JOIN service_providers sp ON sp.id = r.provider_id
    LEFT JOIN trip_history th ON th.request_id = r.id
    WHERE r.provider_id = ? AND r.status IN ('Completed', 'Cancelled', 'Rejected')
    ORDER BY COALESCE(th.closed_at, r.updated_at, r.created_at) DESC, r.id DESC
");
$stmt->bind_param("i", $provider_id);
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

$avatar_letter = mb_substr($provider_name, 0, 1);
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Adud — Provider Trip History</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="provider-trip-history.css" />
</head>
<body>

<aside class="sidebar">
  <div class="sidebar-brand">
    <div class="logo-box">
      <img src="../../images/logo.png" alt="ADUD Logo" />
    </div>
    <div class="brand-text">
      <div class="ar">عضد</div>
      <div class="en">ADUD</div>
    </div>
  </div>

  <div class="provider-badge">🔑 Service Provider</div>

  <div class="nav-section">
    <div class="nav-section-label">Main / الرئيسية</div>

    <a class="nav-item" href="../provider-dashboard/provider-dashboard.php">
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
        <span class="label-ar">تفاصيل الرحلة</span>
      </div>
    </a>

    <a class="nav-item active" href="../trip-history/provider-trip-history.php">
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

    <button class="logout-btn" onclick="location.href='../logout.php'">
      🚪 Logout / تسجيل الخروج
    </button>
  </div>
</aside>

<main class="main">
  <div class="topbar">
    <div>
      <h1>Trip History / سجل الرحلات</h1>
      <p>Completed and cancelled trips handled by this provider</p>
    </div>
  </div>

  <div class="filters-bar">
    <div class="search-box">
      <span>🔍</span>
      <input
        type="text"
        id="searchInput"
        placeholder="Search by patient, pickup, or destination..."
        oninput="filterTrips()"
      />
    </div>

    <select class="filter-select" id="statusFilter" onchange="filterTrips()">
      <option value="">All Status</option>
      <option value="Completed">Completed</option>
      <option value="Cancelled">Cancelled</option>
      <option value="Rejected">Rejected</option>
    </select>

    <input class="filter-select" type="date" id="dateFilter" onchange="filterTrips()" />

    <button class="btn-clear" onclick="clearFilters()">Clear</button>
  </div>

  <div id="emptyState" class="empty-state" style="display:none;">
    <div class="empty-icon">📭</div>
    <h3>No provider trips found / لا توجد رحلات للمزود</h3>
    <p>Try changing the filters or complete more trips / تغيير الفلاتر أو إكمال المزيد من الرحلات</p>
  </div>

  <div id="tripsList" class="trips-list">
    <?php foreach ($trips as $trip): ?>
      <div
        class="trip-card"
        data-id="<?php echo (int)$trip["id"]; ?>"
        data-patient="<?php echo htmlspecialchars(strtolower($trip["patient_name"] ?? "")); ?>"
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
          <span class="route-point">🧑 <?php echo htmlspecialchars($trip["patient_name"] ?: 'Patient'); ?></span>
          <span class="route-arrow">•</span>
          <span class="route-point">📍 <?php echo htmlspecialchars($trip["pickup_location"] ?: '—'); ?></span>
          <span class="route-arrow">→</span>
          <span class="route-point">🏥 <?php echo htmlspecialchars($trip["destination"] ?: '—'); ?></span>
        </div>

        <div class="trip-card-bottom">
          <div class="trip-meta">
            <?php if (!empty($trip["escort_name"])): ?>
              <span class="meta-chip">🏥 Guardian Assigned</span>
            <?php endif; ?>
            <span class="meta-chip">Provider: <?php echo htmlspecialchars(provider_display_name($trip)); ?></span>
          </div>

          <span class="status-pill <?php echo status_class($trip["status"]); ?>">
            <span class="dot"></span>
            <?php echo htmlspecialchars(status_label($trip["status"])); ?>
          </span>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
</main>

<div class="modal-overlay" id="detailModal">
  <div class="modal-box">
    <div class="modal-header">
      <h3>Trip Details / تفاصيل الرحلة</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>

    <div id="modalContent" class="modal-content"></div>
  </div>
</div>

<script>
const tripsData = <?php
echo json_encode(array_map(function($trip) {
    return [
        "id" => (int)$trip["id"],
        "patient_name" => $trip["patient_name"] ?? "",
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
    const patient = card.dataset.patient || '';
    const pickup = card.dataset.pickup || '';
    const destination = card.dataset.destination || '';
    const cardStatus = card.dataset.status || '';
    const cardDate = card.dataset.date || '';

    const matchesQuery =
      !query ||
      patient.includes(query) ||
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

function buildTimelineHtml(trip) {
  const timeline = Array.isArray(trip.timeline) ? trip.timeline : [];

  if (!timeline.length) {
    return `
      <div class="timeline-box">
        <div class="timeline-title">Trip Timeline / الجدول الزمني</div>
        <div class="timeline-item">
          <div class="timeline-note">No timeline available / لا يوجد تسلسل زمني</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="timeline-box">
      <div class="timeline-title">Trip Timeline / الجدول الزمني</div>
      <div class="timeline-list">
        ${timeline.map(item => `
          <div class="timeline-item">
            <div class="timeline-status">${item.status || '—'}</div>
            <div class="timeline-time">${item.time || '—'}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function showDetail(id) {
  const trip = tripsData.find(item => item.id === id);
  if (!trip) return;

  const statusColor = trip.status === 'Completed' ? '#2F855A' : '#C53030';
  const summary = trip.summary || (trip.timeline.length ? trip.timeline[trip.timeline.length - 1].status : '—');

  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = `
    <div class="modal-detail-row">
      <div class="modal-label">Request ID</div>
      <div class="modal-val">#${trip.id}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Patient</div>
      <div class="modal-val">${trip.patient_name || '—'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Pickup</div>
      <div class="modal-val">${trip.pickup_location || '—'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Destination</div>
      <div class="modal-val">${trip.destination || '—'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Date & Time</div>
      <div class="modal-val">${trip.appointment_date || '—'} — ${trip.appointment_time || '—'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Provider</div>
      <div class="modal-val">${trip.provider_name || '—'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Guardian</div>
      <div class="modal-val">${trip.escort_name || 'None'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Status</div>
      <div class="modal-val" style="color:${statusColor}">
        ${trip.status || '—'}
      </div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Summary</div>
      <div class="modal-val">${summary}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Last Update</div>
      <div class="modal-val">${trip.updated_at || '—'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Closed At</div>
      <div class="modal-val">${trip.closed_at || '—'}</div>
    </div>

    ${buildTimelineHtml(trip)}
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