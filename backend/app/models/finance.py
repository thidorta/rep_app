from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import date

if TYPE_CHECKING:
    from .user import User
    from .republic import Republic

class ExpenseTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str  # Ex: "Internet Vivo"
    base_value: float # Valor que costuma vir
    category: str     # "fixo", "luz", "aluguel"
    
    republic_id: int = Field(foreign_key="republic.id")

class Expense(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    amount: float
    due_date: date
    split_type: str  # "equal" ou "manual"
    category: str # "aluguel", "luz", "compras", etc.

    republic_id: int = Field(foreign_key="republic.id")

    splits: List["UserExpense"] = Relationship(back_populates="expense")

class UserExpense(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    value: float
    is_paid: bool = Field(default=False)
    paid_amount: float = Field(default=0.0)
    user_id: int = Field(foreign_key="user.id")
    expense_id: int = Field(foreign_key="expense.id")

    expense: "Expense" = Relationship(back_populates="splits")

class ResidentPurchase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    amount: float
    purchase_date: date
    is_settled: bool = Field(default=False)
    user_id: int = Field(foreign_key="user.id")
    republic_id: int = Field(foreign_key="republic.id")

class CashTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    amount: float
    transaction_date: date = Field(default_factory=date.today)
    type: str  # "in" para entrada, "out" para saída

    republic_id: int = Field(foreign_key="republic.id")

class PaymentHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    user_expense_id: int = Field(foreign_key="userexpense.id")
    amount: float
    payment_date: date = Field(default_factory=date.today)
    
    confirmed_by_id: int = Field(foreign_key="user.id")