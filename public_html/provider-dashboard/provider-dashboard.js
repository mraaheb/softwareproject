const requestsContainer = document.getElementById('requests-container');
const activeTripsContainer = document.getElementById('active-trips-container');
const guardiansContainer = document.getElementById('guardians-container');
const guardianName = document.getElementById('guardianName');
const guardianPhone = document.getElementById('guardianPhone');
const guardianNotes = document.getElementById('guardianNotes');
const updateModal = document.getElementById('updateModal');
const toast = document.getElementById('toast');

let currentEditingId = null;
let tempSelectedStatus = '';

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

function getGuardians() {
  return AdudStore.getGuardians();
}

function saveGuardians(guardians) {
  AdudStore.saveGuardians(guardians);
}

function incomingRequests() {
  return getRequests().filter(r => r.status === 'Requested');
}

function activeTrips() {
  return getRequests().filter(r =>
    ['Assigned', 'Picked Up', 'Arrived'].includes(r.status)
  );
}

function renderStats() {
  document.getElementById('count-new').textContent = incomingRequests().length;
  document.getElementById('count-active').textContent = activeTrips().length;
}

function renderIncomingRequests() {
  const guardians = getGuardians();

  requestsContainer.innerHTML =
    incomingRequests().map(r => {
      const guardianOptions = guardians.map(g => `
        <option value="${g.id}" ${r.guardianId === g.id ? 'selected' : ''}>
          ${g.name}
        </option>
      `).join('');

      return `
        <div class="req-card new-req">
          <div class="req-title">#${r.id} • ${r.pickup} → ${r.dest}</div>
          <div class="req-meta">
            Date: ${r.date} — ${r.time}<br>
            Mobility: ${(r.mobility || []).join(', ') || 'None'}<br>
            Notes: ${r.notes || '—'}<br>
            Escort needed: ${r.escort ? 'Yes' : 'No'}
          </div>

          <div style="margin-top: 12px;">
            <label style="font-size:12px;font-weight:700;">Assign Guardian / تعيين مرافق</label>
            <select
              onchange="assignGuardian('${r.id}', this.value)"
              style="width:100%;margin-top:6px;padding:10px;border:1.5px solid #e3e8e5;border-radius:10px;font-family:inherit;"
            >
              <option value="">None</option>
              ${guardianOptions}
            </select>
          </div>

          <div class="req-actions">
            <button class="btn-reject" onclick="rejectRequest('${r.id}')">✗ Reject</button>
            <button class="btn-accept" onclick="acceptRequest('${r.id}')">✓ Accept</button>
          </div>
        </div>
      `;
    }).join('') || '<p>No incoming requests / لا توجد طلبات واردة</p>';
}

function renderActiveTrips() {
  activeTripsContainer.innerHTML =
    activeTrips().map(trip => {
      let pillClass = 'pill-assigned';
      if (trip.status === 'Picked Up' || trip.status === 'Arrived') {
        pillClass = 'pill-pickedup';
      }

      const guardian = getGuardians().find(g => g.id === trip.guardianId);

      return `
        <div class="trip-row">
          <div class="trip-route-sm">${trip.pickup} → ${trip.dest}</div>
          <div class="trip-meta-sm">
            #${trip.id} • ${trip.date} — ${trip.time}<br>
            Provider: ${trip.providerName || '—'}<br>
            Guardian: ${guardian ? guardian.name : 'None'}
          </div>

          <div class="req-actions">
            <span class="status-pill ${pillClass}">
              <span class="dot"></span>${trip.status}
            </span>
            <button class="btn-update" onclick="openUpdateModal('${trip.id}')">
              Update Status
            </button>
          </div>
        </div>
      `;
    }).join('') || '<p>No active trips / لا توجد رحلات نشطة</p>';
}

function renderGuardians() {
  guardiansContainer.innerHTML =
    getGuardians().map(g => `
      <div class="guardian-list-item">
        <div class="guardian-title">${g.name}</div>
        <div class="guardian-meta">${g.phone} • ${g.notes || '—'}</div>
      </div>
    `).join('') || '<p>No guardians yet / لا يوجد مرافقون بعد</p>';
}

function renderAll() {
  renderStats();
  renderIncomingRequests();
  renderActiveTrips();
  renderGuardians();
}

function addGuardian() {
  const name = guardianName.value.trim();
  const phone = guardianPhone.value.trim();
  const notes = guardianNotes.value.trim();

  if (!name || !phone) {
    alert('Please enter guardian name and phone / الرجاء إدخال اسم المرافق ورقم الجوال');
    return;
  }

  const guardians = getGuardians();
  guardians.push({
    id: AdudStore.nextId('G'),
    name,
    phone,
    notes
  });

  saveGuardians(guardians);

  guardianName.value = '';
  guardianPhone.value = '';
  guardianNotes.value = '';

  renderGuardians();
  showToast('Guardian added successfully / تم إضافة المرافق بنجاح', 'success');
}

function assignGuardian(requestId, guardianId) {
  const requests = getRequests();
  const request = requests.find(r => r.id === requestId);

  if (!request) return;

  request.guardianId = guardianId || null;
  request.updatedAt = AdudStore.nowIso();

  saveRequests(requests);
  showToast('Guardian assigned / تم تعيين المرافق', 'success');
}

function acceptRequest(id) {
  const requests = getRequests();
  const request = requests.find(r => r.id === id);

  if (!request) return;

  const currentUser = AdudStore.getCurrentUser() || {
    id: 'PROV001',
    name: 'Al Shifaa Transport'
  };

  request.status = 'Assigned';
  request.providerId = currentUser.id;
  request.providerName = currentUser.name;
  request.updatedAt = AdudStore.nowIso();

  if (!request.timeline) {
    request.timeline = [];
  }

  request.timeline.push({
    status: 'Assigned',
    time: request.updatedAt,
    note: 'Request accepted by provider'
  });

  saveRequests(requests);
  renderAll();
  showToast(`Request #${id} accepted / تم قبول الطلب`, 'success');
}

function rejectRequest(id) {
  const requests = getRequests();
  const request = requests.find(r => r.id === id);

  if (!request) return;

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
    note: 'Rejected by service provider'
  });

  saveRequests(requests);
  renderAll();
  showToast(`Request #${id} rejected / تم رفض الطلب`, 'error');
}

function openUpdateModal(id) {
  currentEditingId = id;
  tempSelectedStatus = '';

  document.querySelectorAll('.status-option').forEach(option => {
    option.classList.remove('selected');
    const input = option.querySelector('input');
    if (input) input.checked = false;
  });

  updateModal.classList.add('show');
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

  const requests = getRequests();
  const request = requests.find(r => r.id === currentEditingId);

  if (!request) return;

  const allowedOrder = ['Assigned', 'Picked Up', 'Arrived', 'Completed', 'Cancelled'];
  const currentIndex = allowedOrder.indexOf(request.status);
  const nextIndex = allowedOrder.indexOf(tempSelectedStatus);

  if (
    tempSelectedStatus !== 'Cancelled' &&
    nextIndex !== -1 &&
    currentIndex !== -1 &&
    nextIndex < currentIndex
  ) {
    alert('Status must follow the workflow order / يجب اتباع تسلسل الحالات');
    return;
  }

  request.status = tempSelectedStatus;
  request.updatedAt = AdudStore.nowIso();

  if (tempSelectedStatus === 'Cancelled') {
    request.cancelledAt = request.updatedAt;
  }

  if (!request.timeline) {
    request.timeline = [];
  }

  request.timeline.push({
    status: tempSelectedStatus,
    time: request.updatedAt,
    note: `Status changed to ${tempSelectedStatus}`
  });

  saveRequests(requests);
  closeUpdateModal();
  renderAll();
  showToast(`Status updated to ${tempSelectedStatus}`, 'success');
}

function closeUpdateModal() {
  updateModal.classList.remove('show');
}

function showToast(message, type) {
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  renderAll();
});