// بيانات تجريبية أولية
let incomingRequests = [
    { id: '008', pickup: 'Al Malaz District', dest: 'King Fahad Medical City', date: '28 Mar 2026', time: '10:00 AM', meta: ['♿ Wheelchair', '🤝 Companion'] },
    { id: '009', pickup: 'Al Rawdah District', dest: 'National Guard Hospital', date: '29 Mar 2026', time: '08:30 AM', meta: ['🫁 Oxygen'] }
];

let activeTrips = [
    { id: '001', route: 'King Fahad District → King Saud Medical City', meta: '26 Mar 2026 — 09:00 AM', status: 'Assigned', statusClass: 'pill-assigned' },
    { id: '010', route: 'Al Nakheel District → Riyadh National Hospital', meta: '26 Mar 2026 — 02:00 PM', status: 'Picked Up', statusClass: 'pill-pickedup' }
];

let currentEditingId = null;
let tempSelectedStatus = '';

// --- الدوال الأساسية ---

function renderAll() {
    renderRequests();
    renderActiveTrips();
    updateStats();
}

function renderRequests() {
    const container = document.getElementById('requests-container');
    container.innerHTML = incomingRequests.map(req => `
        <div class="req-card new-req" id="req-${req.id}">
            <div class="req-top">
                <span class="req-id-badge">#${req.id} — New</span>
                <span class="req-datetime">📅 ${req.date} — ${req.time}</span>
            </div>
            <div class="req-route">
                <span class="req-point">📍 ${req.pickup}</span>
                <span class="req-arrow">→</span>
                <span class="req-point">🏥 ${req.dest}</span>
            </div>
            <div class="req-meta">
                ${req.meta.map(m => `<span class="meta-tag">${m}</span>`).join('')}
            </div>
            <div class="req-actions">
                <button class="btn-reject" onclick="handleReject('${req.id}')">✗ Reject</button>
                <button class="btn-accept" onclick="handleAccept('${req.id}')">✓ Accept</button>
            </div>
        </div>
    `).join('');
}

function renderActiveTrips() {
    const container = document.getElementById('active-trips-container');
    container.innerHTML = activeTrips.map(trip => `
        <div class="trip-row">
            <div class="trip-info">
                <div class="trip-route-sm">${trip.route}</div>
                <div class="trip-meta-sm">#${trip.id} • ${trip.meta}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="status-pill ${trip.statusClass}"><span class="dot"></span>${trip.status}</span>
                <button class="btn-update" onclick="openUpdateModal('${trip.id}')">Update Status →</button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    document.getElementById('count-new').textContent = incomingRequests.length;
    document.getElementById('count-active').textContent = activeTrips.length;
}

// --- معالجة الأفعال ---

function handleAccept(id) {
    const reqIndex = incomingRequests.findIndex(r => r.id === id);
    const req = incomingRequests[reqIndex];
    
    // نقل للرحلات النشطة
    activeTrips.push({
        id: req.id,
        route: `📍 ${req.pickup} → 🏥 ${req.dest}`,
        meta: `${req.date} — ${req.time}`,
        status: 'Assigned',
        statusClass: 'pill-assigned'
    });
    
    incomingRequests.splice(reqIndex, 1);
    renderAll();
    showToast(`✅ Request #${id} accepted and assigned!`, 'success');
}

function handleReject(id) {
    incomingRequests = incomingRequests.filter(r => r.id !== id);
    renderAll();
    showToast(`Request #${id} has been rejected.`, 'error');
}

// --- نظام الـ Modal ---

function openUpdateModal(id) {
    currentEditingId = id;
    tempSelectedStatus = '';
    document.querySelectorAll('.status-option').forEach(o => {
        o.classList.remove('selected');
        o.querySelector('input').checked = false;
    });
    document.getElementById('updateModal').classList.add('show');
}

function selectStatus(el, val) {
    document.querySelectorAll('.status-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    el.querySelector('input').checked = true;
    tempSelectedStatus = val;
}

function saveStatus() {
    if (!tempSelectedStatus) return alert('Please select a status');
    
    const trip = activeTrips.find(t => t.id === currentEditingId);
    if (trip) {
        trip.status = tempSelectedStatus;
        // تغيير لون الـ Pill بناءً على الحالة
        if (tempSelectedStatus === 'Completed') trip.statusClass = 'pill-completed'; 
        else if (tempSelectedStatus === 'Picked Up') trip.statusClass = 'pill-pickedup';
        else trip.statusClass = 'pill-assigned';
    }
    
    closeUpdateModal();
    renderActiveTrips();
    showToast(`✅ Status updated to "${tempSelectedStatus}"`, 'success');
}

function closeUpdateModal() {
    document.getElementById('updateModal').classList.remove('show');
}

function showToast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
}

// تشغيل عند التحميل
renderAll();