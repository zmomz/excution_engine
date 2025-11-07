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

def create_user_api_key(db: Session, api_key: schemas.ApiKeyCreate, user_id: int):
    encrypted_key = security.encrypt_api_key(api_key.key)
    db_api_key = models.ApiKey(**api_key.dict(exclude={"key"}), encrypted_key=encrypted_key, owner_id=user_id)
    db.add(db_api_key)
    db.commit()
    db.refresh(db_api_key)
    return db_api_key

def get_user_api_keys(db: Session, user_id: int):
    return db.query(models.ApiKey).filter(models.ApiKey.owner_id == user_id).all()