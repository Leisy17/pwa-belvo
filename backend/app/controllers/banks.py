from typing import List, Optional

from fastapi import APIRouter, Depends
from fastapi import Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.bank import (
    Account as AccountSchema,
    AccountCreateRequest,
    AccountSummary,
    Institution as InstitutionSchema,
    LinkAccountsResponse,
    LinkCreateRequest,
    LinkResponse,
    LinkSummary,
    Transaction as TransactionSchema,
)
from app.services.bank_service import BankService

router = APIRouter(prefix="/banks", tags=["banks"], dependencies=[Depends(get_current_user)])
accounts_router = APIRouter(prefix="/accounts", tags=["accounts"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[InstitutionSchema])
def list_banks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[InstitutionSchema]:
    service = BankService(db, current_user)
    return service.list_institutions()


@router.get("/links", response_model=List[LinkSummary])
def list_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[LinkSummary]:
    service = BankService(db, current_user)
    return service.list_links()


@router.get("/{institution_id}/links", response_model=List[LinkSummary])
def list_institution_links(
    institution_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[LinkSummary]:
    service = BankService(db, current_user)
    return service.list_links_by_institution(institution_id)


@router.get("/links/{link_id}/accounts", response_model=LinkAccountsResponse)
def sync_link_accounts(
    link_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LinkAccountsResponse:
    service = BankService(db, current_user)
    return service.sync_accounts_by_link(link_id)


@router.get("/{institution_id}/accounts", response_model=List[AccountSchema])
def list_accounts(
    institution_id: str,
    link_id: Optional[str] = Query(default=None, alias="link"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[AccountSchema]:
    service = BankService(db, current_user)
    return service.list_accounts(institution_id, link_id)


@router.post("/{institution_id}/links/{link_id}/accounts", response_model=AccountSchema, status_code=201)
def create_account_for_link(
    institution_id: str,
    link_id: str,
    payload: AccountCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AccountSchema:
    service = BankService(db, current_user)
    return service.create_account_for_link(institution_id, link_id, payload)


@router.get("/{institution_id}/accounts/{account_id}", response_model=List[TransactionSchema])
def list_account_transactions(
    institution_id: str,
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[TransactionSchema]:
    service = BankService(db, current_user)
    return service.list_transactions(institution_id, account_id)


@accounts_router.get("/{account_id}/summary", response_model=AccountSummary)
def account_summary(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AccountSummary:
    service = BankService(db, current_user)
    return service.get_account_summary(account_id)


@accounts_router.get("/{account_id}/transactions", response_model=List[TransactionSchema])
def account_transactions(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[TransactionSchema]:
    service = BankService(db, current_user)
    return service.list_transactions_by_account(account_id)


@router.post("/{institution_id}/links", response_model=LinkResponse, status_code=201)
def create_link(
    institution_id: str,
    payload: LinkCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LinkResponse:
    service = BankService(db, current_user)
    return service.create_link(institution_id, payload)
