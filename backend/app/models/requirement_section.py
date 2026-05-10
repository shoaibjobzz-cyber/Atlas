from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class RequirementSection(Base):
    __tablename__ = "requirement_sections"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id"), nullable=False, index=True)
    parent_section_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("requirement_sections.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    project = relationship("Project")
    parent_section = relationship("RequirementSection", remote_side=[id], back_populates="child_sections")
    child_sections = relationship("RequirementSection", back_populates="parent_section")
    requirements = relationship("Requirement", back_populates="section")
