# National Healthcare Platform - API Documentation (v1)

This document describes the API endpoints for the National Electronic Medical Record (EMR) system.

**Base URL:** `http://localhost:3000/api/v1/emr`

## 1. Authentication
Endpoints under `/auth` are used to manage users and obtain access tokens.

### Register User
*   **URL:** `/auth/register`
*   **Method:** `POST`
*   **Roles:** `SYSTEM_ADMIN`, `DOCTOR`, `CLINIC_ADMIN`, `RECEPTIONIST`, `PHARMACIST`
*   **Body:**
```json
{
  "username": "dr_smith",
  "password": "password123",
  "role": "DOCTOR",
  "name": "Dr. Smith",
  "clinicId": "CLINIC_A"
}
```

### Login
*   **URL:** `/auth/login`
*   **Method:** `POST`
*   **Response:** `{"access_token": "..."}`

---

## 2. EMR Endpoints
**Required Headers:**
*   `Authorization: Bearer <JWT>`

### Register Patient
*   **URL:** `/patients`
*   **Method:** `POST`
*   **Roles:** `SYSTEM_ADMIN`, `CLINIC_ADMIN`
*   **Body:** `NationalPatient` object.
*   **Audit:** Logs a `WRITE` action.

### Get Patient Core Data
*   **URL:** `/patients/:nationalId`
*   **Method:** `GET`
*   **Roles:** `SYSTEM_ADMIN`, `CLINIC_ADMIN`, `DOCTOR`
*   **Audit:** Logs a `READ` action.

### Append Encounter
*   **URL:** `/encounters`
*   **Method:** `POST`
*   **Roles:** `DOCTOR`
*   **Headers:** `Idempotency-Key: <uuid>` (Mandatory)
*   **Body:**
```json
{
  "patientId": "uuid",
  "diagnosis": "Acute Gastritis",
  "encounterType": "EMERGENCY", // OUTPATIENT | EMERGENCY | FOLLOWUP
  "notes": "Patient notes",
  "supersedesEncounterId": null // Optional: ID of encounter to correct
}
```
*   **Note:** Encounters are immutable. If `supersedesEncounterId` is provided, the old encounter's status will be set to `SUPERSEDED`.
*   **Audit:** Logs a `WRITE` action.

### Longitudinal History
*   **URL:** `/patients/:patientId/history`
*   **Method:** `GET`
*   **Roles:** `DOCTOR`, `SYSTEM_ADMIN`
*   **Audit:** Logs a `READ` action.
*   **Requirement:** Valid patient consent (Mocked as always true for prototype).

---

## 3. Clinic Management Endpoints
**Base URL:** `http://localhost:3000/api/v1/clinic`

### Register Clinic
*   **URL:** `/`
*   **Method:** `POST`
*   **Roles:** `SYSTEM_ADMIN`
*   **Body:** `{"name": "...", "address": "...", "phone": "..."}`

### Get Doctors
*   **URL:** `/doctors`
*   **Method:** `GET`
*   **Roles:** `RECEPTIONIST`, `CLINIC_ADMIN`, `DOCTOR`
*   **Description:** Returns all doctors registered at the current user's clinic.

### Create Appointment
*   **URL:** `/appointments`
*   **Method:** `POST`
*   **Roles:** `RECEPTIONIST`, `CLINIC_ADMIN`
*   **Body:** 
```json
{
  "patientId": "national-patient-uuid",
  "doctorId": "user-uuid",
  "appointmentDate": "2026-05-01T10:00:00Z",
  "reason": "..."
}
```

### Get Appointments
*   **URL:** `/appointments`
*   **Method:** `GET`
*   **Roles:** `RECEPTIONIST`, `CLINIC_ADMIN`, `DOCTOR`
*   **Query Params:** `doctorId` (optional for Admin/Receptionist, enforced for Doctor).

---

## 4. Error Handling
All errors follow this structure:
```json
{
  "error": "ErrorType",
  "message": "Detailed explanation"
}
```
Common Status Codes:
- `400 Bad Request`: Missing headers or invalid body.
- `401 Unauthorized`: Missing or invalid JWT.
- `403 Forbidden`: Insufficient roles or missing consent.
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Duplicate data (e.g., National ID).
- `500 Internal Server Error`: Unexpected system error.
