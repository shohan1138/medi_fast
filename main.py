from fastapi import FastAPI
from app.database import engine, Base
import app.models

app = FastAPI()

Base.metadata.create_all(bind=engine) ##for creating table form model.py to any database 

@app.get("/")
def read_root():
    return {"msg": "PostGre DB with FastAPI is running"}