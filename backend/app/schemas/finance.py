from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import date

# Schema para receber os dados
class FixedRentUpdate(BaseModel):
    user_id: int
    fixed_rent: float

class PaymentCreate(BaseModel):
    user_expense_id: Optional[int] = None
    user_id: Optional[int] = None
    amount: float    

class UserSplitInput(BaseModel):
    user_id: int
    value: float

class ExpenseTemplateCreate(BaseModel):
    description: str
    base_value: float
    category: str

class ExpenseTemplateUpdate(BaseModel):
    description: Optional[str] = None
    base_value: Optional[float] = None
    category: Optional[str] = None

class ExpenseCreateInput(BaseModel):
    description: str
    total_value: float
    due_date: date
    category: str  # "aluguel", "luz", "compras"
    split_type: str = "equal" # "equal" ou "manual"
    # Se for manual, enviamos esta lista:
    manual_splits: Optional[List[UserSplitInput]] = None

    @field_validator("split_type")
    @classmethod
    def validate_split_type(cls, v):
        if v not in ["equal", "manual"]:
            raise ValueError("O tipo de divisão deve ser 'equal' ou 'manual'")
        return v
    
class ExpenseResponse(BaseModel):
    description: str
    amount: float
    due_date: date
    category: str
    split_type: str
    splits: List[UserSplitInput]
    
class ResidentPurchaseCreate(BaseModel):
    description: str
    value: float

class CashTransactionCreate(BaseModel):
    amount: float
    description: str
    type: str # "in" ou "out"

class DashboardResponse(BaseModel):
    fixed_rent_base: float
    variable_debts: float
    my_credits: float
    total_to_pay: float
    cashbox_balance: float
    total_republic_expenses: float 
    user_balance: float            