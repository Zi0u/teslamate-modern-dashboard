# TeslaMate Modern Dashboard

A modern, responsive web dashboard for [TeslaMate](https://github.com/teslamate-org/teslamate) — the self-hosted Tesla data logger.

Connects read-only to your existing TeslaMate PostgreSQL database. No modifications, no extra setup.

## Features

- **Live vehicle status** — battery level, firmware version, state (online/driving/charging/asleep)
- **Interactive map** — current position with integrated weather
- **Driving stats** — weekly, monthly, and last month summaries (distance, energy, cost)
- **Recent drives** — last 10 trips with consumption details
- **Battery health** — degradation gauge based on capacity data
- **Last charge** — energy added, duration, cost, range gained
- **Battery & consumption charts** — 7-day history with tabbed views
- **Drive heatmap** — 15-day activity overview (GitHub-style)
- **Top destinations** — most visited places
- **Bilingual** — French & English with one-click toggle
- **Dark mode** — always on, easy on the eyes

## Demo Mode

Try the dashboard without a TeslaMate instance:

```bash
npm run demo
```

This serves mock data on `http://localhost:5173` — no database required.

## Prerequisites

- **Node.js** 18+
- **TeslaMate** with a running PostgreSQL database
- A read-only database user (recommended)

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/teslamate-modern-dashboard.git
cd teslamate-modern-dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your TeslaMate database credentials
```

## Configuration

Edit the `.env` file at the project root:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=teslamate
DATABASE_USER=teslamate_readonly
DATABASE_PASSWORD=your_password_here
PORT=3001
```

### Creating a read-only database user (recommended)

```sql
CREATE USER teslamate_readonly WITH PASSWORD 'your_password_here';
GRANT CONNECT ON DATABASE teslamate TO teslamate_readonly;
GRANT USAGE ON SCHEMA public TO teslamate_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO teslamate_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO teslamate_readonly;
```

## Usage

```bash
# Development (backend + frontend with hot reload)
npm run dev

# Demo mode (mock data, no database needed)
npm run demo

# Build for production
npm run build
```

The dashboard will be available at `http://localhost:5173` (dev) with the API on port `3001`.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts + React Query
- **Backend**: Node.js + Express + TypeScript
- **Map**: Leaflet + CartoDB Voyager tiles (free, no API key)
- **Weather**: Open-Meteo API (free, no API key)

## License

[MIT](LICENSE)
