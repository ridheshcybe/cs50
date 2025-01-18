
const btn = document.getElementById("formbtn");
const username = document.getElementById("username");
const password = document.getElementById("password");
const confirmation = document.getElementById("confirmation");

async function submit() {
    try {
        const response = await fetch("/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username.value,
                password: password.value,
                confirmation: confirmation.value
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
    if (!confirmation.value) return alert("confirmation dosen't exists");
    if (confirmation.value !== password.value) return alert("Password dosen't equal confirmation");

    submit().then(() => { }).catch(alert);
}
