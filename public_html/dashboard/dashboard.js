function navigateTo(url) {
  if (url) window.location.href = url;
}

function handleLogout() {
  AdudStore.logout();
  window.location.href = '../login/login.html';
}

function getRequests() {
  return AdudStore.getRequests();
}

function saveRequests(requests) {
  AdudStore.saveRequests(requests);
}

function isActive(status) {
  return ['Requested', 'Assigned', 'Picked Up', 'Arrived'].includes(status);
}

function getStatusClass(status) {
  switch (status) {
    case 'Completed':
      return 'pill-completed';
    case 'Cancelled':
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

function renderStats() {
  const requests = getRequests();

  const active = requests.filter(r => isActive(r.status)).length;
  const completed = requests.filter(r => r.status === 'Completed').length;
  const pending = requests.filter(r => r.status === 'Requested').length;
  const escorts = requests.filter(r => r.escort || r.guardianId).length;

  const activeCount = document.getElementById('activeCount');
  const completedCount = document.getElementById('completedCount');
  const pendingCount = document.getElementById('pendingCount');
  const escortCount = document.getElementById('escortCount');

  if (activeCount) activeCount.textContent = active;
  if (completedCount) completedCount.textContent = completed;
  if (pendingCount) pendingCount.textContent = pending;
  if (escortCount) escortCount.textContent = escorts;
}

function renderRequestsTable() {
  const tbody = document.getElementById('requests-body');
  const requests = getRequests()
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!tbody) return;

  if (!requests.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">No requests yet / لا توجد طلبات</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = requests.map(r => {
    let actions = `
      <button class="act-btn act-view" onclick="viewRequest('${r.id}')">View</button>
    `;

    if (r.status === 'Requested') {
      actions += `
        <button class="act-btn act-edit" onclick="editRequest('${r.id}')">Edit</button>
        <button class="act-btn act-delete" onclick="cancelRequest('${r.id}')">Cancel</button>
      `;
    }

    return `
      <tr>
        <td><strong>#${r.id}</strong></td>
        <td>${r.pickup}</td>
        <td>${r.dest}</td>
        <td>${r.date} — ${r.time}</td>
        <td>
          <span class="status-pill ${getStatusClass(r.status)}">
            <span class="dot"></span>${r.status}
          </span>
        </td>
        <td>
          <div class="action-btns">${actions}</div>
        </td>
      </tr>
    `;
  }).join('');
}

function viewRequest(id) {
  window.location.href = `../track-trip/track-trip.html?id=${encodeURIComponent(id)}`;
}

function editRequest(id) {
  window.location.href = `../createReq/createReq.html?id=${encodeURIComponent(id)}`;
}

function cancelRequest(id) {
  const requests = getRequests();
  const request = requests.find(r => r.id === id);

  if (!request) return;

  if (request.status !== 'Requested') {
    alert('You can only cancel before provider acceptance / يمكن الإلغاء فقط قبل قبول مزود الخدمة');
    return;
  }

  const ok = confirm('Cancel this request? / هل تريد إلغاء هذا الطلب؟');
  if (!ok) return;

  const now = AdudStore.nowIso();

  request.status = 'Cancelled';
  request.cancelledAt = now;
  request.updatedAt = now;

  if (!request.timeline) {
    request.timeline = [];
  }

  request.timeline.push({
    status: 'Cancelled',
    time: now,
    note: 'Cancelled by patient before provider acceptance'
  });

  saveRequests(requests);
  renderStats();
  renderRequestsTable();

  alert('Request cancelled successfully / تم إلغاء الطلب بنجاح');
}

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderRequestsTable();
});