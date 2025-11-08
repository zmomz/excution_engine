from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB

from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    api_keys = relationship("ApiKey", back_populates="owner")
    position_groups = relationship("PositionGroup", back_populates="owner")
    queued_signals = relationship("QueuedSignal", back_populates="owner")

class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    encrypted_key = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="api_keys")

class WebhookLog(Base):
    __tablename__ = "webhook_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    payload = Column(JSONB)
    status = Column(String)

class PositionGroup(Base):
    __tablename__ = "position_groups"

    id = Column(Integer, primary_key=True, index=True)
    pair = Column(String, index=True)
    timeframe = Column(String, index=True)
    status = Column(String, default="Waiting") # e.g., Waiting, Live, Closed
    avg_entry_price = Column(Float, nullable=True)
    unrealized_pnl_percent = Column(Float, nullable=True)
    unrealized_pnl_usd = Column(Float, nullable=True)
    tp_mode = Column(String, default="Per-Leg TP") # e.g., Per-Leg TP, Aggregate TP, Hybrid TP
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="position_groups")
    pyramids = relationship("Pyramid", back_populates="position_group")

class Pyramid(Base):
    __tablename__ = "pyramids"

    id = Column(Integer, primary_key=True, index=True)
    position_group_id = Column(Integer, ForeignKey("position_groups.id"))
    entry_price = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    position_group = relationship("PositionGroup", back_populates="pyramids")
    dca_legs = relationship("DCALeg", back_populates="pyramid")

class DCALeg(Base):
    __tablename__ = "dca_legs"

    id = Column(Integer, primary_key=True, index=True)
    pyramid_id = Column(Integer, ForeignKey("pyramids.id"))
    price_gap = Column(Float) # Percentage price difference from base entry
    capital_weight = Column(Float) # Percentage of capital allocated to this leg
    tp_target = Column(Float) # Take-profit target for this specific leg
    fill_price = Column(Float, nullable=True)
    status = Column(String, default="Pending") # e.g., Pending, Filled, Hit TP, Cancelled
    order_id = Column(String, nullable=True) # The ID of the order on the exchange
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    filled_at = Column(DateTime(timezone=True), nullable=True)

    pyramid = relationship("Pyramid", back_populates="dca_legs")

class QueuedSignal(Base):
    __tablename__ = "queued_signals"

    id = Column(Integer, primary_key=True, index=True)
    pair = Column(String, index=True)
    timeframe = Column(String, index=True)
    payload = Column(JSONB) # The raw webhook payload
    status = Column(String, default="Queued") # e.g., Queued, Processed, Cancelled
    loss_percentage = Column(Float, nullable=True)
    replacement_count = Column(Integer, default=0)
    expected_profit = Column(Float, nullable=True)
    time_in_queue = Column(DateTime(timezone=True), server_default=func.now())
    priority_rank = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="queued_signals")
