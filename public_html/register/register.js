const patientFields = document.getElementById("patientFields");

function getRole() {
  return document.querySelector('input[name="role"]:checked').value;
}

function togglePatient() {
  if (getRole() === "patient") {
    patientFields.style.display = "block";
  } else {
    patientFields.style.display = "none";
  }
}

document.querySelectorAll('input[name="role"]').forEach(r => {
  r.addEventListener("change", togglePatient);
});

togglePatient();

function register() {
  const name = document.getElementById("name").value.trim();
  const role = getRole();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    alert("Fill all fields");
    return;
  }

  let profile = null;

  if (role === "patient") {
    const phone = document.getElementById("phone").value;
    const dob = document.getElementById("dob").value;

    if (!phone || !dob) {
      alert("Complete medical info");
      return;
    }

    profile = {
      fullName: name,
      email,
      phone,
      dob,
      wheelchair: document.getElementById("wheelchair").checked,
      oxygen: document.getElementById("oxygen").checked,
      companion: document.getElementById("companion").checked
    };
  }

  try {
    const user = AdudStore.registerUser({
      name,
      role,
      email,
      password
    });

    if (profile) {
      AdudStore.saveProfile(profile);
    }

    AdudStore.setCurrentUser(user);

    alert("Done!");

    window.location.href = role === "patient"
      ? "../medical-profile/medical-profile.html"
      : "../provider-dashboard/provider-dashboard.html";

  } catch (e) {
    alert(e.message);
  }
}