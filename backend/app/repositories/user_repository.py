from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_email(self, email: str) -> Optional[User]:
        normalized_email = email.strip().lower()
        return self.db.query(User).filter(User.email == normalized_email).first()

    def create(self, email: str, hashed_password: str) -> User:
        normalized_email = email.strip().lower()
        user = User(email=normalized_email, hashed_password=hashed_password)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
