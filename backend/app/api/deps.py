from __future__ import annotations

from functools import lru_cache
from typing import Generator

import jwt
from fastapi import Depends, HTTPException, Request, status
from jwt import PyJWKClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import User
from app.db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient:
    if settings.LOGTO_ISSUER or settings.LOGTO_JWKS_URL:
        if not settings.LOGTO_JWKS_URL:
            raise RuntimeError("LOGTO_JWKS_URL is not configured.")
        return PyJWKClient(settings.LOGTO_JWKS_URL, cache_keys=True)
    
    if not settings.CLERK_JWKS_URL:
        raise RuntimeError(
            "CLERK_JWKS_URL or LOGTO_JWKS_URL must be configured."
        )
    return PyJWKClient(settings.CLERK_JWKS_URL, cache_keys=True)



def _extract_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth_header.split(" ", 1)[1]


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    token = _extract_bearer_token(request)

    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        options = {"verify_aud": False}
        issuer = settings.CLERK_ISSUER or None
        
        if settings.LOGTO_ISSUER:
            issuer = settings.LOGTO_ISSUER
            if settings.LOGTO_AUDIENCE:
                options = {"verify_aud": True, "verify_signature": True}
        
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES384"], # Logto might use ES384 or RS256
            options=options,
            issuer=issuer,
            audience=settings.LOGTO_AUDIENCE if settings.LOGTO_AUDIENCE else None
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()
    if user is None:
        user = User(
            clerk_id=clerk_user_id,
            email=payload.get("email") or payload.get("email_address"),
            username=payload.get("username") or clerk_user_id,
            is_verified=True,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account disabled",
        )

    return user
