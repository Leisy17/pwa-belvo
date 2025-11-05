import uuid
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import relationship

from app.database.session import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False, index=True)
    link_id = Column(String, ForeignKey("belvo_links.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=True)
    number = Column(String, nullable=True)
    currency = Column(String, nullable=True)
    balance = Column(Numeric(14, 2), default=0, nullable=False)
    available_balance = Column(Numeric(14, 2), default=0, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    link = relationship("BelvoLink", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    belvo_transaction_id = Column(String, unique=True, nullable=False)
    account_id = Column(String, ForeignKey("accounts.id"), nullable=False, index=True)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True)
    type = Column(String, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String, nullable=True)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    account = relationship("Account", back_populates="transactions")
