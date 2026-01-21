from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.user import User
from app.models.republic import Republic
from app.schemas.user import UserCreate, UserPublic
from app.core.security import get_current_user, hash_password
from typing import List

# Criamos o router com um prefixo. Assim, todas as rotas aqui começam com /republicas
router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.post("/", response_model=UserPublic)
def criar_usuario(usuario_input: UserCreate, session: Session = Depends(get_session)):
    #validação da senha
    if len(usuario_input.password) > 72:
        raise HTTPException(status_code=400, detail="A senha não pode ultrapassar 72 caracteres.")
    
    # validação simples para evitar emails duplicados
    existing_user = session.exec(select(User).where(User.email == usuario_input.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado.")

    usuario = User(
        name=usuario_input.name,
        email=usuario_input.email,
        hashed_password=hash_password(usuario_input.password)
    )
    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    return usuario

@router.get("/me", response_model=UserPublic)
def obter_perfil_logado(current_user: User = Depends(get_current_user)):
    """
    Retorna os dados do usuário que enviou o token. 
    Não precisa passar ID na URL, o sistema descobre pelo token.
    """
    return current_user

@router.get("/", response_model=List[UserPublic])
def listar_usuarios(session: Session = Depends(get_session)):
    usuarios = session.exec(select(User)).all()
    return usuarios

@router.get("/{usuario_id}", response_model=UserPublic)
def obter_usuario(usuario_id: int, session: Session = Depends(get_session)):
    usuario = session.get(User, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return usuario