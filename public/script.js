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
    updateAllResults();
  });
});

// ============ TOOL & MODE UPDATES ============
function updateToolSection() {
  toolSections.forEach(section => section.classList.remove('active'));
  document.getElementById(`${state.currentTool}-section`).classList.add('active');
  loadDefaults();
  setTimeout(updateAllResults, 100);
}

function updateModeContent() {
  const modeContents = document.querySelectorAll('.mode-content');
  modeContents.forEach(content => content.classList.remove('active'));

  const activeSection = document.getElementById(`${state.currentTool}-section`);
  const modeDiv = activeSection.querySelector(`#${state.currentTool}-${state.currentMode}`);
  if (modeDiv) modeDiv.classList.add('active');

  setTimeout(updateAllResults, 100);
}

// ============ UPDATE ALL RESULTS ============
function updateAllResults() {
  if (state.currentTool === 'welder') {
    if (state.currentMode === 'quick') {
      updateWelderQuickResults();
    } else {
      updateWelderAdvancedResults();
    }
  } else {
    if (state.currentMode === 'quick') {
      updatePlasmaQuickResults();
    } else {
      updatePlasmaAdvancedResults();
    }
  }
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
      thicknessSelect.innerHTML += `<option value="${t}">${formatThicknessDisplay(t)}</option>`;
    });
    thicknessSelect.disabled = false;
    if (thicknesses.length > 0) {
      thicknessSelect.value = thicknesses[0];
    }
  } else {
    thicknessSelect.disabled = true;
  }
  updateWelderQuickResults();
});

// Update on thickness change for welder quick mode
document.getElementById('welder-quick-thickness').addEventListener('change', updateWelderQuickResults);

// Populate thickness dropdown for welder advanced mode
document.getElementById('welder-adv-material').addEventListener('change', async (e) => {
  const material = e.target.value;
  const thicknessSelect = document.getElementById('welder-adv-thickness');

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
  updateWelderAdvancedResults();
});

// Update on thickness/wire size change for welder advanced mode
document.getElementById('welder-adv-thickness').addEventListener('change', updateWelderAdvancedResults);
document.getElementById('welder-wire-size').addEventListener('change', updateWelderAdvancedResults);

// Welder quick mode update results
async function updateWelderQuickResults() {
  const material = document.getElementById('welder-quick-material').value;
  const thickness = document.getElementById('welder-quick-thickness').value;

  if (!material || !thickness) {
    document.getElementById('welder-quick-results').classList.add('hidden');
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
  } else {
    noteEl.textContent = '';
  }

  document.getElementById('welder-quick-results').classList.remove('hidden');
}

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

// Welder advanced mode update results
async function updateWelderAdvancedResults() {
  const material = document.getElementById('welder-adv-material').value;
  const thickness = document.getElementById('welder-adv-thickness').value;

  if (!material || !thickness) {
    document.getElementById('welder-adv-results').classList.add('hidden');
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
  } else {
    noteEl.textContent = '';
  }

  document.getElementById('welder-adv-results').classList.remove('hidden');
}

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
      thicknessSelect.innerHTML += `<option value="${t}">${formatThicknessDisplay(t)}</option>`;
    });
    thicknessSelect.disabled = false;
    if (thicknesses.length > 0) {
      thicknessSelect.value = thicknesses[0];
    }
  } else {
    thicknessSelect.disabled = true;
  }
  updatePlasmaQuickResults();
});

// Update on thickness change for plasma quick mode
document.getElementById('plasma-quick-thickness').addEventListener('change', updatePlasmaQuickResults);

// Populate thickness dropdown for plasma advanced mode
document.getElementById('plasma-adv-material').addEventListener('change', async (e) => {
  const material = e.target.value;
  const thicknessSelect = document.getElementById('plasma-adv-thickness');

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
  updatePlasmaAdvancedResults();
});

// Update on thickness change for plasma advanced mode
document.getElementById('plasma-adv-thickness').addEventListener('change', updatePlasmaAdvancedResults);

// Plasma quick mode update results
async function updatePlasmaQuickResults() {
  const material = document.getElementById('plasma-quick-material').value;
  const thickness = document.getElementById('plasma-quick-thickness').value;

  if (!material || !thickness) {
    document.getElementById('plasma-quick-results').classList.add('hidden');
    return;
  }

  const response = await fetch(`/api/plasma/settings/${material}/${thickness}`);
  const settings = await response.json();

  document.getElementById('plasma-quick-amps').textContent = settings.amps;

  const airPressureKey = state.currentVoltage === '220V' ? 'airPressure220V' : 'airPressure110V';
  document.getElementById('plasma-quick-airPressure').textContent = settings[airPressureKey];

  document.getElementById('plasma-quick-cutSpeed').textContent = settings.cutSpeed;

  const noteEl = document.getElementById('plasma-quick-note');
  if (settings.note) {
    noteEl.textContent = settings.note;
  } else {
    noteEl.textContent = '';
  }

  document.getElementById('plasma-quick-results').classList.remove('hidden');
}

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

// Plasma advanced mode update results
async function updatePlasmaAdvancedResults() {
  const material = document.getElementById('plasma-adv-material').value;
  const thickness = document.getElementById('plasma-adv-thickness').value;

  if (!material || !thickness) {
    document.getElementById('plasma-adv-results').classList.add('hidden');
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
  } else {
    noteEl.textContent = '';
  }

  document.getElementById('plasma-adv-results').classList.remove('hidden');
}

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

  if (!defaults) {
    // Set initial defaults
    if (tool === 'welder') {
      state.currentVoltage = '220V';
      document.getElementById('welder-wire-size').value = '.030"';
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

    const quickMaterialSelect = document.getElementById('welder-quick-material');
    const advMaterialSelect = document.getElementById('welder-adv-material');

    quickMaterialSelect.innerHTML = '<option value="">Select material...</option>';
    advMaterialSelect.innerHTML = '<option value="">Select material...</option>';

    materials.forEach(m => {
      quickMaterialSelect.innerHTML += `<option value="${m}">${formatMaterialName(m)}</option>`;
      advMaterialSelect.innerHTML += `<option value="${m}">${formatMaterialName(m)}</option>`;
    });

    // Set default material and trigger thickness population
    if (defaults.material) {
      quickMaterialSelect.value = defaults.material;
      advMaterialSelect.value = defaults.material;

      // Populate thicknesses
      const thickResponse = await fetch(`/api/welding/thicknesses/${defaults.material}`);
      const thicknesses = await thickResponse.json();

      const quickThickSelect = document.getElementById('welder-quick-thickness');
      const advThickSelect = document.getElementById('welder-adv-thickness');

      quickThickSelect.innerHTML = '<option value="">Select thickness...</option>';
      advThickSelect.innerHTML = '<option value="">Select thickness...</option>';

      thicknesses.forEach(t => {
        quickThickSelect.innerHTML += `<option value="${t}">${formatThicknessDisplay(t)}</option>`;
        advThickSelect.innerHTML += `<option value="${t}">${formatThicknessDisplay(t)}</option>`;
      });

      if (defaults.thickness) {
        quickThickSelect.value = defaults.thickness;
        advThickSelect.value = defaults.thickness;
      }

      quickThickSelect.disabled = false;
      advThickSelect.disabled = false;
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

    // Set default material and trigger thickness population
    if (defaults.material) {
      quickMaterialSelect.value = defaults.material;
      advMaterialSelect.value = defaults.material;

      // Populate thicknesses
      const thickResponse = await fetch(`/api/plasma/thicknesses/${defaults.material}`);
      const thicknesses = await thickResponse.json();

      const quickThickSelect = document.getElementById('plasma-quick-thickness');
      const advThickSelect = document.getElementById('plasma-adv-thickness');

      quickThickSelect.innerHTML = '<option value="">Select thickness...</option>';
      advThickSelect.innerHTML = '<option value="">Select thickness...</option>';

      thicknesses.forEach(t => {
        quickThickSelect.innerHTML += `<option value="${t}">${formatThicknessDisplay(t)}</option>`;
        advThickSelect.innerHTML += `<option value="${t}">${formatThicknessDisplay(t)}</option>`;
      });

      if (defaults.thickness) {
        quickThickSelect.value = defaults.thickness;
        advThickSelect.value = defaults.thickness;
      }

      quickThickSelect.disabled = false;
      advThickSelect.disabled = false;
    }
  }
}

function formatMaterialName(name) {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/flux.*core/i, 'Flux Core')
    .trim();
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

// Initialize on load
window.addEventListener('load', () => {
  loadDefaults();
  setTimeout(updateAllResults, 200);
});
