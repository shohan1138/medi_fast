from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
import app.models.models
from app.routes import auth, patient,doctor,appointment

app = FastAPI(
    title="MediFast API",
    docs_url="/docs",
    redoc_url="/redoc",
)

Base.metadata.create_all(bind=engine) ##for creating table form model.py to any database 
app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(doctor.router)
app.include_router(appointment.router)


@app.get("/")
def read_root():
    return {"msg": "MediFast API is running"}