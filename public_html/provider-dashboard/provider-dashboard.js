const requests_container = document.getElementById('requests-container');
const active_trips_container = document.getElementById('active-trips-container');
const guardians_container = document.getElementById('guardians-container');
const guardianName = document.getElementById('guardianName');
const guardianPhone = document.getElementById('guardianPhone');
const guardianNotes = document.getElementById('guardianNotes');
const updateModal = document.getElementById('updateModal');
const toast = document.getElementById('toast');

let currentEditingId = null;
let tempSelectedStatus = '';

function requests() {
  return AdudStore.getRequests();
}

function saveRequests(v) {
  AdudStore.saveRequests(v);
}

function guardians() {
  return AdudStore.getGuardians();
}

function saveGuardians(v) {
  AdudStore.saveGuardians(v);
}

function incomingRequests() {
  return requests().filter(r => r.status === 'Requested');
}

function activeTrips() {
  return requests().filter(r =>
    ['Assigned', 'Picked Up', 'Arrived'].includes(r.status)
  );
}

function renderStats() {
  document.getElementById('count-new').textContent = incomingRequests().length;
  document.getElementById('count-active').textContent = activeTrips().length;
}

function renderIncoming() {
  requests_container.innerHTML =
    incomingRequests()
      .map(r => {
        const guardianOptions = guardians()
          .map(g => `<option value="${g.id}">${g.name}</option>`)
          .join('');

        return `
          <div class="req-card new-req">
            <div class="req-title">#${r.id} • ${r.pickup} → ${r.dest}</div>
            <div class="req-meta">
              Date: ${r.date} — ${r.time}<br>
              Mobility: ${(r.mobility || []).join(', ') || 'None'}<br>
              Notes: ${r.notes || '—'}<br>
              Escort: ${r.escort ? 'Yes' : 'No'}
            </div>

            <div style="margin-top:10px;">
              <label style="font-size:12px;font-weight:700;">Assign Guardian / تعيين مرافق</label>
              <select onchange="assignGuardian('${r.id}', this.value)" style="width:100%;margin-top:6px;padding:10px;border:1.5px solid #e3e8e5;border-radius:10px;">
                <option value="">None</option>
                ${guardianOptions}
              </select>
            </div>

            <div class="req-actions">
              <button class="btn-reject" onclick="handleReject('${r.id}')">✗ Reject</button>
              <button class="btn-accept" onclick="handleAccept('${r.id}')">✓ Accept</button>
            </div>
          </div>
        `;
      })
      .join('') || '<p>No incoming requests.</p>';
}

function renderActiveTrips() {
  active_trips_container.innerHTML =
    activeTrips()
      .map(trip => `
        <div class="trip-row">
          <div class="trip-info">
            <div class="trip-route-sm">${trip.pickup} → ${trip.dest}</div>
            <div class="trip-meta-sm">
              #${trip.id} • ${trip.date} — ${trip.time}
              ${
                trip.guardianId
                  ? `• Guardian: ${guardians().find(g => g.id === trip.guardianId)?.name || ''}`
                  : ''
              }
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:10px;">
            <span class="status-pill ${trip.status === 'Picked Up' ? 'pill-pickedup' : 'pill-assigned'}">
              <span class="dot"></span>${trip.status}
            </span>
            <button class="btn-update" onclick="openUpdateModal('${trip.id}')">Update Status →</button>
          </div>
        </div>
      `)
      .join('') || '<p>No active trips.</p>';
}

function renderGuardians() {
  guardians_container.innerHTML =
    guardians()
      .map(g => `
        <div class="guardian-list-item">
          <div>
            <strong>${g.name}</strong>
            <div style="font-size:12px;color:#6B7A99">${g.phone} • ${g.notes || ''}</div>
          </div>
        </div>
      `)
      .join('') || '<p>No guardians added yet.</p>';
}

function renderAll() {
  renderStats();
  renderIncoming();
  renderActiveTrips();
  renderGuardians();
}

function addGuardian() {
  if (!guardianName.value.trim() || !guardianPhone.value.trim()) return;

  const list = guardians();
  list.push({
    id: AdudStore.nextId('G'),
    name: guardianName.value.trim(),
    phone: guardianPhone.value.trim(),
    notes: guardianNotes.value.trim()
  });

  saveGuardians(list);

  guardianName.value = '';
  guardianPhone.value = '';
  guardianNotes.value = '';

  renderAll();
}

function assignGuardian(id, guardianId) {
  const list = requests();
  const r = list.find(x => x.id === id);
  if (!r) return;

  r.guardianId = guardianId || null;
  r.updatedAt = AdudStore.nowIso();

  saveRequests(list);
}

function handleAccept(id) {
  const list = requests();
  const r = list.find(x => x.id === id);
  if (!r) return;

  const user = AdudStore.getCurrentUser() || {
    id: 'PROV001',
    name: 'Al Shifaa Transport'
  };

  r.status = 'Assigned';
  r.providerId = user.id;
  r.providerName = user.name;
  r.updatedAt = AdudStore.nowIso();
  r.timeline.push({
    status: 'Assigned',
    time: r.updatedAt,
    note: 'Request accepted by provider'
  });

  saveRequests(list);
  renderAll();
  showToast(`✅ Request #${id} accepted and assigned!`, 'success');
}

function handleReject(id) {
  const list = requests();
  const r = list.find(x => x.id === id);
  if (!r) return;

  r.status = 'Cancelled';
  r.cancelledAt = AdudStore.nowIso();
  r.updatedAt = r.cancelledAt;
  r.timeline.push({
    status: 'Cancelled',
    time: r.cancelledAt,
    note: 'Rejected by service provider'
  });

  saveRequests(list);
  renderAll();
  showToast(`Request #${id} rejected.`, 'error');
}

function openUpdateModal(id) {
  currentEditingId = id;
  tempSelectedStatus = '';

  document.querySelectorAll('.status-option').forEach(o => {
    o.classList.remove('selected');
    o.querySelector('input').checked = false;
  });

  updateModal.classList.add('show');
}

function selectStatus(el, val) {
  document.querySelectorAll('.status-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input').checked = true;
  tempSelectedStatus = val;
}

function saveStatus() {
  if (!tempSelectedStatus) return alert('Please select a status');

  const list = requests();
  const r = list.find(t => t.id === currentEditingId);
  if (!r) return;

  const order = ['Assigned', 'Picked Up', 'Arrived', 'Completed', 'Cancelled'];

  if (
    order.indexOf(tempSelectedStatus) < order.indexOf(r.status) &&
    tempSelectedStatus !== 'Cancelled'
  ) {
    return alert('Status must follow the workflow order.');
  }

  r.status = tempSelectedStatus;
  r.updatedAt = AdudStore.nowIso();

  if (tempSelectedStatus === 'Cancelled') {
    r.cancelledAt = r.updatedAt;
  }

  r.timeline.push({
    status: tempSelectedStatus,
    time: r.updatedAt,
    note: `Status changed to ${tempSelectedStatus}`
  });

  saveRequests(list);
  closeUpdateModal();
  renderAll();
  showToast(`✅ Status updated to "${tempSelectedStatus}"`, 'success');
}

function closeUpdateModal() {
  updateModal.classList.remove('show');
}

function showToast(msg, type) {
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', renderAll);