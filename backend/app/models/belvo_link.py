import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.database.session import Base


class BelvoLink(Base):
    __tablename__ = "belvo_links"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_id = Column(String, nullable=False, index=True)
    belvo_link_id = Column(String, unique=True, nullable=False, index=True)
    status = Column(String, nullable=False)
    username = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_accessed_at = Column(DateTime, nullable=True)
    external_id = Column(String, nullable=True)
    institution_name = Column(String, nullable=True)
    country = Column(String, nullable=True)

    user = relationship("User", back_populates="belvo_links")
    accounts = relationship(
        "Account",
        back_populates="link",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
