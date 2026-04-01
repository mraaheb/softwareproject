function completedOrCancelled() {
  return AdudStore.getRequests().filter(request =>
    ['Completed', 'Cancelled'].includes(request.status)
  );
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
          <span class="route-point">📍 ${trip.pickup || '—'}</span>
          <span class="route-arrow">→</span>
          <span class="route-point">🏥 ${trip.dest || '—'}</span>
        </div>

        <div class="trip-card-bottom">
          <div class="trip-meta">
            ${(trip.mobility || []).map(m => `<span class="meta-chip">${m}</span>`).join('')}
            ${trip.guardianId ? `<span class="meta-chip">🏥 Escort</span>` : ''}
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
  const trips = completedOrCancelled();

  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const status = document.getElementById('statusFilter').value;
  const date = document.getElementById('dateFilter').value;

  const filteredTrips = trips.filter(trip => {
    const matchesQuery =
      !query ||
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

  renderTrips(completedOrCancelled());
}

function showDetail(id) {
  const trip = AdudStore.getRequests().find(request => request.id === id);
  if (!trip) return;

  const guardians = typeof AdudStore.getGuardians === 'function'
    ? AdudStore.getGuardians()
    : [];

  const guardian = guardians.find(g => g.id === trip.guardianId);
  const isCompleted = trip.status === 'Completed';
  const timeline = Array.isArray(trip.timeline) ? trip.timeline : [];
  const summary = timeline.length ? (timeline[timeline.length - 1].note || '—') : '—';

  const cancelledAtFormatted = trip.cancelledAt
    ? (typeof AdudStore.fmt === 'function' ? AdudStore.fmt(trip.cancelledAt) : trip.cancelledAt)
    : '—';

  const modalContent = document.getElementById('modalContent');
  if (!modalContent) return;

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
        <div class="modal-val">${trip.pickup || '—'}</div>
      </div>
    </div>

    <div class="modal-detail-row">
      <div>
        <div class="modal-label">Destination</div>
        <div class="modal-val">${trip.dest || '—'}</div>
      </div>
    </div>

    <div class="modal-detail-row">
      <div>
        <div class="modal-label">Date & Time</div>
        <div class="modal-val">${trip.date || '—'} — ${trip.time || '—'}</div>
      </div>
    </div>

    <div class="modal-detail-row">
      <div>
        <div class="modal-label">Provider</div>
        <div class="modal-val">${trip.providerName || '—'}</div>
      </div>
    </div>

    <div class="modal-detail-row">
      <div>
        <div class="modal-label">Escort</div>
        <div class="modal-val">${guardian ? guardian.name : 'None'}</div>
      </div>
    </div>

    <div class="modal-detail-row">
      <div>
        <div class="modal-label">Status</div>
        <div class="modal-val" style="color:${isCompleted ? '#2F855A' : '#C53030'}">
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
        <div class="modal-label">Cancelled At</div>
        <div class="modal-val">${cancelledAtFormatted}</div>
      </div>
    </div>
  `;

  document.getElementById('detailModal').classList.add('show');
}

function closeModal() {
  const modal = document.getElementById('detailModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderTrips(completedOrCancelled());
});