function register() {
  const name = document.getElementById("name").value.trim();
  const role = document.getElementById("role").value;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const user = AdudStore.registerUser({
      name,
      role,
      email,
      password
    });

    alert("Registered successfully!");
    window.location.href = "../dashboard/dashboard.html";
  } catch (e) {
    alert(e.message || "Registration failed.");
  }
}