from sqlalchemy.orm import Session
from . import models, schemas, security

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

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

def create_webhook_log(db: Session, payload: dict, status: str):
    print(f"Attempting to create webhook log with status: {status} and payload: {payload}")
    db_log = models.WebhookLog(payload=payload, status=status)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    print(f"Successfully created webhook log with id: {db_log.id}")
    return db_log

def get_webhook_logs(db: Session):
    return db.query(models.WebhookLog).order_by(models.WebhookLog.timestamp.desc()).limit(100).all()