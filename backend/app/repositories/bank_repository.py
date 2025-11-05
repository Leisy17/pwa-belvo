from decimal import Decimal
from typing import Iterable, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.account import Account, Transaction
from app.models.institution import Institution


class BankRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def upsert_institutions(self, institutions: Iterable[Institution]) -> None:
        for institution in institutions:
            existing = self.db.get(Institution, institution.id)
            if existing:
                existing.name = institution.name
                existing.internal_name = getattr(institution, "internal_name", existing.internal_name)
                existing.code = getattr(institution, "code", existing.code)
                existing.country = institution.country
                existing.type = institution.type
            else:
                self.db.add(institution)
        self.db.commit()

    def list_cached_institutions(self) -> List[Institution]:
        return self.db.query(Institution).order_by(Institution.name).all()

    def upsert_account(self, payload: Account) -> Account:
        existing = self.db.get(Account, payload.id)
        if existing:
            existing.name = payload.name
            existing.type = payload.type
            existing.number = payload.number
            existing.currency = payload.currency
            existing.balance = payload.balance
            existing.available_balance = payload.available_balance
            existing.link_id = payload.link_id
            return existing
        self.db.add(payload)
        return payload

    def commit(self) -> None:
        self.db.commit()

    def refresh(self, account: Account) -> None:
        self.db.refresh(account)

    def get_account_for_user(self, account_id: str, _user_id: str) -> Optional[Account]:
        return self.db.query(Account).filter(Account.id == account_id).first()

    def list_accounts_by_institution_for_user(self, institution_id: str, _user_id: str) -> List[Account]:
        return (
            self.db.query(Account)
            .filter(
                Account.institution_id == institution_id,
            )
            .order_by(Account.name)
            .all()
        )

    def list_accounts_by_link_for_user(self, link_id: str, _user_id: str) -> List[Account]:
        return (
            self.db.query(Account)
            .filter(Account.link_id == link_id)
            .order_by(Account.name)
            .all()
        )

    def upsert_transaction(self, transaction: Transaction) -> Transaction:
        existing = (
            self.db.query(Transaction)
            .filter(Transaction.belvo_transaction_id == transaction.belvo_transaction_id)
            .first()
        )
        if existing:
            existing.description = transaction.description
            existing.type = transaction.type
            existing.amount = transaction.amount
            existing.currency = transaction.currency
            existing.date = transaction.date
            existing.category = transaction.category
            return existing
        self.db.add(transaction)
        return transaction

    def list_transactions_for_user(self, account_id: str, _user_id: str) -> List[Transaction]:
        return (
            self.db.query(Transaction)
            .filter(Transaction.account_id == account_id)
            .order_by(Transaction.date.desc())
            .all()
        )

    def aggregate_account_summary(self, account_id: str, _user_id: str) -> Optional[dict]:
        type_column = func.lower(Transaction.type)
        income = (
            self.db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.account_id == account_id,
                type_column.in_(("credit", "income")),
            )
            .scalar()
        )
        expenses = (
            self.db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.account_id == account_id,
                type_column.in_(("debit", "expense")),
            )
            .scalar()
        )
        account = self.db.query(Account).filter(Account.id == account_id).first()
        if account is None:
            return None
        income_total = Decimal(income or 0)
        expense_total = Decimal(expenses or 0)
        current_balance = Decimal(account.balance or 0)
        if income_total == 0 and current_balance != 0:
            income_total = current_balance

        return {
            "income": income_total,
            "expenses": expense_total,
            "balance": current_balance if current_balance else (income_total - expense_total),
            "current_balance": current_balance,
        }
