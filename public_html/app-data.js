(function () {
  const KEYS = {
    users: 'adud_users',
    currentUser: 'adud_current_user',
    profile: 'adud_medical_profile',
    requests: 'adud_requests',
    guardians: 'adud_guardians'
  };

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function fmt(dt) {
    const d = new Date(dt);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function nextId(prefix = 'REQ') {
    return prefix + Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  function seed() {
    if (!localStorage.getItem(KEYS.users)) {
      write(KEYS.users, [
        {
          id: 'PAT001',
          role: 'patient',
          name: 'Lujain Almajyul',
          email: 'lujain@email.com',
          password: '123456'
        },
        {
          id: 'PROV001',
          role: 'provider',
          name: 'Al Shifaa Transport',
          email: 'provider@adud.com',
          password: '123456'
        }
      ]);
    }

    if (!localStorage.getItem(KEYS.profile)) {
      write(KEYS.profile, {
        fullName: 'Lujain Almajyul',
        phone: '0501234567',
        email: 'lujain@email.com',
        dob: '1999-05-14',
        wheelchair: true,
        oxygen: false,
        companion: true,
        notes: 'Patient requires wheelchair-accessible vehicle. Companion seat needed for caregiver.'
      });
    }

    if (!localStorage.getItem(KEYS.guardians)) {
      write(KEYS.guardians, [
        {
          id: 'G001',
          name: 'Sara Al-Mutairi',
          phone: '0509876543',
          notes: 'Hospital escort'
        },
        {
          id: 'G002',
          name: 'Ahmed Al-Otaibi',
          phone: '0501231234',
          notes: 'Companion support'
        }
      ]);
    }

    if (!localStorage.getItem(KEYS.requests)) {
      const demo = [
        {
          id: 'REQ001',
          pickup: 'King Fahad District, Riyadh',
          dest: 'King Saud Medical City',
          date: '2026-03-26',
          time: '09:00',
          mobility: ['Wheelchair', 'Companion'],
          notes: '',
          escort: true,
          guardianId: 'G001',
          providerId: 'PROV001',
          providerName: 'Al Shifaa Transport',
          status: 'Assigned',
          createdAt: '2026-03-26T07:30:00',
          updatedAt: '2026-03-26T08:10:00',
          cancelledAt: null,
          timeline: [
            {
              status: 'Requested',
              time: '2026-03-26T07:30:00',
              note: 'Transport request submitted successfully'
            },
            {
              status: 'Assigned',
              time: '2026-03-26T08:10:00',
              note: 'Request accepted by Al Shifaa Medical Transport'
            }
          ]
        },
        {
          id: 'REQ002',
          pickup: 'Al Rawdah District',
          dest: 'King Khalid University Hospital',
          date: '2026-03-20',
          time: '08:00',
          mobility: ['Wheelchair', 'Companion'],
          notes: '',
          escort: true,
          guardianId: 'G001',
          providerId: 'PROV001',
          providerName: 'Al Shifaa Transport',
          status: 'Completed',
          createdAt: '2026-03-20T06:40:00',
          updatedAt: '2026-03-20T09:00:00',
          cancelledAt: null,
          timeline: [
            {
              status: 'Requested',
              time: '2026-03-20T06:40:00',
              note: 'Transport request submitted successfully'
            },
            {
              status: 'Assigned',
              time: '2026-03-20T06:55:00',
              note: 'Provider accepted the request'
            },
            {
              status: 'Picked Up',
              time: '2026-03-20T07:50:00',
              note: 'Patient picked up'
            },
            {
              status: 'Arrived',
              time: '2026-03-20T08:35:00',
              note: 'Arrived at destination'
            },
            {
              status: 'Completed',
              time: '2026-03-20T09:00:00',
              note: 'Trip completed successfully'
            }
          ]
        },
        {
          id: 'REQ003',
          pickup: 'Al Nakheel District',
          dest: 'Riyadh National Hospital',
          date: '2026-03-22',
          time: '11:00',
          mobility: ['Oxygen'],
          notes: '',
          escort: false,
          guardianId: null,
          providerId: null,
          providerName: '—',
          status: 'Cancelled',
          createdAt: '2026-03-22T08:30:00',
          updatedAt: '2026-03-22T09:10:00',
          cancelledAt: '2026-03-22T09:10:00',
          timeline: [
            {
              status: 'Requested',
              time: '2026-03-22T08:30:00',
              note: 'Transport request submitted successfully'
            },
            {
              status: 'Cancelled',
              time: '2026-03-22T09:10:00',
              note: 'Cancelled by patient'
            }
          ]
        }
      ];

      write(KEYS.requests, demo);
    }
  }

  function getUsers() {
    return read(KEYS.users, []);
  }

  function saveUsers(v) {
    write(KEYS.users, v);
  }

  function getProfile() {
    return read(KEYS.profile, {});
  }

  function saveProfile(v) {
    write(KEYS.profile, v);
  }

  function getRequests() {
    return read(KEYS.requests, []);
  }

  function saveRequests(v) {
    write(KEYS.requests, v);
  }

  function getGuardians() {
    return read(KEYS.guardians, []);
  }

  function saveGuardians(v) {
    write(KEYS.guardians, v);
  }

  function getCurrentUser() {
    return read(KEYS.currentUser, null);
  }

  function setCurrentUser(v) {
    write(KEYS.currentUser, v);
  }

  function logout() {
    localStorage.removeItem(KEYS.currentUser);
  }

  function registerUser(user) {
    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      throw new Error('Email already exists');
    }
    user.id = user.role === 'provider' ? nextId('PROV') : nextId('PAT');
    users.push(user);
    saveUsers(users);
    return user;
  }

  function login(email, password, role) {
    const u = getUsers().find(
      x =>
        x.email.toLowerCase() === email.toLowerCase() &&
        x.password === password &&
        (!role || x.role === role)
    );
    if (!u) return null;

    setCurrentUser({
      id: u.id,
      role: u.role,
      name: u.name,
      email: u.email
    });

    return u;
  }

  window.AdudStore = {
    KEYS,
    seed,
    fmt,
    nowIso,
    nextId,
    getUsers,
    saveUsers,
    getProfile,
    saveProfile,
    getRequests,
    saveRequests,
    getGuardians,
    saveGuardians,
    getCurrentUser,
    setCurrentUser,
    logout,
    registerUser,
    login
  };

  seed();
})();