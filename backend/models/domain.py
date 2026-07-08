from sqlalchemy import Column, String, JSON, DateTime, Integer
from sqlalchemy.sql import func
from core.database import Base


class WizardSession(Base):
    __tablename__ = "wizard_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), unique=True, index=True, nullable=False)
    state_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())