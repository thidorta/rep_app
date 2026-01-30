from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .republic import Republic

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    hashed_password: str
    republic_id: Optional[int] = Field(default=None, foreign_key="republic.id")
    
    republic: Optional["Republic"] = Relationship(back_populates="users")

    fixed_rent: float = Field(default=0.0) # O valor base do quarto dele
    role_tag: str = Field(default="morador")