from fastapi import FastAPI, HTTPException
from prisma import Prisma
from models import UserCreate, UserResponse

app = FastAPI()
prisma = Prisma()


@app.get("/")
async def root():
    return {"message": "Hello World"}


# CRUD - CREATE
@app.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate):
    new_user = await prisma.user.create(data={"user": user.user, "email": user.email})
    return new_user


# CRUD - READ
@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = await prisma.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado!")
    return user


# CRUD - UPDATE
@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_data: UserCreate):
    user = await prisma.user.update(
        where={"id": user_id}, data={"user": user_data.user, "email": user_data.email}
    )
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado!")
    return user


# CRUD - DELELE
@app.delete("/users/{user_id}")
async def delete_user(user_id: str):
    user = await prisma.user.delete(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado!")
    return user
