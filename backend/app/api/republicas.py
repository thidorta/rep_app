from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.user import User              # Para o banco de dados
from app.models.republic import Republic      # Para o banco de dados
from app.schemas.republic import RepublicCreate, RepublicPublic, RepublicDetail # Para validação
from app.core.security import get_current_user
from app.utils import gerar_codigo_convite
from typing import List

# Criamos o router com um prefixo. Assim, todas as rotas aqui começam com /republicas
router = APIRouter(prefix="/republicas", tags=["Republicas"])

@router.post("/")
def criar_republica(republica_input: RepublicCreate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    codigo = gerar_codigo_convite(republica_input.name)  # Gera um código de convite simples
    republica = Republic(
        name=republica_input.name,
        address=republica_input.address,
        invite_code=codigo
    )
    session.add(republica)  
    session.commit()
    session.refresh(republica)

    current_user.republic_id = republica.id
    session.add(current_user)
    session.commit()

    return {
        "mensagem": "República criada com sucesso!",
        "republica": republica,
        "fundador": current_user.name
    }

@router.get("/", response_model=List[RepublicPublic])
def listar_republicas(session: Session = Depends(get_session)):
    republicas = session.exec(select(Republic)).all()
    return republicas

@router.get("/{republica_id}", response_model=RepublicDetail)
def obter_republica(republica_id: int, session: Session = Depends(get_session)):
    republica = session.get(Republic, republica_id)
    if not republica:
        raise HTTPException(status_code=404, detail="República não encontrada.")
    return republica

@router.post("/entrar/")
def entrar_republica(invite_code: str, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    republica = session.exec(select(Republic).where(Republic.invite_code == invite_code)).first()
    if not republica:
        raise HTTPException(status_code=404, detail="Código de convite inválido.")
    if current_user.republic_id == republica.id:
        raise HTTPException(status_code=400, detail="Usuário já pertence a esta república.")
    if current_user.republic_id is not None:
        raise HTTPException(status_code=400, detail="Usuário já pertence a outra república.")
    
    current_user.republic_id = republica.id
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return {"mensagem": f"Usuário {current_user.name} entrou na república {republica.name} com sucesso!"}

@router.post("/sair")
def sair_republica(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if current_user.republic_id is None:
        raise HTTPException(status_code=400, detail="Usuário não pertence a nenhuma república.")
    
    current_user.republic_id = None
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return {"mensagem": f"Usuário {current_user.name} saiu da república com sucesso!"}
