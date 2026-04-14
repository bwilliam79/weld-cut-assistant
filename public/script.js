// ============ STATE MANAGEMENT ============
const state = {
  currentTool: 'welder',
  currentVoltage: '220V'
};

// ============ DOM ELEMENTS ============
const toolBtns = document.querySelectorAll('.tool-btn');
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
function updateToolSection() {
  toolSections.forEach(section => section.classList.remove('active'));
  document.getElementById(`${state.currentTool}-section`).classList.add('active');
  loadDefaults();
  setTimeout(updateAllResults, 100);
}

// ============ UPDATE ALL RESULTS ============
function updateAllResults() {
  if (state.currentTool === 'welder') {
    updateWelderResults();
  } else {
    updatePlasmaResults();
  }
}

// ============ WELDER LOGIC ============

// Populate thickness dropdown for welder
document.getElementById('welder-material').addEventListener('change', async (e) => {
  const material = e.target.value;
  const thicknessSelect = document.getElementById('welder-thickness');

  if (material) {
    const response = await fetch(`/api/welding/thicknesses/${material}`);
    const thicknesses = await response.json();

    thicknessSelect.innerHTML = '<option value="">Select thickness...</option>';
    thicknesses.forEach(t => {
      thicknessSelect.innerHTML += `<option value="${t}">${formatThicknessDisplay(t)}</option>`;
    });
    thicknessSelect.disabled = false;
    if (thicknesses.length > 0) {
      thicknessSelect.value = thicknesses[0];
    }
  } else {
    thicknessSelect.disabled = true;
  }
  updateWelderResults();
});

// Update on thickness change for welder
document.getElementById('welder-thickness').addEventListener('change', updateWelderResults);

// Welder update results
async function updateWelderResults() {
  const material = document.getElementById('welder-material').value;
  const thickness = document.getElementById('welder-thickness').value;

  if (!material || !thickness) {
    document.getElementById('welder-results').classList.add('hidden');
    return;
  }

  const response = await fetch(`/api/welding/settings/${material}/${thickness}`);
  const settings = await response.json();

  document.getElementById('welder-wireSize').textContent = getWireSizeDisplay();
  document.getElementById('welder-voltage').textContent = settings.voltage;
  document.getElementById('welder-amperage').textContent = settings.ampRange;
  document.getElementById('welder-wireSpeed').textContent = settings.wireSpeed;

  const noteEl = document.getElementById('welder-note');
  if (settings.note) {
    noteEl.textContent = settings.note;
  } else {
    noteEl.textContent = '';
  }

  document.getElementById('welder-results').classList.remove('hidden');
}

// Welder save defaults
document.getElementById('welder-save').addEventListener('click', async () => {
  const material = document.getElementById('welder-material').value;
  const thickness = document.getElementById('welder-thickness').value;
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
});

// ============ PLASMA CUTTER LOGIC ============

// Populate thickness dropdown for plasma
document.getElementById('plasma-material').addEventListener('change', async (e) => {
  const material = e.target.value;
  const thicknessSelect = document.getElementById('plasma-thickness');

  if (material) {
    const response = await fetch(`/api/plasma/thicknesses/${material}`);
    const thicknesses = await response.json();

    thicknessSelect.innerHTML = '<option value="">Select thickness...</option>';
    thicknesses.forEach(t => {
      thicknessSelect.innerHTML += `<option value="${t}">${formatThicknessDisplay(t)}</option>`;
    });
    thicknessSelect.disabled = false;
    if (thicknesses.length > 0) {
      thicknessSelect.value = thicknesses[0];
    }
  } else {
    thicknessSelect.disabled = true;
  }
  updatePlasmaResults();
});

// Update on thickness change for plasma
document.getElementById('plasma-thickness').addEventListener('change', updatePlasmaResults);

// Plasma update results
async function updatePlasmaResults() {
  const material = document.getElementById('plasma-material').value;
  const thickness = document.getElementById('plasma-thickness').value;

  if (!material || !thickness) {
    document.getElementById('plasma-results').classList.add('hidden');
    return;
  }

  const response = await fetch(`/api/plasma/settings/${material}/${thickness}`);
  const settings = await response.json();

  document.getElementById('plasma-amps').textContent = settings.amps;

  const airPressureKey = state.currentVoltage === '220V' ? 'airPressure220V' : 'airPressure110V';
  document.getElementById('plasma-airPressure').textContent = settings[airPressureKey];

  document.getElementById('plasma-cutSpeed').textContent = settings.cutSpeed;

  const noteEl = document.getElementById('plasma-note');
  if (settings.note) {
    noteEl.textContent = settings.note;
  } else {
    noteEl.textContent = '';
  }

  document.getElementById('plasma-results').classList.remove('hidden');
}

// Plasma save defaults
document.getElementById('plasma-save').addEventListener('click', async () => {
  const material = document.getElementById('plasma-material').value;
  const thickness = document.getElementById('plasma-thickness').value;

  await fetch('/api/defaults/plasma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voltage: state.currentVoltage,
      material,
      thickness
    })
  });
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
  return selectedOption.text;
}

// ============ LOAD DEFAULTS ON STARTUP ============
async function loadDefaults() {
  const tool = state.currentTool;
  const response = await fetch(`/api/defaults/${tool}`);
  const defaults = await response.json();

  if (!defaults) {
    // Set initial defaults
    if (tool === 'welder') {
      state.currentVoltage = '220V';
      document.getElementById('welder-wire-size').value = '.030';
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
    // Set wire size
    if (defaults.wireSize) {
      document.getElementById('welder-wire-size').value = defaults.wireSize;
    }

    // Populate materials
    const response = await fetch('/api/welding/materials');
    const materials = await response.json();

    const materialSelect = document.getElementById('welder-material');

    materialSelect.innerHTML = '<option value="">Select material...</option>';

    materials.forEach(m => {
      materialSelect.innerHTML += `<option value="${m}">${formatMaterialName(m)}</option>`;
    });

    // Set default material and trigger thickness population
    if (defaults.material) {
      materialSelect.value = defaults.material;

      // Populate thicknesses
      const thickResponse = await fetch(`/api/welding/thicknesses/${defaults.material}`);
      const thicknesses = await thickResponse.json();

      const thickSelect = document.getElementById('welder-thickness');

      thickSelect.innerHTML = '<option value="">Select thickness...</option>';

      thicknesses.forEach(t => {
        thickSelect.innerHTML += `<option value="${t}">${formatThicknessDisplay(t)}</option>`;
      });

      if (defaults.thickness) {
        thickSelect.value = defaults.thickness;
      }

      thickSelect.disabled = false;
    }
  } else if (tool === 'plasma') {
    // Populate materials
    const response = await fetch('/api/plasma/materials');
    const materials = await response.json();

    const materialSelect = document.getElementById('plasma-material');

    materialSelect.innerHTML = '<option value="">Select material...</option>';

    materials.forEach(m => {
      materialSelect.innerHTML += `<option value="${m}">${formatMaterialName(m)}</option>`;
    });

    // Set default material and trigger thickness population
    if (defaults.material) {
      materialSelect.value = defaults.material;

      // Populate thicknesses
      const thickResponse = await fetch(`/api/plasma/thicknesses/${defaults.material}`);
      const thicknesses = await thickResponse.json();

      const thickSelect = document.getElementById('plasma-thickness');

      thickSelect.innerHTML = '<option value="">Select thickness...</option>';

      thicknesses.forEach(t => {
        thickSelect.innerHTML += `<option value="${t}">${formatThicknessDisplay(t)}</option>`;
      });

      if (defaults.thickness) {
        thickSelect.value = defaults.thickness;
      }

      thickSelect.disabled = false;
    }
  }
}

// Initialize on load
window.addEventListener('load', () => {
  loadDefaults();
  setTimeout(updateAllResults, 200);
});
