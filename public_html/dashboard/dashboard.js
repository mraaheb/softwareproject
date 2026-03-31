/**
 * وظيفة التنقل بين الصفحات
 * @param {string} url - رابط الصفحة المستهدفة
 */
function navigateTo(url) {
    if (url) {
        window.location.href = url;
    }
}

/**
 * معالجة تسجيل الخروج
 */
function handleLogout() {
    const confirmLogout = confirm("Are you sure you want to logout? / هل أنت متأكد من تسجيل الخروج؟");
    if (confirmLogout) {
        // هنا يتم مسح الجلسة (Session) أو التوجيه لصفحة تسجيل الدخول
        console.log("Logging out...");
        window.location.href = "login.html"; 
    }
}

/**
 * وظيفة افتراضية لإلغاء طلب (كمثال للتفاعل)
 * @param {string} requestId - معرف الطلب
 */
function cancelRequest(requestId) {
    const confirmCancel = confirm(`Cancel request ${requestId}? / هل تريد إلغاء الطلب؟`);
    if (confirmCancel) {
        alert("Request cancelled successfully / تم إلغاء الطلب بنجاح");
        // هنا يتم استدعاء API للحذف وتحديث الجدول
    }
}

// يمكن إضافة منطق لجلب البيانات ديناميكياً هنا مستقبلاً
document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard Loaded");
});