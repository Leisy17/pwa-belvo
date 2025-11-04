from __future__ import annotations
from sqlalchemy.exc import SQLAlchemyError
from datetime import date
from decimal import Decimal
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.account import Account, Transaction
from app.models.institution import Institution
from app.repositories.bank_repository import BankRepository
from app.schemas.bank import Account as AccountSchema
from app.schemas.bank import AccountSummary, Institution as InstitutionSchema
from app.schemas.bank import Transaction as TransactionSchema
from app.services.belvo_service import BelvoService


class BankService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = BankRepository(db)
        self.belvo = BelvoService()

    def list_institutions(self) -> List[InstitutionSchema]:
        try:
            belvo_items = self.belvo.list_institutions()
            orm_items: List[Institution] = []

            for item in belvo_items:
                identifier = item.get("id")
                if not identifier:
                    continue
                orm_items.append(Institution(
                    id=identifier,
                    name=item.get("name", "Unknown"),
                    country=item.get("country_code"),
                    type=item.get("type"),
                ))

            # Upsert seguro
            if orm_items:
                for inst in orm_items:
                    existing = self.repository.db.query(Institution).filter_by(id=inst.id).first()
                    if existing:
                        existing.name = inst.name
                        existing.country = inst.country
                        existing.type = inst.type
                    else:
                        self.repository.db.add(inst)

                try:
                    self.repository.db.commit()
                except SQLAlchemyError:
                    self.repository.db.rollback()  # Muy importante

            cached = orm_items or self.repository.list_cached_institutions()

        except Exception:
            self.repository.db.rollback()
            cached = self.repository.list_cached_institutions()

        # Convertir a schema
        payload = [
            InstitutionSchema(
                id=item.id,
                name=item.name,
                country=item.country,
                type=item.type
            )
            for item in cached
        ]
        return payload

    def list_accounts(self, institution_id: str) -> List[AccountSchema]:
        try:
            belvo_accounts = self.belvo.list_accounts(institution=institution_id)
            account_models: List[Account] = []
            for item in belvo_accounts:
                identifier = item.get("id")
                if not identifier:
                    continue
                account = Account(
                    id=identifier,
                    institution_id=item.get("institution"),
                    name=item.get("name") or item.get("alias") or "Cuenta",
                    type=item.get("type"),
                    number=item.get("number"),
                    currency=item.get("currency"),
                    balance=Decimal(str(item.get("balance", 0) or 0)),
                    available_balance=Decimal(str(item.get("available", 0) or 0)),
                )
                account_models.append(account)
                self.repository.upsert_account(account)
            self.repository.commit()
        except Exception:  # noqa: BLE001
            self.db.rollback()
        cached_accounts = self.repository.list_accounts_by_institution(institution_id)
        if not cached_accounts:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No accounts found for this institution. Verify BELVO_LINK_IDS and cached data.",
            )
        items = [
            AccountSchema(
                id=account.id,
                institution_id=account.institution_id,
                name=account.name,
                type=account.type,
                number=account.number,
                currency=account.currency,
                balance=Decimal(account.balance or 0),
            )
            for account in cached_accounts
        ]
        return items

    def get_account_summary(self, account_id: str) -> AccountSummary:
        try:
            account_data = self.belvo.retrieve_account(account_id)
            if account_data:
                account = Account(
                    id=account_data.get("id"),
                    institution_id=account_data.get("institution"),
                    name=account_data.get("name") or account_data.get("alias") or "Cuenta",
                    type=account_data.get("type"),
                    number=account_data.get("number"),
                    currency=account_data.get("currency"),
                    balance=Decimal(str(account_data.get("balance", 0) or 0)),
                    available_balance=Decimal(str(account_data.get("available", 0) or 0)),
                )
                self.repository.upsert_account(account)
                self.repository.commit()
            self._sync_transactions(account_id)
        except Exception:  # noqa: BLE001
            self.db.rollback()
        summary = self.repository.aggregate_account_summary(account_id)
        if summary is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
        return AccountSummary(
            income=Decimal(summary["income"]),
            expenses=Decimal(summary["expenses"]),
            balance=Decimal(summary["balance"]),
        )

    def list_transactions(self, account_id: str) -> List[TransactionSchema]:
        transactions = self._sync_transactions(account_id)
        if not transactions:
            transactions = self.repository.list_transactions(account_id)
        if not transactions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transactions not found for this account. Verify Belvo data availability.",
            )
        items = [
            TransactionSchema(
                id=transaction.belvo_transaction_id,
                description=transaction.description,
                type=transaction.type,
                amount=Decimal(transaction.amount or 0),
                currency=transaction.currency,
                date=transaction.date,
            )
            for transaction in transactions
        ]
        return items

    def _sync_transactions(self, account_id: str) -> List[Transaction]:
        try:
            belvo_transactions = self.belvo.list_transactions(account_id)
            synced: List[Transaction] = []
            for item in belvo_transactions:
                belvo_type = (item.get("type") or "").lower()
                normalized_type = "income" if belvo_type in {"inflow", "income"} else "expense"
                value_date = item.get("value_date") or item.get("posting_date")
                parsed_date = (
                    date.fromisoformat(value_date)
                    if isinstance(value_date, str)
                    else value_date
                )
                parsed_date = parsed_date or date.today()
                raw_amount = Decimal(str(item.get("amount", 0) or 0))
                normalized_amount = abs(raw_amount)
                transaction = Transaction(
                    belvo_transaction_id=item.get("id"),
                    account_id=account_id,
                    description=item.get("description"),
                    category=item.get("category"),
                    type=normalized_type,
                    amount=normalized_amount,
                    currency=item.get("currency"),
                    date=parsed_date,
                )
                synced.append(self.repository.upsert_transaction(transaction))
            self.repository.commit()
            return self.repository.list_transactions(account_id)
        except Exception:  # noqa: BLE001
            self.db.rollback()
            return []
