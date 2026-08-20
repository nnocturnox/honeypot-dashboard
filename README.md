# 🍯 Honeypot Dashboard

A full-stack web application that captures real-time SSH attack attempts, enriches them with geolocation data, and visualizes them on an interactive world map with analytics.

> **Educational purpose only.** This project is designed for cybersecurity research and learning. Do not use against systems you do not own or have explicit permission to monitor.


![Dashboard Overview](docs/screenshots/dashboard-overview.png)

---

## 📋 Table of Contents

- [How It Works](#how-it-works)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Testing Locally](#testing-locally)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)

---

## How It Works

The system acts as a trap. Attackers on the internet constantly try to connect to open SSH ports — brute-forcing usernames and passwords. This project captures every attempt:

```
Attacker → tries SSH connection
               ↓
          Honeypot intercepts (who, from where, which credentials?)
               ↓
          Backend enriches with GeoIP data, saves to PostgreSQL
               ↓
          Frontend receives event via WebSocket
               ↓
          A new dot appears on the map in real time
```

The honeypot **always rejects** authentication — nobody actually gets in. Every attempt is silently logged.

---

## Features

- 🗺️ **Interactive world map** — attack origins plotted as live markers (Leaflet.js)
- 📊 **Analytics dashboard** — 4 charts: hourly timeline, attacks by country, top passwords, protocol distribution
- ⚡ **Real-time updates** — WebSocket connection, no page refresh needed
- 📈 **Live statistics bar** — total attacks, unique IPs, top origin country, most targeted username
- 📋 **Live attack feed** — scrollable list of recent attempts with IP, location, credentials
- 🌍 **GeoIP enrichment** — every IP resolved to country, city, and coordinates
- 🗄️ **Persistent storage** — all events saved to PostgreSQL, survives restarts
- 🔌 **Modular honeypot** — SSH honeypot today, easily extendable to HTTP, FTP

---

## Architecture

```
┌─────────────────────────────────────┐
│           Honeypot Layer            │
│        SSH honeypot (port 2222)     │
└──────────────────┬──────────────────┘
                   │ POST /attack
                   ▼
┌─────────────────────────────────────┐
│         Backend (FastAPI)           │
│  GeoIP enrichment · REST · WebSocket│
└────────┬────────────────────────────┘
         │
         ▼
  ┌─────────────┐
  │ PostgreSQL  │
  │  (storage)  │
  └─────────────┘
         │ WebSocket
         ▼
┌─────────────────────────────────────┐
│         Frontend (React + Vite)     │
│  Map View · Analytics · Live Feed   │
└─────────────────────────────────────┘
```

---

## Screenshots

### Map View

![Map View](docs/screenshots/map-view.png)

### Analytics Dashboard

![Analytics Overview](docs/screenshots/analytics-overview.png)

### Charts Detail

![Charts Detail](docs/screenshots/analytics-charts.png)

---

## Project Structure

```
honeypot-dashboard/
│
├── backend/
│   ├── honeypot/
│   │   ├── __init__.py
│   │   └── ssh_honeypot.py      # SSH honeypot server (Paramiko)
│   ├── data/
│   │   ├── .gitkeep
│   │   └── GeoLite2-City.mmdb   # ⚠️ Not included — download separately
│   ├── logs/
│   │   └── honeypot.log         # Attack logs (auto-generated)
│   ├── venv/                    # Python virtual environment (not in git)
│   ├── db.py                    # PostgreSQL connection and queries
│   ├── main.py                  # FastAPI app (REST + WebSocket)
│   ├── .env                     # Environment variables (not in git)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AttackMap.jsx    # Leaflet world map
│   │   │   ├── AttackFeed.jsx   # Live attack list panel
│   │   │   ├── StatsBar.jsx     # Summary statistics bar
│   │   │   └── Charts.jsx       # Recharts analytics (4 charts)
│   │   ├── App.jsx              # Root component, WebSocket + view toggle
│   │   └── main.jsx
│   ├── index.html               # Leaflet CSS imported here
│   └── package.json
│
├── docs/
│   └── screenshots/             # README images
│
├── .gitignore
└── README.md
```

---

## Prerequisites

Make sure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Backend & honeypot |
| Node.js | 20 LTS | Frontend |
| Docker | Latest | PostgreSQL container |
| Git | Any | Version control |

> **Windows users:** Install [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) with Ubuntu and run all commands inside the WSL terminal. Install Node.js inside WSL via `nvm`.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/nnocturnox/honeypot-dashboard.git
cd honeypot-dashboard
```

### 2. Download GeoLite2 Database

This project uses MaxMind's free GeoLite2-City database for IP geolocation. You must download it separately due to licensing restrictions.

1. Create a free account at [maxmind.com](https://www.maxmind.com/en/geolite2/signup)
2. Go to **Download Databases** → **GeoLite2 City** → **Download GZIP**
3. Extract the archive and place the file at:

```
backend/data/GeoLite2-City.mmdb
```

### 3. Start PostgreSQL with Docker

```bash
docker run -d --name honeypot-db \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=honeypot \
  -p 5432:5432 postgres:16

# Verify it is running
docker ps
```

### 4. Set up the Python backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 5. Configure environment variables

Create a `.env` file inside the `backend/` directory:

```env
DATABASE_URL=postgresql://postgres:secret@localhost:5432/honeypot
REDIS_URL=redis://localhost:6379
```

### 6. Initialize the database

```bash
# Inside backend/ with venv activated:
python -c "
import asyncio
from db import get_pool, init_db

async def run():
    pool = await get_pool()
    await init_db(pool)
    await pool.close()

asyncio.run(run())
"
```

You should see: `Database tables initialized successfully.`

### 7. Set up the React frontend

```bash
cd ../frontend
npm install
```

---

## Running the Project

You need **three terminals** running simultaneously:

**Terminal 1 — Backend API:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — SSH Honeypot:**
```bash
cd backend
source venv/bin/activate
python honeypot/ssh_honeypot.py
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

Use the **Map View / Analytics** buttons in the top-right corner to switch between views.

---

## Testing Locally

With all three services running, simulate an SSH attack:

```bash
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    -p 2222 testuser@localhost
# Enter any password when prompted
```

You should see:
- A new entry appear in the **Live Attack Stream** panel instantly
- The **statistics bar** update (Total Attacks, Unique IPs)
- A **map marker** appear (local IPs show at coordinates 0,0 — this is expected)
- The **Analytics** charts update with the new data point

To verify the database is storing events:
```bash
curl http://localhost:8000/attacks
```

---

## Deployment

To capture **real** attack data, deploy to a public VPS. Attackers will discover the open port within hours.

### Recommended: DigitalOcean Droplet ($6/month)

1. Create an Ubuntu 24.04 droplet
2. Install Docker, Python 3.11, Node.js 20 on the VPS
3. Clone the repo and follow the installation steps above
4. Forward port 22 to the honeypot — **move your real SSH to another port first!**

```bash
# Change your real SSH port to 2200 in /etc/ssh/sshd_config first, then:
sudo iptables -t nat -A PREROUTING -p tcp --dport 22 -j REDIRECT --to-port 2222
```

5. Run the backend as a background service:

```bash
pip install gunicorn
gunicorn main:app -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

6. Deploy the frontend to [Vercel](https://vercel.com) (free):
   - Connect your GitHub repo
   - Set `VITE_BACKEND_URL` environment variable to your VPS IP
   - Deploy

> ⚠️ Always ensure you have an alternative SSH access method before redirecting port 22, or you will be locked out of your VPS.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Honeypot | Python + Paramiko | Fake SSH server that logs all attempts |
| Backend | FastAPI + Uvicorn | REST API + WebSocket broadcast server |
| Database | PostgreSQL 16 (Docker) | Persistent attack event storage |
| GeoIP | MaxMind GeoLite2 + geoip2 | IP address → country / city / coordinates |
| HTTP Client | httpx | Honeypot → backend communication |
| Frontend | React + Vite | UI framework |
| Map | Leaflet.js + react-leaflet | Interactive world map with attack markers |
| Charts | Recharts | Hourly timeline, country bar, password bar, protocol pie |
| Async DB | asyncpg | Non-blocking PostgreSQL queries |

---

## ⚠️ Legal & Ethical Notice

This project is intended for **educational and research purposes only**.

- Only run this honeypot on infrastructure you own or have explicit permission to use
- Do not use any part of this project to attack or scan unauthorized systems
- The GeoLite2 database is subject to [MaxMind's license terms](https://www.maxmind.com/en/geolite2/eula) and must not be redistributed
- Review your local laws and regulations regarding honeypot operation before deploying publicly

---

## Author

**Selin Çoban** 



