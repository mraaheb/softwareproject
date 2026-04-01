function navigateTo(url) {
  if (url) window.location.href = url;
}

function handleLogout() {
  AdudStore.logout();
  window.location.href = '../login/login.html';
}

function allRequests() {
  return AdudStore.getRequests();
}

function saveRequests(v) {
  AdudStore.saveRequests(v);
}

function isActive(status) {
  return ['Requested', 'Assigned', 'Picked Up', 'Arrived'].includes(status);
}

function pillClass(status) {
  if (status === 'Completed') return 'pill-completed';
  if (status === 'Cancelled') return 'pill-cancelled';
  if (status === 'Requested') return 'pill-pending';
  return 'pill-assigned';
}

function renderStats() {
  const reqs = allRequests();

  document.getElementById('activeCount').textContent =
    reqs.filter(r => isActive(r.status)).length;

  document.getElementById('completedCount').textContent =
    reqs.filter(r => r.status === 'Completed').length;

  document.getElementById('pendingCount').textContent =
    reqs.filter(r => r.status === 'Requested').length;

  document.getElementById('escortCount').textContent =
    reqs.filter(r => r.escort || r.guardianId).length;
}

function renderTable() {
  const tbody = document.getElementById('requests-body');
  const reqs = allRequests().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  tbody.innerHTML =
    reqs
      .map(r => {
        const dt = `${r.date} — ${r.time}`;
        const actions = [];

        actions.push(
          `<button class="act-btn act-view" onclick="viewRequest('${r.id}')">View</button>`
        );

        if (r.status === 'Requested') {
          actions.push(
            `<button class="act-btn act-view" onclick="editRequest('${r.id}')">Edit</button>`
          );
          actions.push(
            `<button class="act-btn act-view" onclick="cancelRequest('${r.id}')">Cancel</button>`
          );
        }

        return `
          <tr>
            <td><strong>#${r.id}</strong></td>
            <td>${r.pickup}</td>
            <td>${r.dest}</td>
            <td>${dt}</td>
            <td>
              <span class="status-pill ${pillClass(r.status)}">
                <span class="dot"></span>${r.status}
              </span>
            </td>
            <td><div class="action-btns">${actions.join('')}</div></td>
          </tr>
        `;
      })
      .join('') || '<tr><td colspan="6">No requests yet</td></tr>';
}

function editRequest(id) {
  window.location.href = `../createReq/createReq.html?id=${encodeURIComponent(id)}`;
}

function viewRequest(id) {
  window.location.href = `../track-trip/track-trip.html?id=${encodeURIComponent(id)}`;
}

function cancelRequest(id) {
  if (!confirm('Cancel this request? / إلغاء الطلب؟')) return;

  const reqs = allRequests();
  const req = reqs.find(r => r.id === id);

  if (!req || req.status !== 'Requested') return;

  req.status = 'Cancelled';
  req.cancelledAt = AdudStore.nowIso();
  req.updatedAt = req.cancelledAt;
  req.timeline.push({
    status: 'Cancelled',
    time: req.cancelledAt,
    note: 'Cancelled by patient'
  });

  saveRequests(reqs);
  renderStats();
  renderTable();
}

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderTable();
});