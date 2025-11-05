from datetime import datetime

from pydantic import BaseModel, EmailStr, validator

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 64
PASSWORD_MAX_BYTES = 72
PASSWORD_TOO_LONG_MESSAGE = (
    "La contraseña es demasiado larga. Usa máximo 64 caracteres y evita emojis o caracteres poco comunes."
)
PASSWORD_HELP_MESSAGE = "La contraseña debe tener entre 8 y 64 caracteres."


class UserBase(BaseModel):
    email: EmailStr
    class Config:
        from_attributes = True


def _validate_password(value: str) -> str:
    if len(value) < PASSWORD_MIN_LENGTH:
        raise ValueError(PASSWORD_HELP_MESSAGE)
    if len(value) > PASSWORD_MAX_LENGTH:
        raise ValueError(PASSWORD_TOO_LONG_MESSAGE)
    if len(value.encode("utf-8")) > PASSWORD_MAX_BYTES:
        raise ValueError(PASSWORD_TOO_LONG_MESSAGE)
    return value


class UserCreate(UserBase):
    password: str

    _password_rules = validator("password", allow_reuse=True)(_validate_password)


class UserLogin(UserBase):
    password: str

    _password_rules = validator("password", allow_reuse=True)(_validate_password)


class UserRead(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
    


class AuthResponse(BaseModel):
    user: UserRead
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_expires_in: int

    class Config:
        from_attributes = True


class TokenRefreshRequest(BaseModel):
    refresh_token: str

    class Config:
        from_attributes = True
