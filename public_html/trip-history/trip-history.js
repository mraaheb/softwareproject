function completedOrCancelled() {
  return AdudStore.getRequests().filter(t =>
    ['Completed', 'Cancelled'].includes(t.status)
  );
}

function renderTrips(list) {
  const container = document.getElementById('tripsList');
  const empty = document.getElementById('emptyState');

  container.innerHTML = '';

  if (!list.length) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  list.forEach(t => {
    const isCompleted = t.status === 'Completed';

    container.innerHTML += `
      <div class="trip-card" onclick="showDetail('${t.id}')">
        <div class="trip-card-top">
          <span class="trip-id">#${t.id}</span>
          <span class="trip-date">📅 ${t.date} — ${t.time}</span>
        </div>

        <div class="trip-route">
          <span class="route-point">📍 ${t.pickup}</span>
          <span class="route-arrow">→</span>
          <span class="route-point">🏥 ${t.dest}</span>
        </div>

        <div class="trip-card-bottom">
          <div class="trip-meta">
            ${(t.mobility || []).map(m => `<span class="meta-chip">${m}</span>`).join('')}
            ${t.guardianId ? `<span class="meta-chip">🏥 Escort</span>` : ''}
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
  const query = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;
  const date = document.getElementById('dateFilter').value;

  renderTrips(
    trips.filter(
      t =>
        (!query ||
          t.dest.toLowerCase().includes(query) ||
          t.pickup.toLowerCase().includes(query)) &&
        (!status || t.status.toLowerCase() === status) &&
        (!date || t.date === date)
    )
  );
}

function clearFilters() {
  searchInput.value = '';
  statusFilter.value = '';
  dateFilter.value = '';
  renderTrips(completedOrCancelled());
}

function showDetail(id) {
  const t = AdudStore.getRequests().find(x => x.id === id);
  if (!t) return;

  const isCompleted = t.status === 'Completed';
  const g = AdudStore.getGuardians().find(x => x.id === t.guardianId);
  const summary = t.timeline?.at(-1)?.note || '';

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-detail-row">
      <div>
        <div class="modal-label">Request ID</div>
        <div class="modal-val">#${t.id}</div>
      </div>
    </div>

    <div class="modal-detail-row">
      <div>
        <div class="modal-label">Pickup</div>
        <div class="modal-val">${t.pickup}</div>
      </div>
    </div>

    <div class="modal-detail-row">
      <div>
        <div class="modal-label">Destination</div>
        <div class="modal-val">${t.dest}</div>
      </div>
    </div>

    <div class="modal-detail-row">
      <div>
        <div class="modal-label">Date & Time</div>
        <div class="modal-val">${t.date} — ${t.time}</div>
      </div>
    </div>

    <div class="modal-detail-row">
      <div>
        <div class="modal-label">Provider</div>
        <div class="modal-val">${t.providerName || '—'}</div>
      </div>
    </div>

    <div class="modal-detail-row">
      <div>
        <div class="modal-label">Escort</div>
        <div class="modal-val">${g ? g.name : 'None'}</div>
      </div>
    </div>

    <div class="modal-detail-row">
      <div>
        <div class="modal-label">Status</div>
        <div class="modal-val" style="color:${isCompleted ? '#2F855A' : '#C53030'}">
          ${t.status}
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
        <div class="modal-val">${t.cancelledAt ? AdudStore.fmt(t.cancelledAt) : '—'}</div>
      </div>
    </div>
  `;

  detailModal.classList.add('show');
}

function closeModal() {
  detailModal.classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => renderTrips(completedOrCancelled()));