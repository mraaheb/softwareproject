/**
 * تفعيل وضع التعديل في الملف الشخصي
 */
function toggleEdit() {
    // تفعيل جميع الحقول
    const fields = ['fname', 'phone', 'email', 'dob', 'notes'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = false;
    });

    // تفعيل خيارات التنقل
    const options = ['wheelchairOpt', 'oxygenOpt', 'companionOpt'];
    options.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('disabled');
    });

    // تبديل الأزرار
    document.getElementById('editBtn').style.display = 'none';
    document.getElementById('formFooter').style.display = 'flex';
}

/**
 * إلغاء التعديل والعودة لوضع العرض فقط
 */
function cancelEdit() {
    const fields = ['fname', 'phone', 'email', 'dob', 'notes'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = true;
    });

    const options = ['wheelchairOpt', 'oxygenOpt', 'companionOpt'];
    options.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('disabled');
    });

    document.getElementById('editBtn').style.display = 'flex';
    document.getElementById('formFooter').style.display = 'none';
}

/**
 * حفظ التغييرات وإظهار إشعار النجاح
 */
function saveProfile() {
    // هنا يتم استدعاء API لحفظ البيانات في قاعدة البيانات مستقبلاً
    
    cancelEdit();
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

/**
 * التبديل بين حالات خيارات التنقل (صح / خطأ)
 * @param {HTMLElement} el - العنصر الذي تم النقر عليه
 */
function toggleMobility(el) {
    if (el.classList.contains('disabled')) return;
    
    el.classList.toggle('checked');
    const check = el.querySelector('.mobility-check');
    if (check) {
        check.textContent = el.classList.contains('checked') ? '✓' : '';
    }
}