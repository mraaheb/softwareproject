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

function canModifyRequest(request) {
  return request && request.status === 'Requested';
}

function getRestrictionMessage(status) {
  switch (status) {
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
    default:
      return 'You can only edit or cancel a request while its status is Requested.';
  }
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

function showToast(message, type = 'info') {
  let toast = document.getElementById('dashboardToast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dashboardToast';
    toast.className = 'dashboard-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `dashboard-toast show ${type}`;

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.className = 'dashboard-toast';
  }, 3200);
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
    const canModify = canModifyRequest(r);
    const restrictionMessage = getRestrictionMessage(r.status);

    let actions = `
      <button class="act-btn act-view" onclick="viewRequest('${r.id}')">
        View
      </button>
    `;

    if (r.status === 'Cancelled') {
      actions += `
        <button
          class="act-btn act-disabled"
          type="button"
          onclick="showRestriction('${encodeURIComponent(restrictionMessage)}')"
          title="${restrictionMessage}">
          Cancelled
        </button>
      `;
    } else if (canModify) {
      actions += `
        <button class="act-btn act-edit" onclick="editRequest('${r.id}')">
          Edit
        </button>
        <button class="act-btn act-delete" onclick="cancelRequest('${r.id}')">
          Cancel
        </button>
      `;
    } else {
      actions += `
        <button
          class="act-btn act-disabled"
          type="button"
          onclick="showRestriction('${encodeURIComponent(restrictionMessage)}')"
          title="${restrictionMessage}">
          Edit
        </button>
        <button
          class="act-btn act-disabled"
          type="button"
          onclick="showRestriction('${encodeURIComponent(restrictionMessage)}')"
          title="${restrictionMessage}">
          Cancel
        </button>
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
          ${!canModify && r.status !== 'Cancelled'
            ? `<div class="action-hint">Available only while status is Requested</div>`
            : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function showRestriction(encodedMessage) {
  const message = decodeURIComponent(encodedMessage);
  showToast(message, 'warning');
}

function viewRequest(id) {
  window.location.href = `../track-trip/track-trip.html?id=${encodeURIComponent(id)}`;
}

function editRequest(id) {
  const request = getRequests().find(r => r.id === id);

  if (!request) {
    showToast('Request not found.', 'warning');
    return;
  }

  if (!canModifyRequest(request)) {
    showToast(getRestrictionMessage(request.status), 'warning');
    return;
  }

  window.location.href = `../createReq/createReq.html?id=${encodeURIComponent(id)}`;
}

function cancelRequest(id) {
  const requests = getRequests();
  const request = requests.find(r => r.id === id);

  if (!request) {
    showToast('Request not found.', 'warning');
    return;
  }

  if (!canModifyRequest(request)) {
    showToast(getRestrictionMessage(request.status), 'warning');
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
    note: 'Cancelled by patient'
  });

  saveRequests(requests);
  renderStats();
  renderRequestsTable();

  showToast('Request cancelled successfully / تم إلغاء الطلب بنجاح', 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderRequestsTable();
});