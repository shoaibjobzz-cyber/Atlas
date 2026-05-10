from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="Draft", server_default="Draft")
    project_kind: Mapped[str] = mapped_column(String(32), nullable=False, default="Standard", server_default="Standard")
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

    owner = relationship("User", back_populates="projects")
    requirements = relationship("Requirement", back_populates="project")
    design_parameters = relationship("DesignParameter", back_populates="project")
    snapshots = relationship("ProjectSnapshot", back_populates="project", cascade="all, delete-orphan")
    features = relationship("ProjectFeature", back_populates="project", cascade="all, delete-orphan")
