/**
 * التبديل بين خيارات متطلبات التنقل
 * @param {HTMLElement} el - عنصر خيار التنقل
 */
function toggleMobility(el) {
    el.classList.toggle('checked');
    const cb = el.querySelector('input[type="checkbox"]');
    if (cb) {
        cb.checked = el.classList.contains('checked');
    }
}

/**
 * التبديل بين حالة طلب مرافق المستشفى
 * @param {HTMLElement} el - عنصر بنر المرافق
 */
function toggleEscort(el) {
    el.classList.toggle('active');
    const check = document.getElementById('escortCheck');
    if (check) {
        check.textContent = el.classList.contains('active') ? '✓' : '';
    }
}

/**
 * تطبيق بيانات الملف الطبي تلقائياً
 */
function applyProfile() {
    // تحديد الكرسي المتحرك والمرافق
    const wheelchair = document.getElementById('wheelchairOpt');
    const companion = document.getElementById('companionOpt');
    
    if (!wheelchair.classList.contains('checked')) toggleMobility(wheelchair);
    if (!companion.classList.contains('checked')) toggleMobility(companion);
    
    // تحديث شكل البنر الخاص بالملف الطبي
    const banner = document.getElementById('autofillBanner');
    const bannerText = document.getElementById('autofillText');
    const applyBtn = document.getElementById('applyBtn');
    
    if (banner) banner.style.background = '#E6FFED';
    if (bannerText) {
        bannerText.innerHTML = '<strong>✓ Profile applied!</strong> Wheelchair & Companion auto-filled. / تم تطبيق بيانات ملفك بنجاح';
    }
    if (applyBtn) applyBtn.style.display = 'none';
}

/**
 * إرسال الطلب والتحقق من الحقول
 */
function submitRequest() {
    const pickup = document.getElementById('pickup').value;
    const dest = document.getElementById('destination').value;
    const date = document.getElementById('apptDate').value;
    const time = document.getElementById('apptTime').value;

    if (!pickup || !dest || !date || !time) {
        alert('Please fill in all required fields. / يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    // إظهار نافذة النجاح
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('show');
    }
}