from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    name: str
    email: str
    fixed_rent: float = 0.0
    role_tag: str = " "

class UserCreate(UserBase):
    password: str

class UserPublic(UserBase):
    id: int
    republic_id: Optional[int]