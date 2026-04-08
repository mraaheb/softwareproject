function logout() {
  if (typeof AdudStore !== 'undefined' && AdudStore.logout) {
    AdudStore.logout();
  }
  window.location.href = '../login/login.html';
}

function getProviderOrRedirect() {
  if (
    typeof AdudStore === 'undefined' ||
    !AdudStore ||
    typeof AdudStore.getCurrentUser !== 'function'
  ) {
    window.location.href = '../login/login.html';
    return null;
  }

  const user = AdudStore.getCurrentUser();

  if (!user) {
    window.location.href = '../login/login.html';
    return null;
  }

  if (user.role !== 'provider') {
    window.location.href = '../dashboard/dashboard.html';
    return null;
  }

  return user;
}

function loadProviderUI(user) {
  const avatar = document.querySelector('.user-avatar');
  const name = document.querySelector('.user-info .name');
  const role = document.querySelector('.user-info .role');

  if (avatar) avatar.textContent = (user.name || 'P').charAt(0).toUpperCase();
  if (name) name.textContent = user.name || 'Provider';
  if (role) role.textContent = 'Service Provider ✓';
}

function getGuardiansSafe() {
  return typeof AdudStore.getGuardians === 'function' ? AdudStore.getGuardians() : [];
}

function ensureDemoProviderHistory(provider) {
  const requests = AdudStore.getRequests() || [];
  const providerTrips = requests.filter(r => r.providerId === provider.id);

  if (providerTrips.some(r => ['Completed', 'Cancelled'].includes(r.status))) return;

  const guardians = getGuardiansSafe();
  const guardianId = guardians.length ? guardians[0].id : null;

  requests.push({
    id: 'REQ-PROV-HIS-1',
    patientName: 'Maha Al-Harbi',
    pickup: 'Al Rawdah District',
    dest: 'King Khalid University Hospital',
    date: '2026-04-01',
    time: '08:15',
    mobility: ['Wheelchair'],
    notes: 'Patient needs door-to-door wheelchair support.',
    escort: true,
    guardianId,
    providerId: provider.id,
    providerName: provider.name || 'Provider',
    status: 'Completed',
    createdAt: '2026-04-01T06:40:00',
    updatedAt: '2026-04-01T09:10:00',
    cancelledAt: null,
    timeline: [
      { status: 'Requested', time: '2026-04-01T06:40:00', note: 'Transport request submitted successfully' },
      { status: 'Assigned', time: '2026-04-01T07:00:00', note: 'Trip accepted by provider' },
      { status: 'Picked Up', time: '2026-04-01T08:00:00', note: 'Patient has been picked up' },
      { status: 'Arrived', time: '2026-04-01T08:45:00', note: 'Patient arrived at destination' },
      { status: 'Completed', time: '2026-04-01T09:10:00', note: 'Trip completed successfully' }
    ]
  });

  requests.push({
    id: 'REQ-PROV-HIS-2',
    patientName: 'Noura Al-Dosari',
    pickup: 'Al Nakheel District',
    dest: 'Riyadh National Hospital',
    date: '2026-03-30',
    time: '11:00',
    mobility: ['Companion', 'Oxygen'],
    notes: 'Trip cancelled after assignment.',
    escort: false,
    guardianId: null,
    providerId: provider.id,
    providerName: provider.name || 'Provider',
    status: 'Cancelled',
    createdAt: '2026-03-30T09:00:00',
    updatedAt: '2026-03-30T10:20:00',
    cancelledAt: '2026-03-30T10:20:00',
    timeline: [
      { status: 'Requested', time: '2026-03-30T09:00:00', note: 'Transport request submitted successfully' },
      { status: 'Assigned', time: '2026-03-30T09:30:00', note: 'Trip accepted by provider' },
      { status: 'Cancelled', time: '2026-03-30T10:20:00', note: 'Trip has been cancelled' }
    ]
  });

  AdudStore.saveRequests(requests);
}

function getProviderHistory() {
  const provider = getProviderOrRedirect();
  if (!provider) return [];

  return (AdudStore.getRequests() || [])
    .filter(request =>
      request.providerId === provider.id &&
      ['Completed', 'Cancelled'].includes(request.status)
    )
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

function renderTrips(list) {
  const container = document.getElementById('tripsList');
  const emptyState = document.getElementById('emptyState');

  if (!container || !emptyState) return;

  container.innerHTML = '';

  if (!list.length) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  list.forEach(trip => {
    const isCompleted = trip.status === 'Completed';

    container.innerHTML += `
      <div class="trip-card" onclick="showDetail('${trip.id}')">
        <div class="trip-card-top">
          <span class="trip-id">#${trip.id}</span>
          <span class="trip-date">📅 ${trip.date || '—'} — ${trip.time || '—'}</span>
        </div>

        <div class="trip-route">
          <span class="route-point">🧑 ${trip.patientName || 'Patient'}</span>
          <span class="route-arrow">•</span>
          <span class="route-point">📍 ${trip.pickup || '—'}</span>
          <span class="route-arrow">→</span>
          <span class="route-point">🏥 ${trip.dest || '—'}</span>
        </div>

        <div class="trip-card-bottom">
          <div class="trip-meta">
            ${(trip.mobility || []).map(m => `<span class="meta-chip">${m}</span>`).join('')}
            ${trip.guardianId ? `<span class="meta-chip">🏥 Guardian Assigned</span>` : ''}
            <span class="meta-chip">Provider: ${trip.providerName || '—'}</span>
          </div>

          <span class="status-pill ${isCompleted ? 'pill-completed' : 'pill-cancelled'}">
            <span class="dot"></span>
            ${isCompleted ? 'Completed ✓' : 'Cancelled ✗'}
          </span>
        </div>
      </div>
    `;
  });
}

function filterTrips() {
  const trips = getProviderHistory();

  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const status = document.getElementById('statusFilter').value;
  const date = document.getElementById('dateFilter').value;

  const filteredTrips = trips.filter(trip => {
    const matchesQuery =
      !query ||
      (trip.patientName || '').toLowerCase().includes(query) ||
      (trip.dest || '').toLowerCase().includes(query) ||
      (trip.pickup || '').toLowerCase().includes(query);

    const matchesStatus =
      !status || (trip.status || '').toLowerCase() === status.toLowerCase();

    const matchesDate =
      !date || trip.date === date;

    return matchesQuery && matchesStatus && matchesDate;
  });

  renderTrips(filteredTrips);
}

function clearFilters() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const dateFilter = document.getElementById('dateFilter');

  if (searchInput) searchInput.value = '';
  if (statusFilter) statusFilter.value = '';
  if (dateFilter) dateFilter.value = '';

  renderTrips(getProviderHistory());
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
            <div class="timeline-note">${item.note || 'No note'}</div>
            <div class="timeline-time">
              ${item.time && typeof AdudStore.fmt === 'function' ? AdudStore.fmt(item.time) : (item.time || '—')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function showDetail(id) {
  const trip = getProviderHistory().find(request => request.id === id);
  if (!trip) return;

  const guardians = getGuardiansSafe();
  const guardian = guardians.find(g => g.id === trip.guardianId);
  const isCompleted = trip.status === 'Completed';
  const timeline = Array.isArray(trip.timeline) ? trip.timeline : [];
  const summary = timeline.length ? (timeline[timeline.length - 1].note || '—') : '—';

  const cancelledAtFormatted = trip.cancelledAt
    ? (typeof AdudStore.fmt === 'function' ? AdudStore.fmt(trip.cancelledAt) : trip.cancelledAt)
    : '—';

  const updatedAtFormatted = trip.updatedAt
    ? (typeof AdudStore.fmt === 'function' ? AdudStore.fmt(trip.updatedAt) : trip.updatedAt)
    : '—';

  const modalContent = document.getElementById('modalContent');
  if (!modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-detail-row">
      <div class="modal-label">Request ID</div>
      <div class="modal-val">#${trip.id}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Patient</div>
      <div class="modal-val">${trip.patientName || '—'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Pickup</div>
      <div class="modal-val">${trip.pickup || '—'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Destination</div>
      <div class="modal-val">${trip.dest || '—'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Date & Time</div>
      <div class="modal-val">${trip.date || '—'} — ${trip.time || '—'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Provider</div>
      <div class="modal-val">${trip.providerName || '—'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Guardian</div>
      <div class="modal-val">${guardian ? guardian.name : 'None'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Mobility</div>
      <div class="modal-val">${(trip.mobility || []).length ? trip.mobility.join(', ') : '—'}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Status</div>
      <div class="modal-val" style="color:${isCompleted ? '#2F855A' : '#C53030'}">
        ${trip.status || '—'}
      </div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Summary</div>
      <div class="modal-val">${summary}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Last Update</div>
      <div class="modal-val">${updatedAtFormatted}</div>
    </div>

    <div class="modal-detail-row">
      <div class="modal-label">Cancelled At</div>
      <div class="modal-val">${cancelledAtFormatted}</div>
    </div>

    ${buildTimelineHtml(trip)}
  `;

  const modal = document.getElementById('detailModal');
  if (modal) {
    modal.classList.add('show');
  }
}

function closeModal() {
  const modal = document.getElementById('detailModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const provider = getProviderOrRedirect();
  if (!provider) return;

  loadProviderUI(provider);
  ensureDemoProviderHistory(provider);
  renderTrips(getProviderHistory());
});