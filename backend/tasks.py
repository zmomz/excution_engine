import asyncio
from sqlalchemy.orm import Session
from . import crud, models, utils, risk_engine
from .database import SessionLocal
from .logging_config import logger

async def check_take_profits():
    while True:
        db: Session = SessionLocal()
        try:
            logger.info("Checking for take-profit opportunities and updating PnL...")

            # Update PnL for live position groups
            live_position_groups = db.query(models.PositionGroup).filter(models.PositionGroup.status == "Live").all()
            for pg in live_position_groups:
                filled_legs = []
                total_capital_allocated = 0.0
                weighted_entry_sum = 0.0

                for pyramid in pg.pyramids:
                    for leg in pyramid.dca_legs:
                        if leg.status == "Filled" and leg.fill_price and leg.capital_weight:
                            filled_legs.append(leg)
                            total_capital_allocated += leg.capital_weight # Assuming capital_weight is a proportion of total capital
                            weighted_entry_sum += leg.fill_price * leg.capital_weight
                
                if filled_legs and total_capital_allocated > 0:
                    pg.avg_entry_price = weighted_entry_sum / total_capital_allocated
                else:
                    pg.avg_entry_price = None

                current_price = utils.get_current_price("binance", pg.pair) # TODO: Get exchange from config
                if current_price and pg.avg_entry_price:
                    # Assuming a 'long' position for PnL calculation for now
                    pg.unrealized_pnl_percent = ((current_price - pg.avg_entry_price) / pg.avg_entry_price) * 100
                    # For USD PnL, we need the total position size, which is not yet in the model
                    # For now, we'll leave unrealized_pnl_usd as None or a placeholder
                    pg.unrealized_pnl_usd = None # TODO: Calculate based on total position size
                else:
                    pg.unrealized_pnl_percent = None
                    pg.unrealized_pnl_usd = None
                db.commit()

            # Check for take-profit opportunities
            open_legs = db.query(models.DCALeg).filter(models.DCALeg.status == "Filled").all()
            for leg in open_legs:
                position_group = leg.pyramid.position_group
                current_price = utils.get_current_price("binance", position_group.pair) # TODO: Get exchange from config
                if current_price and leg.fill_price:
                    tp_price = leg.fill_price * (1 + leg.tp_target)
                    if current_price >= tp_price:
                        logger.info(f"Take-profit hit for DCALeg {leg.id} at price {current_price}")
                        # TODO: Placeholder for order placement logic to close the position
                        leg.status = "Hit TP"
                        db.commit()
        finally:
            db.close()
        await asyncio.sleep(10) # Check every 10 seconds

async def run_risk_engine_task():
    while True:
        risk_engine.run_risk_engine()
        await asyncio.sleep(60) # Run every 60 seconds