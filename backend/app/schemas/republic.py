from pydantic import BaseModel, Field
from typing import List, Optional
from .user import UserPublic # Importamos o esquema público do usuário

class RepublicBase(BaseModel):
    name: str
    address: str

class RepublicCreate(RepublicBase):
    name: str = Field(..., min_length=3, description="O nome deve ter pelo menos 3 letras")
    address: str = Field(..., min_length=5, description="Endereço completo")

class RepublicPublic(RepublicBase):
    id: int
    invite_code: str

class RepublicDetail(RepublicPublic):
    # Este esquema é usado quando queremos ver a república + seus moradores
    users: List[UserPublic] = []

# Schema para alteração de cargo
class RoleUpdate(BaseModel):
    user_id: int
    new_role: str # "admin", "admin_finance", "morador"