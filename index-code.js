// ==== SETTINGS ====
const MAX_CIRCLES = 12;
const SPAWN_INTERVAL = 1500; // ms
const COLORS = [
    "rgba(59, 130, 246, 0.2)", // blau
    "rgba(88, 101, 242, 0.2)", // blurple
    "rgba(147, 51, 234, 0.2)"  // lila
];
const RADIUS_FACTORS = [1 / 8, 1 / 6, 1 / 5, 1 / 3];
const SPEED_RANGE = [0.2, 0.5]; // Pixel per frame

const container = document.getElementById("circle-container");
const circles = [];
let w = window.innerWidth;
let h = window.innerHeight;

window.addEventListener("resize", () => {
    w = window.innerWidth;
    h = window.innerHeight;
});

// ==== FUNCTIONS ====
function spawnCircle() {
    if (circles.length >= MAX_CIRCLES) return;

    const radius = Math.min(w, h) * RADIUS_FACTORS[Math.floor(Math.random() * RADIUS_FACTORS.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const el = document.createElement("div");
    el.className = "circle";
    el.style.width = `${radius * 2}px`;
    el.style.height = `${radius * 2}px`;
    el.style.background = `radial-gradient(circle, ${color} 0%, transparent 100%)`;

    const x = Math.random() * (w - radius * 2);
    const y = Math.random() * (h - radius * 2);
    const dx = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * (SPEED_RANGE[1] - SPEED_RANGE[0]) + SPEED_RANGE[0]);
    const dy = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * (SPEED_RANGE[1] - SPEED_RANGE[0]) + SPEED_RANGE[0]);

    container.appendChild(el);
    circles.push({ el, x, y, dx, dy, radius });
}

function updateCircles() {
    for (const c of circles) {
        c.x += c.dx;
        c.y += c.dy;

        // Bounce an den Rändern
        if (c.x <= 0 || c.x + c.radius * 2 >= w) c.dx *= -1;
        if (c.y <= 0 || c.y + c.radius * 2 >= h) c.dy *= -1;

        c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
    }
}

function loop() {
    updateCircles();
    requestAnimationFrame(loop);
}

// ==== INIT ====
// Direkt am Anfang viele Kreise spawnen
for (let i = 0; i < MAX_CIRCLES * 0.6; i++) spawnCircle();
setInterval(spawnCircle, SPAWN_INTERVAL);
loop();