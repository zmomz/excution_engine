from sqlalchemy.orm import Session, joinedload
from . import models, schemas, security
from .logging_config import logger

# User CRUD
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# API Key CRUD
def get_user_api_key_by_name(db: Session, name: str, user_id: int):
    return db.query(models.ApiKey).filter(models.ApiKey.name == name, models.ApiKey.owner_id == user_id).first()

def create_user_api_key(db: Session, api_key: schemas.ApiKeyCreate, user_id: int):
    if get_user_api_key_by_name(db, api_key.name, user_id):
        return None  # Indicate duplicate name
    encrypted_key = security.encrypt_api_key(api_key.key)
    db_api_key = models.ApiKey(**api_key.dict(exclude={"key"}), encrypted_key=encrypted_key, owner_id=user_id)
    db.add(db_api_key)
    db.commit()
    db.refresh(db_api_key)
    return db_api_key

def get_user_api_keys(db: Session, user_id: int):
    return db.query(models.ApiKey).filter(models.ApiKey.owner_id == user_id).all()

def delete_api_key(db: Session, api_key_id: int, user_id: int):
    db_api_key = db.query(models.ApiKey).filter(models.ApiKey.id == api_key_id, models.ApiKey.owner_id == user_id).first()
    if db_api_key:
        db.delete(db_api_key)
        db.commit()
    return db_api_key

def update_api_key(db: Session, api_key_id: int, name: str, user_id: int):
    db_api_key = db.query(models.ApiKey).filter(models.ApiKey.id == api_key_id, models.ApiKey.owner_id == user_id).first()
    if db_api_key:
        db_api_key.name = name
        db.commit()
        db.refresh(db_api_key)
    return db_api_key

# Webhook Log CRUD
def create_webhook_log(db: Session, payload: dict, status: str):
    logger.info(f"Attempting to create webhook log with status: {status} and payload: {payload}")
    db_log = models.WebhookLog(payload=payload, status=status)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    logger.info(f"Successfully created webhook log with id: {db_log.id}")
    return db_log

def get_webhook_logs(db: Session, skip: int = 0, limit: int = 100):
    logs = db.query(models.WebhookLog).order_by(models.WebhookLog.timestamp.desc()).offset(skip).limit(limit).all()
    total = db.query(models.WebhookLog).count()
    return {"logs": logs, "total": total}

# Position Group CRUD
def create_position_group(db: Session, position_group: schemas.PositionGroupCreate, user_id: int):
    db_position_group = models.PositionGroup(**position_group.dict(), owner_id=user_id, status="Live")
    db.add(db_position_group)
    db.commit()
    db.refresh(db_position_group)
    return db_position_group

def get_position_group(db: Session, position_group_id: int):
    return db.query(models.PositionGroup).filter(models.PositionGroup.id == position_group_id).first()

def get_position_groups_by_user(db: Session, user_id: int):
    position_groups = db.query(models.PositionGroup).options(
        joinedload(models.PositionGroup.pyramids).joinedload(models.Pyramid.dca_legs)
    ).filter(models.PositionGroup.owner_id == user_id).all()

    for pg in position_groups:
        pg.pyramids_count = len(pg.pyramids)
        pg.dca_legs_count = sum(len(p.dca_legs) for p in pg.pyramids)

    return position_groups

def update_position_group(db: Session, position_group_id: int, position_group: schemas.PositionGroupUpdate):
    db_position_group = get_position_group(db, position_group_id)
    if db_position_group:
        update_data = position_group.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_position_group, key, value)
        db.commit()
        db.refresh(db_position_group)
    return db_position_group

# Pyramid CRUD
def create_pyramid(db: Session, pyramid: schemas.PyramidCreate):
    db_pyramid = models.Pyramid(**pyramid.dict())
    db.add(db_pyramid)
    db.commit()
    db.refresh(db_pyramid)
    return db_pyramid

# DCA Leg CRUD
def create_dca_leg(db: Session, dca_leg: schemas.DCALegCreate):
    db_dca_leg = models.DCALeg(**dca_leg.dict())
    db.add(db_dca_leg)
    db.commit()
    db.refresh(db_dca_leg)
    return db_dca_leg

def update_dca_leg(db: Session, dca_leg_id: int, dca_leg: schemas.DCALegUpdate):
    db_dca_leg = db.query(models.DCALeg).filter(models.DCALeg.id == dca_leg_id).first()
    if db_dca_leg:
        update_data = dca_leg.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_dca_leg, key, value)
        db.commit()
        db.refresh(db_dca_leg)
    return db_dca_leg

# Queued Signal CRUD
def create_queued_signal(db: Session, queued_signal: schemas.QueuedSignalCreate, user_id: int):
    db_queued_signal = models.QueuedSignal(**queued_signal.dict(), owner_id=user_id)
    db.add(db_queued_signal)
    db.commit()
    db.refresh(db_queued_signal)
    return db_queued_signal

def get_queued_signals_by_user(db: Session, user_id: int):
    return db.query(models.QueuedSignal).filter(models.QueuedSignal.owner_id == user_id).all()
