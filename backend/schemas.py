from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ApiKeyBase(BaseModel):
    name: str

class ApiKeyCreate(ApiKeyBase):
    key: str

class ApiKeyUpdate(ApiKeyBase):
    pass

class ApiKey(ApiKeyBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class DCALegBase(BaseModel):
    price_gap: float
    capital_weight: float
    tp_target: float

class DCALegCreate(DCALegBase):
    pyramid_id: int

class DCALegUpdate(DCALegBase):
    fill_price: Optional[float] = None
    status: Optional[str] = None
    order_id: Optional[str] = None
    filled_at: Optional[datetime] = None

class DCALeg(DCALegBase):
    id: int
    pyramid_id: int
    fill_price: Optional[float] = None
    status: str
    order_id: Optional[str] = None
    created_at: datetime
    filled_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PyramidBase(BaseModel):
    entry_price: float

class PyramidCreate(PyramidBase):
    position_group_id: int

class Pyramid(PyramidBase):
    id: int
    position_group_id: int
    created_at: datetime
    dca_legs: List[DCALeg] = []

    class Config:
        from_attributes = True

class PositionGroupBase(BaseModel):
    pair: str
    timeframe: str
    tp_mode: str = "Per-Leg TP"

class PositionGroupCreate(PositionGroupBase):
    pass

class PositionGroupUpdate(PositionGroupBase):
    status: Optional[str] = None
    avg_entry_price: Optional[float] = None
    closed_at: Optional[datetime] = None

class PositionGroup(PositionGroupBase):
    id: int
    status: str
    avg_entry_price: Optional[float] = None
    created_at: datetime
    closed_at: Optional[datetime] = None
    owner_id: int
    pyramids: List[Pyramid] = []

    class Config:
        from_attributes = True

class QueuedSignalBase(BaseModel):
    pair: str
    timeframe: str
    payload: dict

class QueuedSignalCreate(QueuedSignalBase):
    pass

class QueuedSignalUpdate(QueuedSignalBase):
    status: Optional[str] = None
    loss_percentage: Optional[float] = None
    replacement_count: Optional[int] = None
    expected_profit: Optional[float] = None
    priority_rank: Optional[int] = None

class QueuedSignal(QueuedSignalBase):
    id: int
    status: str
    loss_percentage: Optional[float] = None
    replacement_count: int
    expected_profit: Optional[float] = None
    time_in_queue: datetime
    priority_rank: Optional[int] = None
    created_at: datetime
    owner_id: int

    class Config:
        from_attributes = True

class User(UserBase):
    id: int
    api_keys: list[ApiKey] = []
    position_groups: list[PositionGroup] = []
    queued_signals: list[QueuedSignal] = []

    class Config:
        from_attributes = True