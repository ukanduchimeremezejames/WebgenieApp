from pydantic import BaseModel


class UserCreate(BaseModel):
    user: str
    email: str


class UserResponse(BaseModel):
    id: str
    user: str
    email: str
