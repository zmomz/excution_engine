import asyncio
from sqlalchemy.orm import Session
from . import crud, models, utils
from .database import SessionLocal
from .logging_config import logger

from . import risk_engine

async def run_risk_engine_task():
    while True:
        risk_engine.run_risk_engine()
        await asyncio.sleep(60) # Run every 60 seconds
