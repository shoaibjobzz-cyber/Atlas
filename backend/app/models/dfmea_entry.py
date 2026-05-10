from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class DfmeaEntry(Base):
    __tablename__ = "dfmea_entries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id"), index=True)
    requirement_id: Mapped[str] = mapped_column(String(64), ForeignKey("requirements.id"), index=True)
    function: Mapped[str] = mapped_column(Text)
    failure_mode: Mapped[str] = mapped_column(Text)
    failure_effect: Mapped[str] = mapped_column(Text)
    potential_cause: Mapped[str] = mapped_column(Text)
    current_prevention_controls: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_detection_controls: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[int] = mapped_column(Integer)
    occurrence: Mapped[int] = mapped_column(Integer)
    detection: Mapped[int] = mapped_column(Integer)
    recommended_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="Open")
    related_requirement_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_by_user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    updated_by_user_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("users.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    project = relationship("Project")
    requirement = relationship("Requirement")
    created_by_user = relationship("User", foreign_keys=[created_by_user_id])
    updated_by_user = relationship("User", foreign_keys=[updated_by_user_id])
