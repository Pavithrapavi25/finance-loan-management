# Finance & Loan Management System

A full-stack web application designed to help small loan businesses manage customers, loans, installments, payments, outstanding balances, due dates, reminders, and financial reports from one centralized system.

## 🚀 Live Demo

**Frontend:**
https://finance-loan-management-1.onrender.com

**Backend API:**
https://finance-loan-management.onrender.com

**API Documentation:**
https://finance-loan-management.onrender.com/docs

---

## 📌 Problem Statement

Small loan businesses often manage customer and payment information using notebooks or spreadsheets.

This can lead to:

* Missed payment dates
* Incorrect balance calculations
* Difficulty tracking installments
* Confusion about outstanding amounts
* Difficult customer history tracking
* Manual report preparation
* Lack of centralized financial information

This system provides a centralized digital solution for managing the complete loan lifecycle.

---

## 💡 Solution

The application follows the complete business workflow:

**Customer → Loan → Installments → Payments → Balance → Due Date → Reminder → Loan Closure**

It allows loan business owners to manage daily operations from a single dashboard.

---

## ✨ Key Features

### 👤 Customer Management

* Add customers
* Edit customer information
* Search customers
* View customer details
* View complete customer financial history
* Track active/inactive customers

### 💰 Loan Management

* Create loans for customers
* Support different interest types
* Configure interest rates
* Set loan start and maturity dates
* Track principal and payable amounts
* View active and completed loans
* Search and filter loans

### 📅 Installment Management

* Automatic installment schedule
* Track installment amounts
* Track paid and pending installments
* Record payment dates
* Monitor remaining installments

### 💳 Payment Management

* Record loan payments
* Automatically update outstanding balances
* Track payment history
* View payment details
* Monitor loan payment progress

### 🔔 Reminder Management

* Create payment reminders
* Set specific reminder dates
* Associate reminders with customers and loans
* Track reminder status

### 📊 Dashboard

The dashboard provides an overview of:

* Total customers
* Active loans
* Completed loans
* Total loan amount
* Total collected amount
* Outstanding amount
* Payment progress

### 📈 Reports

The system provides financial reports for:

* Loan portfolio
* Payment collection
* Outstanding and overdue loans
* Customer financial history
* Custom date-range analysis

### 📥 Excel Export

Financial reports can be exported to Excel for further analysis and record keeping.

---

## 🔐 Authentication & Security

The application includes:

* User registration
* Secure password hashing
* JWT-based authentication
* Protected API routes
* Token-based authorization
* Automatic handling of unauthorized API requests
* Environment-based configuration
* Production secrets stored outside source code

Passwords are never stored as plain text.

---

## 🛠️ Technology Stack

### Frontend

* React
* Vite
* JavaScript
* Axios
* React Router
* Lucide React
* CSS
* Responsive UI

### Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* JWT Authentication
* Passlib
* bcrypt

### Database

* PostgreSQL

### Reporting

* OpenPyXL
* Excel export

### Deployment

* GitHub
* Render
* Render PostgreSQL

---

## 🏗️ Project Architecture

```text
finance-loan-management/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

## 🔄 Application Workflow

```text
User Login
    ↓
Dashboard
    ↓
Customer
    ↓
Create Loan
    ↓
Installment Schedule
    ↓
Record Payment
    ↓
Update Balance
    ↓
Payment Reminder
    ↓
Loan Completion
    ↓
Reports & Export
```

---

## 🧪 Testing

The application was tested across the major business workflows:

* Authentication
* Login and logout
* Protected routes
* Customer CRUD operations
* Customer search
* Loan creation
* Loan filtering
* Installment tracking
* Payment recording
* Outstanding balance calculation
* Reminder management
* Dashboard statistics
* Financial reports
* Excel exports
* Customer financial history
* End-to-end loan workflow
* Responsive UI
* Production deployment

The production application was also verified with a live PostgreSQL database.

---

## 💻 Run Locally

### Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## ⚙️ Environment Variables

The application uses environment variables for configuration and sensitive information.

Example:

```text
DATABASE_URL=
SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=
```

Production secrets are not committed to the repository.

---

## 🌐 Deployment

The application is deployed using Render.

### Frontend

```text
React + Vite
        ↓
Render Static Site
```

### Backend

```text
FastAPI
   ↓
Render Web Service
   ↓
PostgreSQL
```

The production application uses a separate PostgreSQL database from the local development database.

---

## 🎯 Project Objective

The main objective of this project is to replace manual loan-business record keeping with a reliable digital system that makes everyday financial operations easier, faster, and more organized.

The system focuses on practical business requirements rather than being only a demonstration application.

---

## 📚 What I Learned

Through this project, I worked with:

* Full-stack application development
* REST API development
* React frontend development
* PostgreSQL database design
* SQLAlchemy ORM
* JWT authentication
* Password hashing
* API integration using Axios
* Financial calculations
* Excel report generation
* Responsive UI development
* Git and GitHub
* Production deployment
* Environment configuration
* Debugging production issues
* Database-backed business workflows

---

## 🔮 Future Improvements

Potential future enhancements include:

* Automated scheduled reminders
* SMS/WhatsApp notifications
* Advanced analytics
* Role-based access control
* Cloud file/document management
* Automated database backups
* PWA/mobile application support

---

## 👩‍💻 Developer

**Pavithra**

Full-Stack Developer | AI & Data Science Graduate

This project was developed as a real-world business management solution with a focus on practical workflow automation, database management, security, and production deployment.
