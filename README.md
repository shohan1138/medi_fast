🏥 MediFast - Hospital Management System
A full-stack, role-based Hospital Management System designed to streamline workflows across 8 different hospital roles (Admin, Doctor, Patient, Receptionist, Nurse, Lab Technician, Pharmacist, Management).

Live Demo: https://medi-fast-mmr9.vercel.app API Docs (Swagger): https://medi-fast-athome4.vercel.app/docs

📸 Screenshots
<img width="1228" height="571" alt="ward admission_2" src="https://github.com/user-attachments/assets/a0eb2bb9-0d2b-43d1-b038-6257bda1723f" />
<img width="1222" height="565" alt="ward admission" src="https://github.com/user-attachments/assets/b11ae63c-2b54-4982-9f64-b6e3ef0afc0a" />
<img width="1225" height="574" alt="user managment" src="https://github.com/user-attachments/assets/a521a0f0-42ff-4eb0-a05d-970b9c444d63" />
<img width="1225" height="568" alt="discharge invoice" src="https://github.com/user-attachments/assets/71da27fe-35ba-4b7b-80fc-3e6781e1e74b" />
<img width="1239" height="572" alt="dashboard" src="https://github.com/user-attachments/assets/81b5c4f3-a706-4797-8c4c-9c6b0f9943ba" />
<img width="1227" height="578" alt="book appointment" src="https://github.com/user-attachments/assets/66d0965c-6f89-45b4-aeb1-828224a23087" />

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
