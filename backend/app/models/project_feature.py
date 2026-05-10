from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class ProjectFeature(Base):
    __tablename__ = "project_features"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_feature_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("project_features.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
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

    project = relationship("Project", back_populates="features")
    parent_feature = relationship("ProjectFeature", remote_side=[id], back_populates="child_features")
    child_features = relationship("ProjectFeature", back_populates="parent_feature")
    requirements = relationship("Requirement", back_populates="feature")
