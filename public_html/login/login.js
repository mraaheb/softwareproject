function login(){

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    const user = AdudStore.login(email,password,role);

    if(!user){
        alert("Wrong login");
        return;
    }

    if(role === "provider"){
        window.location.href = "../provider-dashboard/provider-dashboard.html";
    } else {
        window.location.href = "../dashboard/dashboard.html";
    }
}