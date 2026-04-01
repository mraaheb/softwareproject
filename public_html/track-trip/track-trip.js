function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function getRequestFromQuery() {
  const requests = AdudStore.getRequests();
  const id = new URLSearchParams(window.location.search).get('id');

  if (id) {
    return requests.find(r => r.id === id);
  }

  return requests.find(r =>
    ['Requested', 'Assigned', 'Picked Up', 'Arrived'].includes(r.status)
  ) || requests[0];
}

function getStatusArabic(status) {
  switch (status) {
    case 'Requested': return 'تم الطلب';
    case 'Assigned': return 'تم التعيين';
    case 'Picked Up': return 'تم الاستلام';
    case 'Arrived': return 'تم الوصول';
    case 'Completed': return 'مكتمل';
    case 'Cancelled': return 'ملغي';
    case 'Updated': return 'تم التعديل';
    default: return status;
  }
}

function getStatusNoteFallback(status) {
  switch (status) {
    case 'Requested':
      return 'Transport request submitted successfully';
    case 'Assigned':
      return 'Driver is assigned and preparing for pickup';
    case 'Picked Up':
      return 'Patient has been picked up';
    case 'Arrived':
      return 'Patient arrived at destination';
    case 'Completed':
      return 'Trip completed successfully';
    case 'Cancelled':
      return 'Trip has been cancelled';
    default:
      return 'Status updated';
  }
}

function renderRequestDetails(request) {
  if (!request) return;

  const reqId = qs('.req-id');
  if (reqId) reqId.textContent = `# Request ${request.id}`;

  const detailValues = qsa('.detail-row .value');
  if (detailValues[0]) detailValues[0].textContent = request.pickup || '—';
  if (detailValues[1]) detailValues[1].textContent = request.dest || '—';
  if (detailValues[2]) detailValues[2].textContent = `${request.date || '—'} — ${request.time || '—'}`;
  if (detailValues[3]) detailValues[3].textContent = request.providerName || 'Pending assignment';

  const currentStatusBox = qs('.status-current');
  const mainStatus = qs('.status-current .main-st');
  const subStatus = qs('.status-current .sub-st');

  if (mainStatus) {
    mainStatus.textContent = `${request.status} / ${getStatusArabic(request.status)}`;
  }

  const latestTimeline = Array.isArray(request.timeline) && request.timeline.length
    ? request.timeline[request.timeline.length - 1]
    : null;

  if (subStatus) {
    subStatus.textContent = latestTimeline?.note || getStatusNoteFallback(request.status);
  }

  if (currentStatusBox) {
    currentStatusBox.className = 'status-current';

    if (request.status === 'Assigned') {
      currentStatusBox.classList.add('assigned');
    } else if (request.status === 'Picked Up' || request.status === 'Arrived') {
      currentStatusBox.classList.add('assigned');
    } else if (request.status === 'Completed') {
      currentStatusBox.classList.add('completed');
    } else if (request.status === 'Cancelled') {
      currentStatusBox.classList.add('cancelled');
    } else {
      currentStatusBox.classList.add('assigned');
    }
  }

  const mobilityTags = qs('.mobility-tags');
  if (mobilityTags) {
    mobilityTags.innerHTML =
      (request.mobility || []).length
        ? request.mobility.map(m => `<span class="mob-tag">${m}</span>`).join('')
        : `<span class="mob-tag">No special requirements</span>`;
  }

  const escortInfo = qs('.escort-info');
  const guardians = typeof AdudStore.getGuardians === 'function' ? AdudStore.getGuardians() : [];
  const guardian = guardians.find(g => g.id === request.guardianId);

  if (escortInfo) {
    if (guardian) {
      escortInfo.innerHTML = `
        <h4>🏥 Hospital Escort Assigned / تم تعيين مرافق</h4>
        <div class="escort-row"><span>Name:</span> ${guardian.name}</div>
        <div class="escort-row"><span>Phone:</span> ${guardian.phone}</div>
        <div class="escort-row"><span>Notes:</span> ${guardian.notes || '—'}</div>
      `;
    } else {
      escortInfo.innerHTML = `
        <h4>🏥 Hospital Escort / المرافق</h4>
        <div class="escort-row"><span>Status:</span> No escort assigned</div>
      `;
    }
  }
}

function renderTimeline(request) {
  const timelineContainer = qs('.timeline');
  if (!timelineContainer || !request) return;

  const workflow = ['Requested', 'Assigned', 'Picked Up', 'Arrived', 'Completed'];
  const timelineMap = {};

  (request.timeline || []).forEach(item => {
    timelineMap[item.status] = item;
  });

  timelineContainer.innerHTML = workflow.map(status => {
    const item = timelineMap[status];
    const isCurrent = request.status === status;
    const isDone = !!item && !isCurrent;
    const isPending = !item;

    return `
      <div class="timeline-item">
        <div class="tl-dot ${isDone ? 'done' : isCurrent ? 'active' : 'pending'}">
          ${isDone ? '✓' : isCurrent ? '●' : ''}
        </div>
        <div class="tl-content">
          <div class="tl-title ${isCurrent ? 'active-text' : isPending ? 'pending-text' : ''}">
            ${status} / ${getStatusArabic(status)}${isCurrent ? ' ← Current' : ''}
          </div>
          <div class="tl-sub">${item?.note || getStatusNoteFallback(status)}</div>
          <div class="tl-time ${isPending ? 'pending-time' : ''}">
            ${item?.time ? AdudStore.fmt(item.time) : '⏳ Pending'}
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (request.status === 'Cancelled') {
    timelineContainer.innerHTML += `
      <div class="timeline-item">
        <div class="tl-dot done">✕</div>
        <div class="tl-content">
          <div class="tl-title" style="color:#c53030;">Cancelled / ملغي</div>
          <div class="tl-sub">
            ${(request.timeline || []).find(t => t.status === 'Cancelled')?.note || 'Trip cancelled'}
          </div>
          <div class="tl-time">
            ${request.cancelledAt ? AdudStore.fmt(request.cancelledAt) : '—'}
          </div>
        </div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const request = getRequestFromQuery();

  if (!request) {
    const card = qs('.info-card .card-body');
    if (card) {
      card.innerHTML = '<p>No trip found / لا توجد رحلة</p>';
    }

    const timelineBody = qs('.timeline-body');
    if (timelineBody) {
      timelineBody.innerHTML = '<p>No timeline available / لا يوجد تسلسل زمني</p>';
    }
    return;
  }

  renderRequestDetails(request);
  renderTimeline(request);
});