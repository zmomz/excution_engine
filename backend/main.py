from jose import JWTError, jwt
from datetime import timedelta, datetime
from typing import List

from .logging_config import logger

from fastapi import Depends, FastAPI, HTTPException, status, Request, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import crud, models, schemas, security, utils, config
from .database import SessionLocal, engine

from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis.asyncio as redis

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

from . import tasks
import asyncio

@app.on_event("startup")
async def startup():
    r = redis.from_url(config.REDIS_URL, encoding="utf-8", decode_responses=True)
    await FastAPILimiter.init(r)
    asyncio.create_task(tasks.check_take_profits())
    asyncio.create_task(tasks.run_risk_engine_task())

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
    logger.info(f"Received login request for username: {form_data.username}")
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user:
        logger.warning("User not found in the database")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    logger.info(f"User found: {user.username}")
    if not security.verify_password(form_data.password, user.hashed_password):
        logger.warning("Password verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    logger.info("Password verification successful")
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
    db_api_key = crud.create_user_api_key(db=db, api_key=api_key, user_id=current_user.id)
    if db_api_key is None:
        raise HTTPException(status_code=400, detail="API key with this name already exists for this user")
    return db_api_key


@app.get("/api-keys/", response_model=List[schemas.ApiKey])
def read_api_keys_for_user(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_user_api_keys(db=db, user_id=current_user.id)

@app.delete("/api-keys/{api_key_id}", response_model=schemas.ApiKey)
def delete_api_key_for_user(
    api_key_id: int,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_api_key = crud.delete_api_key(db=db, api_key_id=api_key_id, user_id=current_user.id)
    if db_api_key is None:
        raise HTTPException(status_code=404, detail="API key not found")
    return db_api_key

@app.put("/api-keys/{api_key_id}", response_model=schemas.ApiKey)
def update_api_key_for_user(
    api_key_id: int,
    api_key: schemas.ApiKeyUpdate,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_api_key = crud.update_api_key(db=db, api_key_id=api_key_id, name=api_key.name, user_id=current_user.id)
    if db_api_key is None:
        raise HTTPException(status_code=404, detail="API key not found")
    return db_api_key


@app.get("/api-keys/check-name/")
def check_api_key_name_exists(
    name: str,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_key = crud.get_user_api_key_by_name(db, name, current_user.id)
    return {"exists": existing_key is not None}


webhook_logs = []

def process_queue(db: Session, user_id: int):
    # Simple FIFO for now
    # TODO: Implement priority logic
    queued_signal = db.query(models.QueuedSignal).filter(
        models.QueuedSignal.owner_id == user_id,
        models.QueuedSignal.status == "Queued"
    ).order_by(models.QueuedSignal.created_at).first()

    if queued_signal:
        logger.info(f"Processing queued signal {queued_signal.id}")
        # TODO: Dequeue and create a new PositionGroup from the queued signal
        # This will involve re-running the webhook logic for the queued payload
        queued_signal.status = "Processed"
        db.commit()

@app.post("/webhooks/")
async def receive_webhook(
    request: Request,
    db: Session = Depends(get_db),
    limiter: RateLimiter = Depends(RateLimiter(times=2, seconds=5)),
    x_signature: str = Header(None),
    current_user: schemas.User = Depends(get_current_user),
):
    # ... (webhook processing logic) ...

    # Example of how to call process_queue when a position is closed
    # This would be called from the take-profit task or an exit signal
    # if position_group.status == "Closed":
    #     process_queue(db, current_user.id)

    if not x_signature:
        raise HTTPException(status_code=401, detail="X-Signature header missing")

    raw_payload = await request.body()

    if not security.verify_webhook_signature(raw_payload, x_signature, config.WEBHOOK_SECRET):
        raise HTTPException(status_code=401, detail="Invalid X-Signature")

    payload = await request.json()
    logger.info(f"Received webhook payload: {payload}")
    status_message = "Webhook received and validated"
    status_code = 200

    exchange_name = payload.get("tv.exchange", "binance") # Default to binance for now
    symbol = payload.get("tv.symbol", "BTC/USDT") # Default to BTC/USDT for now

    precision_rules = utils.get_precision_rules(exchange_name, symbol)

    if not precision_rules:
        status_message = f"Could not fetch precision rules for {exchange_name} and {symbol}"
        status_code = 400
    else:
        if "trade_price" in payload and not utils.validate_precision(payload["trade_price"], precision_rules["price"]):
            status_message = "Invalid precision for trade_price"
            status_code = 400
        
        if "trade_quantity" in payload and not utils.validate_precision(payload["trade_quantity"], precision_rules["amount"]):
            status_message = "Invalid precision for trade_quantity"
            status_code = 400

    crud.create_webhook_log(db, payload, status_message)

    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=status_message)

    # Milestone 2 Logic: Position and Pyramid Handling
    pair = payload.get("tv.symbol")
    timeframe = payload.get("tv.timeframe")
    entry_price = payload.get("tv.entry_price")

    if not all([pair, timeframe, entry_price]):
        raise HTTPException(status_code=400, detail="Missing required fields in webhook payload")

    # Check for existing PositionGroup
    position_group = db.query(models.PositionGroup).filter(
        models.PositionGroup.pair == pair,
        models.PositionGroup.timeframe == timeframe,
        models.PositionGroup.owner_id == current_user.id,
        models.PositionGroup.status != "Closed"
    ).first()

    if not position_group:
        # Check execution pool
        # TODO: Get max_open_groups from config
        max_open_groups = 10 
        open_groups_count = db.query(models.PositionGroup).filter(
            models.PositionGroup.owner_id == current_user.id,
            models.PositionGroup.status == "Live"
        ).count()

        if open_groups_count >= max_open_groups:
            logger.info(f"Execution pool is full. Queuing signal for {pair} {timeframe}")
            queued_signal_schema = schemas.QueuedSignalCreate(
                pair=pair,
                timeframe=timeframe,
                payload=payload
            )
            crud.create_queued_signal(db, queued_signal_schema, current_user.id)
            return {"message": "Signal queued due to full execution pool"}

        # Create a new PositionGroup
        logger.info(f"Creating new PositionGroup for {pair} {timeframe}")
        position_group_schema = schemas.PositionGroupCreate(pair=pair, timeframe=timeframe, status="Live")
        position_group = crud.create_position_group(db, position_group_schema, current_user.id)
    
    # Create a new Pyramid for this signal
    logger.info(f"Creating new Pyramid for PositionGroup {position_group.id}")
    pyramid_schema = schemas.PyramidCreate(position_group_id=position_group.id, entry_price=entry_price)
    pyramid = crud.create_pyramid(db, pyramid_schema)

    # Calculate and create DCA legs based on a hardcoded config
    # TODO: Move this to a proper configuration file
    dca_config = [
        {"price_gap": 0, "capital_weight": 0.2, "tp_target": 0.01},
        {"price_gap": -0.005, "capital_weight": 0.2, "tp_target": 0.005},
        {"price_gap": -0.01, "capital_weight": 0.2, "tp_target": 0.02},
        {"price_gap": -0.015, "capital_weight": 0.2, "tp_target": 0.015},
        {"price_gap": -0.02, "capital_weight": 0.2, "tp_target": 0.01},
    ]

    for leg_config in dca_config:
        dca_leg_schema = schemas.DCALegCreate(
            pyramid_id=pyramid.id,
            price_gap=leg_config["price_gap"],
            capital_weight=leg_config["capital_weight"],
            tp_target=leg_config["tp_target"],
        )
        crud.create_dca_leg(db, dca_leg_schema)

    # TODO: Placeholder for order placement logic
    logger.info(f"Simulating order placement for Pyramid {pyramid.id}")

    return {"message": "Webhook processed and position updated"}

@app.get("/position-groups/", response_model=List[schemas.PositionGroup])
def read_position_groups_for_user(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_position_groups_by_user(db=db, user_id=current_user.id)

@app.get("/webhooks/logs/")
def get_webhook_logs(db: Session = Depends(get_db)):
    return crud.get_webhook_logs(db)

@app.get("/logs/")
def get_logs(current_user: schemas.User = Depends(get_current_user)):
    log_file_path = "ex_engine.log" # Assuming log file is in the root directory
    try:
        with open(log_file_path, 'r') as f:
            logs = f.readlines()
        return {"logs": logs}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Log file not found")