const KEYS = {
  users: "adud_users",
  currentUser: "adud_current_user",
  profile: "adud_medical_profile",
  requests: "adud_requests"
};

// ==========================
// أدوات مساعدة
// ==========================
function read(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function nextId(prefix = "REQ") {
  return prefix + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ==========================
// المستخدمين
// ==========================
function getUsers() {
  return read(KEYS.users, []);
}

function saveUsers(users) {
  write(KEYS.users, users);
}

// ==========================
// تسجيل مستخدم جديد
// ==========================
function registerUser(user) {
  const users = getUsers();

  const exists = users.find(
    u => u.email.toLowerCase() === user.email.toLowerCase()
  );

  if (exists) {
    throw new Error("Email already exists");
  }

  user.id = user.role === "provider" ? nextId("PROV") : nextId("PAT");
  users.push(user);

  saveUsers(users);
  return user;
}

// ==========================
// تسجيل الدخول
// ==========================
function login(email, password) {
  const users = getUsers();

  const user = users.find(
    u =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password
  );

  if (!user) {
    throw new Error("Invalid email or password");
  }

  setCurrentUser(user);
  return user;
}

// ==========================
// المستخدم الحالي
// ==========================
function setCurrentUser(user) {
  write(KEYS.currentUser, user);
}

function getCurrentUser() {
  return read(KEYS.currentUser, null);
}

function logout() {
  localStorage.removeItem(KEYS.currentUser);
}

// ==========================
// Medical Profile
// ==========================
function saveProfile(profile) {
  write(KEYS.profile, profile);
}

function getProfile() {
  return read(KEYS.profile, {});
}

// ==========================
// Requests
// ==========================
function getRequests() {
  return read(KEYS.requests, []);
}

function saveRequests(requests) {
  write(KEYS.requests, requests);
}

// ==========================
// بيانات تجريبية أول مرة فقط
// ==========================
function seedDemoData() {
  const users = getUsers();
  const requests = getRequests();
  const profile = getProfile();

  if (users.length === 0) {
    saveUsers([
      {
        id: "PAT001",
        role: "patient",
        name: "Lujain Almajyul",
        email: "lujain@email.com",
        password: "123456"
      },
      {
        id: "PROV001",
        role: "provider",
        name: "Al Shifaa Transport",
        email: "provider@adud.com",
        password: "123456"
      }
    ]);
  }

  if (!profile || Object.keys(profile).length === 0) {
    saveProfile({
      fullName: "Lujain Almajyul",
      phone: "0501234567",
      email: "lujain@email.com",
      dob: "1999-05-14",
      wheelchair: true,
      oxygen: false,
      companion: true,
      notes: "Patient requires wheelchair-accessible vehicle."
    });
  }

  if (requests.length === 0) {
    const now = nowIso();

    saveRequests([
      {
        id: "REQ001",
        pickup: "King Fahad District, Riyadh",
        dest: "King Saud Medical City",
        date: "2026-04-10",
        time: "09:00",
        mobility: ["Wheelchair", "Companion"],
        notes: "",
        escort: true,
        guardianId: null,
        providerId: null,
        providerName: "—",
        status: "Requested",
        createdAt: now,
        updatedAt: now,
        cancelledAt: null,
        timeline: [
          {
            status: "Requested",
            time: now,
            note: "Transport request submitted successfully"
          }
        ]
      }
    ]);
  }
}

// شغلي البيانات التجريبية مرة واحدة
seedDemoData();

// ==========================
// Export
// ==========================
window.AdudStore = {
  registerUser,
  login,
  getCurrentUser,
  setCurrentUser,
  logout,
  saveProfile,
  getProfile,
  getRequests,
  saveRequests,
  nowIso,
  nextId
};