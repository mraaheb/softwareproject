function qs(s) {
  return document.querySelector(s);
}

function qsa(s) {
  return [...document.querySelectorAll(s)];
}

const reqs = AdudStore.getRequests();
const id = new URLSearchParams(location.search).get('id');

const request =
  (id
    ? reqs.find(r => r.id === id)
    : reqs.find(r => ['Requested', 'Assigned', 'Picked Up', 'Arrived'].includes(r.status))) ||
  reqs[0];

if (request) {
  qs('.req-id').textContent = `# Request ${request.id}`;

  const rows = qsa('.detail-row .value');
  rows[0].textContent = request.pickup;
  rows[1].textContent = request.dest;
  rows[2].textContent = `${request.date} — ${request.time}`;
  rows[3].textContent = request.providerName || 'Pending assignment';

  qs('.status-current .main-st').textContent = `${request.status} / ${request.status}`;
  qs('.status-current .sub-st').textContent =
    request.timeline.at(-1)?.note || 'Latest update';

  qs('.mobility-tags').innerHTML =
    (request.mobility || []).map(m => `<span class="mob-tag">${m}</span>`).join('') ||
    '<span class="mob-tag">No special requirements</span>';

  const gs = AdudStore.getGuardians();
  const g = gs.find(x => x.id === request.guardianId);

  if (g) {
    document.querySelector('.escort-info').innerHTML = `
      <h4>🏥 Hospital Escort Assigned / تم تعيين مرافق</h4>
      <div class="escort-row"><span>Name:</span> ${g.name}</div>
      <div class="escort-row"><span>Phone:</span> ${g.phone}</div>
      <div class="escort-row"><span>Notes:</span> ${g.notes || '—'}</div>
    `;
  }

  const timeline = document.querySelector('.timeline');
  const workflow = ['Requested', 'Assigned', 'Picked Up', 'Arrived', 'Completed'];
  const existing = Object.fromEntries((request.timeline || []).map(t => [t.status, t]));

  timeline.innerHTML = workflow
    .map(status => {
      const entry = existing[status];
      const current = status === request.status;
      const done = !!entry && !current;

      return `
        <div class="timeline-item">
          <div class="tl-dot ${done ? 'done' : current ? 'active' : 'pending'}">
            ${done ? '✓' : current ? '●' : ''}
          </div>
          <div class="tl-content">
            <div class="tl-title ${current ? 'active-text' : !entry ? 'pending-text' : ''}">
              ${status}${current ? ' ← Current' : ''}
            </div>
            <div class="tl-sub">${entry ? entry.note : 'Waiting for next update'}</div>
            <div class="tl-time ${entry ? '' : 'pending-time'}">
              ${entry ? AdudStore.fmt(entry.time) : '⏳ Pending'}
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}