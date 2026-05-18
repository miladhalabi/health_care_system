# Slide 16: Database Design / تصميم قاعدة البيانات
## Relational ERD Structure & Integrity / العلاقات ونزاهة البيانات

```text
  ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
  │      User       │1           1│ PatientProfile  │1           *│   Appointment   │
  │─────────────────│────────────>│─────────────────│────────────>│─────────────────│
  │ - id (PK)       │             │ - id (PK)       │             │ - id (PK)       │
  │ - nationalId(U) │             │ - nationalId(FK)│             │ - patientId(FK) │
  │ - fullName      │             │ - bloodType     │             │ - clinicId (FK) │
  │ - role          │             │ - allergies     │             │ - queueNumber   │
  └─────────────────┘             └─────────────────┘             │ - status        │
          │ 1                             │ 1                             └─────────────────┘
          │                               │
          ▼ *                             ▼ *
  ┌─────────────────┐             ┌─────────────────┐
  │ MedicalEncounter│*           1│  Prescription   │1           *│PrescriptionItem │
  │─────────────────│────────────>│─────────────────│────────────>│─────────────────│
  │ - id (PK)       │             │ - id (PK)       │             │ - id (PK)       │
  │ - patientId(FK) │             │ - encounterId(FK│             │ - drugName      │
  │ - doctorId (FK) │             │ - patientId(FK) │             │ - quantity      │
  │ - clinicId (FK) │             │ - status        │             │ - status        │
  └─────────────────┘             └─────────────────┘             └─────────────────┘
```

*   **Referential Actions (النزاهة المرجعية):**
    *   **Prisma mappings** enforce strict cascading limits: a `Prescription` cannot exist without an underlying `MedicalEncounter` database record.
    *   `AuditLog` records capture changes (CREATE, UPDATE, DELETE) to protect patient clinical history.
