from datetime import date
from app.models.finance import CashTransaction, ExpenseTemplate, ResidentPurchase
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models import User, Republic, Expense, UserExpense
from app.models.finance import PaymentHistory 
from app.schemas.republic import RoleUpdate
from app.schemas.finance import ExpenseTemplateUpdate, PaymentCreate, FixedRentUpdate, CashTransactionCreate, DashboardResponse, ExpenseCreateInput, ExpenseResponse, ExpenseTemplateCreate, ResidentPurchaseCreate
from app.core.security import get_current_user
from typing import List
from sqlalchemy import func

router = APIRouter(prefix="/financas", tags=["Finanças"])

# dependencias de permissão
def check_admin_finance(current_user: User = Depends(get_current_user)):
    if current_user.role_tag == "admin_finance" or current_user.role_tag == "admin":
        return current_user
    raise HTTPException(status_code=403, detail= "Acesso negado: somente administradores de finanças podem acessar.")

#rota para criação de despesas fixas da republica, feita por ADM
@router.post("/despesas", response_model=ExpenseResponse)
def criar_despesas(
    expense_in: ExpenseCreateInput, 
    current_user: User  = Depends(get_current_user), 
    session: Session = Depends(get_session)
):
    nova_despesa = Expense(
        description = expense_in.description,
        total_value = expense_in.total_value,
        due_date = expense_in.due_date,
        category = expense_in.category,
        split_type = expense_in.split_type,
        republic_id = current_user.republic_id
    )
    session.add(nova_despesa)
    session.commit()
    session.refresh(nova_despesa)

    moradores = session.exec(select(User).where(User.republic_id == current_user.republic_id)).all()
    
    if expense_in.split_type == "equal":
        # Dividir igualmente entre todos os moradores da república
        split_value = expense_in.total_value / len(moradores)
        for morador in moradores:
            user_expense = UserExpense(
                user_id = morador.id,
                expense_id = nova_despesa.id,
                value = split_value
            )
            session.add(user_expense)
    
    session.commit()
    return("Despesa criada com sucesso.", nova_despesa)

# rota para listar despesas da republica
@router.get("/despesas", response_model=List[ExpenseResponse])
def listar_despesas(
    current_user: User  = Depends(get_current_user), 
    session: Session = Depends(get_session)
):
    despesas = session.exec(
        select(Expense).where(Expense.republic_id == current_user.republic_id)
    ).all()
    return despesas

#rota para listar alugueis fixos dos moradores
@router.get("/alugueis-fixos")
def listar_alugueis(
    current_user: User = Depends(check_admin_finance),
    session: Session = Depends(get_session)
):
    # Retorna todos os moradores da república do admin
    statement = select(User).where(User.republic_id == current_user.republic_id)
    users = session.exec(statement).all()
    return users

#rota para atualizar alugueis fixos dos moradores
@router.put("/alugueis-fixos")
def atualizar_alugueis(
    updates: List[FixedRentUpdate],
    current_user: User = Depends(check_admin_finance),
    session: Session = Depends(get_session)
):
    for update in updates:
        # Verifica se o usuário pertence à mesma república (segurança)
        user = session.get(User, update.user_id)
        if user and user.republic_id == current_user.republic_id:
            user.fixed_rent = update.fixed_rent
            session.add(user)
    
    session.commit()
    return {"mensagem": "Aluguéis atualizados com sucesso!"}

#rota para registrar compras feitas por moradores
@router.post("/compras-moradores")
def registrar_compra_morador(
    compra_in: ResidentPurchaseCreate,
    current_user: User  = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    nova_compra = ResidentPurchase(
        description = compra_in.description,
        amount = compra_in.value,
        purchase_date = date.today(),
        user_id = current_user.id,
        republic_id = current_user.republic_id
    )
    session.add(nova_compra)
    session.commit()
    session.refresh(nova_compra)
    return {"detail": "Compra registrada com sucesso."}
    
@router.post("/caixa/transacao")
def registrar_transacao_caixa(
    transaction_in: CashTransactionCreate,
    current_user: User  = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    nova_transacao = CashTransaction(
        description = transaction_in.description,
        amount = transaction_in.amount,
        purchase_date = date.today(),
        republic_id = current_user.republic_id,
        type = transaction_in.type
    )

    if transaction_in.type not in ["in", "out"]:
        raise HTTPException(status_code=400, detail="Tipo de transação inválido. Use 'in' ou 'out'.")
    
    session.add(nova_transacao)
    session.commit()
    session.refresh(nova_transacao)

    # Ajustar o saldo do caixa conforme o tipo de transação
    valor_final = transaction_in.amount if transaction_in.type == "in" else -transaction_in.amount

    return {"detail": f"Transação de {nova_transacao.amount} registrada com sucesso.", "transacao": nova_transacao.amount}

@router.get("/caixa/extrato", response_model=List[CashTransactionCreate])
def obter_extrato_caixa(
    current_user: User  = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = select(CashTransaction).where(CashTransaction.republic_id == current_user.republic_id)
    transacoes = session.exec(statement).all()
    return transacoes

@router.get("/dashboard", response_model=DashboardResponse)
def obter_dashboard(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    rep_id = current_user.republic_id

    # Agora buscamos APENAS UserExpenses (que incluem Aluguel e Variáveis já gerados)
    debitos_ativos = session.exec(
        select(func.sum(UserExpense.value - UserExpense.paid_amount))
        .where(UserExpense.user_id == current_user.id, UserExpense.is_paid == False)
    ).one() or 0.0

    # Créditos são apenas compras que AINDA NÃO entraram em nenhuma fatura
    meus_creditos_novos = session.exec(
        select(func.sum(ResidentPurchase.amount))
        .where(ResidentPurchase.user_id == current_user.id, ResidentPurchase.is_settled == False)
    ).one() or 0.0

    # 3. Saldo do Caixa da República
    entradas = session.exec(select(func.sum(CashTransaction.amount)).where(CashTransaction.republic_id == rep_id, CashTransaction.type == "in")).one() or 0.0
    saidas = session.exec(select(func.sum(CashTransaction.amount)).where(CashTransaction.republic_id == rep_id, CashTransaction.type == "out")).one() or 0.0
    
    # 4. [NOVO] Total de Despesas da Casa (Para mostrar o custo total da república)
    # Somamos todas as Expenses do mês/geral da república
    total_despesas = session.exec(
        select(func.sum(Expense.amount))
        .where(Expense.republic_id == rep_id)
    ).one() or 0.0

    # --- Cálculos Finais ---
    aluguel_fixo = current_user.fixed_rent or 0.0
    valor_total_pagar = aluguel_fixo + debitos_ativos - meus_creditos_novos
    
    # 5. [NOVO] Saldo do Usuário (Quanto ele tem de crédito ou débito "puro", sem contar aluguel fixo)
    # Positivo = A casa deve pra ele. Negativo = Ele deve pra casa.
    saldo_usuario = meus_creditos_novos - debitos_ativos

    return {
        "fixed_rent_base": current_user.fixed_rent,
        "variable_debts": debitos_ativos,
        "my_credits": meus_creditos_novos,
        "total_to_pay": round(valor_total_pagar, 2),
        "cashbox_balance": entradas - saidas,
        "total_republic_expenses": total_despesas,
        "user_balance": saldo_usuario
    }

@router.post("/pagar-divida")
def registrar_pagamento(
    payment_in: PaymentCreate,
    current_user: User = Depends(check_admin_finance),
    session: Session = Depends(get_session)
):
    valor_disponivel = payment_in.amount
    dividas_para_pagar = []

    # --- CAMINHO A: Pagar um item específico ---
    if payment_in.user_expense_id:
        divida = session.get(UserExpense, payment_in.user_expense_id)
        if not divida:
            raise HTTPException(status_code=404, detail="Dívida não encontrada.")
        if divida.is_paid:
            raise HTTPException(status_code=400, detail="Esta conta já está quitada.")
        dividas_para_pagar = [divida]

    # --- CAMINHO B: Pagamento Inteligente (Distribuição) ---
    elif payment_in.user_id:
        # Busca todas as fatias abertas do usuário (da mais antiga para a mais nova)
        statement = (
            select(UserExpense)
            .where(UserExpense.user_id == payment_in.user_id, UserExpense.is_paid == False)
            .order_by(UserExpense.id)
        )
        dividas_para_pagar = session.exec(statement).all()
        
        if not dividas_para_pagar:
            raise HTTPException(status_code=400, detail="Este usuário não possui dívidas pendentes.")

    else:
        raise HTTPException(status_code=400, detail="Informe o ID da dívida ou o ID do usuário.")

    # --- LÓGICA DE PROCESSAMENTO (Comum para ambos os caminhos) ---
    for conta in dividas_para_pagar:
        if valor_disponivel <= 0:
            break

        falta_nesta = conta.value - conta.paid_amount
        pagar_agora = min(valor_disponivel, falta_nesta)

        # 1. Atualiza a dívida
        conta.paid_amount += pagar_agora
        if conta.paid_amount >= (conta.value - 0.01):
            conta.is_paid = True
        
        # 2. Cria o registro no histórico (Recibo)
        novo_recibo = PaymentHistory(
            user_expense_id=conta.id,
            amount=pagar_agora,
            confirmed_by_id=current_user.id
        )
        
        session.add(conta)
        session.add(novo_recibo)
        
        valor_disponivel -= pagar_agora

    session.commit()

    return {
        "detail": "Pagamento processado com sucesso.",
        "sobra_em_caixa": round(valor_disponivel, 2)
    }

@router.get("/devedores")
def listar_devedores_resumo(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Busca todos os moradores da república
    moradores = session.exec(select(User).where(User.republic_id == current_user.republic_id)).all()
    
    resumo = []
    for m in moradores:
        # Busca fatias pendentes deste morador
        fatias = session.exec(
            select(UserExpense)
            .where(UserExpense.user_id == m.id, UserExpense.is_paid == False)
        ).all()
        
        if not fatias:
            continue
            
        total_devido = sum(f.value - f.paid_amount for f in fatias)
        
        resumo.append({
            "id": m.id,
            "name": m.name,
            "total_owed": total_devido,
            "pending_count": len(fatias),
            "pending_expenses": [
                {
                    "id": f.id,
                    "description": f.expense.description, # Assumindo relação com Expense
                    "value": f.value,
                    "paid_amount": f.paid_amount
                } for f in fatias
            ]
        })
        
    return resumo

@router.post("/templates")
def criar_template(
    template_in: ExpenseTemplateCreate,
    current_user: User = Depends(check_admin_finance),
    session: Session = Depends(get_session)
):
    novo_template = ExpenseTemplate(
        **template_in.model_dump(),
        republic_id=current_user.republic_id
    )
    session.add(novo_template)
    session.commit()
    return {"detail": "Template configurado com sucesso."}

@router.get("/templates", response_model=List[ExpenseTemplate])
def listar_templates(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    return session.exec(
        select(ExpenseTemplate).where(ExpenseTemplate.republic_id == current_user.republic_id)
    ).all()

@router.put("/templates/{template_id}")
def atualizar_template(
    template_id: int,
    template_in: ExpenseTemplateUpdate,
    current_user: User = Depends(check_admin_finance),
    session: Session = Depends(get_session)
):
    template = session.get(ExpenseTemplate, template_id)
    if not template or template.republic_id != current_user.republic_id:
        raise HTTPException(status_code=404, detail="Template não encontrado.")
    
    # 2. Atualiza apenas os campos enviados
    update_data = template_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)

    session.add(template)
    session.commit()
    session.refresh(template)

@router.post("/gerar-mensalidade")
def gerar_contas_do_mes(
    current_user: User = Depends(check_admin_finance),
    session: Session = Depends(get_session)
):
    rep_id = current_user.republic_id
    templates = session.exec(select(ExpenseTemplate).where(ExpenseTemplate.republic_id == rep_id)).all()
    moradores = session.exec(select(User).where(User.republic_id == rep_id)).all()
    
    hoje = date.today()
    mes_referencia = hoje.strftime('%m/%Y')
    
    if not templates:
        raise HTTPException(status_code=400, detail="Nenhum template configurado.")

    hoje = date.today()
    despesas_criadas = 0

    for t in templates:
        # 1. Cria a Despesa Real baseada no Template
        nova_despesa = Expense(
            description=f"{t.description} - {hoje.strftime('%m/%Y')}",
            amount=t.base_value,
            due_date=date(hoje.year, hoje.month, 10), # Fixa para dia 10 (exemplo)
            category=t.category,
            split_type="equal",
            republic_id=rep_id
        )
        session.add(nova_despesa)
        session.commit()
        session.refresh(nova_despesa)

        # 2. Divide entre os moradores
        valor_fatia = t.base_value / len(moradores)
        for m in moradores:
            fatia = UserExpense(user_id=m.id, expense_id=nova_despesa.id, value=valor_fatia, paid_amount=0.0, is_paid=False)
            session.add(fatia)
        
        despesas_criadas += 1

    session.commit()
    return {"detail": f"{despesas_criadas} despesas geradas e divididas para o mês atual."}
