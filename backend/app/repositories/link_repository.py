from datetime import datetime
from typing import Iterable, Optional

from sqlalchemy.orm import Session

from app.models.belvo_link import BelvoLink


class LinkRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_or_update_from_payload(
        self,
        *,
        user_id: str,
        institution_id: str,
        payload: dict,
        institution_display_name: Optional[str] = None,
        credential_username: Optional[str] = None,
    ) -> BelvoLink:
        belvo_id = str(payload.get("id"))
        if not belvo_id:
            raise ValueError("Belvo link payload missing id.")
        link = self.db.query(BelvoLink).filter(BelvoLink.belvo_link_id == belvo_id).first()
        timestamp = datetime.utcnow()
        if link is None:
            link = BelvoLink(
                user_id=user_id,
                institution_id=institution_id,
                belvo_link_id=belvo_id,
                status=payload.get("status") or "unknown",
            )
            self.db.add(link)

        link.user_id = user_id
        link.institution_id = institution_id
        link.status = payload.get("status") or link.status
        link.username = credential_username or payload.get("username") or link.username
        link.external_id = payload.get("external_id") or link.external_id
        display_name = institution_display_name or payload.get("display_name")
        link.institution_name = display_name or link.institution_name
        link.country = payload.get("country") or link.country
        link.updated_at = timestamp
        raw_last_accessed = payload.get("last_accessed_at") or payload.get("last_accessed")
        if isinstance(raw_last_accessed, str):
            try:
                normalized = raw_last_accessed.replace("Z", "+00:00")
                link.last_accessed_at = datetime.fromisoformat(normalized)
            except ValueError:
                link.last_accessed_at = timestamp
        else:
            link.last_accessed_at = timestamp
        self.db.commit()
        self.db.refresh(link)
        return link

    def get_by_user_and_institution(self, user_id: str, institution_id: str) -> Optional[BelvoLink]:
        return (
            self.db.query(BelvoLink)
            .filter(BelvoLink.user_id == user_id, BelvoLink.institution_id == institution_id)
            .order_by(BelvoLink.created_at.desc())
            .first()
        )

    def list_active_by_user(self, user_id: str) -> Iterable[BelvoLink]:
        return (
            self.db.query(BelvoLink)
            .filter(BelvoLink.user_id == user_id)
            .order_by(BelvoLink.created_at.desc())
            .all()
        )

    def list_by_institution_for_user(self, user_id: str, institution_id: str) -> Iterable[BelvoLink]:
        return (
            self.db.query(BelvoLink)
            .filter(
                BelvoLink.user_id == user_id,
                BelvoLink.institution_id == institution_id,
            )
            .order_by(BelvoLink.created_at.desc())
            .all()
        )

    def get_by_id_for_user(self, link_id: str, user_id: str) -> Optional[BelvoLink]:
        return (
            self.db.query(BelvoLink)
            .filter(BelvoLink.id == link_id, BelvoLink.user_id == user_id)
            .first()
        )
