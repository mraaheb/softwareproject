function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

    if (!email || !password) {
        alert("Enter email and password / أدخل البريد وكلمة المرور");
        return;
    }

    // دخول مباشر بدون تحقق
    AdudStore.setCurrentUser({
        id: "TEMP",
        role: role,
        name: email,
        email: email
    });

    if (role === "provider") {
        window.location.href = "../provider-dashboard/provider-dashboard.html";
    } else {
        window.location.href = "../dashboard/dashboard.html";
    }
}