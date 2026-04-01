function showMessage(id, msg, isError = true) {
  const box = document.getElementById(id);
  box.textContent = msg;
  box.style.display = 'block';
  box.style.color = isError ? '' : '#2f855a';
  box.style.background = isError ? 'rgba(197,48,48,.08)' : 'rgba(47,133,90,.08)';
}

function hideMessages() {
  ['errorMsg', 'registerMsg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function routeByRole(role) {
  window.location.href =
    role === 'provider'
      ? '../provider-dashboard/provider-dashboard.html'
      : '../dashboard/dashboard.html';
}

function handleLogin() {
  hideMessages();

  const role = document.getElementById('loginRole').value;
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const user = AdudStore.login(email, password, role);

  if (!user) {
    return showMessage(
      'errorMsg',
      'Invalid credentials. استخدم demo: patient lujain@email.com أو provider@adud.com وكلمة المرور 123456'
    );
  }

  routeByRole(user.role);
}

function handleRegister() {
  hideMessages();

  const name = document.getElementById('regName').value.trim();
  const role = document.getElementById('regRole').value;
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!name || !email || !password) {
    return showMessage('registerMsg', 'Please fill all fields / الرجاء تعبئة جميع الحقول');
  }

  if (password.length < 6) {
    return showMessage('registerMsg', 'Password must be at least 6 characters');
  }

  try {
    const user = AdudStore.registerUser({
      name,
      role,
      email,
      password
    });

    AdudStore.setCurrentUser({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email
    });

    showMessage('registerMsg', 'Registered successfully / تم إنشاء الحساب بنجاح', false);

    setTimeout(() => routeByRole(user.role), 700);
  } catch (e) {
    showMessage('registerMsg', e.message || 'Registration failed');
  }
}

function fillDemo(e, role) {
  e.preventDefault();

  document.getElementById('loginRole').value = role;

  if (role === 'provider') {
    document.getElementById('email').value = 'provider@adud.com';
  } else {
    document.getElementById('email').value = 'lujain@email.com';
  }

  document.getElementById('password').value = '123456';
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
      hideMessages();
    });
  });
});