function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

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

function getStatusArabic(status) {
  switch (status) {
    case 'Requested': return 'تم الطلب';
    case 'Assigned': return 'تم التعيين';
    case 'Picked Up': return 'تم الاستلام';
    case 'Arrived': return 'تم الوصول';
    case 'Completed': return 'مكتمل';
    case 'Cancelled': return 'ملغي';
    case 'Updated': return 'تم التعديل';
    default: return status || '—';
  }
}

function getStatusNoteFallback(status) {
  switch (status) {
    case 'Requested': return 'Transport request submitted successfully';
    case 'Assigned': return 'Trip accepted by provider';
    case 'Picked Up': return 'Patient has been picked up';
    case 'Arrived': return 'Patient arrived at destination';
    case 'Completed': return 'Trip completed successfully';
    case 'Cancelled': return 'Trip has been cancelled';
    case 'Updated': return 'Request details were updated';
    default: return 'Status updated';
  }
}

function getGuardiansSafe() {
  return typeof AdudStore.getGuardians === 'function' ? AdudStore.getGuardians() : [];
}

function ensureDemoProviderTrip(provider) {
  const requests = AdudStore.getRequests() || [];
  const providerTrips = requests.filter(r => r.providerId === provider.id);

  if (providerTrips.length) return;

  const guardians = getGuardiansSafe();
  let guardianId = null;

  if (guardians.length) {
    guardianId = guardians[0].id;
  }

  const now = new Date();
  const iso1 = new Date(now.getTime() - 90 * 60000).toISOString();
  const iso2 = new Date(now.getTime() - 40 * 60000).toISOString();

  const demoTrip = {
    id: 'REQ-PROV-DEMO',
    patientName: 'Sara Al-Qahtani',
    pickup: 'King Fahad District, Riyadh',
    dest: 'King Saud Medical City',
    date: '2026-04-08',
    time: '09:30',
    mobility: ['Wheelchair', 'Companion'],
    notes: 'Patient needs wheelchair support and clinic entrance assistance.',
    escort: true,
    guardianId: guardianId,
    providerId: provider.id,
    providerName: provider.name || 'Provider',
    status: 'Picked Up',
    createdAt: iso1,
    updatedAt: iso2,
    cancelledAt: null,
    timeline: [
      {
        status: 'Requested',
        time: iso1,
        note: 'Transport request submitted successfully'
      },
      {
        status: 'Assigned',
        time: new Date(now.getTime() - 70 * 60000).toISOString(),
        note: 'Trip accepted by provider'
      },
      {
        status: 'Picked Up',
        time: iso2,
        note: 'Patient has been picked up'
      }
    ]
  };

  requests.push(demoTrip);
  AdudStore.saveRequests(requests);
}

function getProviderTrips(provider) {
  const requests = AdudStore.getRequests() || [];
  return requests.filter(r => r.providerId === provider.id);
}

function getRequestFromQuery(provider) {
  const requests = getProviderTrips(provider);
  const id = new URLSearchParams(window.location.search).get('id');

  if (id) {
    return requests.find(r => r.id === id);
  }

  return requests.find(r =>
    ['Assigned', 'Picked Up', 'Arrived'].includes(r.status)
  ) || requests[0];
}

function getStatusThemeClass(status) {
  if (status === 'Completed') return 'completed';
  if (status === 'Cancelled') return 'cancelled';
  return 'assigned';
}

function renderRequestDetails(request) {
  if (!request) return;

  const reqId = qs('.req-id');
  if (reqId) reqId.textContent = `# Request ${request.id}`;

  const detailValues = qsa('.detail-row .value');
  if (detailValues[0]) detailValues[0].textContent = request.patientName || '—';
  if (detailValues[1]) detailValues[1].textContent = request.pickup || '—';
  if (detailValues[2]) detailValues[2].textContent = request.dest || '—';
  if (detailValues[3]) detailValues[3].textContent = `${request.date || '—'} — ${request.time || '—'}`;

  const guardians = getGuardiansSafe();
  const guardian = guardians.find(g => g.id === request.guardianId);
  if (detailValues[4]) detailValues[4].textContent = guardian ? guardian.name : 'None';

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
    currentStatusBox.className = `status-current ${getStatusThemeClass(request.status)}`;
  }

  const mobilityTags = qs('.mobility-tags');
  if (mobilityTags) {
    mobilityTags.innerHTML =
      (request.mobility || []).length
        ? request.mobility.map(m => `<span class="mob-tag">${m}</span>`).join('')
        : `<span class="mob-tag">No special requirements</span>`;
  }

  const escortInfo = qs('.escort-info');
  if (escortInfo) {
    if (guardian) {
      escortInfo.innerHTML = `
        <h4>🏥 Guardian Assigned / تم تعيين المرافق</h4>
        <div class="escort-row"><span>Name:</span> ${guardian.name}</div>
        <div class="escort-row"><span>Phone:</span> ${guardian.phone || '—'}</div>
        <div class="escort-row"><span>Notes:</span> ${guardian.notes || '—'}</div>
      `;
    } else if (request.escort) {
      escortInfo.innerHTML = `
        <h4>🏥 Escort Requested / تم طلب المرافق</h4>
        <div class="escort-row"><span>Status:</span> Waiting for assignment</div>
      `;
    } else {
      escortInfo.innerHTML = `
        <h4>🏥 Escort / المرافق</h4>
        <div class="escort-row"><span>Status:</span> Not requested</div>
      `;
    }
  }

  renderExtraSummary(request, guardian);
}

function renderExtraSummary(request, guardian) {
  const cardBody = qs('.info-card .card-body');
  if (!cardBody) return;

  let summaryBox = qs('.provider-extra-summary');
  if (!summaryBox) {
    summaryBox = document.createElement('div');
    summaryBox.className = 'provider-extra-summary';
    cardBody.appendChild(summaryBox);
  }

  summaryBox.innerHTML = `
    <div style="margin-top:16px;padding:14px 16px;border:1.5px solid #dbe7df;border-radius:14px;background:#f8fbf9;">
      <div style="font-size:11px;font-weight:700;color:#5f6f66;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">
        Provider Summary / ملخص للمزوّد
      </div>
      <div style="font-size:13px;color:#1f2c25;line-height:1.9;">
        <strong>Patient:</strong> ${request.patientName || '—'}<br>
        <strong>Current Status:</strong> ${request.status || '—'}<br>
        <strong>Guardian Assigned:</strong> ${guardian ? guardian.name : 'No'}<br>
        <strong>Escort Requested:</strong> ${request.escort ? 'Yes' : 'No'}<br>
        <strong>Notes:</strong> ${request.notes || '—'}
      </div>
    </div>
  `;
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
    const cancelledEntry = (request.timeline || []).find(t => t.status === 'Cancelled');

    timelineContainer.innerHTML += `
      <div class="timeline-item">
        <div class="tl-dot done">✕</div>
        <div class="tl-content">
          <div class="tl-title" style="color:#c53030;">Cancelled / ملغي</div>
          <div class="tl-sub">${cancelledEntry?.note || 'Trip cancelled'}</div>
          <div class="tl-time">${request.cancelledAt ? AdudStore.fmt(request.cancelledAt) : '—'}</div>
        </div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const provider = getProviderOrRedirect();
  if (!provider) return;

  loadProviderUI(provider);
  ensureDemoProviderTrip(provider);

  const request = getRequestFromQuery(provider);

  if (!request) {
    const card = qs('.info-card .card-body');
    if (card) card.innerHTML = '<p>No provider trip found / لا توجد رحلة للمزود</p>';

    const timelineBody = qs('.timeline-body');
    if (timelineBody) timelineBody.innerHTML = '<p>No timeline available / لا يوجد تسلسل زمني</p>';
    return;
  }

  renderRequestDetails(request);
  renderTimeline(request);
});