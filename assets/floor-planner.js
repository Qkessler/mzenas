// Shared floor-planner component. Consumed by ai-onboarding.html and restaurant-operations.html.
// Spec: plans/floor-planner-spec.md. Demo only — state lives in memory and resets on reload.

// ==================== SHARED FLOOR PLANNER ====================
// Same component is consumed by this onboarding stage and by the "Editar mapa"
// toggle inside restaurant-operations.html. Spec: plans/floor-planner-spec.md.
// State is demo-only; nothing persists across reloads.

const FP_GRID = 40;
const FP_CANVAS_W = 960;
const FP_CANVAS_H = 560;

const FP_CATALOG = {
  'rect-2':  { kind: 'seat', shape: 'rect',   seats: 2, w: 80,  h: 80,  rotatable: true,  label: '2 plazas',     group: 'rect' },
  'rect-4':  { kind: 'seat', shape: 'rect',   seats: 4, w: 80,  h: 160, rotatable: true,  label: '4 plazas',     group: 'rect' },
  'rect-6':  { kind: 'seat', shape: 'rect',   seats: 6, w: 80,  h: 240, rotatable: true,  label: '6 plazas',     group: 'rect' },
  'rect-8':  { kind: 'seat', shape: 'rect',   seats: 8, w: 80,  h: 320, rotatable: true,  label: '8 plazas',     group: 'rect' },
  'round-2': { kind: 'seat', shape: 'round',  seats: 2, w: 80,  h: 80,  rotatable: false, label: 'Redonda 2',    group: 'round' },
  'round-4': { kind: 'seat', shape: 'round',  seats: 4, w: 120, h: 120, rotatable: false, label: 'Redonda 4',    group: 'round' },
  'round-6': { kind: 'seat', shape: 'round',  seats: 6, w: 160, h: 160, rotatable: false, label: 'Redonda 6',    group: 'round' },
  'stool':   { kind: 'seat', shape: 'round',  seats: 1, w: 40,  h: 40,  rotatable: false, label: 'Taburete',     group: 'bar' },
  'bar':     { kind: 'prop', shape: 'bar',    seats: 0, w: 400, h: 60,  rotatable: true,  label: 'Barra',        group: 'bar' },
  'wall':    { kind: 'prop', shape: 'wall',   seats: 0, w: 200, h: 16,  rotatable: true,  label: 'Pared',        group: 'room' },
  'door':    { kind: 'prop', shape: 'door',   seats: 0, w: 80,  h: 16,  rotatable: true,  label: 'Puerta',       group: 'room' },
  'pillar':  { kind: 'prop', shape: 'pillar', seats: 0, w: 40,  h: 40,  rotatable: false, label: 'Pilar',        group: 'room' },
};

const FP_GROUPS = [
  { id: 'rect',  title: 'Mesas rectangulares', keys: ['rect-2', 'rect-4', 'rect-6', 'rect-8'] },
  { id: 'round', title: 'Mesas redondas',      keys: ['round-2', 'round-4', 'round-6'] },
  { id: 'bar',   title: 'Barra y stools',      keys: ['stool', 'bar'] },
  { id: 'room',  title: 'Elementos de sala',   keys: ['wall', 'door', 'pillar'] },
];

function fpItemSize(item) {
  const base = FP_CATALOG[item.catalogKey] || {};
  const w = item.w || base.w;
  const h = item.h || base.h;
  if (item.rotation === 90 && (base.rotatable || item.shape === 'rect' || item.shape === 'bar' || item.shape === 'wall' || item.shape === 'door')) {
    return { w: h, h: w };
  }
  return { w, h };
}

function fpSnap(v) { return Math.round(v / FP_GRID) * FP_GRID; }
function fpClamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function fpNewId() { return 'fp' + Math.random().toString(36).slice(2, 8); }

function initFloorPlanner(rootEl, options) {
  options = options || {};
  const state = {
    items: [],
    selectedId: null,
    nextNum: 1,
  };

  // Seed from options.seed, computing nextNum from the highest existing num
  if (Array.isArray(options.seed)) {
    options.seed.forEach(raw => {
      const item = normalizeSeed(raw);
      state.items.push(item);
      if (item.num && item.num >= state.nextNum) state.nextNum = item.num + 1;
    });
  }

  function normalizeSeed(raw) {
    const catalogKey = raw.catalogKey || inferCatalogKey(raw);
    const base = FP_CATALOG[catalogKey] || {};
    return {
      id: raw.id || fpNewId(),
      catalogKey,
      kind: raw.kind || base.kind,
      shape: raw.shape || base.shape,
      seats: raw.seats != null ? raw.seats : base.seats,
      num: raw.num != null ? raw.num : null,
      x: raw.x || 0,
      y: raw.y || 0,
      rotation: raw.rotation || 0,
      w: raw.w || base.w,
      h: raw.h || base.h,
    };
  }

  function inferCatalogKey(raw) {
    if (raw.kind === 'seat' && raw.shape === 'rect') return 'rect-' + raw.seats;
    if (raw.kind === 'seat' && raw.shape === 'round') {
      if (raw.seats === 1) return 'stool';
      return 'round-' + raw.seats;
    }
    if (raw.shape) return raw.shape;
    return 'rect-4';
  }

  // ===== DOM scaffolding =====
  rootEl.innerHTML = `
    <div class="fp-pane fp-palette-pane">
      <div class="fp-pane-header">Catálogo</div>
      <div class="fp-palette" id="fpPalette"></div>
    </div>
    <div class="fp-pane">
      <div class="fp-pane-header">Planta de la sala</div>
      <div class="fp-canvas-wrap">
        <div class="fp-canvas" id="fpCanvas" style="width:${FP_CANVAS_W}px;height:${FP_CANVAS_H}px"></div>
      </div>
    </div>
    <div class="fp-pane fp-inspector-pane">
      <div class="fp-pane-header">Detalles</div>
      <div class="fp-inspector" id="fpInspector"></div>
    </div>
  `;

  const paletteEl = rootEl.querySelector('#fpPalette');
  const canvasEl = rootEl.querySelector('#fpCanvas');
  const inspectorEl = rootEl.querySelector('#fpInspector');

  renderPalette();
  renderCanvas();
  renderInspector();

  // ===== Palette =====
  function renderPalette() {
    paletteEl.innerHTML = FP_GROUPS.map(g => `
      <h5>${g.title}</h5>
      <div class="fp-palette-grid">
        ${g.keys.map(k => paletteItemHtml(k)).join('')}
      </div>
    `).join('');

    paletteEl.querySelectorAll('.fp-palette-item').forEach(el => {
      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', el.dataset.key);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });
  }

  function paletteItemHtml(key) {
    const c = FP_CATALOG[key];
    const badge = c.kind === 'seat' ? `<div class="fp-palette-seats">${c.seats} ${c.seats === 1 ? 'plaza' : 'plazas'}</div>` : '';
    return `
      <div class="fp-palette-item" draggable="true" data-key="${key}" title="${c.label}">
        <div class="fp-palette-thumb">${paletteThumbSvg(c)}</div>
        <div class="fp-palette-label">${c.label}</div>
        ${badge}
      </div>
    `;
  }

  function paletteThumbSvg(c) {
    // Palette thumbs are tiny scaled previews of the real shapes.
    const maxDim = 36;
    const ratio = Math.min(maxDim / c.w, maxDim / c.h);
    const w = Math.max(10, c.w * ratio);
    const h = Math.max(10, c.h * ratio);
    const style = `width:${w}px;height:${h}px;`;
    return `<div class="fp-item shape-${c.shape}" style="${style};position:static;"></div>`;
  }

  // ===== Canvas drag-from-palette =====
  canvasEl.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    canvasEl.classList.add('dragover');
  });
  canvasEl.addEventListener('dragleave', () => canvasEl.classList.remove('dragover'));
  canvasEl.addEventListener('drop', e => {
    e.preventDefault();
    canvasEl.classList.remove('dragover');
    const key = e.dataTransfer.getData('text/plain');
    const c = FP_CATALOG[key];
    if (!c) return;
    const rect = canvasEl.getBoundingClientRect();
    const dx = e.clientX - rect.left - c.w / 2;
    const dy = e.clientY - rect.top - c.h / 2;
    const x = fpClamp(fpSnap(dx), 0, FP_CANVAS_W - c.w);
    const y = fpClamp(fpSnap(dy), 0, FP_CANVAS_H - c.h);
    const item = {
      id: fpNewId(),
      catalogKey: key,
      kind: c.kind,
      shape: c.shape,
      seats: c.seats,
      num: c.kind === 'seat' ? state.nextNum++ : null,
      x, y, rotation: 0,
      w: c.w, h: c.h,
    };
    state.items.push(item);
    state.selectedId = item.id;
    renderCanvas();
    renderInspector();
    notifyChange();
  });

  canvasEl.addEventListener('click', e => {
    if (e.target === canvasEl || e.target.classList.contains('fp-canvas-hint')) {
      state.selectedId = null;
      renderCanvas();
      renderInspector();
    }
  });

  // ===== Canvas render =====
  function renderCanvas() {
    const hint = state.items.length === 0
      ? '<div class="fp-canvas-hint">Arrastra una mesa aquí para empezar</div>'
      : '';
    canvasEl.innerHTML = hint + state.items.map(itemHtml).join('');
    canvasEl.querySelectorAll('.fp-item').forEach(attachItemHandlers);
  }

  function itemHtml(item) {
    const { w, h } = fpItemSize(item);
    const rotatedClass = item.rotation === 90 ? ' rotated' : '';
    const selectedClass = item.id === state.selectedId ? ' selected' : '';
    const toolbarBelow = item.y < 44 ? ' toolbar-below' : '';
    const labelText = item.kind === 'seat'
      ? (item.num != null ? item.num : '')
      : (item.shape === 'door' ? 'Puerta' : item.shape === 'bar' ? 'Barra' : '');
    const toolbar = item.id === state.selectedId ? toolbarHtml(item) : '';
    return `
      <div class="fp-item shape-${item.shape}${rotatedClass}${selectedClass}${toolbarBelow}" data-id="${item.id}"
           style="left:${item.x}px;top:${item.y}px;width:${w}px;height:${h}px">
        <span class="fp-item-label">${labelText}</span>
        ${toolbar}
      </div>
    `;
  }

  function toolbarHtml(item) {
    const base = FP_CATALOG[item.catalogKey] || {};
    const rotDisabled = !base.rotatable ? 'disabled' : '';
    return `
      <div class="fp-toolbar" data-role="toolbar">
        <button ${rotDisabled} data-act="rotate" title="Rotar"><span class="material-symbols-rounded">rotate_right</span></button>
        <button data-act="duplicate" title="Duplicar"><span class="material-symbols-rounded">content_copy</span></button>
        <button data-act="delete" title="Eliminar"><span class="material-symbols-rounded">delete</span></button>
      </div>
    `;
  }

  // ===== Item interactions =====
  function attachItemHandlers(el) {
    const id = el.dataset.id;

    // Toolbar buttons
    el.querySelectorAll('[data-role="toolbar"] button').forEach(btn => {
      btn.addEventListener('pointerdown', e => e.stopPropagation());
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const act = btn.dataset.act;
        if (act === 'rotate') rotateItem(id);
        else if (act === 'duplicate') duplicateItem(id);
        else if (act === 'delete') deleteItem(id);
      });
    });

    let dragging = false;
    let moved = false;
    let pointerId = null;
    let startX = 0, startY = 0;
    let origX = 0, origY = 0;

    el.addEventListener('pointerdown', e => {
      if (e.target.closest('[data-role="toolbar"]')) return;
      const item = state.items.find(i => i.id === id);
      if (!item) return;
      dragging = true;
      moved = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      origX = item.x;
      origY = item.y;
      el.setPointerCapture(pointerId);
      el.classList.add('dragging');
      e.preventDefault();
    });

    el.addEventListener('pointermove', e => {
      if (!dragging) return;
      const item = state.items.find(i => i.id === id);
      if (!item) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      const { w, h } = fpItemSize(item);
      const nx = fpClamp(origX + dx, 0, FP_CANVAS_W - w);
      const ny = fpClamp(origY + dy, 0, FP_CANVAS_H - h);
      el.style.left = nx + 'px';
      el.style.top = ny + 'px';
    });

    el.addEventListener('pointerup', e => {
      if (!dragging) return;
      dragging = false;
      el.releasePointerCapture(pointerId);
      el.classList.remove('dragging');
      const item = state.items.find(i => i.id === id);
      if (!item) return;
      if (moved) {
        const { w, h } = fpItemSize(item);
        item.x = fpClamp(fpSnap(parseFloat(el.style.left)), 0, FP_CANVAS_W - w);
        item.y = fpClamp(fpSnap(parseFloat(el.style.top)),  0, FP_CANVAS_H - h);
      }
      state.selectedId = id;
      renderCanvas();
      renderInspector();
      notifyChange();
    });

    el.addEventListener('pointercancel', () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      renderCanvas();
    });
  }

  function rotateItem(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) return;
    const base = FP_CATALOG[item.catalogKey] || {};
    if (!base.rotatable) return;
    item.rotation = item.rotation === 90 ? 0 : 90;
    const { w, h } = fpItemSize(item);
    item.x = fpClamp(item.x, 0, FP_CANVAS_W - w);
    item.y = fpClamp(item.y, 0, FP_CANVAS_H - h);
    renderCanvas();
    renderInspector();
    notifyChange();
  }

  function duplicateItem(id) {
    const src = state.items.find(i => i.id === id);
    if (!src) return;
    const copy = Object.assign({}, src, {
      id: fpNewId(),
      x: fpClamp(src.x + FP_GRID, 0, FP_CANVAS_W - fpItemSize(src).w),
      y: fpClamp(src.y + FP_GRID, 0, FP_CANVAS_H - fpItemSize(src).h),
      num: src.kind === 'seat' ? state.nextNum++ : null,
    });
    state.items.push(copy);
    state.selectedId = copy.id;
    renderCanvas();
    renderInspector();
    notifyChange();
  }

  function deleteItem(id) {
    state.items = state.items.filter(i => i.id !== id);
    if (state.selectedId === id) state.selectedId = null;
    renderCanvas();
    renderInspector();
    notifyChange();
  }

  // ===== Inspector =====
  function renderInspector() {
    const sel = state.items.find(i => i.id === state.selectedId);
    if (!sel) {
      inspectorEl.innerHTML = summaryHtml();
      return;
    }
    inspectorEl.innerHTML = selectedHtml(sel);
    wireSelectedHandlers(sel);
  }

  function summaryHtml() {
    const seats = state.items.filter(i => i.kind === 'seat');
    const totalSeats = seats.reduce((s, i) => s + (i.seats || 0), 0);
    const byCap = {};
    seats.forEach(i => { byCap[i.seats] = (byCap[i.seats] || 0) + 1; });
    const caps = Object.keys(byCap).map(Number).sort((a, b) => a - b);
    const rows = caps.map(cap => `
      <div class="fp-summary-row"><span>Mesas de ${cap} ${cap === 1 ? 'plaza' : 'plazas'}</span><strong>${byCap[cap]}</strong></div>
    `).join('');
    const empty = state.items.length === 0
      ? '<div class="fp-inspector-meta">Arrastra elementos desde el catálogo para empezar a diseñar tu sala. Haz clic en cualquier mesa para editarla.</div>'
      : '<div class="fp-inspector-meta">Haz clic en cualquier elemento del plano para editarlo, rotarlo o eliminarlo.</div>';
    return `
      <h4>Resumen de la sala</h4>
      <div class="fp-summary-card">
        <div class="fp-summary-total">${seats.length} ${seats.length === 1 ? 'mesa' : 'mesas'}</div>
        <div class="fp-summary-sub">${totalSeats} plazas en total</div>
        ${rows}
      </div>
      ${empty}
    `;
  }

  function selectedHtml(item) {
    const base = FP_CATALOG[item.catalogKey] || {};
    if (item.kind === 'seat') {
      return `
        <h4>${item.shape === 'round' ? 'Mesa redonda' : 'Mesa rectangular'}</h4>
        <div class="fp-inspector-meta">${item.seats} ${item.seats === 1 ? 'plaza' : 'plazas'} · ${item.rotation === 90 ? 'horizontal' : 'vertical'}</div>
        <div class="fp-inspector-field">
          <label>Número de mesa</label>
          <input type="number" id="fpNumInput" value="${item.num != null ? item.num : ''}" min="1">
        </div>
        <div class="fp-inspector-actions">
          <button data-act="rotate" ${!base.rotatable ? 'disabled' : ''}><span class="material-symbols-rounded">rotate_right</span> Rotar</button>
          <button data-act="duplicate"><span class="material-symbols-rounded">content_copy</span> Duplicar</button>
          <button class="danger" data-act="delete"><span class="material-symbols-rounded">delete</span> Eliminar</button>
        </div>
      `;
    }
    const resizable = item.shape === 'bar' || item.shape === 'wall';
    const { w, h } = fpItemSize(item);
    const longDim = item.rotation === 90 ? h : w;
    return `
      <h4>${base.label || 'Elemento'}</h4>
      <div class="fp-inspector-meta">Elemento de sala. No cuenta como mesa.</div>
      ${resizable ? `
        <div class="fp-inspector-field">
          <label>Largo (${longDim}px)</label>
          <input type="range" id="fpLenInput" min="40" max="600" step="40" value="${longDim}">
        </div>
      ` : ''}
      <div class="fp-inspector-actions">
        <button data-act="rotate" ${!base.rotatable ? 'disabled' : ''}><span class="material-symbols-rounded">rotate_right</span> Rotar</button>
        <button data-act="duplicate"><span class="material-symbols-rounded">content_copy</span> Duplicar</button>
        <button class="danger" data-act="delete"><span class="material-symbols-rounded">delete</span> Eliminar</button>
      </div>
    `;
  }

  function wireSelectedHandlers(item) {
    inspectorEl.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'rotate') rotateItem(item.id);
        else if (act === 'duplicate') duplicateItem(item.id);
        else if (act === 'delete') deleteItem(item.id);
      });
    });
    const numInput = inspectorEl.querySelector('#fpNumInput');
    if (numInput) {
      numInput.addEventListener('input', e => {
        const v = parseInt(e.target.value, 10);
        item.num = isNaN(v) ? null : v;
        // Re-render canvas only so the number updates; keep inspector intact.
        renderCanvas();
        notifyChange();
      });
    }
    const lenInput = inspectorEl.querySelector('#fpLenInput');
    if (lenInput) {
      lenInput.addEventListener('input', e => {
        const v = parseInt(e.target.value, 10);
        if (item.rotation === 90) item.h = v; else item.w = v;
        const { w, h } = fpItemSize(item);
        item.x = fpClamp(item.x, 0, FP_CANVAS_W - w);
        item.y = fpClamp(item.y, 0, FP_CANVAS_H - h);
        renderCanvas();
        renderInspector();
        notifyChange();
      });
    }
  }

  // ===== Keyboard =====
  rootEl.tabIndex = 0;
  rootEl.addEventListener('keydown', e => {
    if (!state.selectedId) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (e.target.tagName === 'INPUT') return;
      e.preventDefault();
      deleteItem(state.selectedId);
    } else if (e.key === 'r' || e.key === 'R') {
      rotateItem(state.selectedId);
    }
  });

  function notifyChange() {
    if (typeof options.onChange === 'function') {
      options.onChange({ items: state.items.slice() });
    }
  }

  return {
    getState: () => ({ items: state.items.slice(), nextNum: state.nextNum }),
    setState: (s) => {
      state.items = (s.items || []).map(normalizeSeed);
      state.selectedId = null;
      state.nextNum = Math.max(1, ...state.items.filter(i => i.num).map(i => i.num + 1));
      renderCanvas();
      renderInspector();
    },
    destroy: () => { rootEl.innerHTML = ''; },
  };
}
