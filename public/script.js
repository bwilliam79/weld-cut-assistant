// ============ STATE MANAGEMENT ============
const state = {
  currentTool: 'welder',
  currentMode: 'quick',
  currentVoltage: '220V'
};

// ============ DOM ELEMENTS ============
const toolBtns = document.querySelectorAll('.tool-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const toolSections = document.querySelectorAll('.tool-section');
const voltageBtns = document.querySelectorAll('.voltage-btn');

// ============ EVENT LISTENERS - TOOL SELECTOR ============
toolBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    toolBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    state.currentTool = btn.dataset.tool;
    updateToolSection();
  });
});

// ============ EVENT LISTENERS - MODE SELECTOR ============
modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    state.currentMode = btn.dataset.mode;
    updateModeContent();
  });
});

// ============ EVENT LISTENERS - VOLTAGE SELECTOR ============
voltageBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    voltageBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.currentVoltage = btn.dataset.voltage;
  });
});

// ============ TOOL & MODE UPDATES ============
function updateToolSection() {
  toolSections.forEach(section => section.classList.remove('active'));
  document.getElementById(`${state.currentTool}-section`).classList.add('active');
  loadDefaults();
}

function updateModeContent() {
  const modeContents = document.querySelectorAll('.mode-content');
  modeContents.forEach(content => content.classList.remove('active'));

  const activeSection = document.getElementById(`${state.currentTool}-section`);
  const modeDiv = activeSection.querySelector(`#${state.currentTool}-${state.currentMode}`);
  if (modeDiv) modeDiv.classList.add('active');
}

// ============ WELDER LOGIC ============

// Populate thickness dropdown for welder quick mode
document.getElementById('welder-quick-material').addEventListener('change', async (e) => {
  const material = e.target.value;
  const thicknessSelect = document.getElementById('welder-quick-thickness');

  if (material) {
    const response = await fetch(`/api/welding/thicknesses/${material}`);
    const thicknesses = await response.json();

    thicknessSelect.innerHTML = '<option value="">Select thickness...</option>';
    thicknesses.forEach(t => {
      thicknessSelect.innerHTML += `<option value="${t}">${t}</option>`;
    });
    thicknessSelect.disabled = false;
  } else {
    thicknessSelect.disabled = true;
  }
});

// Populate thickness dropdown for welder advanced mode
document.getElementById('welder-adv-material').addEventListener('change', async (e) => {
  const material = e.target.value;
  const thicknessSelect = document.getElementById('welder-adv-thickness');

  if (material) {
    const response = await fetch(`/api/welding/thicknesses/${material}`);
    const thicknesses = await response.json();

    thicknessSelect.innerHTML = '<option value="">Select thickness...</option>';
    thicknesses.forEach(t => {
      thicknessSelect.innerHTML += `<option value="${t}">${t}</option>`;
    });
    thicknessSelect.disabled = false;
  } else {
    thicknessSelect.disabled = true;
  }
});

// Welder quick mode calculate
document.getElementById('welder-quick-calculate').addEventListener('click', async () => {
  const material = document.getElementById('welder-quick-material').value;
  const thickness = document.getElementById('welder-quick-thickness').value;

  if (!material || !thickness) {
    alert('Please select material and thickness');
    return;
  }

  const response = await fetch(`/api/welding/settings/${material}/${thickness}`);
  const settings = await response.json();

  document.getElementById('quick-voltage').textContent = settings.voltage;
  document.getElementById('quick-amperage').textContent = settings.ampRange;
  document.getElementById('quick-wireSpeed').textContent = settings.wireSpeed;

  const noteEl = document.getElementById('quick-note');
  if (settings.note) {
    noteEl.textContent = settings.note;
  }

  document.getElementById('welder-quick-results').classList.remove('hidden');
});

// Welder quick mode save defaults
document.getElementById('welder-quick-save').addEventListener('click', async () => {
  const material = document.getElementById('welder-quick-material').value;
  const thickness = document.getElementById('welder-quick-thickness').value;
  const wireSize = document.getElementById('welder-wire-size')?.value || '.030"';

  await fetch('/api/defaults/welder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voltage: state.currentVoltage,
      material,
      thickness,
      wireSize
    })
  });

  alert('Defaults saved!');
});

// Welder advanced mode calculate
document.getElementById('welder-adv-calculate').addEventListener('click', async () => {
  const material = document.getElementById('welder-adv-material').value;
  const thickness = document.getElementById('welder-adv-thickness').value;

  if (!material || !thickness) {
    alert('Please select material and thickness');
    return;
  }

  const response = await fetch(`/api/welding/settings/${material}/${thickness}`);
  const settings = await response.json();

  document.getElementById('adv-voltage').textContent = settings.voltage;
  document.getElementById('adv-amperage').textContent = settings.ampRange;
  document.getElementById('adv-wireSpeed').textContent = settings.wireSpeed;

  const noteEl = document.getElementById('adv-note');
  if (settings.note) {
    noteEl.textContent = settings.note;
  }

  document.getElementById('welder-adv-results').classList.remove('hidden');
});

// Welder advanced mode save defaults
document.getElementById('welder-adv-save').addEventListener('click', async () => {
  const material = document.getElementById('welder-adv-material').value;
  const thickness = document.getElementById('welder-adv-thickness').value;
  const wireSize = document.getElementById('welder-wire-size').value;

  await fetch('/api/defaults/welder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voltage: state.currentVoltage,
      material,
      thickness,
      wireSize
    })
  });

  alert('Defaults saved!');
});

// ============ PLASMA CUTTER LOGIC ============

// Populate thickness dropdown for plasma quick mode
document.getElementById('plasma-quick-material').addEventListener('change', async (e) => {
  const material = e.target.value;
  const thicknessSelect = document.getElementById('plasma-quick-thickness');

  if (material) {
    const response = await fetch(`/api/plasma/thicknesses/${material}`);
    const thicknesses = await response.json();

    thicknessSelect.innerHTML = '<option value="">Select thickness...</option>';
    thicknesses.forEach(t => {
      thicknessSelect.innerHTML += `<option value="${t}">${t}</option>`;
    });
    thicknessSelect.disabled = false;
  } else {
    thicknessSelect.disabled = true;
  }
});

// Populate thickness dropdown for plasma advanced mode
document.getElementById('plasma-adv-material').addEventListener('change', async (e) => {
  const material = e.target.value;
  const thicknessSelect = document.getElementById('plasma-adv-thickness');

  if (material) {
    const response = await fetch(`/api/plasma/thicknesses/${material}`);
    const thicknesses = await response.json();

    thicknessSelect.innerHTML = '<option value="">Select thickness...</option>';
    thicknesses.forEach(t => {
      thicknessSelect.innerHTML += `<option value="${t}">${t}</option>`;
    });
    thicknessSelect.disabled = false;
  } else {
    thicknessSelect.disabled = true;
  }
});

// Plasma quick mode calculate
document.getElementById('plasma-quick-calculate').addEventListener('click', async () => {
  const material = document.getElementById('plasma-quick-material').value;
  const thickness = document.getElementById('plasma-quick-thickness').value;

  if (!material || !thickness) {
    alert('Please select material and thickness');
    return;
  }

  const response = await fetch(`/api/plasma/settings/${material}/${thickness}`);
  const settings = await response.json();

  document.getElementById('plasma-quick-amps').textContent = settings.amps;

  // Show appropriate air pressure based on voltage
  const airPressureKey = state.currentVoltage === '220V' ? 'airPressure220V' : 'airPressure110V';
  document.getElementById('plasma-quick-airPressure').textContent = settings[airPressureKey];

  document.getElementById('plasma-quick-cutSpeed').textContent = settings.cutSpeed;

  const noteEl = document.getElementById('plasma-quick-note');
  if (settings.note) {
    noteEl.textContent = settings.note;
  }

  document.getElementById('plasma-quick-results').classList.remove('hidden');
});

// Plasma quick mode save defaults
document.getElementById('plasma-quick-save').addEventListener('click', async () => {
  const material = document.getElementById('plasma-quick-material').value;
  const thickness = document.getElementById('plasma-quick-thickness').value;

  await fetch('/api/defaults/plasma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voltage: state.currentVoltage,
      material,
      thickness
    })
  });

  alert('Defaults saved!');
});

// Plasma advanced mode calculate
document.getElementById('plasma-adv-calculate').addEventListener('click', async () => {
  const material = document.getElementById('plasma-adv-material').value;
  const thickness = document.getElementById('plasma-adv-thickness').value;

  if (!material || !thickness) {
    alert('Please select material and thickness');
    return;
  }

  const response = await fetch(`/api/plasma/settings/${material}/${thickness}`);
  const settings = await response.json();

  document.getElementById('plasma-adv-amps').textContent = settings.amps;

  const airPressureKey = state.currentVoltage === '220V' ? 'airPressure220V' : 'airPressure110V';
  document.getElementById('plasma-adv-airPressure').textContent = settings[airPressureKey];

  document.getElementById('plasma-adv-cutSpeed').textContent = settings.cutSpeed;

  const noteEl = document.getElementById('plasma-adv-note');
  if (settings.note) {
    noteEl.textContent = settings.note;
  }

  document.getElementById('plasma-adv-results').classList.remove('hidden');
});

// Plasma advanced mode save defaults
document.getElementById('plasma-adv-save').addEventListener('click', async () => {
  const material = document.getElementById('plasma-adv-material').value;
  const thickness = document.getElementById('plasma-adv-thickness').value;

  await fetch('/api/defaults/plasma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voltage: state.currentVoltage,
      material,
      thickness
    })
  });

  alert('Defaults saved!');
});

// ============ LOAD DEFAULTS ON STARTUP ============
async function loadDefaults() {
  const tool = state.currentTool;
  const response = await fetch(`/api/defaults/${tool}`);
  const defaults = await response.json();

  if (!defaults) return;

  // Set voltage
  if (defaults.voltage) {
    const voltageBtn = document.querySelector(`[data-voltage="${defaults.voltage}"]`);
    if (voltageBtn) {
      document.querySelectorAll('.voltage-btn').forEach(b => b.classList.remove('active'));
      voltageBtn.classList.add('active');
      state.currentVoltage = defaults.voltage;
    }
  }

  if (tool === 'welder') {
    // Set wire size
    if (defaults.wireSize) {
      document.getElementById('welder-wire-size').value = defaults.wireSize;
    }

    // Populate materials
    const response = await fetch('/api/welding/materials');
    const materials = await response.json();

    const quickMaterialSelect = document.getElementById('welder-quick-material');
    const advMaterialSelect = document.getElementById('welder-adv-material');

    quickMaterialSelect.innerHTML = '<option value="">Select material...</option>';
    advMaterialSelect.innerHTML = '<option value="">Select material...</option>';

    materials.forEach(m => {
      quickMaterialSelect.innerHTML += `<option value="${m}">${formatMaterialName(m)}</option>`;
      advMaterialSelect.innerHTML += `<option value="${m}">${formatMaterialName(m)}</option>`;
    });

    // Set default material
    if (defaults.material) {
      quickMaterialSelect.value = defaults.material;
      advMaterialSelect.value = defaults.material;
    }
  } else if (tool === 'plasma') {
    // Populate materials
    const response = await fetch('/api/plasma/materials');
    const materials = await response.json();

    const quickMaterialSelect = document.getElementById('plasma-quick-material');
    const advMaterialSelect = document.getElementById('plasma-adv-material');

    quickMaterialSelect.innerHTML = '<option value="">Select material...</option>';
    advMaterialSelect.innerHTML = '<option value="">Select material...</option>';

    materials.forEach(m => {
      quickMaterialSelect.innerHTML += `<option value="${m}">${formatMaterialName(m)}</option>`;
      advMaterialSelect.innerHTML += `<option value="${m}">${formatMaterialName(m)}</option>`;
    });

    // Set default material
    if (defaults.material) {
      quickMaterialSelect.value = defaults.material;
      advMaterialSelect.value = defaults.material;
    }
  }
}

function formatMaterialName(name) {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/flux.*core/i, 'Flux Core')
    .trim();
}

// Initialize on load
window.addEventListener('load', () => {
  loadDefaults();
});
