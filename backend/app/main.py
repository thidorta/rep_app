from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importações internas do projeto
from app.database import create_db_and_tables, get_session
from app.api import republicas, usuarios, auth, financas

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

# Permite chamadas do Expo / emuladores durante desenvolvimento
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(republicas.router)
app.include_router(usuarios.router)
app.include_router(auth.router)
app.include_router(financas.router)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Bem-vindo à API do RepApp!"}


