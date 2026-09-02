from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.database import engine, Base
import app.models.models
from app.routes import auth, patient, doctor, appointment, billing, medical, prescription, reports
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MediFast API",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://medi-fast-mmr9.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# This forces FastAPI to attach CORS headers to error responses (like 401 Unauthorized)
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    headers = dict(exc.headers)
    origin = request.headers.get("origin")
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=headers)

# Base.metadata.create_all(bind=engine) ##for creating table form model.py to any database 

app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(doctor.router)
app.include_router(appointment.router)
app.include_router(medical.router)
app.include_router(prescription.router)
app.include_router(billing.router)
app.include_router(reports.router)

@app.get("/")
def read_root():
    return {"msg": "MediFast API is running"}