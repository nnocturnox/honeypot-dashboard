import os
import asyncio
import geoip2.database
from typing import List
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from db import get_pool, init_db, insert_attack

load_dotenv()

# Initialize GeoIP database reader
GEOIP_PATH = os.path.join(os.path.dirname(__file__), "data", "GeoLite2-City.mmdb")
geo_reader = geoip2.database.Reader(GEOIP_PATH)

# List of active WebSocket client connections
connected_clients: List[WebSocket] = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs on application startup
    app.state.pool = await get_pool()
    await init_db(app.state.pool)
    print("Backend initialized and ready.")
    yield
    # Runs on application shutdown
    await app.state.pool.close()
    geo_reader.close()

app = FastAPI(lifespan=lifespan)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_geo(ip: str):
    """Resolve country, city, and coordinates from IP address."""
    try:
        if ip.startswith("127.") or ip.startswith("192.168.") or ip.startswith("10.") or ip == "localhost":
            return {
                "country": "Local",
                "city": "Local",
                "latitude": 0.0,
                "longitude": 0.0
            }
        response = geo_reader.city(ip)
        return {
            "country": response.country.name,
            "city": response.city.name,
            "latitude": response.location.latitude,
            "longitude": response.location.longitude,
        }
    except Exception:
        return {
            "country": None,
            "city": None,
            "latitude": None,
            "longitude": None
        }

async def broadcast(data: dict):
    """Broadcast real-time attack event to all connected WebSocket clients."""
    disconnected = []
    for client in connected_clients:
        try:
            await client.send_json(data)
        except Exception:
            disconnected.append(client)
    for client in disconnected:
        connected_clients.remove(client)

@app.post("/attack")
async def receive_attack(data: dict):
    """Endpoint for honeypot to forward captured attack attempts."""
    ip = data.get("ip")
    username = data.get("username")
    password = data.get("password")

    geo = get_geo(ip)

    # Insert into PostgreSQL database
    await insert_attack(
        app.state.pool,
        ip=ip,
        username=username,
        password=password,
        **geo
    )

    # Broadcast event to frontend
    event = {
        "ip": ip,
        "username": username,
        "password": password,
        **geo,
        "protocol": "SSH"
    }
    await broadcast(event)

    return {"status": "ok"}

@app.get("/attacks")
async def get_attacks():
    """Fetch the latest 200 attacks on initial dashboard load."""
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT ip, username, password, country, city,
                   latitude, longitude, protocol,
                   timestamp AT TIME ZONE 'UTC' as timestamp
            FROM attacks
            ORDER BY timestamp DESC
            LIMIT 200
        """)
    return [dict(r) for r in rows]

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time frontend streaming."""
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)