from sqlalchemy.orm import Session
from . import crud, models
from .database import SessionLocal
from .logging_config import logger

def run_risk_engine():
    db: Session = SessionLocal()
    try:
        logger.info("Running risk engine...")
        # TODO: Get these values from config
        loss_threshold_percent = -0.05 
        
        losing_groups = db.query(models.PositionGroup).filter(
            models.PositionGroup.status == "Live",
            # TODO: Add a proper PnL calculation
            # models.PositionGroup.unrealized_pnl_percent < loss_threshold_percent
        ).all()

        if not losing_groups:
            logger.info("No losing positions found.")
            return

        # Selection Logic (Section 4.4)
        # 1. Select the losing trade with the highest loss percent
        # TODO: Sort by unrealized_pnl_percent
        worst_loser = losing_groups[0]
        
        logger.info(f"Worst loser selected: PositionGroup {worst_loser.id}")

        # Offset Execution Logic (Section 4.5)
        # TODO: Implement this
        
    finally:
        db.close()
