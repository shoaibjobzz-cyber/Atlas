from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.core.config import settings
from app.core.db import SessionLocal, engine
from app.models.auth_session import AuthSession  # noqa: F401
from app.models.design_parameter import DesignParameter  # noqa: F401
from app.models.dfmea_entry import DfmeaEntry  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.project_feature import ProjectFeature  # noqa: F401
from app.models.project_snapshot import ProjectSnapshot  # noqa: F401
from app.models.requirement import Requirement  # noqa: F401
from app.models.requirement_section import RequirementSection  # noqa: F401
from app.models.user import User  # noqa: F401
from app.routers.agent_validation import router as agent_validation_router
from app.routers.auth import router as auth_router
from app.routers.demo import router as demo_router
from app.routers.design_parameters import router as design_parameters_router
from app.routers.dfmea import router as dfmea_router
from app.routers.feasibility import router as feasibility_router
from app.routers.generation import router as generation_router
from app.routers.health import router as health_router
from app.routers.projects import router as projects_router
from app.routers.project_snapshots import router as project_snapshots_router
from app.routers.project_views import router as project_views_router
from app.routers.quality import router as quality_router
from app.routers.requirements import router as requirements_router
from app.routers.requirement_sections import router as requirement_sections_router
from app.services.auth_service import ensure_default_user


app = FastAPI(title="Requirements Intelligence Platform API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_origin_regex=settings.frontend_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def seed_default_auth_user() -> None:
    DfmeaEntry.__table__.create(bind=engine, checkfirst=True)
    ProjectFeature.__table__.create(bind=engine, checkfirst=True)
    RequirementSection.__table__.create(bind=engine, checkfirst=True)
    with engine.begin() as connection:
        inspector = inspect(connection)
        project_columns = {column["name"] for column in inspector.get_columns("projects")}
        if "project_kind" not in project_columns:
            connection.execute(text("ALTER TABLE projects ADD COLUMN project_kind VARCHAR(32) DEFAULT 'Standard'"))
        requirement_columns = {column["name"] for column in inspector.get_columns("requirements")}
        if "feature_id" not in requirement_columns:
            connection.execute(text("ALTER TABLE requirements ADD COLUMN feature_id VARCHAR(64)"))
        if "section_id" not in requirement_columns:
            connection.execute(text("ALTER TABLE requirements ADD COLUMN section_id VARCHAR(64)"))
        indexes = {index["name"] for index in inspector.get_indexes("requirements")}
        if "ix_requirements_feature_id" not in indexes:
            connection.execute(text("CREATE INDEX ix_requirements_feature_id ON requirements (feature_id)"))
        if "ix_requirements_section_id" not in indexes:
            connection.execute(text("CREATE INDEX ix_requirements_section_id ON requirements (section_id)"))
    session = SessionLocal()
    try:
        ensure_default_user(session)
    finally:
        session.close()

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(agent_validation_router)
app.include_router(projects_router)
app.include_router(project_views_router)
app.include_router(project_snapshots_router)
app.include_router(requirements_router)
app.include_router(requirement_sections_router)
app.include_router(generation_router)
app.include_router(quality_router)
app.include_router(design_parameters_router)
app.include_router(dfmea_router)
app.include_router(feasibility_router)
app.include_router(demo_router)
