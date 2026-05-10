from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ProjectRequirementSequence(Base):
    __tablename__ = "project_requirement_sequences"

    project_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    requirement_type: Mapped[str] = mapped_column(String(64), primary_key=True)
    next_value: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
