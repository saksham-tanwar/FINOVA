<<<<<<< HEAD
# FINOVA
=======
# AI-Powered Smart Banking & Financial Management System

## Overview

This project is a full-stack academic banking simulation with three services:

- `client/` - React + Vite frontend
- `server/` - Express + MongoDB backend
- `ai-service/` - FastAPI AI microservice for email analysis, chatbot, document extraction, and recommendations

It is built for demo and learning purposes. No real banking operations are performed.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Axios, React Router, Zustand, Recharts, React Hot Toast
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Nodemailer, Multer, Joi, Helmet, express-rate-limit
- AI Service: FastAPI, Transformers, Sentence Transformers, spaCy, PyTorch, PyMuPDF, pytesseract

## Project Structure

```text
banking-app/
|-- client/
|   |-- src/
|   |   |-- components/
|   |   |-- layouts/
|   |   |-- pages/
|   |   |   |-- admin/
|   |   |   `-- dashboard/
|   |   |-- stores/
|   |   `-- axiosInstance.js
|-- server/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- services/
|   |-- utils/
|   |-- uploads/
|   |-- seed.js
|   `-- server.js
|-- ai-service/
|   |-- routers/
|   |-- schemas/
|   |-- services/
|   |-- venv/
|   |-- main.py
|   `-- requirements.txt
`-- README.md
```

## Setup Instructions

### 1. Clone and enter the project

```bash
git clone <your-repo-url>
cd banking-app
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bankingapp
JWT_SECRET=replace_with_secret
JWT_REFRESH_SECRET=replace_with_refresh_secret
EMAIL_USER=replace_with_gmail
EMAIL_PASS=replace_with_app_password
ALPHA_VANTAGE_API_KEY=replace_with_key
AI_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
FIREBASE_PROJECT_ID=replace_with_project_id
FIREBASE_CLIENT_EMAIL=replace_with_client_email
FIREBASE_PRIVATE_KEY=replace_with_private_key
```

### 3. Set up the frontend

```bash
cd ../client
npm install
```

### 4. Set up the AI service

```bash
cd ../ai-service
python -m venv venv
```

Activate the virtual environment:

```bash
# Mac/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

Install Python packages:

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Create `ai-service/.env`:

```env
NODE_BACKEND_URL=http://localhost:5000
ALLOWED_ORIGINS=http://localhost:5000,http://localhost:5173
```

Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_AI_BASE_URL=http://localhost:8000/ai
VITE_FIREBASE_API_KEY=replace_with_api_key
VITE_FIREBASE_AUTH_DOMAIN=replace_with_auth_domain
VITE_FIREBASE_PROJECT_ID=replace_with_project_id
VITE_FIREBASE_APP_ID=replace_with_app_id
```

## How To Run All 3 Services

Open three terminals.

### Terminal 1 - Backend

```bash
cd server
npm run dev
```

### Terminal 2 - Frontend

```bash
cd client
npm run dev
```

### Terminal 3 - AI Service

Always activate the venv before running:

```bash
# Mac/Linux
cd ai-service
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Windows
cd ai-service
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

You can also use:

```bash
# Mac/Linux
./start.sh

# Windows
start.bat
```

## Demo Credentials

- Admin: `admin@bank.com` / `Admin@123`
- Customer: `customer1@bank.com` / `Test@1234`

## Seed Data

Run the seed script after MongoDB is running:

```bash
cd server
npm run seed
```

Or:

```bash
node seed.js
```

The seed script will:

- clear existing collections
- create 1 admin user
- create 3 verified customers
- create accounts, transactions, investments, insurance policies, claims, notifications, and AI logs

## Environment Variables

### Backend `server/.env`

- `PORT` - Express server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - access token secret
- `JWT_REFRESH_SECRET` - refresh token secret
- `EMAIL_USER` - Gmail address for SMTP notifications
- `EMAIL_PASS` - Gmail app password
- `ALPHA_VANTAGE_API_KEY` - stock API key for live stock prices and symbol search
- `AI_SERVICE_URL` - FastAPI service base URL
- `CLIENT_URL` - frontend origin allowed by CORS
- `FIREBASE_PROJECT_ID` - Firebase project ID for Admin SDK token verification
- `FIREBASE_CLIENT_EMAIL` - Firebase service account client email
- `FIREBASE_PRIVATE_KEY` - Firebase service account private key with `\n` preserved

### Frontend `client/.env`

- `VITE_API_BASE_URL` - Node backend API base URL for browser requests
- `VITE_AI_BASE_URL` - FastAPI AI service base URL for browser requests
- `VITE_FIREBASE_API_KEY` - Firebase web app API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_APP_ID` - Firebase web app ID

### AI Service `ai-service/.env`

- `NODE_BACKEND_URL` - Node backend base URL used by the AI service
- `ALLOWED_ORIGINS` - comma-separated browser origins allowed to call the AI service

## Health Checks

- Backend health: `GET http://localhost:5000/api/health`
- AI service health: `GET http://localhost:8000/health`

## Security Notes

The backend includes:

- `helmet()` for secure headers
- general API rate limiting at `100 requests / 15 minutes / IP`
- stricter auth rate limiting at `5 requests / 15 minutes / IP` for login and register
- Joi request validation middleware for key sensitive operations
- auth and admin route protection through middleware

Google authentication uses Firebase Web Auth on the client and Firebase Admin
token verification on the server. After successful Google sign-in, the backend
issues the same app JWT used by the rest of the platform so protected routes
continue to work with the existing middleware.

## Notes

- Frontend API calls use `VITE_API_BASE_URL` and default to `http://localhost:5000/api`
- AI calls use `VITE_AI_BASE_URL` and default to `http://localhost:8000/ai`
- This project is an academic simulation and should not be used for real financial operations without production-grade security, compliance, audit, and infrastructure work

## Deployment

Recommended hosting split:

- `client/` on Vercel
- `server/` on Render Web Service
- `ai-service/` on Render Web Service

Why this setup:

- Vercel documents first-class support for Vite deployments and supports deploying from the project root with the CLI or Git import.
- Render documents FastAPI deployment with `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Render web services get public `onrender.com` URLs and require binding to `0.0.0.0` on `PORT`.

Deployment order:

1. Deploy `server/` to Render
2. Deploy `ai-service/` to Render
3. Deploy `client/` to Vercel
4. Update Firebase Authentication authorized domains with your Vercel domain

### Render backend env

Set these on the `server` service:

- `PORT=10000`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `ALPHA_VANTAGE_API_KEY`
- `AI_SERVICE_URL=https://<your-ai-service>.onrender.com`
- `CLIENT_URL=https://<your-frontend>.vercel.app`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### Render AI service env

Set these on the `ai-service` service:

- `NODE_BACKEND_URL=https://<your-server>.onrender.com`
- `ALLOWED_ORIGINS=https://<your-frontend>.vercel.app`

### Vercel frontend env

Set these on the Vercel project:

- `VITE_API_BASE_URL=https://<your-server>.onrender.com/api`
- `VITE_AI_BASE_URL=https://<your-ai-service>.onrender.com/ai`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

### Firebase after deploy

In Firebase Console:

- add your Vercel production domain under Authentication -> Settings -> Authorized domains
- keep Google provider enabled
- rotate the current Firebase Admin private key before public launch because it was exposed during setup
>>>>>>> 37d5ae0d (initial finova deployment build)
