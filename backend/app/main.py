from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI

# Importações internas do projeto
from app.database import create_db_and_tables, get_session
from app.api import republicas, usuarios, auth

# Gerenciador de Ciclo de Vida (Lifespan)
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

# Inicialização do App
app = FastAPI(
    title="RepApp - Gestão de Repúblicas",
    description="API para gerenciamento de moradores, contas e tarefas de repúblicas.",
    lifespan=lifespan
)

app.include_router(republicas.router)
app.include_router(usuarios.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Bem-vindo à API do RepApp!"}


