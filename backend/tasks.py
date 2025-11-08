import asyncio
from sqlalchemy.orm import Session
from . import crud, models, utils
from .database import SessionLocal
from .logging_config import logger

async def check_take_profits():
    while True:
        db: Session = SessionLocal()
        try:
            logger.info("Checking for take-profit opportunities...")
            open_legs = db.query(models.DCALeg).filter(models.DCALeg.status == "Filled").all()
            for leg in open_legs:
                position_group = leg.pyramid.position_group
                current_price = utils.get_current_price("binance", position_group.pair) # TODO: Get exchange from config
                if current_price:
                    tp_price = leg.fill_price * (1 + leg.tp_target)
                    if current_price >= tp_price:
                        logger.info(f"Take-profit hit for DCALeg {leg.id} at price {current_price}")
                        # TODO: Placeholder for order placement logic to close the position
                        leg.status = "Hit TP"
                        db.commit()
        finally:
            db.close()
        await asyncio.sleep(10) # Check every 10 seconds
