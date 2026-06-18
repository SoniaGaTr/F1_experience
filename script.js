const scenes = ["intro", "lights", "race", "final"];

const MAX_SPEED = 330;
const MAX_RPM = 10000;
const TRACK_LENGTH = 2000; // distancia virtual de carrera
let carAudio = null;
let cheerAudio = null;

function showScene(index) {

    const allScenes = document.querySelectorAll(".scene");

    allScenes.forEach(scene => {
        scene.classList.remove("active");
        scene.style.display = "none"; // 👈 fuerza apagado real
    });

    const target = document.getElementById(scenes[index]);

    if (!target) return;

    target.style.display = "flex"; // 👈 fuerza render limpio
    requestAnimationFrame(() => {
        target.classList.add("active");
    });
}

/* =========================
   LIGHTS
========================= */

function startLightsSequence() {
    showScene(1);

    const lights = [
        document.getElementById("l1"),
        document.getElementById("l2"),
        document.getElementById("l3"),
        document.getElementById("l4"),
        document.getElementById("l5")
    ];

    let index = 0;

    const interval = setInterval(() => {

        if (index < lights.length) {
            lights[index]?.classList.add("on");
            playBeep();
            index++;
        } else {
            clearInterval(interval);

            setTimeout(() => {
                playBeep();
                goLightsOut(lights);
            }, 800);
        }

    }, 800);
}

function playBeep() {
    const audio = new Audio("assets/audio/beep.wav");
    audio.volume = 0.4;
    audio.play().catch(() => {});
}

/* =========================
   LIGHTS OUT
========================= */

function goLightsOut(lights) {

    lights.forEach(l => l?.classList.remove("on"));

    carAudio = new Audio("assets/audio/car.mp3");
    carAudio.volume = 0.5;
    carAudio.play().catch(() => {});

    setTimeout(() => {
        showScene(2);
        startRace();
    }, 500);
}

/* =========================
   RACE
========================= */

let speed = 0;
let rpm = 0;
let gear = 1;
let finishStarted = false;
let finishReached = false;

function startRace() {

    const startTime = Date.now();

    const raceInterval = setInterval(() => {

        const t = (Date.now() - startTime) / 1000;
        if (t >= 17 && !finishStarted) {
            finishStarted = true;
            startFinishSequence();
        }

        if (t < 8) {
            speed += 4 + Math.random() * 2;
        }
        else if (t < 11) {
            speed -= 2;
        }
        else if (t < 17) {
            speed += 6 + Math.random() * 3;
        }
        else if (t < 19) {
            speed = 330;
        }
        else {
            speed -= 5;
        }

        speed = Math.max(0, Math.min(speed, 330));

        const speedRatio = speed / MAX_SPEED;
        rpm = speedRatio * MAX_RPM;

        if (speed > 60) gear = 2;
        if (speed > 120) gear = 3;
        if (speed > 180) gear = 4;
        if (speed > 240) gear = 5;
        if (speed > 280) gear = 6;

        updateRace(t);

    }, 100);
}

/* =========================
   HUD
========================= */

function updateRace(t) {

    const speedEl = document.getElementById("speedCenter");
    const gearEl = document.getElementById("gearIndicator");

    if (speedEl) speedEl.innerText = Math.floor(speed);
    if (gearEl) gearEl.innerText = gear;


    updatePilotAnalysis(t);
    updateCarSystems();
    updateRPMArc(rpm);

    const rpmRatio = rpm / MAX_RPM;
    const speedRatio = speed / MAX_SPEED;

    const intensity = Math.max(rpmRatio, speedRatio);

    document.documentElement.style.setProperty(
        "--hudGlow",
        intensity.toFixed(2)
    );
}

let arcLength = 0;

window.addEventListener("load", () => {
    const arc = document.getElementById("arcFill");
    if (arc) {
        arcLength = arc.getTotalLength();
    }
});

function updateRPMArc(rpm) {

    const arc = document.getElementById("arcFill");
    const needle = document.getElementById("needle");

    if (!arc || !needle || !arcLength) return;

    const percent = rpm / MAX_RPM;

    // evita saltos iniciales
    const clamped = Math.min(Math.max(percent, 0), 1);

    const offset = arcLength;

    arc.style.strokeDasharray = `${offset}`;
    arc.style.strokeDashoffset = offset - (offset * clamped);

    const angle = -90 + (clamped * 180);
    needle.style.transform = `rotate(${angle}deg)`;
}

function startFinishSequence() {
    const finish = document.getElementById("finishLine");
    if (!finish) return;

    finish.style.display = "block";

    // reset posición arriba
    finish.style.transform = "translate(-50%, -200px)";

    requestAnimationFrame(() => {
        finish.style.transition = "transform 2s linear";

        // baja hasta el HUD (aprox centro inferior)
        finish.style.transform = "translate(-50%, 250px)";
    });

    finish.addEventListener("transitionend", onFinishReached, { once: true });
}

function onFinishReached() {

    const finish = document.getElementById("finishLine");
    if (!finish) return;

    // ocultas línea
    finish.style.display = "none";

    // opcional sonido
    cheerAudio = new Audio("assets/audio/cheer.mp3");
    cheerAudio.volume = 0.6;
    cheerAudio.play().catch(() => {});

    // mostrar texto META
    showFinishText();

    const audio = new Audio("assets/audio/f1.mp3");
    audio.volume = 0.4;
    audio.play().catch(() => {});

    setTimeout(() => {
        finishRace();
    }, 2000);
}

function showFinishText() {
    const text = document.getElementById("finishText");
    if (!text) return;

    text.style.opacity = "1";
}

/* =========================
   ANALYSIS
========================= */

const pilotMessages = [
    "Good consistency",
    "Braking stability strong",
    "Slight understeer detected",
    "Perfect traction zone",
    "Overtaking potential high"
];

function updatePilotAnalysis(t) {

    const status = document.getElementById("pilotStatus");

    if (status) {
        if (t < 15) {
            status.innerText = "Analizando piloto...";
        } else {
            status.innerText = "Análisis completo";
        }
    }

    // valores dinámicos pero estables (no aleatorios locos)
    const speedFactor = Math.min(speed / 330, 1);

    const reflexes = speedFactor > 0.7 ? "EXCEPCIONALES" : "ÓPTIMOS";
    const precision = speedFactor > 0.5 ? "ESTABLE" : "MUY ESTABLE";
    const stress = speedFactor > 0.8 ? "MEDIO" : "BAJO";
    const consistency = speedFactor > 0.6 ? "ALTA" : "MUY ALTA";
    const risk = speedFactor > 0.75 ? "ELEVADO" : "CONTROLADO";

    document.getElementById("reflexes").innerText = reflexes;
    document.getElementById("precision").innerText = precision;
    document.getElementById("stress").innerText = stress;
    document.getElementById("consistency").innerText = consistency;
    document.getElementById("risk").innerText = risk;
}

function updateCarSystems() {

    const tyres = document.getElementById("tyres");
    const ers = document.getElementById("ers");
    const drs = document.getElementById("drs");
    const temp = document.getElementById("temp");

    if (tyres) tyres.innerText = speed > 250 ? "DETERIORADOS" : "OK";
    if (ers) ers.innerText = Math.max(0, 100 - Math.floor(speed / 3)) + "%";
    if (drs) drs.innerText = speed > 280 ? "DISPONIBLE" : "DESACTIVADO";
    if (temp) temp.innerText = 90 + Math.floor(speed / 20) + "º";
}

/* =========================
   FINAL RACE
========================= */

function finishRace() {

    if (carAudio) {
        carAudio.pause();
        carAudio.currentTime = 0;
    }

    if (cheerAudio) {
        cheerAudio.volume= 0.2;
    }

    showScene(3);
    requestAnimationFrame(() => {
        showFinalStatsPhase1();
    });
}

let finishProgress = 0;
let finishEl;

window.addEventListener("load", () => {
    finishEl = document.getElementById("finishLine");
});

/* =========================
   PASE PILOTO
========================= */

function showFinalStatsPhase1() {

    const status =
        speed > 300 ? "EXCEPCIONAL" :
        speed > 220 ? "ÓPTIMO" :
        "ESTÁNDAR";

    document.getElementById("finalStatusBig").innerText =
        "ESTADO: " + status;

    document.getElementById("finalDesc").innerText =
        "Simulación completada con rendimiento " + status + ". \n\n" +
        "El piloto ha demostrado control, consistencia y capacidad de reacción en condiciones de alta exigencia.\n\n"+
        "RESUMEN:\n" +
        "-- Consistencia: " + (speed > 250 ? "Alta" : "Media") + "\n" +
        "-- Control bajo presión: " + (speed > 280 ? "Óptimo" : "Estable") + "\n" +
        "-- Ritmo de carrera: " + (speed > 300 ? "Competitivo" : "Mejorable") + "\n\n" +
        "VEREDICTO IA: Piloto con alto potencial.";

    setTimeout(() => {
        if (cheerAudio) {
            cheerAudio.pause();
            cheerAudio.currentTime = 0;
        }
    }, 700);

    // transición a fase 2
    setTimeout(() => {
        showFinalReward();
    }, 10000);
}

function showFinalReward() {

    const analysis = document.getElementById("finalAnalysis");
    const reward = document.getElementById("finalReward");

    // fade out fase 1
    analysis.style.opacity = "0";

    setTimeout(() => {
        analysis.style.display = "none";

        reward.style.display = "flex";
        requestAnimationFrame(() => {
            reward.style.opacity = "1";
            reward.style.transform = "scale(1)";
        });

    }, 600);
}

/* =========================
   INIT
========================= */

document.getElementById("startBtn")?.addEventListener("click", startLightsSequence);

window.addEventListener("load", () => {
    showScene(0);
});

function fitScreen() {
    const scale = Math.min(
        window.innerWidth / 1100,
        window.innerHeight / 700
    );

    document.documentElement.style.setProperty("--scale", scale);
}

window.addEventListener("resize", fitScreen);
window.addEventListener("load", fitScreen);