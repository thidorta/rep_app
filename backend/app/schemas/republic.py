from pydantic import BaseModel
from typing import List, Optional
from .user import UserPublic # Importamos o esquema público do usuário

class RepublicBase(BaseModel):
    name: str
    address: str

class RepublicCreate(RepublicBase):
    # O invite_code não está aqui porque o servidor gera automaticamente
    pass

class RepublicPublic(RepublicBase):
    id: int
    invite_code: str

class RepublicDetail(RepublicPublic):
    # Este esquema é usado quando queremos ver a república + seus moradores
    users: List[UserPublic] = []