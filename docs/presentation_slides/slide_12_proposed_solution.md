# Slide 12: Proposed Solution / الحل المقترح
## The Centralized Health Ecosystem / المنظومة الصحية المتكاملة

```text
                     ┌───────────────────────────┐
                     │     NHR Central Server    │
                     │  (NodeJS, Express, Prisma)│
                     └──────┬──────┬──────┬──────┘
                            │      │      │
       ┌────────────────────┘      │      └────────────────────┐
       ▼                           ▼                           ▼
┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│  CITIZEN     │ <────────> │  CLINIC      │ <────────> │  PHARMACY    │
│  PORTAL      │  Socket    │  PORTAL      │  Socket    │  PORTAL      │
│ (Patient PWA)│            │(Doctor/Rec)  │            │ (Pharmacist) │
└──────────────┘            └──────────────┘            └──────────────┘
```

*   **One Database, Many Portals (قاعدة بيانات موحدة، بوابات متعددة):**
    A unified PostgreSQL schema serves as the single source of truth. Data flows through a layered backend to specialized clients.
*   **Smart Waiting Coordination (إدارة ذكية للطوابير):**
    Instead of physical tickets, patients use their mobile browser to book slots, track positions live, and arrive at the clinic precisely when their turn is active.
*   **Closed-Loop Pharmacy Pipeline (دورة وصفات مغلقة):**
    Prescriptions are securely saved in the database during the clinic encounter. Pharmacists retrieve and fulfill the prescription electronically, ending illegible handwriting and preventing unauthorized medicine duplication.
