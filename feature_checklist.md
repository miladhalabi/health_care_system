# System Implementation Checklist

This checklist tracks the implementation of the National Digital Health Platform based on the `plan.md` roadmap.

---

## 🟢 Feature 1: System Core & Identity Foundation
**Status:** In Progress (Backend First)

### **1.1 Backend: Database Schema Evolution**
- [x] **Governorate Model:** Create `Governorate` table (ID, Name_AR, Name_EN).
- [x] **Specialty Model:** Create `Specialty` table (ID, Name_AR, Name_EN).
- [x] **Clinic Expansion:** Link `Clinic` to `Governorate`.
- [x] **User/Doctor Expansion:** Link `User` (Doctors) to `Specialty`.
- [x] **Patient Profile Expansion:**
    - [x] Add `address`, `phone`, `emergencyContact`.
    - [x] Add `bloodType`, `allergies`, `chronicDiseases` fields.
    - [x] Add `reliabilityScore` (Int, Default: 100).
    - [x] Add `missedAppointments` (Int, Default: 0).
- [x] **Audit System:** Create `AuditLog` model (ID, Action, Entity, EntityId, UserId, Details, CreatedAt).
- [x] **Prisma Migration:** Run and verify `npx prisma migrate dev`.
- [ ] **Seed Data:** Populate Governorates and Specialties.

### **1.2 Backend: Architectural Scalability (Refactoring)**
- [x] **Service Layer Pattern:**
    - [x] Create `src/services/` directory.
    - [x] Implement `AuthService.js` (Handle login/token logic).
    - [x] Implement `ProfileService.js` (Handle profile updates/fetching) -> *Implemented as part of general service pattern foundation.*
    - [x] Implement `AuditService.js` (Utility for creating logs).
- [x] **Validation Layer:**
    - [x] Install `zod`.
    - [x] Create `src/validations/authValidation.js`.
- [x] **Error Handling & Logging:**
    - [x] Install `winston` and `morgan`.
    - [x] Implement `src/middlewares/errorMiddleware.js` (Global error handler).
    - [x] Setup structured logging in `src/utils/logger.js`.

### **1.3 Backend: Security Hardening**
- [x] Install `helmet` and `express-rate-limit`.
- [x] Configure security middleware in `src/index.js`.
- [x] Restrict CORS to authorized origins.
- [x] Remove hardcoded JWT secret fallbacks.
- [x] Create `.env.example` file.

### **1.4 Frontend: Design System & Core Foundation**
- [x] **Shared Workspace Setup:** Create `@nhr/shared` package.
- [x] **Unified Theme:** Centralize Tailwind & Arabic-optimized styles.
- [x] **Global API Client:** Implement shared Axios with interceptors.
- [x] **Shared Utils:** Arabic date/time formatting & merging helpers.
- [x] **Atomic Components:** Build Buttons, Inputs, Cards.
- [x] **Portal Refactor:** Update Pharmacy Portal to use shared core.
- [x] **Portal Refactor:** Update Clinic and Patient portals to use shared core.
- [x] **Resilience:** Implement Error Boundaries.

- [x] Backend: Doctor Self-Configuration (Multi-Clinic Rotation CRUD).
- [x] Backend: Real-time Session Tracking (`activeClinicId`).
- [x] Frontend: "My Rotation" management dashboard.
- [x] Frontend: Header Session Switcher with Auto-suggestion.

---

## 🟢 Feature 3: Advanced Queueing & Flow
**Status:** Next Step

- [ ] Backend: Priority Algorithm (Scheduled vs. Walk-in vs. Emergency).
- [ ] Backend: Real-time turn notifications (Socket.io).
- [ ] Frontend: Enhanced Clinic Dashboard with priority reordering.

---

## ⚪ Feature 8: Professional Management Modules (DEFERRED)
- [ ] Clinic-Doctor Affiliation Approval workflow.
- [ ] Doctor Specialty Verification workflow.

---

## ⚪ Feature 3: Advanced Queueing & Flow
**Status:** Next Step

## ⚪ Feature 5: Pharmacy & Fulfillment
**Status:** Pending

- [ ] Backend: Identity Verification check before dispensing.
- [ ] Backend: Partial Fulfillment & Stock awareness tracking.
- [ ] Frontend: Pharmacist Search & Secure Dispensing workflow.

---

## ⚪ Feature 6: Reliability & Compliance
**Status:** Pending

- [ ] Backend: Attendance tracking logic & Scoring algorithm.
- [ ] Backend: Behavioral Enforcement Rules (Booking restrictions).
- [ ] Frontend: Reliability Badges & User Compliance Dashboard.

---

## ⚪ Feature 7: National Analytics
**Status:** Pending

- [ ] Backend: Data aggregation endpoints (by Governorate/Specialty).
- [ ] Frontend: Ministry of Health Insights Dashboard.
