function fillProfile() {
  const p = AdudStore.getProfile();

  document.getElementById('fname').value = p.fullName || '';
  document.getElementById('phone').value = p.phone || '';
  document.getElementById('email').value = p.email || '';
  document.getElementById('dob').value = p.dob || '';
  document.getElementById('notes').value = p.notes || '';

  [
    ['wheelchair', 'wheelchairOpt'],
    ['oxygen', 'oxygenOpt'],
    ['companion', 'companionOpt']
  ].forEach(([key, id]) => {
    const el = document.getElementById(id);
    el.classList.toggle('checked', !!p[key]);
    const chk = el.querySelector('.mobility-check');
    chk.textContent = !!p[key] ? '✓' : '';
  });
}

function toggleEdit() {
  ['fname', 'phone', 'email', 'dob', 'notes'].forEach(id => {
    document.getElementById(id).disabled = false;
  });

  ['wheelchairOpt', 'oxygenOpt', 'companionOpt'].forEach(id => {
    document.getElementById(id).classList.remove('disabled');
  });

  document.getElementById('editBtn').style.display = 'none';
  document.getElementById('formFooter').style.display = 'flex';
}

function cancelEdit() {
  ['fname', 'phone', 'email', 'dob', 'notes'].forEach(id => {
    document.getElementById(id).disabled = true;
  });

  ['wheelchairOpt', 'oxygenOpt', 'companionOpt'].forEach(id => {
    document.getElementById(id).classList.add('disabled');
  });

  document.getElementById('editBtn').style.display = 'flex';
  document.getElementById('formFooter').style.display = 'none';

  fillProfile();
}

function saveProfile() {
  AdudStore.saveProfile({
    fullName: fname.value.trim(),
    phone: phone.value.trim(),
    email: email.value.trim(),
    dob: dob.value,
    wheelchair: wheelchairOpt.classList.contains('checked'),
    oxygen: oxygenOpt.classList.contains('checked'),
    companion: companionOpt.classList.contains('checked'),
    notes: notes.value.trim()
  });

  cancelEdit();
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function toggleMobility(el) {
  if (el.classList.contains('disabled')) return;
  el.classList.toggle('checked');
  const c = el.querySelector('.mobility-check');
  c.textContent = el.classList.contains('checked') ? '✓' : '';
}

document.addEventListener('DOMContentLoaded', fillProfile);