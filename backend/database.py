import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import shutil

# Serverless environment (Vercel) SQLite compatibility
# The root filesystem is read-only. We must write to /tmp/ to keep SQLite operational.
if os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
    db_path = "/tmp/astracast.db"
    
    # Copy seed database from source to /tmp if it doesn't exist
    if not os.path.exists(db_path):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        src_path = os.path.join(base_dir, "astracast.db")
        if os.path.exists(src_path):
            try:
                shutil.copy2(src_path, db_path)
                print(f"[AstraCast DB] Seeded database copied to {db_path}")
            except Exception as e:
                print(f"[AstraCast DB] Warning: Failed to copy seed database: {e}")
        else:
            print(f"[AstraCast DB] Warning: Seed database not found at {src_path}")
            
    DATABASE_URL = f"sqlite:///{db_path}"
else:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./astracast.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
