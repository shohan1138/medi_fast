from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
import app.models.models
from app.routes import auth, patient,doctor,appointment,billing,medical,prescription
# from app.routes.medical import medical_router,lab_router
# from app.routes.prescription import prescription_router
# from app.routes.billing import router as billing_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MediFast API",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://medi-fast-mmr9.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Base.metadata.create_all(bind=engine) ##for creating table form model.py to any database 

app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(doctor.router)
app.include_router(appointment.router)
app.include_router(medical.router)
# app.include_router(lab_router)
app.include_router(prescription.router)
app.include_router(billing.router)


@app.get("/")
def read_root():
    return {"msg": "MediFast API is running"}


