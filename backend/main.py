from jose import JWTError, jwt
from datetime import timedelta
from typing import List

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import crud, models, schemas, security, utils
from .database import SessionLocal, engine

from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis.asyncio as redis

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.on_event("startup")
async def startup():
    r = redis.from_url("redis://localhost:6379", encoding="utf-8", decode_responses=True)
    await FastAPILimiter.init(r)

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


@app.post("/token", response_model=schemas.Token, dependencies=[Depends(RateLimiter(times=5, seconds=10))])
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print(f"Received login request for username: {form_data.username}")
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user:
        print("User not found in the database")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    print(f"User found: {user.username}, Hashed password: {user.hashed_password}")
    if not security.verify_password(form_data.password, user.hashed_password):
        print("Password verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    print("Password verification successful")
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)


@app.get("/users/me/", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user

@app.post("/api-keys/", response_model=schemas.ApiKey)
def create_api_key_for_user(
    api_key: schemas.ApiKeyCreate,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.create_user_api_key(db=db, api_key=api_key, user_id=current_user.id)


@app.get("/api-keys/", response_model=List[schemas.ApiKey])
def read_api_keys_for_user(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_user_api_keys(db=db, user_id=current_user.id)


@app.post("/webhooks/", dependencies=[Depends(RateLimiter(times=2, seconds=5))])
def receive_webhook(payload: dict):
    print(f"Received webhook payload: {payload}")

    # Example precision validation
    if "trade_price" in payload and not utils.validate_precision(payload["trade_price"], utils.PRECISION_RULES["trade_price"]):
        raise HTTPException(status_code=400, detail="Invalid precision for trade_price")
    
    if "trade_quantity" in payload and not utils.validate_precision(payload["trade_quantity"], utils.PRECISION_RULES["trade_quantity"]):
        raise HTTPException(status_code=400, detail="Invalid precision for trade_quantity")

    return {"message": "Webhook received and validated"}