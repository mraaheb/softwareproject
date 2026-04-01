function register(){

    const name = document.getElementById("name").value;
    const role = document.getElementById("role").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if(!name || !email || !password){
        alert("Fill all fields");
        return;
    }

    try{
        const user = AdudStore.registerUser({
            name,
            role,
            email,
            password
        });

        alert("Registered successfully");

        window.location.href = "login.html";

    }catch(e){
        alert(e.message);
    }
}