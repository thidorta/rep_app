from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING

# Isso evita erros de importação circular
if TYPE_CHECKING:
    from .user import User

class Republic(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    address: str
    invite_code: str = Field(unique=True, index=True)
    
    # Relação: Uma república tem muitos usuários (moradores)
    users: List["User"] = Relationship(back_populates="republic")