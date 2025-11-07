from pydantic import BaseModel

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

class User(UserBase):
    id: int
    api_keys: list[ApiKey] = []

    class Config:
        from_attributes = True
