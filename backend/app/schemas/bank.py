from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class Institution(BaseModel):
    id: str
    name: str
    country: Optional[str] = None
    type: Optional[str] = None
    class Config:
        from_attributes = True


class Account(BaseModel):
    id: str
    institution_id: str
    name: str
    type: Optional[str] = None
    number: Optional[str] = None
    currency: Optional[str] = None
    balance: Decimal
    class Config:
        from_attributes = True


class AccountSummary(BaseModel):
    income: Decimal
    expenses: Decimal
    balance: Decimal
    class Config:
        from_attributes = True


class Transaction(BaseModel):
    id: str
    description: Optional[str] = None
    type: str
    amount: Decimal
    currency: Optional[str] = None
    date: date
    class Config:
        from_attributes = True
