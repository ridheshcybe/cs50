
const btn = document.getElementById("btn");
const username = document.getElementById("username");
const password = document.getElementById("password");

async function submit() {
    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username.value,
                password: password.value
            }),
        });
        const data = await response.text();
        location.href = data;
    } catch (e) {
        alert(`Error: ${JSON.stringify(e)}`)
        console.error(e);
    }
}

btn.onclick = () => {
    if (!username.value) return alert("username dosen't exists");
    if (!password.value) return alert("Password dosen't exist");

    submit().then(() => { }).catch(alert);
}
