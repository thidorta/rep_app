from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.user import User              # Para o banco de dados
from app.models.republic import Republic      # Para o banco de dados
from app.schemas.republic import RepublicCreate, RepublicPublic, RepublicDetail, RoleUpdate # Para validação
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

    current_user.role_tag = "admin"
    current_user.republic_id = republica.id
    session.add(current_user)
    session.commit()

    return {
        "mensagem": "República criada com sucesso!",
        "republica": republica,
        "fundador": current_user.name
    }

@router.delete("/sair")
def sair_republica(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if current_user.republic_id is None:
        raise HTTPException(status_code=400, detail="Usuário não pertence a nenhuma república.")

    old_republic_id = current_user.republic_id
    current_user.role_tag = "morador"

    current_user.republic_id = None
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    moradores = session.exec(select(User).where(User.republic_id == old_republic_id)).all()
    
    mensagem_extra = ""

    if not moradores:
        republica = session.get(Republic, old_republic_id)
        session.delete(republica)
        session.commit()
        mensagem_extra = " Como você era o último, a república foi encerrada."
    
    return {"mensagem": f"Você saiu da república com sucesso.{mensagem_extra}"}

@router.get("/", response_model=List[RepublicPublic])
def listar_republicas(session: Session = Depends(get_session)):
    republicas = session.exec(select(Republic)).all()
    return republicas

@router.post("/entrar/")
def entrar_republica(invite_code: str, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    republica = session.exec(select(Republic).where(Republic.invite_code == invite_code)).first()
    if not republica:
        raise HTTPException(status_code=404, detail="Código de convite inválido.")
    if current_user.republic_id == republica.id:
        raise HTTPException(status_code=400, detail="Usuário já pertence a esta república.")
    if current_user.republic_id is not None:
        raise HTTPException(status_code=400, detail="Usuário já pertence a outra república.")
    
    current_user.role_tag = "morador"
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

@router.get("/moradores", response_model=RepublicDetail)
def listar_moradores(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if current_user.republic_id is None:
        raise HTTPException(status_code=400, detail="Usuário não pertence a nenhuma república.")
    
    republica = session.get(Republic, current_user.republic_id)
    if not republica:
        raise HTTPException(status_code=404, detail="República não encontrada.")
    
    return republica

@router.get("/{republica_id}", response_model=RepublicDetail)
def obter_republica(republica_id: int, session: Session = Depends(get_session)):
    republica = session.get(Republic, republica_id)
    if not republica:
        raise HTTPException(status_code=404, detail="República não encontrada.")
    return republica

@router.put("/promover-admin")
def alterar_cargo(
    role_data: RoleUpdate,
    current_user: User = Depends(get_current_user), # Vamos checar manualmente se é admin
    session: Session = Depends(get_session)
):
    # 1. Segurança: Apenas quem TEM a tag 'admin' pode promover outros
    if current_user.role_tag != 'admin':
        raise HTTPException(status_code=403, detail="Apenas o Admin Geral pode alterar cargos.")

    # 2. Busca o usuário alvo
    target_user = session.get(User, role_data.user_id)
    if not target_user or target_user.republic_id != current_user.republic_id:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # 3. Impede que o admin se rebaixe acidentalmente (opcional, mas seguro)
    if target_user.id == current_user.id and role_data.new_role != 'admin':
         raise HTTPException(status_code=400, detail="Você não pode remover seu próprio cargo de Admin.")

    target_user.role_tag = role_data.new_role
    session.add(target_user)
    session.commit()

    return {"mensagem": f"Cargo de {target_user.name} alterado para {role_data.new_role}."}
