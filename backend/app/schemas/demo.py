from pydantic import BaseModel


class DemoProjectLoadResponse(BaseModel):
    project_id: str
    project_name: str
    requirements_loaded: int
    design_parameters_loaded: int
