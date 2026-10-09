# CalTrack – Automated Lab Equipment Calibration Management and Compliance Scheduler

React + Vite + Bootstrap frontend, Node/Express API, MySQL 8 database.
Roles: Administrator, Laboratory Technician, Auditor, Student. 7-check CRVE engine, DCF fingerprint, manual review, quarantine, daily scheduler.

## Setup
1. Backend and database
   ```
   cd server
   cp .env.example .env     # edit DB_PASSWORD, JWT_SECRET, ADMIN_* values
   npm install
   npm run db:init          # creates the database and tables from db/schema.sql
   npm run seed:admin       # creates the first administrator from .env
   npm run dev              # API on http://localhost:5000
   ```
2. Frontend (new terminal)
   ```
   cd client
   npm install
   npm run dev              # http://localhost:5173 (proxies /api to :5000)
   ```
3. Tests: `cd server && npm test` (12 unit tests for DCF, CRVE and decision)

## Try it
Log in as the admin, sign up other users in a private window, approve them in Users, register equipment, then enter calibrations.
Three normal calibrations give CRI >= 70 (accepted). A sudden large change gives CRI 50-69 (manual review). An out-of-tolerance
record is capped at CRI 49 (quarantined). The person who entered a calibration can never review or release it.

## Not included yet
PDF/Excel report downloads, e-mail alerts (alerts appear in the app), Jest tests for API routes.
