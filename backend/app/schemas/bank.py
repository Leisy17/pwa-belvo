from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, validator


class Institution(BaseModel):
    id: str
    name: str
    internal_name: Optional[str] = None
    code: Optional[str] = None
    country: Optional[str] = None
    type: Optional[str] = None
    is_linked: bool = Field(default=False)
    link_id: Optional[str] = None
    link_username: Optional[str] = None
    linked_email: Optional[str] = None

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
    link_id: Optional[str] = None

    class Config:
        from_attributes = True


class AccountCreateRequest(BaseModel):
    reference_id: Optional[str] = None
    name: str
    type: Optional[str] = None
    number: Optional[str] = None
    currency: Optional[str] = None
    balance: Decimal = Decimal("0")

    @validator("name")
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("El nombre de la cuenta es obligatorio.")
        return cleaned

    @validator("reference_id", "number", "currency", pre=True)
    def strip_optional_fields(cls, value: Optional[str]) -> Optional[str]:
        if isinstance(value, str):
            cleaned = value.strip()
            return cleaned or None
        return value

    class Config:
        anystr_strip_whitespace = True


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


class LinkSummary(BaseModel):
    id: str
    institution_id: str
    institution_name: Optional[str] = None
    institution_display_name: Optional[str] = None
    status: str
    username: Optional[str] = None
    linked_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_accessed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LinkResponse(LinkSummary):
    belvo_link_id: str


class LinkAccountsResponse(BaseModel):
    link: LinkSummary
    accounts: list[Account]


class LinkCreateRequest(BaseModel):
    institution_name: str
    institution_display_name: Optional[str] = None
    username: str
    password: str
    token: Optional[str] = None
    access_mode: str = "single"
    external_id: Optional[str] = None

    @validator("institution_name", "username", pre=True)
    def strip_whitespace(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        raise ValueError("Valor inválido.")

    @validator("username")
    def enforce_simple_username(cls, value: str) -> str:
        lowered = value.lower()
        if not lowered.replace("_", "").isalnum():
            raise ValueError("El usuario solo puede contener letras, números o guiones bajos.")
        return lowered

    @validator("institution_display_name", pre=True, always=True)
    def strip_display_name(cls, value: Optional[str]) -> Optional[str]:
        if isinstance(value, str):
            return value.strip() or None
        return None
