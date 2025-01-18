
fetch('/public/globe.svg').then(res => res.text()).then(e => {
    document.getElementById("globe").innerHTML += e;
})

document.getElementById("code").innerHTML = hljs.highlight(
    `<script src="${location.href}:username/track50.js"></script>`,
    { language: 'html' }
).value