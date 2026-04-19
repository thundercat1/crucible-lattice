// ===================== Crucible Lattice — demo app =====================
// All the intelligence here is theater: hard-coded results, fake latency,
// molecule rendering via RDKit-JS.

let RDKit = null;
window.initRDKitModule && window.initRDKitModule().then((m) => { RDKit = m; });

// ---------- DOM refs ----------
const $ = (id) => document.getElementById(id);
const inputPanel    = $('input-panel');
const workflowPanel = $('workflow-panel');
const resultsPanel  = $('results');
const executionPanel = $('execution');
const stagesEl      = $('stages');
let currentInput    = null;
let currentPayload  = null;
let selectedScenario = null;

// ---------- Example cards ----------
const inputGrid = document.querySelector('.input-grid');
const analyzeBtn = $('analyze-btn');
let selectedExample = null;

function fillFields(ex) {
  $('f-smiles').value    = ex.input.smiles;
  $('f-name').value      = ex.input.name;
  $('f-usecase').value   = ex.input.useCase;
  $('f-quantity').value  = ex.input.quantity;
  $('f-timeline').value  = ex.input.timeline;
  inputGrid.setAttribute('data-filled', '');
  inputGrid.removeAttribute('title');
}

function clearFields() {
  ['f-smiles','f-name','f-usecase','f-quantity','f-timeline'].forEach((id) => { $(id).value = ''; });
  inputGrid.removeAttribute('data-filled');
  inputGrid.setAttribute('title', 'Select from Examples');
  document.querySelectorAll('.example-card').forEach((c) => c.classList.remove('selected'));
  selectedExample = null;
  analyzeBtn.disabled = true;
  analyzeBtn.classList.remove('ready');
}

document.querySelectorAll('.example-card').forEach((btn) => {
  btn.addEventListener('click', () => {
    const ex = EXAMPLES[btn.dataset.example];
    if (!ex) return;
    document.querySelectorAll('.example-card').forEach((c) => c.classList.remove('selected'));
    btn.classList.add('selected');
    fillFields(ex);
    selectedExample = ex;
    analyzeBtn.disabled = false;
    analyzeBtn.classList.remove('ready');
    void analyzeBtn.offsetWidth;
    analyzeBtn.classList.add('ready');
  });
});

analyzeBtn.addEventListener('click', () => {
  if (!selectedExample) return;
  const ex = selectedExample;
  runWorkflow({ smiles: ex.input.smiles, ...ex.input }, ex);
});

$('reset-btn').addEventListener('click', () => {
  resultsPanel.hidden = true;
  inputPanel.hidden = false;
  clearFields();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ---------- Execution handlers ----------
$('execute-btn').addEventListener('click', () => {
  if (!selectedScenario) return;
  executionPanel.hidden = false;
  resultsPanel.hidden = true;
  renderExecution(selectedScenario);
  executionPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

const execBackLink = $('exec-back-link');
const execResetBtn = $('exec-reset-btn');
if (execBackLink) {
  execBackLink.addEventListener('click', (e) => {
    e.preventDefault();
    executionPanel.hidden = true;
    resultsPanel.hidden = false;
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
if (execResetBtn) {
  execResetBtn.addEventListener('click', () => {
    executionPanel.hidden = true;
    inputPanel.hidden = false;
    clearFields();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function renderExecution(scenario) {
  const id = currentInput.name || currentPayload.identity.name;

  // Copy molecule to execution page
  const srcRender = $('molecule-render').innerHTML;
  $('exec-mol-render').innerHTML = srcRender;

  // Project info
  $('exec-project-name').textContent = id;
  $('exec-use-case').textContent = currentInput.useCase;
  $('exec-lead-partner').textContent = scenario.partners[0] || 'TBD';
  $('exec-timeline').textContent = scenario.leadTime;
  $('exec-cost').textContent = scenario.cost;

  // Timeline
  const timeline = [
    { title: 'Request manufacturing brief', detail: 'Full cGMP audit, capacity confirmation, lead-time validation', owner: 'Crucible', timeline: 'Day 1', status: 'done' },
    { title: 'Select & negotiate with lead partner', detail: `Contracting, NDA, tech specs to ${scenario.partners[0] || 'lead partner'}`, owner: 'Crucible + partner', timeline: scenario.leadTime.split('–')[0] || 'Week 1–2', status: 'active' },
    { title: 'Technical transfer & process validation', detail: 'Lab demo, scale-up feasibility, constraint confirmation', owner: scenario.partners[0] || 'Partner', timeline: '2–3 weeks', status: 'pending' },
    { title: 'Tooling & process optimization', detail: 'Equipment setup, parameter tuning, batch sizing', owner: scenario.partners[0] || 'Partner', timeline: '3–4 weeks', status: 'pending' },
    { title: 'Manufacturing run', detail: 'Full-scale production, real-time monitoring', owner: scenario.partners[0] || 'Partner', timeline: 'Variable', status: 'pending' },
    { title: 'QC release & final testing', detail: 'COA generation, analytical validation, regulatory sign-off', owner: 'QC Lab', timeline: '1–2 weeks', status: 'pending' },
    { title: 'Delivery & handoff', detail: 'Logistics, documentation, supply-chain closure', owner: 'Crucible logistics', timeline: 'On-time rate: 97.4%', status: 'pending' },
  ];

  $('execution-timeline').innerHTML = timeline.map((step, i) => `
    <li class="exec-step ${step.status}">
      <div class="exec-step-dot">${i + 1}</div>
      <div class="exec-step-content">
        <div class="exec-step-title">${step.title}</div>
        <div class="exec-step-details">
          <div class="exec-step-detail-item">
            <span class="exec-step-detail-label">Detail</span>
            <span class="exec-step-detail-value">${step.detail}</span>
          </div>
          <div class="exec-step-detail-item">
            <span class="exec-step-detail-label">Owner</span>
            <span class="exec-step-detail-value">${step.owner}</span>
          </div>
          <div class="exec-step-detail-item">
            <span class="exec-step-detail-label">Timeline</span>
            <span class="exec-step-detail-value">${step.timeline}</span>
          </div>
        </div>
      </div>
    </li>
  `).join('');
}

// ---------- Workflow animation ----------
function runWorkflow(input, payload) {
  inputPanel.hidden = true;
  workflowPanel.hidden = false;
  resultsPanel.hidden = true;
  executionPanel.hidden = true;
  workflowPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  stagesEl.innerHTML = WORKFLOW_STAGES.map((s, i) => `
    <li class="stage" data-i="${i}">
      <div class="stage-icon">${i + 1}</div>
      <div>
        <div class="stage-label">${s.label}</div>
        <div class="stage-detail">${s.detail}</div>
      </div>
      <div class="stage-timing" data-timing>—</div>
    </li>
  `).join('');

  let i = 0;
  const total = WORKFLOW_STAGES.length;
  const stageEls = stagesEl.querySelectorAll('.stage');

  function nextStage() {
    if (i > 0) {
      stageEls[i - 1].classList.remove('active');
      stageEls[i - 1].classList.add('done');
    }
    if (i >= total) { finishWorkflow(input, payload); return; }
    stageEls[i].classList.add('active');
    const dur = 450 + Math.random() * 650;
    const startedAt = performance.now();
    const timingEl = stageEls[i].querySelector('[data-timing]');
    const tick = () => {
      const elapsed = performance.now() - startedAt;
      timingEl.textContent = (elapsed / 1000).toFixed(2) + 's';
      if (stageEls[i] && stageEls[i].classList.contains('active')) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => { i++; nextStage(); }, dur);
  }
  nextStage();
}

function finishWorkflow(input, payload) {
  setTimeout(() => {
    workflowPanel.hidden = true;
    currentInput = input;
    currentPayload = payload;
    selectedScenario = payload.scenarios[0];
    renderResults(input, payload);
    resultsPanel.hidden = false;
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 300);
}

// ---------- Results render ----------
function renderResults(input, payload) {
  renderMolecule(input.smiles);
  renderIdentity(input, payload);
  renderOptimization(payload);
  renderRegulatory(payload);
  renderHazard(payload);
  renderPurity(payload);
  renderScenarios(payload);
  renderWhatIf(payload);
  renderMap(payload);
}

function renderMolecule(smiles) {
  const el = $('molecule-render');
  el.innerHTML = '<div class="render-placeholder">Rendering structure…</div>';
  const draw = () => {
    if (!RDKit) { setTimeout(draw, 150); return; }
    try {
      const mol = RDKit.get_mol(smiles);
      if (!mol) throw new Error('parse failed');
      const svg = mol.get_svg(440, 280);
      el.innerHTML = svg;
      mol.delete();
    } catch (e) {
      el.innerHTML = '<div class="render-placeholder">Structure preview unavailable for this SMILES.</div>';
    }
  };
  draw();
}

function renderIdentity(input, payload) {
  const id = payload.identity;
  const tagRow = $('id-tag-row');
  tagRow.innerHTML = `<span class="chip-tag ${payload.tagColor}">${payload.tag}</span>` +
                     `<span class="chip-tag slate">${payload.label}</span>`;
  $('id-name').textContent           = input.name || id.name;
  $('id-classification').textContent = id.classification;
  $('id-formula').textContent        = id.formula;
  $('id-mw').textContent             = id.molecularWeight;
  $('id-state').textContent          = id.state;
  $('id-usecase').textContent        = input.useCase;
  $('id-qty').textContent            = input.quantity;
  $('id-timeline').textContent       = input.timeline;
}

function renderOptimization(payload) {
  const box = $('optimization-alert');
  if (!payload.optimization) { box.hidden = true; return; }
  const opt = payload.optimization;
  box.hidden = false;
  $('opt-title').textContent      = opt.title;
  $('opt-finding').textContent    = opt.finding;
  $('opt-suggestion').textContent = opt.suggestion;
  $('opt-cta').textContent        = opt.cta;
  $('opt-impact').innerHTML = opt.impact.map((m) => `
    <div class="opt-metric">
      <div class="opt-metric-label">${m.metric}</div>
      <div class="opt-metric-values">
        <span class="opt-metric-from">${m.from}</span>
        <span class="opt-metric-arrow">→</span>
        <span class="opt-metric-to">${m.to}</span>
      </div>
      <div class="opt-metric-delta">${m.delta}</div>
    </div>
  `).join('');
}

function renderRegulatory(payload) {
  $('reg-list').innerHTML = payload.regulatory.map((r) => {
    const glyph = r.status === 'pass' ? '✓' : r.status === 'flag' ? '!' : r.status === 'fail' ? '✕' : '–';
    return `<li class="reg-item">
      <div class="reg-status ${r.status}">${glyph}</div>
      <div>
        <div class="reg-label">${r.label}</div>
        <div class="reg-note">${r.note}</div>
      </div>
    </li>`;
  }).join('');
}

function renderHazard(payload) {
  $('hazard-summary').textContent = payload.hazard.summary;
  $('hazard-flags').innerHTML = payload.hazard.flags
    .map((f) => `<span class="hazard-flag">${f}</span>`).join('');
}

function renderPurity(payload) {
  $('purity-body').innerHTML = payload.purity.map((p) => `
    <tr>
      <td class="purity-scale">${p.scale}</td>
      <td>${p.target}</td>
      <td class="purity-method">${p.method}</td>
    </tr>
  `).join('');
}

// ----- Scenarios w/ SVG radar chart -----
function renderScenarios(payload) {
  $('scenarios').innerHTML = payload.scenarios.map((s, i) => `
    <button class="scenario-card" data-scenario="${i}" style="border: none; background: none; cursor: pointer; padding: 0;">
      <div class="scenario-head">
        <div class="scenario-icon">${s.icon}</div>
        <div class="scenario-name">${s.name}</div>
      </div>
      <div class="scenario-radar">${radarSvg(s.radar)}</div>
      <div class="scenario-facts">
        <div class="scenario-fact"><div class="label">Cost</div><div class="value">${s.cost}</div></div>
        <div class="scenario-fact"><div class="label">Per kg</div><div class="value">${s.costPerKg}</div></div>
        <div class="scenario-fact"><div class="label">Lead time</div><div class="value">${s.leadTime}</div></div>
        <div class="scenario-fact"><div class="label">Partners</div><div class="value">${s.partnerCount}</div></div>
      </div>
      <div class="scenario-highlight">${s.highlight}</div>
      <ul class="scenario-partners">
        ${s.partners.map((p) => `<li>${p}</li>`).join('')}
      </ul>
    </button>
  `).join('');

  // Wire scenario card clicks
  document.querySelectorAll('.scenario-card').forEach((card) => {
    card.addEventListener('click', () => {
      const idx = +card.dataset.scenario;
      document.querySelectorAll('.scenario-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedScenario = payload.scenarios[idx];
    });
  });

  // Default select first scenario
  document.querySelectorAll('.scenario-card')[0]?.classList.add('selected');
  selectedScenario = payload.scenarios[0];
}

function radarSvg(r) {
  const axes = [
    { key: 'cost',           label: 'Cost' },
    { key: 'speed',          label: 'Speed' },
    { key: 'risk',           label: 'Risk' },
    { key: 'sustainability', label: 'Green' },
    { key: 'compliance',     label: 'Comp.' },
    { key: 'scalability',    label: 'Scale' },
  ];
  const cx = 95, cy = 95, maxR = 68;
  const n = axes.length;

  const pt = (i, rad) => {
    const theta = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [cx + rad * Math.cos(theta), cy + rad * Math.sin(theta)];
  };

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1].map((f) => {
    const pts = axes.map((_, i) => pt(i, maxR * f).join(',')).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="rgba(43,58,88,0.55)" stroke-width="0.8"/>`;
  }).join('');

  // Axis lines
  const spokes = axes.map((_, i) => {
    const [x, y] = pt(i, maxR);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(43,58,88,0.45)" stroke-width="0.8"/>`;
  }).join('');

  // Data polygon
  const dataPts = axes.map((a, i) => pt(i, maxR * ((r[a.key] || 0) / 100)).join(',')).join(' ');

  // Labels
  const labels = axes.map((a, i) => {
    const [x, y] = pt(i, maxR + 14);
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle"
              fill="#6a7a96" font-size="9" font-family="system-ui">${a.label}</text>`;
  }).join('');

  return `
    <svg width="190" height="190" viewBox="0 0 190 190">
      <defs>
        <linearGradient id="radar-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#5eead4" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#818cf8" stop-opacity="0.45"/>
        </linearGradient>
      </defs>
      ${rings}
      ${spokes}
      <polygon points="${dataPts}" fill="url(#radar-fill)" stroke="#5eead4" stroke-width="1.5"/>
      ${labels}
    </svg>
  `;
}

// ----- What-if slider -----
function renderWhatIf(payload) {
  const slider = $('whatif-slider');
  const readout = $('whatif-readout');
  const result = $('whatif-result');

  const scaleOf = (v) => {
    if (v < 33)  return { label: 'Bench', unit: 'grams',     qtyText: '100 g – 1 kg', multiplier: 0.12, tier: 'bench' };
    if (v < 67)  return { label: 'Pilot', unit: 'kilograms', qtyText: '10 kg – 500 kg', multiplier: 1.0,  tier: 'pilot' };
    return { label: 'Commercial', unit: 'tons', qtyText: '5 t – 1000 t / year', multiplier: 8.6, tier: 'commercial' };
  };

  const update = () => {
    const v = +slider.value;
    const s = scaleOf(v);
    readout.textContent = `${s.label.toUpperCase()} · ${s.qtyText}`;

    // Pick partners based on scale
    const allPartners = [...new Set(payload.scenarios.flatMap((sc) => sc.partners))];
    const scaleFactor = s.tier === 'bench' ? 0.45 : s.tier === 'pilot' ? 0.75 : 1.0;
    const matching = Math.max(2, Math.round(allPartners.length * scaleFactor));
    const filtered = allPartners.slice(0, matching);

    const baseCost = payload.scenarios[0]?.costPerKg || '';
    const dropOut = allPartners.length - matching;

    result.innerHTML = `
      <div style="display:flex;gap:2rem;flex-wrap:wrap">
        <div><strong>${matching}</strong> partners match at ${s.label.toLowerCase()} scale
          ${dropOut > 0 ? `<span class="muted"> · ${dropOut} drop out below MOQ or capability</span>` : ''}
        </div>
        <div class="muted">Cost profile shifts: ${s.tier === 'bench'
            ? 'premium per kg, specialty CDMOs only'
            : s.tier === 'pilot'
              ? 'balanced — most partners qualify'
              : 'economies of scale kick in, commodity sourcing available'}.</div>
      </div>
      <div style="margin-top:0.65rem;font-size:0.8rem;color:var(--text-muted)">
        In network: ${filtered.slice(0, 5).map((p) => p.split(' (')[0]).join(' · ')}${filtered.length > 5 ? ' · …' : ''}
      </div>`;
  };
  slider.oninput = update;
  update();
}

// ----- Network map -----
function renderMap(payload) {
  $('map-caption').textContent = payload.map.caption;
  const mapEl = $('network-map');

  // Connection lines between active tier-1 nodes
  const nodes = payload.map.nodes;
  const activeT1 = nodes.map((n, i) => ({ ...n, i })).filter((n) => n.active && n.tier === 1);
  let lines = '';
  for (let a = 0; a < activeT1.length; a++) {
    for (let b = a + 1; b < activeT1.length; b++) {
      if (Math.random() < 0.45) {
        const n1 = activeT1[a], n2 = activeT1[b];
        lines += `<line x1="${n1.x}%" y1="${n1.y}%" x2="${n2.x}%" y2="${n2.y}%"
                    stroke="rgba(94,234,212,0.22)" stroke-width="1" stroke-dasharray="4 3"/>`;
      }
    }
  }

  mapEl.innerHTML = `
    <svg preserveAspectRatio="none">${lines}</svg>
    ${nodes.map((n) => `
      <div class="node tier-${n.tier}" style="left:${n.x}%;top:${n.y}%">
        <div class="node-dot"></div>
        <div class="node-label">${n.name}</div>
        <div class="node-role">${n.role}</div>
      </div>
    `).join('')}
  `;
}
