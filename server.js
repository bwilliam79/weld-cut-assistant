const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Known tools — used to validate :tool params on defaults routes
const VALID_TOOLS = ['welder', 'plasma'];

// CORS configuration — allow localhost by default, or a comma-separated list via CORS_ORIGINS
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : [/^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];

// Middleware
app.use(cors({ origin: corsOrigins }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure data directory exists
const dataDir = process.env.NODE_ENV === 'production' ? '/app/data' : './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database initialization
const dbPath = path.join(dataDir, 'settings.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log(`Connected to SQLite database at ${dbPath}`);
});

// Create defaults table
db.run(`
  CREATE TABLE IF NOT EXISTS defaults (
    id INTEGER PRIMARY KEY,
    tool TEXT NOT NULL,
    voltage TEXT,
    material TEXT,
    thickness TEXT,
    wireSize TEXT,
    UNIQUE(tool)
  )
`);

// ============ WELDING SETTINGS DATA ============
const weldingSettings = {
  mildSteel: {
    "16ga": { voltage: "20-22V", ampRange: "80-120A", wireSpeed: "200-250 IPM" },
    "14ga": { voltage: "21-23V", ampRange: "100-140A", wireSpeed: "240-280 IPM" },
    "12ga": { voltage: "22-24V", ampRange: "120-160A", wireSpeed: "280-320 IPM" },
    "1_8in": { voltage: "22-24V", ampRange: "140-180A", wireSpeed: "300-350 IPM" },
    "3_16in": { voltage: "23-25V", ampRange: "160-200A", wireSpeed: "320-360 IPM" },
    "1_4in": { voltage: "24-26V", ampRange: "180-205A", wireSpeed: "340-380 IPM" }
  },
  stainlessSteelFluxCore: {
    "16ga": { voltage: "19-21V", ampRange: "70-100A", wireSpeed: "190-230 IPM", note: "Use ~10-15% less current than mild steel" },
    "14ga": { voltage: "20-22V", ampRange: "85-120A", wireSpeed: "220-260 IPM" },
    "12ga": { voltage: "21-23V", ampRange: "100-140A", wireSpeed: "250-290 IPM" },
    "1_8in": { voltage: "22-24V", ampRange: "120-160A", wireSpeed: "280-320 IPM" }
  },
  aluminumFluxCore: {
    "16ga": { voltage: "21-23V", ampRange: "100-150A", wireSpeed: "300-400 IPM", note: "Requires ~25% more current than mild steel" },
    "14ga": { voltage: "22-24V", ampRange: "130-170A", wireSpeed: "350-450 IPM" },
    "12ga": { voltage: "23-25V", ampRange: "160-205A", wireSpeed: "400-500 IPM" },
    "1_8in": { voltage: "24-26V", ampRange: "180-205A", wireSpeed: "450-550 IPM" }
  }
};

// ============ PLASMA CUTTER SETTINGS DATA ============
const plasmaSettings = {
  mildSteel: {
    "16ga": { amps: "25-35A", airPressure110V: "45-50 PSI", airPressure220V: "50-60 PSI", cutSpeed: "100-150 IPM" },
    "1_8in": { amps: "35-45A", airPressure110V: "50-55 PSI", airPressure220V: "55-65 PSI", cutSpeed: "140-160 IPM" },
    "3_16in": { amps: "45-50A", airPressure110V: "55-60 PSI", airPressure220V: "60-70 PSI", cutSpeed: "100-130 IPM" },
    "1_4in": { amps: "50-55A", airPressure110V: "60-65 PSI", airPressure220V: "65-75 PSI", cutSpeed: "80-110 IPM" },
    "3_8in": { amps: "55A", airPressure110V: "N/A", airPressure220V: "70-75 PSI", cutSpeed: "60-90 IPM" },
    "1_2in": { amps: "55A", airPressure110V: "N/A", airPressure220V: "75+ PSI", cutSpeed: "50-80 IPM" }
  },
  carbonSteel: {
    "16ga": { amps: "25-35A", airPressure110V: "45-50 PSI", airPressure220V: "50-60 PSI", cutSpeed: "100-150 IPM" },
    "1_8in": { amps: "35-45A", airPressure110V: "50-55 PSI", airPressure220V: "55-65 PSI", cutSpeed: "130-160 IPM" },
    "3_16in": { amps: "45-50A", airPressure110V: "55-60 PSI", airPressure220V: "60-70 PSI", cutSpeed: "100-130 IPM" },
    "1_4in": { amps: "50-55A", airPressure110V: "60-65 PSI", airPressure220V: "65-75 PSI", cutSpeed: "80-110 IPM" }
  },
  stainlessSteel: {
    "16ga": { amps: "30-40A", airPressure110V: "50-55 PSI", airPressure220V: "55-65 PSI", cutSpeed: "80-120 IPM", note: "Slower than mild steel" },
    "1_8in": { amps: "40-50A", airPressure110V: "55-60 PSI", airPressure220V: "60-70 PSI", cutSpeed: "100-140 IPM" },
    "3_16in": { amps: "50-55A", airPressure110V: "60-65 PSI", airPressure220V: "70-75 PSI", cutSpeed: "80-110 IPM" },
    "1_4in": { amps: "55A", airPressure110V: "N/A", airPressure220V: "70-75 PSI", cutSpeed: "60-90 IPM" }
  },
  aluminum: {
    "16ga": { amps: "25-35A", airPressure110V: "45-50 PSI", airPressure220V: "50-60 PSI", cutSpeed: "120-180 IPM", note: "Faster than steel" },
    "1_8in": { amps: "35-45A", airPressure110V: "50-55 PSI", airPressure220V: "55-65 PSI", cutSpeed: "150-200 IPM" },
    "3_16in": { amps: "45-50A", airPressure110V: "55-60 PSI", airPressure220V: "60-70 PSI", cutSpeed: "120-160 IPM" },
    "1_4in": { amps: "50-55A", airPressure110V: "60-65 PSI", airPressure220V: "70-75 PSI", cutSpeed: "100-130 IPM" }
  }
};

// ============ API ROUTES ============

// Get welding settings
app.get('/api/welding/materials', (req, res) => {
  res.json(Object.keys(weldingSettings));
});

app.get('/api/welding/thicknesses/:material', (req, res) => {
  const material = req.params.material;
  if (weldingSettings[material]) {
    res.json(Object.keys(weldingSettings[material]));
  } else {
    res.status(404).json({ error: 'Material not found' });
  }
});

app.get('/api/welding/settings/:material/:thickness', (req, res) => {
  const { material, thickness } = req.params;
  if (weldingSettings[material] && weldingSettings[material][thickness]) {
    res.json(weldingSettings[material][thickness]);
  } else {
    res.status(404).json({ error: 'Settings not found' });
  }
});

// Get plasma cutter settings
app.get('/api/plasma/materials', (req, res) => {
  res.json(Object.keys(plasmaSettings));
});

app.get('/api/plasma/thicknesses/:material', (req, res) => {
  const material = req.params.material;
  if (plasmaSettings[material]) {
    res.json(Object.keys(plasmaSettings[material]));
  } else {
    res.status(404).json({ error: 'Material not found' });
  }
});

app.get('/api/plasma/settings/:material/:thickness', (req, res) => {
  const { material, thickness } = req.params;
  if (plasmaSettings[material] && plasmaSettings[material][thickness]) {
    res.json(plasmaSettings[material][thickness]);
  } else {
    res.status(404).json({ error: 'Settings not found' });
  }
});

// Get defaults
app.get('/api/defaults/:tool', (req, res) => {
  const tool = req.params.tool;
  if (!VALID_TOOLS.includes(tool)) {
    return res.status(400).json({ error: `Unknown tool '${tool}'. Valid tools: ${VALID_TOOLS.join(', ')}` });
  }
  db.get(
    'SELECT tool, voltage, material, thickness, wireSize FROM defaults WHERE tool = ?',
    [tool],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else if (row) {
        res.json(row);
      } else {
        res.json(null);
      }
    }
  );
});

// Save defaults
app.post('/api/defaults/:tool', (req, res) => {
  const tool = req.params.tool;
  if (!VALID_TOOLS.includes(tool)) {
    return res.status(400).json({ error: `Unknown tool '${tool}'. Valid tools: ${VALID_TOOLS.join(', ')}` });
  }
  const { voltage, material, thickness, wireSize } = req.body;

  db.run(
    `INSERT OR REPLACE INTO defaults (tool, voltage, material, thickness, wireSize)
     VALUES (?, ?, ?, ?, ?)`,
    [tool, voltage, material, thickness, wireSize],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true });
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`Weld-Cut Assistant running on http://localhost:${PORT}`);
});
