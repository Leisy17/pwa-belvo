from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    AuthResponse,
    UserCreate,
    UserLogin,
    UserRead,
    PASSWORD_TOO_LONG_MESSAGE,
)

PASSWORD_TOO_LONG_MARKER = "password cannot be longer than"


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = UserRepository(db)
        self.settings = get_settings()

    def register_user(self, payload: UserCreate) -> AuthResponse:
        existing = self.repository.get_by_email(email=payload.email)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

        try:
            hashed_password = get_password_hash(payload.password)
        except ValueError as error:
            if PASSWORD_TOO_LONG_MARKER in str(error).lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=[
                        {
                            "loc": ["body", "password"],
                            "msg": PASSWORD_TOO_LONG_MESSAGE,
                            "type": "value_error.password_length",
                        }
                    ],
                ) from error
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No fue posible procesar la contraseña. Intenta más tarde."
            ) from error
        try:
            user = self.repository.create(email=payload.email, hashed_password=hashed_password)
        except IntegrityError as error:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists") from error
        token = self._generate_token(user.email)
        return AuthResponse(user=UserRead.from_orm(user), token=token)

    def authenticate_user(self, payload: UserLogin) -> AuthResponse:
        user = self.repository.get_by_email(email=payload.email)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        try:
            is_valid = verify_password(payload.password, user.hashed_password)
        except ValueError as error:
            if PASSWORD_TOO_LONG_MARKER in str(error).lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=[
                        {
                            "loc": ["body", "password"],
                            "msg": PASSWORD_TOO_LONG_MESSAGE,
                            "type": "value_error.password_length",
                        }
                    ],
                ) from error
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No fue posible procesar la contraseña. Intenta más tarde."
            ) from error
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        token = self._generate_token(user.email)
        return AuthResponse(user=UserRead.from_orm(user), token=token)

    def _generate_token(self, subject: str) -> str:
        expires = timedelta(minutes=self.settings.access_token_expire_minutes)
        return create_access_token(subject=subject, expires_delta=expires)
