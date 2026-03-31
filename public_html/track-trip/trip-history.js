/**
 * بيانات الرحلات التجريبية
 */
const trips = [
    { id:'003', pickup:'Al Rawdah District', dest:'King Khalid University Hospital', date:'2026-03-20', time:'08:00 AM', status:'completed', provider:'Al Shifaa Transport', mobility:['♿ Wheelchair','🤝 Companion'], escort:'Sara Al-Mutairi', summary:'Trip completed successfully. Patient arrived on time.' },
    { id:'004', pickup:'Al Sulaimaniyah', dest:'Dr. Sulaiman Al Habib Hospital', date:'2026-03-15', time:'02:00 PM', status:'cancelled', provider:'—', mobility:['♿ Wheelchair'], escort:'None', summary:'Cancelled by patient — appointment rescheduled.' },
    { id:'005', pickup:'Al Malaz District', dest:'King Fahad Medical City', date:'2026-03-10', time:'10:30 AM', status:'completed', provider:'Naqla Medical Transport', mobility:['🫁 Oxygen','🤝 Companion'], escort:'Ahmed Al-Otaibi', summary:'Trip completed. Escort met patient at main entrance.' },
    { id:'006', pickup:'King Fahad District', dest:'National Guard Hospital', date:'2026-03-02', time:'09:00 AM', status:'completed', provider:'Al Shifaa Transport', mobility:['♿ Wheelchair'], escort:'None', summary:'Trip completed on time.' },
    { id:'007', pickup:'Al Nakheel District', dest:'Riyadh National Hospital', date:'2026-02-22', time:'11:00 AM', status:'cancelled', provider:'—', mobility:[], escort:'None', summary:'No service provider accepted within time window.' },
];

/**
 * دالة لعرض الرحلات في الصفحة
 */
function renderTrips(list) {
    const container = document.getElementById('tripsList');
    const empty = document.getElementById('emptyState');
    container.innerHTML = '';

    if (!list.length) {
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    list.forEach(t => {
        const isCompleted = t.status === 'completed';
        container.innerHTML += `
            <div class="trip-card" onclick="showDetail('${t.id}')">
                <div class="trip-card-top">
                    <span class="trip-id">#${t.id}</span>
                    <span class="trip-date">📅 ${t.date} — ${t.time}</span>
                </div>
                <div class="trip-route">
                    <span class="route-point">📍 ${t.pickup}</span>
                    <span class="route-arrow">→</span>
                    <span class="route-point">🏥 ${t.dest}</span>
                </div>
                <div class="trip-card-bottom">
                    <div class="trip-meta">
                        ${t.mobility.map(m => `<span class="meta-chip">${m}</span>`).join('')}
                        ${t.escort !== 'None' ? `<span class="meta-chip">🏥 Escort</span>` : ''}
                    </div>
                    <span class="status-pill ${isCompleted ? 'pill-completed' : 'pill-cancelled'}">
                        <span class="dot"></span>${isCompleted ? 'Completed ✓' : 'Cancelled ✗'}
                    </span>
                </div>
            </div>`;
    });
}

/**
 * دالة لتصفية الرحلات (البحث، الحالة، التاريخ)
 */
function filterTrips() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const date = document.getElementById('dateFilter').value;

    const filtered = trips.filter(t => {
        const matchQuery = !query || t.dest.toLowerCase().includes(query) || t.pickup.toLowerCase().includes(query);
        const matchStatus = !status || t.status === status;
        const matchDate = !date || t.date === date;
        return matchQuery && matchStatus && matchDate;
    });

    renderTrips(filtered);
}

/**
 * مسح جميع الفلاتر
 */
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFilter').value = '';
    renderTrips(trips);
}

/**
 * عرض تفاصيل الرحلة في النافذة المنبثقة (Modal)
 */
function showDetail(id) {
    const t = trips.find(x => x.id === id);
    if (!t) return;

    const isCompleted = t.status === 'completed';
    document.getElementById('modalContent').innerHTML = `
        <div class="modal-detail-row"><span class="modal-icon">🔖</span><div><div class="modal-label">Request ID</div><div class="modal-val">#${t.id}</div></div></div>
        <div class="modal-detail-row"><span class="modal-icon">📍</span><div><div class="modal-label">Pickup</div><div class="modal-val">${t.pickup}</div></div></div>
        <div class="modal-detail-row"><span class="modal-icon">🏥</span><div><div class="modal-label">Destination</div><div class="modal-val">${t.dest}</div></div></div>
        <div class="modal-detail-row"><span class="modal-icon">📅</span><div><div class="modal-label">Date & Time</div><div class="modal-val">${t.date} — ${t.time}</div></div></div>
        <div class="modal-detail-row"><span class="modal-icon">🚐</span><div><div class="modal-label">Provider</div><div class="modal-val">${t.provider}</div></div></div>
        <div class="modal-detail-row"><span class="modal-icon">🤝</span><div><div class="modal-label">Escort</div><div class="modal-val">${t.escort}</div></div></div>
        <div class="modal-detail-row"><span class="modal-icon">${isCompleted ? '✅' : '❌'}</span><div><div class="modal-label">Status</div><div class="modal-val" style="color:${isCompleted ? '#2F855A' : '#C53030'}">${isCompleted ? 'Completed' : 'Cancelled'}</div></div></div>
        <div class="modal-detail-row"><span class="modal-icon">📝</span><div><div class="modal-label">Summary</div><div class="modal-val">${t.summary}</div></div></div>
    `;
    document.getElementById('detailModal').classList.add('show');
}

function closeModal() {
    document.getElementById('detailModal').classList.remove('show');
}

// البدء بعرض جميع الرحلات عند تحميل الصفحة
renderTrips(trips);