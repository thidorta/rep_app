from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from app.database import get_session
from app.models import User
from app.core.security import pwd_context, create_access_token

router = APIRouter(tags=["Autenticação"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    usuario = session.exec(select(User).where(User.email == form_data.username)).first()
    if not usuario or not pwd_context.verify(form_data.password, usuario.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")
    
    access_token = create_access_token(data={"sub": usuario.email})
    
    return {"access_token": access_token, "token_type": "bearer"}