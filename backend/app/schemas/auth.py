from datetime import datetime

from pydantic import BaseModel, Field


class AuthSignInRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=255)


class AuthUserResponse(BaseModel):
    id: str
    username: str
    display_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthSessionResponse(BaseModel):
    user: AuthUserResponse
