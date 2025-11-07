from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ApiKeyBase(BaseModel):
    name: str

class ApiKeyCreate(ApiKeyBase):
    key: str

class ApiKey(ApiKeyBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True