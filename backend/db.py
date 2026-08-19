import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Database connection pool
async def get_pool():
    return await asyncpg.create_pool(DATABASE_URL)

# Table creation schema and indexes
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS attacks (
    id          SERIAL PRIMARY KEY,
    ip          VARCHAR(45) NOT NULL,
    username    VARCHAR(255),
    password    VARCHAR(255),
    country     VARCHAR(100),
    city        VARCHAR(100),
    latitude    FLOAT,
    longitude   FLOAT,
    protocol    VARCHAR(20) DEFAULT 'SSH',
    timestamp   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attacks_timestamp ON attacks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attacks_ip ON attacks(ip);
CREATE INDEX IF NOT EXISTS idx_attacks_country ON attacks(country);
"""

async def init_db(pool):
    async with pool.acquire() as conn:
        await conn.execute(CREATE_TABLE_SQL)
    print("Database tables initialized successfully.")

async def insert_attack(pool, ip, username, password, country=None,
                        city=None, latitude=None, longitude=None):
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO attacks
                (ip, username, password, country, city, latitude, longitude)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        """, ip, username, password, country, city, latitude, longitude)