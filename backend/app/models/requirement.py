from datetime import datetime

from sqlalchemy import Boolean, JSON, DateTime, ForeignKey, String, Text, UniqueConstraint, false, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Requirement(Base):
    __tablename__ = "requirements"
    __table_args__ = (
        UniqueConstraint("project_id", "requirement_code", name="uq_requirements_project_requirement_code"),
        UniqueConstraint("project_id", "hierarchy", name="uq_requirements_project_hierarchy"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    requirement_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    text: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(64))
    priority: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32))
    parent_requirement_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("requirements.id", ondelete="SET NULL"),
        nullable=True,
    )
    feature_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("project_features.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    hierarchy: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    section_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("requirement_sections.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    subsystem: Mapped[str | None] = mapped_column(String(128), nullable=True)
    verification_method: Mapped[str | None] = mapped_column(String(64), nullable=True)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    assumptions: Mapped[str | None] = mapped_column(Text, nullable=True)
    parsed_requirement: Mapped[dict[str, str | None] | None] = mapped_column(JSON, nullable=True)
    generation_metadata: Mapped[dict[str, str | bool | None] | None] = mapped_column(JSON, nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    updated_by_user_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("users.id"), nullable=True, index=True)
    deleted_by_user_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("users.id"), nullable=True, index=True)
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
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())

    linked_design_parameters = relationship(
        "DesignParameter",
        secondary="requirement_design_parameter_links",
        back_populates="linked_requirements",
    )
    project = relationship("Project", back_populates="requirements")
    feature = relationship("ProjectFeature", back_populates="requirements")
    section = relationship("RequirementSection", back_populates="requirements")
    created_by_user = relationship("User", foreign_keys=[created_by_user_id])
    updated_by_user = relationship("User", foreign_keys=[updated_by_user_id])
    deleted_by_user = relationship("User", foreign_keys=[deleted_by_user_id])

    @property
    def created_by_username(self) -> str | None:
        user = self.created_by_user
        return user.username if user is not None else None

    @property
    def updated_by_username(self) -> str | None:
        user = self.updated_by_user
        return user.username if user is not None else None

    @property
    def deleted_by_username(self) -> str | None:
        user = self.deleted_by_user
        return user.username if user is not None else None
