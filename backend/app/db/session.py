from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import Optional

from app.core.config import settings

# Lazy initialization for sync engine
_sync_engine = None
_session_local = None


def get_sync_engine():
    """Get or create the synchronous database engine lazily."""
    global _sync_engine
    if _sync_engine is None:
        if settings.SQLALCHEMY_DATABASE_URI:
            _sync_engine = create_engine(
                settings.SQLALCHEMY_DATABASE_URI,
                pool_pre_ping=True,
                pool_timeout=10,
                connect_args={"connect_timeout": 10}
            )
        else:
            # Fallback to SQLite for development
            _sync_engine = create_engine(
                "sqlite:///./kuantra.db",
                connect_args={"check_same_thread": False}
            )
    return _sync_engine


def get_session_local():
    """Get or create the session maker lazily."""
    global _session_local
    if _session_local is None:
        _session_local = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=get_sync_engine()
        )
    return _session_local


class LazySessionLocal:
    """Lazy wrapper for SessionLocal to prevent import-time DB connections."""
    def __call__(self):
        return get_session_local()()
    
    def __getattr__(self, name):
        return getattr(get_session_local(), name)


# For backwards compatibility
SessionLocal = LazySessionLocal()
engine = None  # Will be set on first use


def get_engine():
    return get_sync_engine()
