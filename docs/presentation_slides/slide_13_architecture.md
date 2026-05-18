# Slide 13: System Architecture / معمارية النظام
## Monorepo & Layered Deep-Dive / تعمق في المعمارية التقنية

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                        NHR SYRIA MONOREPO (npm workspaces)                   │
├──────────────────────────────────────────────────────────────────────────────┤
│  apps/                                                                       │
│  ├── patient-portal: React Client (PWA)                                      │
│  ├── clinic-portal:  React Client (Doctor/Receptionist)                      │
│  └── pharmacy-portal: React Client (Pharmacist)                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  packages/                                                                   │
│  └── shared: Shared UI Components, Validation Schema, & Core Models          │
├──────────────────────────────────────────────────────────────────────────────┤
│  backend-nhr/                                                                │
│  ├── src/routes:     REST API Endpoints (Auth, Queue, Prescriptions)         │
│  ├── src/services:   Business Rules & Calculations                           │
│  └── prisma/schema:  PostgreSQL Database Layer (Prisma Client)               │
└──────────────────────────────────────────────────────────────────────────────┘
```

*   **Layered Micro-structure (الهندسة الطبقية):**
    *   **Presentation Layer:** React + Tailwind CSS v4 running on Vite for high-speed responsiveness.
    *   **Real-Time Gateway:** Socket.io managing persistent TCP channels for immediate system alerts.
    *   **Service Layer:** Dedicated JavaScript services processing booking logic, queue priorities, and patient compliance calculations.
    *   **Data Access Layer:** PostgreSQL with Prisma Client ORM managing automated transactions and foreign key safety.
