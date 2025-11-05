from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, user_id: str, token_hash: str, expires_at: datetime) -> RefreshToken:
        token = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(token)
        self.db.commit()
        self.db.refresh(token)
        return token

    def get_active_by_hash(self, token_hash: str, now: datetime) -> Optional[RefreshToken]:
        return (
            self.db.query(RefreshToken)
            .filter(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > now,
            )
            .first()
        )

    def revoke(self, token: RefreshToken, revoked_at: Optional[datetime] = None) -> None:
        token.revoked_at = revoked_at or datetime.utcnow()
        self.db.add(token)
        self.db.commit()

    def revoke_user_tokens(self, user_id: str, revoked_at: Optional[datetime] = None) -> None:
        timestamp = revoked_at or datetime.utcnow()
        (
            self.db.query(RefreshToken)
            .filter(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .update({RefreshToken.revoked_at: timestamp}, synchronize_session=False)
        )
        self.db.commit()
