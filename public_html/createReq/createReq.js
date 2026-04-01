function qs(id) {
  return document.getElementById(id);
}

function toggleMobility(el) {
  el.classList.toggle('checked');
  const cb = el.querySelector('input[type="checkbox"]');
  if (cb) cb.checked = el.classList.contains('checked');
}

function toggleEscort(el) {
  el.classList.toggle('active');
  qs('escortCheck').textContent = el.classList.contains('active') ? '✓' : '';
}

function applyProfile() {
  const p = AdudStore.getProfile();

  [
    ['wheelchair', 'wheelchairOpt'],
    ['oxygen', 'oxygenOpt'],
    ['companion', 'companionOpt']
  ].forEach(([k, id]) => {
    const el = qs(id);
    const want = !!p[k];
    if (el.classList.contains('checked') !== want) toggleMobility(el);
  });

  qs('notes').value = p.notes || '';
  qs('autofillText').innerHTML =
    '<strong>✓ Profile applied!</strong> Your medical profile was applied successfully.';
  qs('applyBtn').style.display = 'none';
}

function formData() {
  return {
    pickup: qs('pickup').value.trim(),
    dest: qs('destination').value.trim(),
    date: qs('apptDate').value,
    time: qs('apptTime').value,
    mobility: [
      ['wheelchairOpt', 'Wheelchair'],
      ['oxygenOpt', 'Oxygen'],
      ['companionOpt', 'Companion']
    ]
      .filter(([id]) => qs(id).classList.contains('checked'))
      .map(([, name]) => name),
    notes: qs('notes').value.trim(),
    escort: qs('escortBanner').classList.contains('active')
  };
}

function fillForm(r) {
  qs('pickup').value = r.pickup;
  qs('destination').value = r.dest;
  qs('apptDate').value = r.date;
  qs('apptTime').value = r.time;
  qs('notes').value = r.notes || '';

  [
    ['Wheelchair', 'wheelchairOpt'],
    ['Oxygen', 'oxygenOpt'],
    ['Companion', 'companionOpt']
  ].forEach(([name, id]) => {
    const should = (r.mobility || []).includes(name);
    const el = qs(id);
    if (el.classList.contains('checked') !== should) toggleMobility(el);
  });

  if (!!r.escort !== qs('escortBanner').classList.contains('active')) {
    toggleEscort(qs('escortBanner'));
  }
}

function submitRequest() {
  const data = formData();

  if (!data.pickup || !data.dest || !data.date || !data.time) {
    return alert('Please fill in all required fields. / يرجى ملء جميع الحقول المطلوبة');
  }

  const reqs = AdudStore.getRequests();
  const id = new URLSearchParams(location.search).get('id');

  if (id) {
    const r = reqs.find(x => x.id === id);
    if (!r || r.status !== 'Requested') {
      return alert('Only requested trips can be edited before provider acceptance.');
    }

    Object.assign(r, data, { updatedAt: AdudStore.nowIso() });
    r.timeline.push({
      status: 'Updated',
      time: r.updatedAt,
      note: 'Request details edited by patient'
    });
  } else {
    const now = AdudStore.nowIso();

    reqs.push({
      id: AdudStore.nextId('REQ'),
      ...data,
      status: 'Requested',
      createdAt: now,
      updatedAt: now,
      cancelledAt: null,
      guardianId: null,
      providerId: null,
      providerName: '—',
      timeline: [
        {
          status: 'Requested',
          time: now,
          note: 'Transport request submitted successfully'
        }
      ]
    });
  }

  AdudStore.saveRequests(reqs);
  qs('successModal').classList.add('show');
}

document.addEventListener('DOMContentLoaded', () => {
  const id = new URLSearchParams(location.search).get('id');
  if (id) {
    const r = AdudStore.getRequests().find(x => x.id === id);
    if (r) fillForm(r);
    const topbarTitle = document.querySelector('.topbar h1');
    if (topbarTitle) {
      topbarTitle.textContent = 'Edit Transport Request / تعديل الطلب';
    }
  }
});