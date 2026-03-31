/**
 * معالجة تسجيل الدخول
 */
function handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showError('Please fill in all fields. / يرجى ملء جميع الحقول');
        return;
    }

    if (!isValidEmail(email)) {
        showError('Please enter a valid email. / يرجى إدخال بريد إلكتروني صحيح');
        return;
    }

    // محاكاة تسجيل الدخول (هنا يتم استدعاء API مستقبلاً)
    console.log('Logging in with:', email);
    window.location.href = '../dashboard/dashboard.html';
}

function showError(msg) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// السماح بالضغط على Enter
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
});