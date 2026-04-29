// Shared floor-planner component. Consumed by ai-onboarding.html and restaurant-operations.html.
// Spec: plans/floor-planner-spec.md. Demo only — state lives in memory and resets on reload.

// ==================== SHARED FLOOR PLANNER ====================
// Same component is consumed by this onboarding stage and by the "Editar mapa"
// toggle inside restaurant-operations.html. Spec: plans/floor-planner-spec.md.
// State is demo-only; nothing persists across reloads.

const FP_GRID = 40;
// Logical canvas coordinate space. The actual rendered size is scaled by `state.zoom`
// so the entire room fits on tablet/desktop viewports without horizontal scrolling.
const FP_LOGICAL_W = 1600;
const FP_LOGICAL_H = 900;
const FP_MIN_ZOOM = 0.3;
const FP_MAX_ZOOM = 1.5;

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
function fpNewPlanId() { return 'plan' + Math.random().toString(36).slice(2, 7); }

function initFloorPlanner(rootEl, options) {
  options = options || {};

  // Normalize the seed into a { plans, activePlanId } shape. Accepts either:
  //   - legacy flat array of items → single "Salón principal" plan
  //   - { plans: [{ id?, name, items, nextNum? }], activePlanId? }
  const state = {
    plans: [],
    activePlanId: null,
    selectedId: null,
    zoom: 1,
    // Catalog key the user "armed" by tapping a palette item; the next tap
    // inside the canvas will place that element. Lets tablets/touch devices
    // add elements without relying on HTML5 drag-and-drop, which is flaky on
    // iPadOS/Android browsers where dragstart on the palette item never
    // fires from a finger gesture.
    pendingPaletteKey: null,
    // If the consumer pinned an activePlanId we honor it on mount; a manual tab
    // click after that clears this so subsequent renders don't fight the user.
    _pinnedActive: options.activePlanId || null,
  };

  seedPlans(options.seed);
  if (state.plans.length === 0) addPlan('Salón principal', true);
  state.activePlanId = options.activePlanId || state.plans[0].id;

  function seedPlans(seed) {
    if (!seed) return;
    if (Array.isArray(seed)) {
      const p = makePlan('Salón principal');
      seed.forEach(raw => {
        const it = normalizeSeed(raw);
        p.items.push(it);
        if (it.num && it.num >= p.nextNum) p.nextNum = it.num + 1;
      });
      state.plans.push(p);
      return;
    }
    if (seed && Array.isArray(seed.plans)) {
      seed.plans.forEach(rp => {
        const p = makePlan(rp.name || 'Plano', rp.id);
        (rp.items || []).forEach(raw => {
          const it = normalizeSeed(raw);
          p.items.push(it);
          if (it.num && it.num >= p.nextNum) p.nextNum = it.num + 1;
        });
        if (rp.nextNum && rp.nextNum > p.nextNum) p.nextNum = rp.nextNum;
        state.plans.push(p);
      });
    }
  }

  function makePlan(name, id) {
    return { id: id || fpNewPlanId(), name, items: [], nextNum: 1 };
  }

  function addPlan(name, skipSelect) {
    const p = makePlan(name || `Plano ${state.plans.length + 1}`);
    state.plans.push(p);
    if (!skipSelect) {
      state.activePlanId = p.id;
      state.selectedId = null;
    }
    return p;
  }

  function currentPlan() {
    return state.plans.find(p => p.id === state.activePlanId) || state.plans[0];
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
    <div class="fp-pane fp-canvas-pane">
      <div class="fp-plans-bar" id="fpPlansBar"></div>
      <div class="fp-canvas-wrap" id="fpCanvasWrap">
        <div class="fp-canvas" id="fpCanvas"
             style="width:${FP_LOGICAL_W}px;height:${FP_LOGICAL_H}px"></div>
      </div>
      <div class="fp-zoombar" id="fpZoomBar">
        <button type="button" data-z="out" title="Alejar"><span class="material-symbols-rounded">remove</span></button>
        <span class="fp-zoom-readout" id="fpZoomReadout">100%</span>
        <button type="button" data-z="in" title="Acercar"><span class="material-symbols-rounded">add</span></button>
        <button type="button" data-z="fit" class="fp-zoom-fit" title="Ajustar a la ventana">
          <span class="material-symbols-rounded">fit_screen</span><span class="fp-zoom-fit-label">Ajustar</span>
        </button>
      </div>
    </div>
    <div class="fp-pane fp-inspector-pane">
      <div class="fp-pane-header">Detalles</div>
      <div class="fp-inspector" id="fpInspector"></div>
    </div>
  `;

  const paletteEl = rootEl.querySelector('#fpPalette');
  const plansBarEl = rootEl.querySelector('#fpPlansBar');
  const canvasWrapEl = rootEl.querySelector('#fpCanvasWrap');
  const canvasEl = rootEl.querySelector('#fpCanvas');
  const zoomBarEl = rootEl.querySelector('#fpZoomBar');
  const zoomReadoutEl = rootEl.querySelector('#fpZoomReadout');
  const inspectorEl = rootEl.querySelector('#fpInspector');

  renderPalette();
  renderPlansBar();
  renderCanvas();
  renderInspector();
  wireZoomBar();

  // Fit-to-container on mount and whenever the wrap resizes (window resize,
  // panes collapsing on tablet, DevTools open, etc.). We only auto-fit while
  // the user hasn't manually zoomed since the last fit.
  let userZoomed = false;
  const ro = new ResizeObserver(() => { if (!userZoomed) fitToContainer(); });
  ro.observe(canvasWrapEl);
  // Initial fit after layout settles.
  requestAnimationFrame(() => fitToContainer());

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
        // Starting a real drag cancels any armed tap-to-place so the two
        // interaction modes don't compete.
        setPendingKey(null);
      });
      el.addEventListener('click', () => {
        const key = el.dataset.key;
        setPendingKey(state.pendingPaletteKey === key ? null : key);
      });
    });
    reflectPendingKey();
  }

  function setPendingKey(key) {
    state.pendingPaletteKey = key;
    reflectPendingKey();
  }

  function reflectPendingKey() {
    paletteEl.querySelectorAll('.fp-palette-item').forEach(el => {
      el.classList.toggle('pending', el.dataset.key === state.pendingPaletteKey);
    });
    canvasEl.classList.toggle('placing', !!state.pendingPaletteKey);
    // Refresh the canvas hint copy so empty plans prompt the user for the
    // right next gesture (drag vs. tap).
    const hint = canvasEl.querySelector('.fp-canvas-hint');
    if (hint) hint.textContent = canvasHintText();
  }

  function canvasHintText() {
    if (state.pendingPaletteKey) {
      const c = FP_CATALOG[state.pendingPaletteKey];
      return `Toca aquí para colocar: ${c ? c.label : 'elemento'}`;
    }
    return 'Arrastra una mesa aquí o toca un elemento del catálogo y luego toca aquí para colocarlo';
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

  // ===== Plans tab strip =====
  function renderPlansBar() {
    const tabs = state.plans.map(p => {
      const active = p.id === state.activePlanId ? ' active' : '';
      const canDelete = state.plans.length > 1;
      return `
        <div class="fp-plan-tab${active}" data-plan="${p.id}" role="tab" tabindex="0">
          <span class="fp-plan-name">${escapeHtml(p.name)}</span>
          <button class="fp-plan-rename" data-act="rename" title="Renombrar"><span class="material-symbols-rounded">edit</span></button>
          <button class="fp-plan-close" data-act="delete" title="Eliminar plano" ${canDelete ? '' : 'disabled'}>×</button>
        </div>
      `;
    }).join('');
    plansBarEl.innerHTML = `
      <div class="fp-plans-tabs" role="tablist">${tabs}
        <button class="fp-plan-add" id="fpPlanAdd" title="Añadir plano">
          <span class="material-symbols-rounded">add</span>
          <span class="fp-plan-add-label">Nuevo plano</span>
        </button>
      </div>
    `;
    plansBarEl.querySelectorAll('.fp-plan-tab').forEach(el => {
      const planId = el.dataset.plan;
      el.addEventListener('click', e => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'delete') { e.stopPropagation(); deletePlan(planId); return; }
        if (act === 'rename') { e.stopPropagation(); renamePlan(planId); return; }
        activatePlan(planId);
      });
      el.addEventListener('dblclick', e => {
        if (e.target.closest('[data-act]')) return;
        renamePlan(planId);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activatePlan(planId); }
        if (e.key === 'F2') { e.preventDefault(); renamePlan(planId); }
      });
    });
    plansBarEl.querySelector('#fpPlanAdd').addEventListener('click', () => {
      const name = (prompt('Nombre del nuevo plano', `Plano ${state.plans.length + 1}`) || '').trim();
      if (!name) return;
      addPlan(name);
      renderPlansBar();
      renderCanvas();
      renderInspector();
      notifyChange();
    });
  }

  function activatePlan(planId) {
    if (state.activePlanId === planId) return;
    state.activePlanId = planId;
    state.selectedId = null;
    renderPlansBar();
    renderCanvas();
    renderInspector();
    notifyChange();
  }

  function renamePlan(planId) {
    const p = state.plans.find(x => x.id === planId);
    if (!p) return;
    const name = (prompt('Nombre del plano', p.name) || '').trim();
    if (!name || name === p.name) return;
    p.name = name;
    renderPlansBar();
    notifyChange();
  }

  function deletePlan(planId) {
    if (state.plans.length <= 1) return;
    const p = state.plans.find(x => x.id === planId);
    if (!p) return;
    const hasContent = p.items.length > 0;
    if (hasContent && !confirm(`¿Eliminar el plano "${p.name}"? Se perderán ${p.items.length} elemento(s).`)) return;
    state.plans = state.plans.filter(x => x.id !== planId);
    if (state.activePlanId === planId) {
      state.activePlanId = state.plans[0].id;
      state.selectedId = null;
    }
    renderPlansBar();
    renderCanvas();
    renderInspector();
    notifyChange();
  }

  // ===== Zoom =====
  function wireZoomBar() {
    zoomBarEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-z]');
      if (!btn) return;
      const z = btn.dataset.z;
      if (z === 'in')  { userZoomed = true; setZoom(state.zoom + 0.1); }
      if (z === 'out') { userZoomed = true; setZoom(state.zoom - 0.1); }
      if (z === 'fit') { userZoomed = false; fitToContainer(); }
    });
  }

  function setZoom(z) {
    state.zoom = Math.round(fpClamp(z, FP_MIN_ZOOM, FP_MAX_ZOOM) * 100) / 100;
    applyZoom();
  }

  function fitToContainer() {
    // Account for wrap padding; clientWidth/Height excludes scrollbars.
    const cw = canvasWrapEl.clientWidth  - 24;
    const ch = canvasWrapEl.clientHeight - 24;
    if (cw <= 0 || ch <= 0) return;
    // Fit the active plan's content bounding box (plus breathing room) rather
    // than the full 1600x900 logical canvas. Seeded onboarding layouts only
    // use a fraction of the canvas, so fitting the whole thing produced a
    // ~52% zoom that made the tables feel tiny. When the plan is empty we
    // fall back to fitting the full canvas so the operator still sees the
    // whole working area.
    const bbox = contentBBox();
    const targetW = bbox ? bbox.w : FP_LOGICAL_W;
    const targetH = bbox ? bbox.h : FP_LOGICAL_H;
    const z = Math.min(1, cw / targetW, ch / targetH);
    state.zoom = Math.max(FP_MIN_ZOOM, Math.round(z * 100) / 100);
    applyZoom();
    // Scroll the wrap to the bbox origin so content sitting far from (0,0)
    // still lands in view after fitting.
    if (bbox) {
      canvasWrapEl.scrollLeft = Math.max(0, bbox.x * state.zoom);
      canvasWrapEl.scrollTop  = Math.max(0, bbox.y * state.zoom);
    } else {
      canvasWrapEl.scrollLeft = 0;
      canvasWrapEl.scrollTop = 0;
    }
  }

  // Bounding box around all items on the active plan, padded by two grid
  // cells on every side so tables near the edge don't kiss the viewport.
  // Returns null when the plan has no items.
  function contentBBox() {
    const plan = currentPlan();
    if (!plan || !plan.items || plan.items.length === 0) return null;
    const pad = FP_GRID * 2;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    plan.items.forEach(item => {
      const { w, h } = fpItemSize(item);
      if (item.x < minX) minX = item.x;
      if (item.y < minY) minY = item.y;
      if (item.x + w > maxX) maxX = item.x + w;
      if (item.y + h > maxY) maxY = item.y + h;
    });
    const x0 = Math.max(0, minX - pad);
    const y0 = Math.max(0, minY - pad);
    const x1 = Math.min(FP_LOGICAL_W, maxX + pad);
    const y1 = Math.min(FP_LOGICAL_H, maxY + pad);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  function applyZoom() {
    canvasEl.style.transform = `scale(${state.zoom})`;
    zoomReadoutEl.textContent = Math.round(state.zoom * 100) + '%';
  }

  // ===== Canvas drag-from-palette =====
  // Translate a clientX/Y event into logical (unscaled) canvas coordinates.
  function eventToLogical(e) {
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / state.zoom,
      y: (e.clientY - rect.top)  / state.zoom,
    };
  }

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
    const { x: lx, y: ly } = eventToLogical(e);
    placeCatalogItem(key, lx, ly);
  });

  // Place a catalog item centered on logical (lx, ly). Used by both the drop
  // handler and the tap-to-place flow.
  function placeCatalogItem(key, lx, ly) {
    const c = FP_CATALOG[key];
    if (!c) return;
    const plan = currentPlan();
    const x = fpClamp(fpSnap(lx - c.w / 2), 0, FP_LOGICAL_W - c.w);
    const y = fpClamp(fpSnap(ly - c.h / 2), 0, FP_LOGICAL_H - c.h);
    const item = {
      id: fpNewId(),
      catalogKey: key,
      kind: c.kind,
      shape: c.shape,
      seats: c.seats,
      num: c.kind === 'seat' ? plan.nextNum++ : null,
      x, y, rotation: 0,
      w: c.w, h: c.h,
    };
    plan.items.push(item);
    state.selectedId = item.id;
    setPendingKey(null);
    renderCanvas();
    renderInspector();
    notifyChange();
  }

  canvasEl.addEventListener('click', e => {
    const isEmptyTarget = e.target === canvasEl || e.target.classList.contains('fp-canvas-hint');
    if (state.pendingPaletteKey && isEmptyTarget) {
      const { x: lx, y: ly } = eventToLogical(e);
      placeCatalogItem(state.pendingPaletteKey, lx, ly);
      return;
    }
    if (isEmptyTarget) {
      state.selectedId = null;
      renderCanvas();
      renderInspector();
    }
  });

  // ===== Canvas render =====
  function renderCanvas() {
    const plan = currentPlan();
    const hint = plan.items.length === 0
      ? `<div class="fp-canvas-hint">${canvasHintText()}</div>`
      : '';
    canvasEl.innerHTML = hint + plan.items.map(itemHtml).join('');
    canvasEl.querySelectorAll('.fp-item').forEach(attachItemHandlers);
    canvasEl.classList.toggle('placing', !!state.pendingPaletteKey);
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
      const item = currentPlan().items.find(i => i.id === id);
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
      const item = currentPlan().items.find(i => i.id === id);
      if (!item) return;
      // Pointer deltas are in rendered (scaled) pixels — divide by zoom to work
      // in the canvas's logical coordinate space.
      const dx = (e.clientX - startX) / state.zoom;
      const dy = (e.clientY - startY) / state.zoom;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      const { w, h } = fpItemSize(item);
      const nx = fpClamp(origX + dx, 0, FP_LOGICAL_W - w);
      const ny = fpClamp(origY + dy, 0, FP_LOGICAL_H - h);
      el.style.left = nx + 'px';
      el.style.top = ny + 'px';
    });

    el.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      el.releasePointerCapture(pointerId);
      el.classList.remove('dragging');
      const item = currentPlan().items.find(i => i.id === id);
      if (!item) return;
      if (moved) {
        const { w, h } = fpItemSize(item);
        item.x = fpClamp(fpSnap(parseFloat(el.style.left)), 0, FP_LOGICAL_W - w);
        item.y = fpClamp(fpSnap(parseFloat(el.style.top)),  0, FP_LOGICAL_H - h);
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
    const item = currentPlan().items.find(i => i.id === id);
    if (!item) return;
    const base = FP_CATALOG[item.catalogKey] || {};
    if (!base.rotatable) return;
    item.rotation = item.rotation === 90 ? 0 : 90;
    const { w, h } = fpItemSize(item);
    item.x = fpClamp(item.x, 0, FP_LOGICAL_W - w);
    item.y = fpClamp(item.y, 0, FP_LOGICAL_H - h);
    renderCanvas();
    renderInspector();
    notifyChange();
  }

  function duplicateItem(id) {
    const plan = currentPlan();
    const src = plan.items.find(i => i.id === id);
    if (!src) return;
    const copy = Object.assign({}, src, {
      id: fpNewId(),
      x: fpClamp(src.x + FP_GRID, 0, FP_LOGICAL_W - fpItemSize(src).w),
      y: fpClamp(src.y + FP_GRID, 0, FP_LOGICAL_H - fpItemSize(src).h),
      num: src.kind === 'seat' ? plan.nextNum++ : null,
    });
    plan.items.push(copy);
    state.selectedId = copy.id;
    renderCanvas();
    renderInspector();
    notifyChange();
  }

  function deleteItem(id) {
    const plan = currentPlan();
    plan.items = plan.items.filter(i => i.id !== id);
    if (state.selectedId === id) state.selectedId = null;
    renderCanvas();
    renderInspector();
    notifyChange();
  }

  // ===== Inspector =====
  function renderInspector() {
    const plan = currentPlan();
    const sel = plan.items.find(i => i.id === state.selectedId);
    if (!sel) {
      inspectorEl.innerHTML = summaryHtml(plan);
      return;
    }
    inspectorEl.innerHTML = selectedHtml(sel);
    wireSelectedHandlers(sel);
  }

  function summaryHtml(plan) {
    const seats = plan.items.filter(i => i.kind === 'seat');
    const totalSeats = seats.reduce((s, i) => s + (i.seats || 0), 0);
    const byCap = {};
    seats.forEach(i => { byCap[i.seats] = (byCap[i.seats] || 0) + 1; });
    const caps = Object.keys(byCap).map(Number).sort((a, b) => a - b);
    const rows = caps.map(cap => `
      <div class="fp-summary-row"><span>Mesas de ${cap} ${cap === 1 ? 'plaza' : 'plazas'}</span><strong>${byCap[cap]}</strong></div>
    `).join('');
    const empty = plan.items.length === 0
      ? '<div class="fp-inspector-meta">Arrastra elementos desde el catálogo, o toca uno y luego el plano para colocarlo. Toca cualquier mesa para editarla.</div>'
      : '<div class="fp-inspector-meta">Haz clic en cualquier elemento del plano para editarlo, rotarlo o eliminarlo.</div>';
    const planCount = state.plans.length;
    const otherPlans = planCount > 1
      ? `<div class="fp-inspector-meta" style="margin-top:8px">${planCount} planos en total · usa las pestañas para cambiar de sala.</div>`
      : '';
    return `
      <h4>${escapeHtml(plan.name)}</h4>
      <div class="fp-summary-card">
        <div class="fp-summary-total">${seats.length} ${seats.length === 1 ? 'mesa' : 'mesas'}</div>
        <div class="fp-summary-sub">${totalSeats} plazas en total</div>
        ${rows}
      </div>
      ${empty}
      ${otherPlans}
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
        item.x = fpClamp(item.x, 0, FP_LOGICAL_W - w);
        item.y = fpClamp(item.y, 0, FP_LOGICAL_H - h);
        renderCanvas();
        renderInspector();
        notifyChange();
      });
    }
  }

  // ===== Keyboard =====
  rootEl.tabIndex = 0;
  rootEl.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.pendingPaletteKey) {
      e.preventDefault();
      setPendingKey(null);
      return;
    }
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
      options.onChange(exportState());
    }
  }

  function exportState() {
    return {
      plans: state.plans.map(p => ({
        id: p.id,
        name: p.name,
        nextNum: p.nextNum,
        items: p.items.slice(),
      })),
      activePlanId: state.activePlanId,
    };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  return {
    getState: exportState,
    setState: (s) => {
      state.plans = [];
      seedPlans(s);
      if (state.plans.length === 0) addPlan('Salón principal', true);
      state.activePlanId = (s && s.activePlanId) || state.plans[0].id;
      state.selectedId = null;
      renderPlansBar();
      renderCanvas();
      renderInspector();
    },
    destroy: () => { ro.disconnect(); rootEl.innerHTML = ''; },
  };
}
