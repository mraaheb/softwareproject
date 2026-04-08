function getEl(id) {
  return document.getElementById(id);
}

function getProfileSafe() {
  return AdudStore.getProfile() || {};
}

function getCurrentUserSafe() {
  return AdudStore.getCurrentUser() || {};
}

function updateSummary(profile, currentUser) {
  const fullName = profile.fullName || currentUser.name || '';
  const email = profile.email || currentUser.email || '';
  const phone = profile.phone || '';

  const profileName = document.querySelector('.profile-name');
  if (profileName) profileName.textContent = fullName;

  const infoVals = document.querySelectorAll('.info-row .info-val');
  if (infoVals.length >= 5) {
    infoVals[0].textContent = email;
    infoVals[1].textContent = phone;

    infoVals[2].textContent = profile.wheelchair ? '✓ Required' : '✗ Not needed';
    infoVals[2].className = 'info-val ' + (profile.wheelchair ? 'highlight-green' : 'highlight-gray');

    infoVals[3].textContent = profile.companion ? '✓ Required' : '✗ Not needed';
    infoVals[3].className = 'info-val ' + (profile.companion ? 'highlight-green' : 'highlight-gray');

    infoVals[4].textContent = profile.oxygen ? '✓ Required' : '✗ Not needed';
    infoVals[4].className = 'info-val ' + (profile.oxygen ? 'highlight-green' : 'highlight-gray');
  }

  const userCardName = document.querySelector('.user-card .name');
  if (userCardName) userCardName.textContent = fullName;

  const avatarBig = document.querySelector('.avatar-big');
  if (avatarBig) avatarBig.textContent = fullName ? fullName.charAt(0).toUpperCase() : 'U';

  const userAvatar = document.querySelector('.user-avatar');
  if (userAvatar) userAvatar.textContent = fullName ? fullName.charAt(0).toUpperCase() : 'U';
}

function setMobilityState(optionId, enabled) {
  const el = getEl(optionId);
  if (!el) return;

  el.classList.toggle('checked', !!enabled);

  const chk = el.querySelector('.mobility-check');
  if (chk) {
    chk.textContent = enabled ? '✓' : '';
  }
}

function fillProfile() {
  const p = getProfileSafe();
  const currentUser = getCurrentUserSafe();

  const fullName = p.fullName || currentUser.name || '';
  const email = p.email || currentUser.email || '';

  getEl('fname').value = fullName;
  getEl('phone').value = p.phone || '';
  getEl('email').value = email;
  getEl('dob').value = p.dob || '';
  getEl('notes').value = p.notes || '';

  setMobilityState('wheelchairOpt', !!p.wheelchair);
  setMobilityState('oxygenOpt', !!p.oxygen);
  setMobilityState('companionOpt', !!p.companion);

  updateSummary(
    {
      ...p,
      fullName,
      email
    },
    currentUser
  );
}

function toggleEdit() {
  ['fname', 'phone', 'email', 'dob', 'notes'].forEach(id => {
    const el = getEl(id);
    if (el) el.disabled = false;
  });

  ['wheelchairOpt', 'oxygenOpt', 'companionOpt'].forEach(id => {
    const el = getEl(id);
    if (el) el.classList.remove('disabled');
  });

  const editBtn = getEl('editBtn');
  const formFooter = getEl('formFooter');

  if (editBtn) editBtn.style.display = 'none';
  if (formFooter) formFooter.style.display = 'flex';
}

function cancelEdit() {
  ['fname', 'phone', 'email', 'dob', 'notes'].forEach(id => {
    const el = getEl(id);
    if (el) el.disabled = true;
  });

  ['wheelchairOpt', 'oxygenOpt', 'companionOpt'].forEach(id => {
    const el = getEl(id);
    if (el) el.classList.add('disabled');
  });

  const editBtn = getEl('editBtn');
  const formFooter = getEl('formFooter');

  if (editBtn) editBtn.style.display = 'flex';
  if (formFooter) formFooter.style.display = 'none';

  fillProfile();
}

function saveProfile() {
  const fullName = getEl('fname').value.trim();
  const phone = getEl('phone').value.trim();
  const email = getEl('email').value.trim();
  const dob = getEl('dob').value;
  const notes = getEl('notes').value.trim();

  if (!fullName || !phone || !email || !dob) {
    alert('Please fill in all required fields.');
    return;
  }

  const profileData = {
    fullName: fullName,
    phone: phone,
    email: email,
    dob: dob,
    wheelchair: getEl('wheelchairOpt').classList.contains('checked'),
    oxygen: getEl('oxygenOpt').classList.contains('checked'),
    companion: getEl('companionOpt').classList.contains('checked'),
    notes: notes
  };

  AdudStore.saveProfile(profileData);

  const currentUser = AdudStore.getCurrentUser();
  if (currentUser) {
    currentUser.name = fullName;
    currentUser.email = email;
    AdudStore.setCurrentUser(currentUser);
  }

  cancelEdit();

  const toast = getEl('toast');
  if (toast) {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

function toggleMobility(el) {
  if (!el || el.classList.contains('disabled')) return;

  el.classList.toggle('checked');

  const c = el.querySelector('.mobility-check');
  if (c) {
    c.textContent = el.classList.contains('checked') ? '✓' : '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fillProfile();
});