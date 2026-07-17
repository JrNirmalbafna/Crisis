from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from loguru import logger

from backend.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    echo=settings.debug,
)

# expire_on_commit=False prevents DetachedInstanceError when ORM objects
# are accessed after the session's with-block closes. Critical for all
# services that return model objects to callers outside the session scope.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency for request-scoped database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables (use for development/testing only).

    In production, use Alembic migrations instead of this function.
    """
    from backend.core.models import Base  # noqa: F401  — ensures all ORM models are registered

    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}")
        raise
