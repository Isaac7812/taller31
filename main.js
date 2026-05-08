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

// ═══════════════════════════════════════════════════
// SECCIÓN 4 — Canvas y transformación de coordenadas
// ═══════════════════════════════════════════════════

const cv  = document.getElementById('cv');
const ctx = cv.getContext('2d');

function worldToCanvas(wx, wy) {
  const sx = cv.width  / WORLD_W;
  const sy = cv.height / WORLD_H;
  return [ wx * sx, cv.height - wy * sy ];
}

// ═══════════════════════════════════════════════════
// SECCIÓN 5 — Función de viewport (solo 1 permitida)
// ═══════════════════════════════════════════════════

function drawViewport(win) {
  const [ax, ay] = worldToCanvas(win.x1, win.y2);
  const [bx, by] = worldToCanvas(win.x2, win.y1);
  const cw = bx - ax;
  const ch = by - ay;

  // Cuadrícula de fondo
  ctx.strokeStyle = '#2a2f3d';
  ctx.lineWidth = 1;
  for (let x = 0; x <= cv.width;  x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cv.height); ctx.stroke();
  }
  for (let y = 0; y <= cv.height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cv.width, y); ctx.stroke();
  }

  // Ejes
  ctx.strokeStyle = '#1e2230';
  ctx.lineWidth = 1.5;
  const [ox, oy] = worldToCanvas(0, 0);
  ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, cv.height); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(cv.width, oy);  ctx.stroke();

  // Rectángulo de recorte
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(ax, ay, cw, ch);
  ctx.fillStyle = 'rgba(0,229,255,0.04)';
  ctx.fillRect(ax, ay, cw, ch);

  return { cx: ax, cy: ay, cw, ch };
}

// ═══════════════════════════════════════════════════
// SECCIÓN 6 — Función de línea (solo 1 permitida)
// ═══════════════════════════════════════════════════

function drawLine(x1, y1, x2, y2, color, dashed) {
  const [cx1, cy1] = worldToCanvas(x1, y1);
  const [cx2, cy2] = worldToCanvas(x2, y2);

  const dx    = Math.abs(cx2 - cx1);
  const dy    = Math.abs(cy2 - cy1);
  const steps = Math.max(dx, dy);

  if (steps === 0) return { cx1, cy1, cx2, cy2 };

  const xi = (cx2 - cx1) / steps;
  const yi = (cy2 - cy1) / steps;

  ctx.fillStyle = color;
  for (let i = 0; i <= steps; i++) {
    if (dashed && Math.floor(i / 6) % 2 === 1) continue;
    ctx.fillRect(
      Math.round(cx1 + xi * i),
      Math.round(cy1 + yi * i),
      1.5, 1.5
    );
  }

  return { cx1, cy1, cx2, cy2 };
}

// ═══════════════════════════════════════════════════
// SECCIÓN 7 — Render de escena y panel de info
// ═══════════════════════════════════════════════════

let currentScene = 0;

function renderScene() {
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = '#111318';
  ctx.fillRect(0, 0, cv.width, cv.height);

  drawViewport(WIN);

  const line         = LINES[currentScene];
  const [ox1, oy1]  = line.p1;
  const [ox2, oy2]  = line.p2;
  const result       = clipLine(line, WIN);

  // Línea original en gris punteado
  drawLine(ox1, oy1, ox2, oy2, '#3a4055', true);

  if (result.accept) {
    if (result.status === 'clipped') {
      drawLine(ox1, oy1, result.cx1, result.cy1, '#ff4d6d', false);
      drawLine(result.cx2, result.cy2, ox2, oy2, '#ff4d6d', false);
    }
    drawLine(result.cx1, result.cy1, result.cx2, result.cy2, '#39ff96', false);
  } else {
    drawLine(ox1, oy1, ox2, oy2, '#ff4d6d', false);
  }

  drawEndpoint(ox1, oy1, '#aaaaaa');
  drawEndpoint(ox2, oy2, '#aaaaaa');
  if (result.accept && result.status === 'clipped') {
    drawEndpoint(result.cx1, result.cy1, '#39ff96');
    drawEndpoint(result.cx2, result.cy2, '#39ff96');
  }

  updateInfoPanel(line, result);
  document.getElementById('sceneCounter').textContent =
    `Escena ${currentScene + 1} / ${LINES.length}`;
}

function drawEndpoint(wx, wy, color) {
  const [cx, cy] = worldToCanvas(wx, wy);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function updateInfoPanel(line, result) {
  const statusHTML = {
    trivial_accept: '<span class="status-accept">✔ Aceptación trivial</span>',
    trivial_reject: '<span class="status-reject">✘ Rechazo trivial</span>',
    clipped:        '<span class="status-clip">✂ Recortada</span>',
  };

  let html = `
    <div><span class="lbl">Caso: </span><span class="val">${line.label}</span></div>
    <div><span class="lbl">p1:   </span><span class="val">(${line.p1[0]}, ${line.p1[1]})</span></div>
    <div><span class="lbl">p2:   </span><span class="val">(${line.p2[0]}, ${line.p2[1]})</span></div>
    <div><span class="lbl">c1:   </span><span class="val">${result.code1.toString(2).padStart(4,'0')}</span></div>
    <div><span class="lbl">c2:   </span><span class="val">${result.code2.toString(2).padStart(4,'0')}</span></div>
    <div style="margin-top:6px"><span class="lbl">Estado: </span>${statusHTML[result.status]}</div>
  `;

  if (result.accept) {
    html += `
      <div style="margin-top:6px">
        <span class="lbl">pc1: </span>
        <span class="val">(${result.cx1.toFixed(1)}, ${result.cy1.toFixed(1)})</span>
      </div>
      <div>
        <span class="lbl">pc2: </span>
        <span class="val">(${result.cx2.toFixed(1)}, ${result.cy2.toFixed(1)})</span>
      </div>
    `;
  }

  document.getElementById('infoPanel').innerHTML = html;
}

// ═══════════════════════════════════════════════════
// SECCIÓN 8 — Eventos: navegación y actualizar ventana
// ═══════════════════════════════════════════════════

document.getElementById('btnFirst').onclick = () => { currentScene = 0; renderScene(); };
document.getElementById('btnPrev').onclick  = () => { if (currentScene > 0) { currentScene--; renderScene(); } };
document.getElementById('btnNext').onclick  = () => { if (currentScene < LINES.length - 1) { currentScene++; renderScene(); } };
document.getElementById('btnLast').onclick  = () => { currentScene = LINES.length - 1; renderScene(); };

document.getElementById('btnUpdate').onclick = () => {
  WIN = {
    x1: +document.getElementById('wx1').value,
    y1: +document.getElementById('wy1').value,
    x2: +document.getElementById('wx2').value,
    y2: +document.getElementById('wy2').value,
  };
  renderScene();
};

// ═══════════════════════════════════════════════════
// Arranque
// ═══════════════════════════════════════════════════

renderScene();