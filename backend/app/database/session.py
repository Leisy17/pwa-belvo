from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, scoped_session, sessionmaker
from sqlalchemy.engine import make_url

from app.core.config import get_settings

settings = get_settings()

database_url = make_url(settings.database_url)
# Switch legacy psycopg2 URLs to psycopg v3 so wheels are available on new Python versions.
if database_url.drivername in {"postgresql+psycopg2", "postgresql"}:
    database_url = database_url.set(drivername="postgresql+psycopg")

engine = create_engine(database_url, pool_pre_ping=True, future=True)
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True))

Base = declarative_base()
