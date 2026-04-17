// ============ STATE MANAGEMENT ============
const state = {
  currentTool: 'welder',
  currentVoltage: '220V'
};

// ============ DOM ELEMENTS ============
const toolBtns = document.querySelectorAll('.tool-btn');
const toolSections = document.querySelectorAll('.tool-section');
const voltageBtns = document.querySelectorAll('.voltage-btn');

// ============ ERROR HANDLING HELPERS ============
function showError(msg) {
  let banner = document.getElementById('error-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'error-banner';
    banner.setAttribute('role', 'alert');
    banner.className = 'error-banner';
    document.body.appendChild(banner);
  }
  banner.textContent = msg;
  banner.classList.add('visible');
  // Auto-dismiss after 5s
  clearTimeout(showError._timer);
  showError._timer = setTimeout(() => banner.classList.remove('visible'), 5000);
}

function isAbort(err) {
  return err && err.name === 'AbortError';
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.json();
}

// Coalesce rapid in-flight GETs by key. When the user hammers the voltage,
// thickness, or tool buttons, older requests for the same endpoint are
// aborted so their responses can't land on top of a newer selection.
// Callers should treat an AbortError as "superseded" — silent early return.
const inflight = new Map();

async function fetchJsonLatest(key, url, options = {}) {
  const previous = inflight.get(key);
  if (previous) previous.abort();

  const controller = new AbortController();
  inflight.set(key, controller);

  try {
    return await fetchJson(url, { ...options, signal: controller.signal });
  } finally {
    if (inflight.get(key) === controller) {
      inflight.delete(key);
    }
  }
}

// ============ EVENT LISTENERS - TOOL SELECTOR ============
toolBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    toolBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    state.currentTool = btn.dataset.tool;
    updateToolSection();
  });
});

// ============ EVENT LISTENERS - VOLTAGE SELECTOR ============
voltageBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    voltageBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.currentVoltage = btn.dataset.voltage;
    updateAllResults();
  });
});

// ============ TOOL UPDATES ============
async function updateToolSection() {
  toolSections.forEach(section => section.classList.remove('active'));
  document.getElementById(`${state.currentTool}-section`).classList.add('active');
  try {
    await loadDefaults();
    await updateAllResults();
  } catch (err) {
    if (isAbort(err)) return;
    showError(err.message || 'Failed to update tool section');
  }
}

// ============ UPDATE ALL RESULTS ============
async function updateAllResults() {
  try {
    if (state.currentTool === 'welder') {
      await updateWelderResults();
    } else {
      await updatePlasmaResults();
    }
  } catch (err) {
    if (isAbort(err)) return;
    showError(err.message || 'Failed to update results');
  }
}

// ============ DOM HELPERS ============
function populateSelect(selectEl, placeholderText, items, labelFn) {
  // Clear existing options
  while (selectEl.firstChild) {
    selectEl.removeChild(selectEl.firstChild);
  }
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = placeholderText;
  selectEl.appendChild(placeholder);

  items.forEach(value => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = labelFn ? labelFn(value) : value;
    selectEl.appendChild(opt);
  });
}

// ============ WELDER LOGIC ============

// Populate thickness dropdown for welder
document.getElementById('welder-material').addEventListener('change', async (e) => {
  const material = e.target.value;
  const thicknessSelect = document.getElementById('welder-thickness');

  if (material) {
    try {
      const thicknesses = await fetchJsonLatest(
        'welder-thicknesses',
        `/api/welding/thicknesses/${encodeURIComponent(material)}`
      );
      populateSelect(thicknessSelect, 'Select thickness...', thicknesses, formatThicknessDisplay);
      thicknessSelect.disabled = false;
      if (thicknesses.length > 0) {
        thicknessSelect.value = thicknesses[0];
      }
    } catch (err) {
      if (isAbort(err)) return;
      showError(err.message || 'Failed to load thicknesses');
      return;
    }
  } else {
    thicknessSelect.disabled = true;
  }
  try {
    await updateWelderResults();
  } catch (err) {
    if (isAbort(err)) return;
    showError(err.message || 'Failed to update results');
  }
});

// Update on thickness change for welder
document.getElementById('welder-thickness').addEventListener('change', () => {
  updateWelderResults().catch(err => {
    if (isAbort(err)) return;
    showError(err.message || 'Failed to update results');
  });
});

// Welder update results
async function updateWelderResults() {
  const material = document.getElementById('welder-material').value;
  const thickness = document.getElementById('welder-thickness').value;

  if (!material || !thickness) {
    document.getElementById('welder-results').classList.add('hidden');
    return;
  }

  const settings = await fetchJsonLatest(
    'welder-settings',
    `/api/welding/settings/${encodeURIComponent(material)}/${encodeURIComponent(thickness)}`
  );

  const wireSizeDisplay = getWireSizeDisplay();
  document.getElementById('welder-wireSize').textContent = wireSizeDisplay;
  document.getElementById('welder-voltage').textContent = settings.voltage;
  document.getElementById('welder-amperage').textContent = settings.ampRange;
  document.getElementById('welder-wireSpeed').textContent = settings.wireSpeed;

  const noteEl = document.getElementById('welder-note');
  noteEl.textContent = settings.note ? settings.note : '';

  document.getElementById('welder-results').classList.remove('hidden');
}

// Welder save defaults
document.getElementById('welder-save').addEventListener('click', async () => {
  const material = document.getElementById('welder-material').value;
  const thickness = document.getElementById('welder-thickness').value;
  const wireSize = document.getElementById('welder-wire-size').value;

  try {
    await fetchJson('/api/defaults/welder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voltage: state.currentVoltage,
        material,
        thickness,
        wireSize
      })
    });
  } catch (err) {
    showError(err.message || 'Failed to save defaults');
  }
});

// ============ PLASMA CUTTER LOGIC ============

// Populate thickness dropdown for plasma
document.getElementById('plasma-material').addEventListener('change', async (e) => {
  const material = e.target.value;
  const thicknessSelect = document.getElementById('plasma-thickness');

  if (material) {
    try {
      const thicknesses = await fetchJsonLatest(
        'plasma-thicknesses',
        `/api/plasma/thicknesses/${encodeURIComponent(material)}`
      );
      populateSelect(thicknessSelect, 'Select thickness...', thicknesses, formatThicknessDisplay);
      thicknessSelect.disabled = false;
      if (thicknesses.length > 0) {
        thicknessSelect.value = thicknesses[0];
      }
    } catch (err) {
      if (isAbort(err)) return;
      showError(err.message || 'Failed to load thicknesses');
      return;
    }
  } else {
    thicknessSelect.disabled = true;
  }
  try {
    await updatePlasmaResults();
  } catch (err) {
    if (isAbort(err)) return;
    showError(err.message || 'Failed to update results');
  }
});

// Update on thickness change for plasma
document.getElementById('plasma-thickness').addEventListener('change', () => {
  updatePlasmaResults().catch(err => {
    if (isAbort(err)) return;
    showError(err.message || 'Failed to update results');
  });
});

// Plasma update results
async function updatePlasmaResults() {
  const material = document.getElementById('plasma-material').value;
  const thickness = document.getElementById('plasma-thickness').value;

  if (!material || !thickness) {
    document.getElementById('plasma-results').classList.add('hidden');
    return;
  }

  const settings = await fetchJsonLatest(
    'plasma-settings',
    `/api/plasma/settings/${encodeURIComponent(material)}/${encodeURIComponent(thickness)}`
  );

  document.getElementById('plasma-amps').textContent = settings.amps;

  const airPressureKey = state.currentVoltage === '220V' ? 'airPressure220V' : 'airPressure110V';
  document.getElementById('plasma-airPressure').textContent = settings[airPressureKey];

  document.getElementById('plasma-cutSpeed').textContent = settings.cutSpeed;

  const noteEl = document.getElementById('plasma-note');
  noteEl.textContent = settings.note ? settings.note : '';

  document.getElementById('plasma-results').classList.remove('hidden');
}

// Plasma save defaults
document.getElementById('plasma-save').addEventListener('click', async () => {
  const material = document.getElementById('plasma-material').value;
  const thickness = document.getElementById('plasma-thickness').value;

  try {
    await fetchJson('/api/defaults/plasma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voltage: state.currentVoltage,
        material,
        thickness
      })
    });
  } catch (err) {
    showError(err.message || 'Failed to save defaults');
  }
});

// ============ HELPER FUNCTIONS ============
function formatMaterialName(name) {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/flux.*core/i, 'Flux Core')
    .trim()
    .replace(/^\w/, c => c.toUpperCase());
}

function formatThicknessDisplay(key) {
  const thicknessMap = {
    '16ga': '16ga',
    '14ga': '14ga',
    '12ga': '12ga',
    '1_8in': '1/8"',
    '3_16in': '3/16"',
    '1_4in': '1/4"',
    '3_8in': '3/8"',
    '1_2in': '1/2"'
  };
  return thicknessMap[key] || key;
}

function getWireSizeDisplay() {
  const select = document.getElementById('welder-wire-size');
  const selectedOption = select.options[select.selectedIndex];
  return selectedOption ? selectedOption.text : '';
}

// ============ LOAD DEFAULTS ON STARTUP ============
async function loadDefaults() {
  const tool = state.currentTool;
  const defaults = await fetchJsonLatest('defaults', `/api/defaults/${encodeURIComponent(tool)}`);

  const wireSizeSelect = document.getElementById('welder-wire-size');

  if (!defaults) {
    // No saved defaults — leave dropdowns at their first option (HTML default)
    if (tool === 'welder') {
      state.currentVoltage = '220V';
      // Use the first option in the wire size dropdown rather than hardcoding a value
      if (wireSizeSelect && wireSizeSelect.options.length > 0) {
        wireSizeSelect.selectedIndex = 0;
      }
    }
    return;
  }

  // Set voltage
  if (defaults.voltage) {
    state.currentVoltage = defaults.voltage;
    const voltageBtn = document.querySelector(`[data-voltage="${defaults.voltage}"]`);
    if (voltageBtn) {
      document.querySelectorAll('.voltage-btn').forEach(b => b.classList.remove('active'));
      voltageBtn.classList.add('active');
    }
  }

  if (tool === 'welder') {
    // Set wire size — prefer server default, else first option
    if (defaults.wireSize) {
      wireSizeSelect.value = defaults.wireSize;
    } else if (wireSizeSelect && wireSizeSelect.options.length > 0) {
      wireSizeSelect.selectedIndex = 0;
    }

    // Populate materials
    const materials = await fetchJsonLatest('welder-materials', '/api/welding/materials');
    const materialSelect = document.getElementById('welder-material');
    populateSelect(materialSelect, 'Select material...', materials, formatMaterialName);

    // Set default material and trigger thickness population
    if (defaults.material) {
      materialSelect.value = defaults.material;

      const thicknesses = await fetchJsonLatest(
        'welder-thicknesses',
        `/api/welding/thicknesses/${encodeURIComponent(defaults.material)}`
      );
      const thickSelect = document.getElementById('welder-thickness');
      populateSelect(thickSelect, 'Select thickness...', thicknesses, formatThicknessDisplay);

      if (defaults.thickness) {
        thickSelect.value = defaults.thickness;
      }
      thickSelect.disabled = false;
    }
  } else if (tool === 'plasma') {
    // Populate materials
    const materials = await fetchJsonLatest('plasma-materials', '/api/plasma/materials');
    const materialSelect = document.getElementById('plasma-material');
    populateSelect(materialSelect, 'Select material...', materials, formatMaterialName);

    // Set default material and trigger thickness population
    if (defaults.material) {
      materialSelect.value = defaults.material;

      const thicknesses = await fetchJsonLatest(
        'plasma-thicknesses',
        `/api/plasma/thicknesses/${encodeURIComponent(defaults.material)}`
      );
      const thickSelect = document.getElementById('plasma-thickness');
      populateSelect(thickSelect, 'Select thickness...', thicknesses, formatThicknessDisplay);

      if (defaults.thickness) {
        thickSelect.value = defaults.thickness;
      }
      thickSelect.disabled = false;
    }
  }
}

// Initialize on load
window.addEventListener('load', async () => {
  try {
    await loadDefaults();
    await updateAllResults();
  } catch (err) {
    if (isAbort(err)) return;
    showError(err.message || 'Failed to initialize');
  }
});
