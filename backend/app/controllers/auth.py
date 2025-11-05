from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.auth import AuthResponse, TokenRefreshRequest, UserCreate, UserLogin
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> AuthResponse:
    service = AuthService(db)
    return service.register_user(payload)


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> AuthResponse:
    service = AuthService(db)
    return service.authenticate_user(payload)


@router.post("/refresh", response_model=AuthResponse)
def refresh(payload: TokenRefreshRequest, db: Session = Depends(get_db)) -> AuthResponse:
    service = AuthService(db)
    return service.refresh_session(payload.refresh_token)
