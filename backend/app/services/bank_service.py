from __future__ import annotations

from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any, List, Optional
from uuid import uuid4

import requests
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.account import Account, Transaction
from app.models.institution import Institution
from app.models.user import User
from app.repositories.bank_repository import BankRepository
from app.repositories.link_repository import LinkRepository
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
from app.services.belvo_service import BelvoService


class BankService:
    def __init__(self, db: Session, user: User) -> None:
        self.db = db
        self.user = user
        self.repository = BankRepository(db)
        self.link_repository = LinkRepository(db)
        self.belvo = BelvoService()

    def _link_to_summary(self, link) -> LinkSummary:
        institution = self.db.get(Institution, link.institution_id)
        display_name = getattr(link, "institution_name", None)
        if institution is not None:
            display_name = institution.name or display_name
        return LinkSummary(
            id=link.id,
            institution_id=link.institution_id,
            institution_name=getattr(link, "institution_name", None),
            institution_display_name=display_name,
            status=link.status,
            username=link.username,
            linked_email=self.user.email,
            created_at=link.created_at,
            updated_at=link.updated_at,
            last_accessed_at=link.last_accessed_at,
        )

    @staticmethod
    def _account_to_schema(account: Account) -> AccountSchema:
        return AccountSchema(
            id=account.id,
            institution_id=account.institution_id,
            name=account.name,
            type=account.type,
            number=account.number,
            currency=account.currency,
            balance=Decimal(account.balance or 0),
            link_id=account.link_id,
        )

    def list_links(self) -> List[LinkSummary]:
        links = self.link_repository.list_active_by_user(self.user.id)
        return [self._link_to_summary(link) for link in links]

    def list_links_by_institution(self, institution_id: str) -> List[LinkSummary]:
        links = self.link_repository.list_by_institution_for_user(self.user.id, institution_id)
        return [self._link_to_summary(link) for link in links]

    @staticmethod
    def _decimal_from(value: Any, default: Decimal = Decimal("0")) -> Decimal:
        if value is None:
            return default
        if isinstance(value, (int, float, Decimal)):
            return Decimal(str(value))
        if isinstance(value, str):
            cleaned = value.strip()
            if cleaned == "":
                return default
            try:
                return Decimal(cleaned)
            except InvalidOperation:
                return default
        if isinstance(value, dict):
            for key in ("current", "current_balance", "available", "balance", "value"):
                if key in value:
                    return BankService._decimal_from(value.get(key), default)
            return default
        return default

    @staticmethod
    def _extract_account_number(raw: Optional[str]) -> Optional[str]:
        if raw is None:
            return None
        text = str(raw).strip()
        if not text:
            return None
        return text

    def list_institutions(self) -> List[InstitutionSchema]:
        try:
            belvo_items = self.belvo.list_institutions()
            orm_items: List[Institution] = []
            for item in belvo_items:
                identifier = str(item.get("id"))
                if not identifier:
                    continue
                orm_items.append(
                    Institution(
                        id=identifier,
                        name=item.get("display_name") or item.get("name") or "Unknown",
                        internal_name=item.get("name"),
                        code=item.get("code"),
                        country=item.get("country_code"),
                        type=item.get("type"),
                    )
                )

            if orm_items:
                self.repository.upsert_institutions(orm_items)
            cached = self.repository.list_cached_institutions()

        except Exception:  # noqa: BLE001
            self.db.rollback()
            cached = self.repository.list_cached_institutions()

        user_links = {
            link.institution_id: link
            for link in self.link_repository.list_active_by_user(self.user.id)
        }
        payload = []
        for item in cached:
            link = user_links.get(item.id)
            payload.append(
                InstitutionSchema(
                    id=item.id,
                    name=item.name,
                    internal_name=item.internal_name,
                    code=getattr(item, "code", None),
                    country=item.country,
                    type=item.type,
                    is_linked=link is not None,
                    link_id=link.id if link else None,
                    link_username=link.username if link else None,
                    linked_email=self.user.email if link else None,
                )
            )
        return payload

    def list_accounts(self, institution_id: str, link_id: Optional[str] = None) -> List[AccountSchema]:
        if link_id:
            link = self.link_repository.get_by_id_for_user(link_id, self.user.id)
        else:
            link = self.link_repository.get_by_user_and_institution(self.user.id, institution_id)
        if link is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No tienes un enlace activo para esta institución. Crea uno primero.",
            )

        try:
            belvo_accounts = self.belvo.list_accounts(link_id=link.belvo_link_id)
            for item in belvo_accounts:
                identifier = str(item.get("id"))
                if not identifier:
                    continue
                balance_value = self._decimal_from(item.get("balance"))
                available_value = self._decimal_from(item.get("available"))
                number_value = self._extract_account_number(item.get("number") or item.get("account_number"))
                account = Account(
                    id=identifier,
                    institution_id=institution_id,
                    link_id=link.id,
                    name=item.get("name") or item.get("alias") or "Cuenta",
                    type=item.get("type"),
                    number=number_value,
                    currency=item.get("currency"),
                    balance=balance_value,
                    available_balance=available_value,
                )
                self.repository.upsert_account(account)
            self.repository.commit()
        except Exception:  # noqa: BLE001
            self.db.rollback()
        if link_id:
            cached_accounts = self.repository.list_accounts_by_link_for_user(link.id, self.user.id)
        else:
            cached_accounts = self.repository.list_accounts_by_institution_for_user(
                institution_id,
                self.user.id,
            )
        if not cached_accounts:
            return []
        items = [
            self._account_to_schema(account)
            for account in cached_accounts
        ]
        return items

    def create_account_for_link(
        self,
        institution_id: str,
        link_id: str,
        payload: AccountCreateRequest,
    ) -> AccountSchema:
        link = self.link_repository.get_by_id_for_user(link_id, self.user.id)
        if link is None or link.institution_id != institution_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No existe un enlace activo para esta institución.",
            )

        account_identifier = payload.reference_id or str(uuid4())
        normalized_balance = Decimal(payload.balance or 0)
        account_currency = payload.currency
        if isinstance(account_currency, str):
            account_currency = account_currency.upper()
        account = Account(
            id=str(account_identifier),
            institution_id=institution_id,
            link_id=link.id,
            name=payload.name,
            type=payload.type,
            number=payload.number,
            currency=account_currency,
            balance=normalized_balance,
            available_balance=normalized_balance,
        )

        try:
            stored = self.repository.upsert_account(account)
            initial_amount = abs(normalized_balance)
            if initial_amount > 0:
                transaction_type = "CREDIT" if normalized_balance >= 0 else "DEBIT"
                manual_transaction = Transaction(
                    belvo_transaction_id=f"manual-initial-{uuid4()}",
                    account_id=account.id,
                    description="Saldo inicial",
                    category="initial_balance",
                    type=transaction_type,
                    amount=initial_amount,
                    currency=account_currency,
                    date=date.today(),
                )
                self.repository.upsert_transaction(manual_transaction)
            self.repository.commit()
            self.repository.refresh(stored)
        except Exception as error:  # noqa: BLE001
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No fue posible registrar la cuenta.",
            ) from error

        return self._account_to_schema(stored)

    def sync_accounts_by_link(self, link_id: str) -> LinkAccountsResponse:
        link = self.link_repository.get_by_id_for_user(link_id, self.user.id)
        if link is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enlace no encontrado")

        try:
            belvo_accounts = self.belvo.list_accounts(link_id=link.belvo_link_id)
            for item in belvo_accounts:
                identifier = str(item.get("id"))
                if not identifier:
                    continue
                balance_value = self._decimal_from(item.get("balance"))
                available_value = self._decimal_from(item.get("available"))
                number_value = self._extract_account_number(item.get("number") or item.get("account_number"))
                account = Account(
                    id=identifier,
                    institution_id=link.institution_id,
                    link_id=link.id,
                    name=item.get("name") or item.get("alias") or "Cuenta",
                    type=item.get("type"),
                    number=number_value,
                    currency=item.get("currency"),
                    balance=balance_value,
                    available_balance=available_value,
                )
                self.repository.upsert_account(account)
            self.repository.commit()
        except Exception:  # noqa: BLE001
            self.db.rollback()

        cached_accounts = self.repository.list_accounts_by_link_for_user(link.id, self.user.id)
        account_payload = [self._account_to_schema(account) for account in cached_accounts]
        summary = self._link_to_summary(link)
        return LinkAccountsResponse(link=summary, accounts=account_payload)

    def get_account_summary(self, account_id: str) -> AccountSummary:
        account = self.repository.get_account_for_user(account_id, self.user.id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")
        summary = self.repository.aggregate_account_summary(account_id, self.user.id)
        if summary is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")
        return AccountSummary(
            income=Decimal(summary["income"]),
            expenses=Decimal(summary["expenses"]),
            balance=Decimal(summary["balance"]),
        )

    def list_transactions(self, institution_id: str, account_id: str) -> List[TransactionSchema]:
        account = self.repository.get_account_for_user(account_id, self.user.id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")
        if account.institution_id != institution_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada en esta institución")

        transactions = self.repository.list_transactions_for_user(account_id, self.user.id)
        items = [
            TransactionSchema(
                id=transaction.belvo_transaction_id,
                description=transaction.description,
                type=(transaction.type or "").upper(),
                amount=Decimal(transaction.amount or 0),
                currency=transaction.currency,
                date=transaction.date,
            )
            for transaction in transactions
        ]
        return items

    def list_transactions_by_account(self, account_id: str) -> List[TransactionSchema]:
        account = self.repository.get_account_for_user(account_id, self.user.id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")
        return self.list_transactions(account.institution_id, account_id)

    def create_link(self, institution_id: str, payload: LinkCreateRequest) -> LinkResponse:
        try:
            belvo_payload = self.belvo.create_link(
                institution_id=institution_id,
                institution_name=payload.institution_name,
                username=payload.username,
                password=payload.password,
                token=payload.token,
                access_mode=payload.access_mode,
                external_id=payload.external_id,
            )
        except requests.HTTPError as error:
            detail = "No fue posible crear el enlace en Belvo"
            try:
                problem = error.response.json()
                detail = problem.get("message") or problem.get("detail") or detail
            except Exception:  # noqa: BLE001
                detail = error.response.text or detail
            raise HTTPException(status_code=error.response.status_code, detail=detail) from error
        except Exception as error:  # noqa: BLE001
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="No fue posible crear el enlace en Belvo",
            ) from error

        institution = self.db.get(Institution, institution_id)
        display_name = payload.institution_display_name or (institution.name if institution else None)

        link = self.link_repository.create_or_update_from_payload(
            user_id=self.user.id,
            institution_id=institution_id,
            payload=belvo_payload,
            institution_display_name=display_name,
            credential_username=payload.username,
        )

        # Sincronizar cuentas recién creadas para que el frontend las tenga al instante
        try:
            belvo_accounts = self.belvo.list_accounts(link_id=link.belvo_link_id)
            for item in belvo_accounts:
                identifier = str(item.get("id"))
                if not identifier:
                    continue
                account = Account(
                    id=identifier,
                    institution_id=item.get("institution"),
                    link_id=link.id,
                    name=item.get("name") or item.get("alias") or "Cuenta",
                    type=item.get("type"),
                    number=item.get("number"),
                    currency=item.get("currency"),
                    balance=Decimal(str(item.get("balance", 0) or 0)),
                    available_balance=Decimal(str(item.get("available", 0) or 0)),
                )
                self.repository.upsert_account(account)
            self.repository.commit()
        except Exception:  # noqa: BLE001
            self.db.rollback()

        summary = self._link_to_summary(link)
        return LinkResponse(
            **summary.dict(),
            belvo_link_id=link.belvo_link_id,
        )
