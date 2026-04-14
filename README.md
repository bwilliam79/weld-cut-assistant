# Weld-Cut Assistant

A web-based calculator for welder and plasma cutter settings based on material type, thickness, and other parameters.

## Features

- **Welder Settings** - MIG-205DS PRO flux core settings
- **Plasma Cutter Settings** - CUT-55DS PRO cutting parameters
- **Quick Mode** - Fast selection with minimal inputs
- **Advanced Mode** - Fine-tune all parameters
- **Saved Defaults** - Server-side storage for preferences
- **Dual Voltage** - Support for 110V and 220V
- **Mobile Friendly** - Responsive design optimized for iPhone

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
