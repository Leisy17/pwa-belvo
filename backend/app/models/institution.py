from sqlalchemy import Column, DateTime, String
from sqlalchemy.sql import func

from app.database.session import Base


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    country = Column(String, nullable=True)
    type = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
