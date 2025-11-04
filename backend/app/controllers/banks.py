from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from typing import List

from app.schemas.bank import Account as AccountSchema
from app.schemas.bank import AccountSummary, Institution as InstitutionSchema, Transaction as TransactionSchema
from app.services.bank_service import BankService

router = APIRouter(prefix="/banks", tags=["banks"], dependencies=[Depends(get_current_user)])
accounts_router = APIRouter(prefix="/accounts", tags=["accounts"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[InstitutionSchema])
def list_banks(db: Session = Depends(get_db)) -> List[InstitutionSchema]:
    service = BankService(db)
    return service.list_institutions()


@router.get("/{institution_id}/accounts", response_model=List[AccountSchema])
def list_accounts(institution_id: str, db: Session = Depends(get_db)) -> List[AccountSchema]:
    service = BankService(db)
    return service.list_accounts(institution_id)


@router.get("/{institution_id}/accounts/{account_id}", response_model=List[TransactionSchema])
def list_account_transactions(
    institution_id: str, account_id: str, db: Session = Depends(get_db)
) -> List[TransactionSchema]:
    service = BankService(db)
    return service.list_transactions(account_id)


@accounts_router.get("/{account_id}/summary", response_model=AccountSummary)
def account_summary(account_id: str, db: Session = Depends(get_db)) -> AccountSummary:
    service = BankService(db)
    return service.get_account_summary(account_id)
