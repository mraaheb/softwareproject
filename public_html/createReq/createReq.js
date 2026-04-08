function qs(id) {
  return document.getElementById(id);
}

let savedMode = 'create';

function toggleMobility(el) {
  if (!el) return;
  el.classList.toggle('checked');
  const cb = el.querySelector('input[type="checkbox"]');
  if (cb) cb.checked = el.classList.contains('checked');
}

function toggleEscort(el) {
  if (!el) return;
  el.classList.toggle('active');
  const check = qs('escortCheck');
  if (check) {
    check.textContent = el.classList.contains('active') ? '✓' : '';
  }
}

function applyProfile() {
  const p = AdudStore.getProfile ? AdudStore.getProfile() : {};

  [
    ['wheelchair', 'wheelchairOpt'],
    ['oxygen', 'oxygenOpt'],
    ['companion', 'companionOpt']
  ].forEach(([key, id]) => {
    const el = qs(id);
    if (!el) return;

    const shouldBeChecked = !!p[key];
    const isChecked = el.classList.contains('checked');

    if (shouldBeChecked !== isChecked) {
      toggleMobility(el);
    }
  });

  if (qs('notes')) {
    qs('notes').value = p.notes || '';
  }

  if (qs('autofillText')) {
    qs('autofillText').innerHTML =
      '<strong>✓ Profile applied!</strong> Your medical profile has been applied successfully.';
  }

  if (qs('applyBtn')) {
    qs('applyBtn').style.display = 'none';
  }
}

function getFormData() {
  return {
    pickup: qs('pickup') ? qs('pickup').value.trim() : '',
    dest: qs('destination') ? qs('destination').value.trim() : '',
    date: qs('apptDate') ? qs('apptDate').value : '',
    time: qs('apptTime') ? qs('apptTime').value : '',
    mobility: [
      ['wheelchairOpt', 'Wheelchair'],
      ['oxygenOpt', 'Oxygen'],
      ['companionOpt', 'Companion']
    ]
      .filter(([id]) => qs(id) && qs(id).classList.contains('checked'))
      .map(([, name]) => name),
    notes: qs('notes') ? qs('notes').value.trim() : '',
    escort: qs('escortBanner') ? qs('escortBanner').classList.contains('active') : false
  };
}

function fillForm(request) {
  if (qs('pickup')) qs('pickup').value = request.pickup || '';
  if (qs('destination')) qs('destination').value = request.dest || '';
  if (qs('apptDate')) qs('apptDate').value = request.date || '';
  if (qs('apptTime')) qs('apptTime').value = request.time || '';
  if (qs('notes')) qs('notes').value = request.notes || '';

  [
    ['Wheelchair', 'wheelchairOpt'],
    ['Oxygen', 'oxygenOpt'],
    ['Companion', 'companionOpt']
  ].forEach(([name, id]) => {
    const el = qs(id);
    if (!el) return;

    const shouldBeChecked = (request.mobility || []).includes(name);
    const isChecked = el.classList.contains('checked');

    if (shouldBeChecked !== isChecked) {
      toggleMobility(el);
    }
  });

  const escortBanner = qs('escortBanner');
  if (escortBanner) {
    const shouldEscort = !!request.escort;
    const isEscort = escortBanner.classList.contains('active');

    if (shouldEscort !== isEscort) {
      toggleEscort(escortBanner);
    }
  }
}

function validateForm(data) {
  if (!data.pickup || !data.dest || !data.date || !data.time) {
    alert('Please fill in all required fields / الرجاء تعبئة جميع الحقول المطلوبة');
    return false;
  }
  return true;
}

function showSuccessModal(mode) {
  savedMode = mode || 'create';

  const modal = qs('successModal');
  const modalTitle = qs('modalTitle');
  const modalSub = qs('modalSub');

  if (modalTitle && modalSub) {
    if (savedMode === 'edit') {
      modalTitle.textContent = 'Request Updated! / تم تحديث الطلب';
      modalSub.innerHTML =
        'Your transport request has been updated successfully. The request is still in <strong>Requested</strong> status.';
    } else {
      modalTitle.textContent = 'Request Submitted! / تم إرسال الطلب';
      modalSub.innerHTML =
        'Your transport request has been submitted successfully with status <strong>Requested</strong>. A service provider will review it shortly.';
    }
  }

  if (modal) {
    modal.classList.add('show');
  } else {
    window.location.href = '../dashboard/dashboard.html';
  }
}

function goAfterSave() {
  window.location.href = '../dashboard/dashboard.html';
}

function submitRequest() {
  const data = getFormData();

  if (!validateForm(data)) return;

  if (
    !AdudStore ||
    typeof AdudStore.getRequests !== 'function' ||
    typeof AdudStore.saveRequests !== 'function' ||
    typeof AdudStore.nowIso !== 'function' ||
    typeof AdudStore.nextId !== 'function'
  ) {
    alert('Request storage functions are missing in app-data.js');
    return;
  }

  const requests = AdudStore.getRequests();
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  if (editId) {
    const request = requests.find(r => r.id === editId);

    if (!request) {
      alert('Request not found / الطلب غير موجود');
      return;
    }

    if (request.status !== 'Requested') {
      alert('You can only edit the request before provider acceptance / يمكن تعديل الطلب فقط قبل قبول مزود الخدمة');
      return;
    }

    request.pickup = data.pickup;
    request.dest = data.dest;
    request.date = data.date;
    request.time = data.time;
    request.mobility = data.mobility;
    request.notes = data.notes;
    request.escort = data.escort;
    request.updatedAt = AdudStore.nowIso();

    if (!request.timeline) request.timeline = [];
    request.timeline.push({
      status: 'Updated',
      time: request.updatedAt,
      note: 'Request details edited by patient'
    });

    AdudStore.saveRequests(requests);
    showSuccessModal('edit');
    return;
  }

  const now = AdudStore.nowIso();

  requests.push({
    id: AdudStore.nextId('REQ'),
    pickup: data.pickup,
    dest: data.dest,
    date: data.date,
    time: data.time,
    mobility: data.mobility,
    notes: data.notes,
    escort: data.escort,
    guardianId: null,
    providerId: null,
    providerName: '—',
    status: 'Requested',
    createdAt: now,
    updatedAt: now,
    cancelledAt: null,
    timeline: [
      {
        status: 'Requested',
        time: now,
        note: 'Transport request submitted successfully'
      }
    ]
  });

  AdudStore.saveRequests(requests);
  showSuccessModal('create');
}

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  if (editId) {
    const requests = AdudStore.getRequests ? AdudStore.getRequests() : [];
    const request = requests.find(r => r.id === editId);

    if (!request) {
      alert('Request not found / الطلب غير موجود');
      window.location.href = '../dashboard/dashboard.html';
      return;
    }

    if (request.status !== 'Requested') {
      alert('This request can no longer be edited / لا يمكن تعديل هذا الطلب الآن');
      window.location.href = '../dashboard/dashboard.html';
      return;
    }

    fillForm(request);

    const pageTitle = document.querySelector('.topbar h1');
    if (pageTitle) {
      pageTitle.textContent = 'Edit Transport Request / تعديل الطلب';
    }

    const submitBtn = document.querySelector('.btn-submit');
    if (submitBtn) {
      submitBtn.textContent = 'Save Changes / حفظ التعديلات';
    }
  }
});