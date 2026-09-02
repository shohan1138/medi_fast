🏥 MediFast - Hospital Management System
A full-stack, role-based Hospital Management System designed to streamline workflows across 8 different hospital roles (Admin, Doctor, Patient, Receptionist, Nurse, Lab Technician, Pharmacist, Management).

Live Demo: https://medi-fast-mmr9.vercel.appAPI Docs (Swagger): https://medi-fast-athome4.vercel.app/docs

📸 Screenshots

🛠 Tech Stack

Frontend: React, Vite, TailwindCSS, Axios, React Router
Backend: Python, FastAPI, Pydantic, JWT Authentication
Database: PostgreSQL (Hosted on Neon)
Deployment: Vercel (Serverless Functions)

✨ Key Features & RBAC Matrix

The system uses strict Role-Based Access Control (RBAC).

Role Capabilities
Admin Full system access, user management, role assignment
Receptionist Patient registration, appointment booking, ward admission
Doctor View appointments, write prescriptions, update medical records
Patient View own medical records, prescriptions, and invoices
Pharmacist View prescriptions, dispense medication
Lab Tech Upload and manage lab reports
Nurse View patient ward assignments, update basic vitals
Management View financial dashboard, auto-invoicing, ward occupancy

📊 Core Modules

User Management: Secure registration, login, and granular role assignment.
Appointments: Book, reschedule, and complete doctor visits.
Medical Records: Doctors can update patient histories and link lab reports.
Pharmacy: Electronic prescriptions linked directly to patient profiles.
Ward Management: Bed assignment, discharge, and status tracking.
Billing: Automated invoice generation upon ward discharge or appointment completion.

🚀 Local Setup (For Reviewers)

Clone the repository.
Backend: Create a virtual environment, pip install -r requirements.txt, set up .env with DATABASE_URL and SECRET_KEY, run uvicorn main:app --reload.
Frontend: cd frontend, npm install, create .env with VITE_API_URL=http://localhost:8000, run npm run dev.

🔮 Future Enhancements

Raw SQL reporting dashboard for revenue and doctor load analytics.
IoT integration for automated patient vitals logging.
