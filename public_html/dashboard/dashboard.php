
<?php
require_once "../config.php";

if (!isset($_SESSION["user_id"]) || $_SESSION["role"] !== "patient") {
    header("Location: ../login/login.php");
    exit;
}

$user_id = $_SESSION["user_id"];
$full_name = $_SESSION["full_name"];

$active_count = 0;
$completed_count = 0;
$pending_count = 0;
$escort_count = 0;

$requests = [];

$count_stmt = $conn->prepare("
    SELECT
        SUM(CASE WHEN status IN ('Requested', 'Assigned', 'Picked Up', 'Arrived') THEN 1 ELSE 0 END) AS active_count,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN status = 'Requested' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN escort_required = 1 THEN 1 ELSE 0 END) AS escort_count
    FROM requests
    WHERE patient_id = ?
");
$count_stmt->bind_param("i", $user_id);
$count_stmt->execute();
$count_result = $count_stmt->get_result();

if ($count_result->num_rows > 0) {
    $counts = $count_result->fetch_assoc();
    $active_count = (int)($counts["active_count"] ?? 0);
    $completed_count = (int)($counts["completed_count"] ?? 0);
    $pending_count = (int)($counts["pending_count"] ?? 0);
    $escort_count = (int)($counts["escort_count"] ?? 0);
}

$list_stmt = $conn->prepare("
    SELECT
        id,
        pickup_location,
        destination,
        appointment_datetime,
        status,
        escort_required,
        created_at
    FROM requests
    WHERE patient_id = ?
    ORDER BY created_at DESC
    LIMIT 10
");
$list_stmt->bind_param("i", $user_id);
$list_stmt->execute();
$list_result = $list_stmt->get_result();

while ($row = $list_result->fetch_assoc()) {
    $requests[] = $row;
}

function getStatusClass($status) {
    switch ($status) {
        case 'Completed':
            return 'pill-completed';
        case 'Cancelled':
        case 'Rejected':
            return 'pill-cancelled';
        case 'Requested':
            return 'pill-pending';
        case 'Assigned':
        case 'Picked Up':
        case 'Arrived':
            return 'pill-assigned';
        default:
            return 'pill-pending';
    }
}

function canModifyRequest($status) {
    return $status === 'Requested';
}

function getRestrictionMessage($status) {
    switch ($status) {
        case 'Assigned':
            return 'This request has already been accepted by a service provider, so editing and cancellation are no longer available.';
        case 'Picked Up':
            return 'This trip is already in progress, so editing and cancellation are no longer available.';
        case 'Arrived':
            return 'This trip has already reached the destination, so editing and cancellation are no longer available.';
        case 'Completed':
            return 'This trip is already completed, so editing and cancellation are no longer available.';
        case 'Cancelled':
            return 'This request has already been cancelled.';
        case 'Rejected':
            return 'This request has been rejected by the service provider.';
        default:
            return 'You can only edit or cancel a request while its status is Requested.';
    }
}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Adud — Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="dashboard.css">
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

            <a class="nav-item active" href="../dashboard/dashboard.php">
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

            <button class="logout-btn" onclick="window.location.href='../logout.php'">
                🚪 Logout / تسجيل الخروج
            </button>
        </div>
    </aside>

    <main class="main">
        <div class="topbar">
            <div class="topbar-title">
                <h1>Dashboard / لوحة التحكم</h1>
                <p>Welcome back! / أهلاً بك</p>
            </div>

            <div class="topbar-actions">
                <button class="btn-new" onclick="window.location.href='../createReq/createReq.php'">
                    ➕ New Request / طلب جديد
                </button>
            </div>
        </div>

        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-top">
                    <div class="stat-icon teal">🚐</div>
                    <span class="stat-badge badge-active">Active</span>
                </div>
                <div class="stat-value" id="activeCount"><?php echo $active_count; ?></div>
                <div class="stat-label">Active Requests</div>
                <div class="stat-label-ar">الطلبات النشطة</div>
            </div>

            <div class="stat-card">
                <div class="stat-top">
                    <div class="stat-icon green">✅</div>
                    <span class="stat-badge badge-done">Done</span>
                </div>
                <div class="stat-value" id="completedCount"><?php echo $completed_count; ?></div>
                <div class="stat-label">Completed Trips</div>
                <div class="stat-label-ar">الرحلات المكتملة</div>
            </div>

            <div class="stat-card">
                <div class="stat-top">
                    <div class="stat-icon gold">⏳</div>
                    <span class="stat-badge badge-pending">Pending</span>
                </div>
                <div class="stat-value" id="pendingCount"><?php echo $pending_count; ?></div>
                <div class="stat-label">Pending Requests</div>
                <div class="stat-label-ar">طلبات معلقة</div>
            </div>

            <div class="stat-card">
                <div class="stat-top">
                    <div class="stat-icon olive">🏥</div>
                </div>
                <div class="stat-value" id="escortCount"><?php echo $escort_count; ?></div>
                <div class="stat-label">Escort Assigned</div>
                <div class="stat-label-ar">مرافق مُعيّن</div>
            </div>
        </div>

        <div class="section-header">
            <div class="section-title">Recent Requests <span>/ آخر الطلبات</span></div>
            <a class="view-all" href="../trip-history/trip-history.php">View all / عرض الكل →</a>
        </div>

        <div class="requests-table">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Pickup / الاستلام</th>
                        <th>Destination / الوجهة</th>
                        <th>Date &amp; Time / التاريخ</th>
                        <th>Status / الحالة</th>
                        <th>Actions / إجراءات</th>
                    </tr>
                </thead>
                <tbody id="requests-body">
                    <?php if (empty($requests)): ?>
                        <tr>
                            <td colspan="6" style="text-align:center;">No requests yet / لا توجد طلبات</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($requests as $request): ?>
                            <?php
                                $request_id = $request["id"];
                                $pickup = $request["pickup_location"];
                                $destination = $request["destination"];
                                $status = $request["status"];
                                $appointment_datetime = strtotime($request["appointment_datetime"]);
                                $date_only = date("Y-m-d", $appointment_datetime);
                                $time_only = date("H:i", $appointment_datetime);
                                $can_modify = canModifyRequest($status);
                                $status_class = getStatusClass($status);
                                $restriction_message = getRestrictionMessage($status);
                            ?>
                            <tr>
                                <td><strong>#<?php echo htmlspecialchars($request_id); ?></strong></td>
                                <td><?php echo htmlspecialchars($pickup); ?></td>
                                <td><?php echo htmlspecialchars($destination); ?></td>
                                <td><?php echo htmlspecialchars($date_only . " — " . $time_only); ?></td>
                                <td>
                                    <span class="status-pill <?php echo $status_class; ?>">
                                        <span class="dot"></span><?php echo htmlspecialchars($status); ?>
                                    </span>
                                </td>
                                <td>
                                    <div class="action-btns">
                                        <button class="act-btn act-view"
                                                onclick="window.location.href='../track-trip/track-trip.php?id=<?php echo urlencode($request_id); ?>'">
                                            View
                                        </button>

                                        <?php if ($status === 'Cancelled' || $status === 'Rejected'): ?>
                                            <button class="act-btn act-disabled" type="button"
                                                    title="<?php echo htmlspecialchars($restriction_message); ?>">
                                                <?php echo $status === 'Rejected' ? 'Rejected' : 'Cancelled'; ?>
                                            </button>
                                        <?php elseif ($can_modify): ?>
                                            <button class="act-btn act-view"
                                                    onclick="window.location.href='../edit-request/edit-request.php?id=<?php echo urlencode($request_id); ?>'">
                                                Edit
                                            </button>
                                            <button class="act-btn act-delete"
                                                    onclick="confirmCancel(<?php echo (int)$request_id; ?>)">
                                                Cancel
                                            </button>
                                        <?php else: ?>
                                            <button class="act-btn act-disabled" type="button"
                                                    title="<?php echo htmlspecialchars($restriction_message); ?>">
                                                Edit
                                            </button>
                                            <button class="act-btn act-disabled" type="button"
                                                    title="<?php echo htmlspecialchars($restriction_message); ?>">
                                                Cancel
                                            </button>
                                        <?php endif; ?>
                                    </div>

                                    <?php if (!$can_modify && $status !== 'Cancelled' && $status !== 'Rejected'): ?>
                                        <div class="action-hint">Available only while status is Requested</div>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <div class="section-header">
            <div class="section-title">Quick Actions <span>/ إجراءات سريعة</span></div>
        </div>

        <div class="quick-grid">
            <div class="quick-card" onclick="window.location.href='../createReq/createReq.php'">
                <div class="quick-icon">🚐</div>
                <div>
                    <div class="quick-label">New Transport Request</div>
                    <div class="quick-label-ar">إنشاء طلب نقل جديد</div>
                </div>
            </div>

            <div class="quick-card" onclick="window.location.href='../medical-profile/medical-profile.php'">
                <div class="quick-icon">👤</div>
                <div>
                    <div class="quick-label">Update Medical Profile</div>
                    <div class="quick-label-ar">تحديث الملف الطبي</div>
                </div>
            </div>

            <div class="quick-card" onclick="window.location.href='../trip-history/trip-history.php'">
                <div class="quick-icon">📋</div>
                <div>
                    <div class="quick-label">View Trip History</div>
                    <div class="quick-label-ar">عرض سجل الرحلات</div>
                </div>
            </div>
        </div>
    </main>

    <form id="cancelForm" method="POST" action="../cancel-request/cancel-request.php" style="display:none;">
        <input type="hidden" name="request_id" id="cancel_request_id">
    </form>

    <script>
        function confirmCancel(requestId) {
            const ok = confirm('Cancel this request? / هل تريد إلغاء هذا الطلب؟');
            if (ok) {
                document.getElementById('cancel_request_id').value = requestId;
                document.getElementById('cancelForm').submit();
            }
        }
    </script>
</body>
</html>