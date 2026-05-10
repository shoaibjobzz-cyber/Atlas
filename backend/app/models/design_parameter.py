from sqlalchemy import ForeignKey, String, Table, Text, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


requirement_design_parameter_links = Table(
    "requirement_design_parameter_links",
    Base.metadata,
    Column("requirement_id", String(64), ForeignKey("requirements.id", ondelete="CASCADE"), primary_key=True),
    Column("design_parameter_id", String(64), ForeignKey("design_parameters.id", ondelete="CASCADE"), primary_key=True),
)


class DesignParameter(Base):
    __tablename__ = "design_parameters"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    subsystem: Mapped[str | None] = mapped_column(String(128), nullable=True)
    parameter_name: Mapped[str] = mapped_column(String(255))
    value: Mapped[str] = mapped_column(String(128))
    unit: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_document: Mapped[str | None] = mapped_column(String(255), nullable=True)
    revision: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    linked_requirements = relationship(
        "Requirement",
        secondary=requirement_design_parameter_links,
        back_populates="linked_design_parameters",
    )
    project = relationship("Project", back_populates="design_parameters")
