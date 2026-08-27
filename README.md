# Weld-Cut Assistant

A web-based calculator for welder and plasma cutter settings based on material type, thickness, and other parameters.

## Features

- **Welder Settings** - MIG-205DS PRO flux core settings
- **Plasma Cutter Settings** - CUT-55DS PRO cutting parameters
- **Saved Defaults** - Server-side storage for preferences
- **Dual Voltage** - Support for 110V and 220V
- **Mobile Friendly** - Responsive design optimized for iPhone

The favicon and PWA app icon is the locked MIG torch 3/4 (glow at the cup).

## Setup

```bash
npm install
npm start
```

Visit `http://localhost:3000` in your browser.

## Docker Deployment

```bash
docker compose up -d --build
```

The app will be available at `http://localhost:3000`

## Configuration

Defaults are stored in SQLite database (created automatically on first run).

## Theme

Accent token `--orange` is real orange (`#f97316` / dim `#ea580c`), not red. Voltage toggles use `label for=` bound to the toggle group ids (`welder-voltage-toggle`, `plasma-voltage-toggle`). App icon pack is locked (MIG torch 3/4) — do not swap.
