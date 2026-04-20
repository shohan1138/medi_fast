from fastapi import FastAPI
from app.database import engine, Base
import app.models

app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"msg": "SQLite DB with FastAPI is running"}