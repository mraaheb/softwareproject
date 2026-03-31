function navigateTo(url) {
    if (url) {
        window.location.href = url;
    }
}

function handleLogout() {
    const confirmLogout = confirm("Are you sure you want to logout? / هل أنت متأكد من تسجيل الخروج؟");
    if (confirmLogout) {
        window.location.href = '../login/login.html';
    }
}

function cancelRequest(requestId) {
    const confirmCancel = confirm(`Cancel request ${requestId}? / هل تريد إلغاء الطلب؟`);
    if (confirmCancel) {
        alert("Request cancelled successfully / تم إلغاء الطلب بنجاح");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard Loaded");
});