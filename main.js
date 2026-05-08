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
// ═══════════════════════════════════════════════════
// SECCIÓN 3 — Algoritmo de Cohen-Sutherland
// ═══════════════════════════════════════════════════

function cohenSutherland(x1, y1, x2, y2, win) {
  let c1 = computeCode(x1, y1, win);
  let c2 = computeCode(x2, y2, win);

  while (true) {
    if ((c1 | c2) === 0) {
      return { accept: true, cx1: x1, cy1: y1, cx2: x2, cy2: y2 };
    }
    if ((c1 & c2) !== 0) {
      return { accept: false, cx1: x1, cy1: y1, cx2: x2, cy2: y2 };
    }

    const cOut = (c1 !== 0) ? c1 : c2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    let xi, yi;

    if (cOut & TOP) {
      xi = x1 + dx * (win.y2 - y1) / dy;
      yi = win.y2;
    } else if (cOut & BOTTOM) {
      xi = x1 + dx * (win.y1 - y1) / dy;
      yi = win.y1;
    } else if (cOut & RIGHT) {
      yi = y1 + dy * (win.x2 - x1) / dx;
      xi = win.x2;
    } else {
      yi = y1 + dy * (win.x1 - x1) / dx;
      xi = win.x1;
    }

    if (cOut === c1) {
      x1 = xi; y1 = yi;
      c1 = computeCode(x1, y1, win);
    } else {
      x2 = xi; y2 = yi;
      c2 = computeCode(x2, y2, win);
    }
  }
}

// Wrapper que además detecta el status y guarda códigos originales
function clipLine(line, win) {
  const [ox1, oy1] = line.p1;
  const [ox2, oy2] = line.p2;

  const c1 = computeCode(ox1, oy1, win);
  const c2 = computeCode(ox2, oy2, win);

  let status;
  if      ((c1 & c2) !== 0)       status = 'trivial_reject';
  else if (c1 === 0 && c2 === 0)  status = 'trivial_accept';
  else                             status = 'clipped';

  const result = cohenSutherland(ox1, oy1, ox2, oy2, win);
  result.status = status;
  result.code1  = c1;
  result.code2  = c2;
  return result;
}