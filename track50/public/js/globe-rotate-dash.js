import createGlobe from 'https://cdn.skypack.dev/cobe'

let phi = 0
let canvas = document.getElementById("cobe")

fetch('/getlocations').then(res => res.json()).then(data => {

    const globe = createGlobe(canvas, {
        devicePixelRatio: 2,
        width: 1000,
        height: 1000,
        phi: 0,
        theta: 0,
        dark: 1,
        diffuse: 1.3,
        scale: 1,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [1, 1, 1],
        markerColor: [1, 0.5, 1],
        glowColor: [0.6, 0.6, 0.6],
        offset: [0, 0],
        markers: data.map(e => {
            e.size = 0.1;
            e.location = e.loc;
            return e;
        }),
        onRender: (state) => {
            state.phi = phi
            phi += 0.01
        },
    })
})
