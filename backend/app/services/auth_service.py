import hashlib
import secrets
from datetime import datetime, timedelta
from typing import TYPE_CHECKING

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.refresh_token import RefreshToken
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    AuthResponse,
    UserCreate,
    UserLogin,
    UserRead,
    PASSWORD_TOO_LONG_MESSAGE,
)

if TYPE_CHECKING:
    from app.models.user import User

PASSWORD_TOO_LONG_MARKER = "password cannot be longer than"


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = UserRepository(db)
        self.refresh_repository = RefreshTokenRepository(db)
        self.settings = get_settings()
        self._ensure_refresh_token_table()

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
        return self._build_auth_response(user=user, revoke_existing_refresh_tokens=True)

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
        return self._build_auth_response(user=user, revoke_existing_refresh_tokens=True)

    def refresh_session(self, refresh_token: str) -> AuthResponse:
        if not refresh_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        token_hash = self._hash_refresh_token(refresh_token)
        stored = self.refresh_repository.get_active_by_hash(token_hash=token_hash, now=datetime.utcnow())
        if stored is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        self.refresh_repository.revoke(stored)
        user = stored.user
        return self._build_auth_response(user=user, revoke_existing_refresh_tokens=False)

    def _generate_token(self, subject: str) -> str:
        expires = timedelta(minutes=self.settings.access_token_expire_minutes)
        return create_access_token(subject=subject, expires_delta=expires)

    def _build_auth_response(self, user: "User", revoke_existing_refresh_tokens: bool) -> AuthResponse:
        access_token = self._generate_token(user.email)
        refresh_token = self._create_refresh_token(user, revoke_existing=revoke_existing_refresh_tokens)
        return AuthResponse(
            user=UserRead.from_orm(user),
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=int(timedelta(minutes=self.settings.access_token_expire_minutes).total_seconds()),
            refresh_expires_in=self._refresh_expires_in_seconds(),
        )

    def _create_refresh_token(self, user: "User", revoke_existing: bool) -> str:
        if revoke_existing:
            self.refresh_repository.revoke_user_tokens(user.id)
        refresh_token = secrets.token_urlsafe(48)
        token_hash = self._hash_refresh_token(refresh_token)
        expires_at = datetime.utcnow() + timedelta(minutes=self.settings.refresh_token_expire_minutes)
        self.refresh_repository.create(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
        return refresh_token

    def _refresh_expires_in_seconds(self) -> int:
        return int(timedelta(minutes=self.settings.refresh_token_expire_minutes).total_seconds())

    @staticmethod
    def _hash_refresh_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def _ensure_refresh_token_table(self) -> None:
        bind = self.db.get_bind()
        if bind is None:
            return
        RefreshToken.__table__.create(bind=bind, checkfirst=True)
