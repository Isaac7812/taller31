// ═══════════════════════════════════════════════════
// SECCIÓN 1 — Constantes, líneas y ventana de recorte
// ═══════════════════════════════════════════════════

const WORLD_W = 400;
const WORLD_H = 360;

const LINES = [
  { p1: [120, 90],  p2: [280, 250], label: "Caso 1 – Aceptación trivial"         },
  { p1: [10,  100], p2: [60,  220], label: "Caso 2 – Rechazo trivial (izquierda)"},
  { p1: [150, 330], p2: [250, 180], label: "Caso 3 – Recorte un extremo (arriba)"},
  { p1: [20,  20],  p2: [370, 340], label: "Caso 4 – Recorte dos extremos"       },
  { p1: [100, 320], p2: [300, 350], label: "Caso 5 – Rechazo trivial (arriba)"   },
];

let WIN = { x1: 80, y1: 60, x2: 320, y2: 300 };

// ═══════════════════════════════════════════════════
// SECCIÓN 2 — Códigos de región (4 bits TBRL)
// ═══════════════════════════════════════════════════

const INSIDE = 0;
const LEFT   = 1;
const RIGHT  = 2;
const BOTTOM = 4;
const TOP    = 8;

function computeCode(x, y, win) {
  let code = INSIDE;
  if (x < win.x1) code |= LEFT;
  if (x > win.x2) code |= RIGHT;
  if (y < win.y1) code |= BOTTOM;
  if (y > win.y2) code |= TOP;
  return code;
}