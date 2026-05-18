# Slide 15: Data Flow / تدفق البيانات في النظام
## Core Patient & Prescription Lifecycles / دورة حياة المرض والوصفة

```text
  [ 🆕 PATIENT BOOKING ]
         │
         ▼
  [ 📅 APPOINTMENT SCHEDULED ] ───> [ 👤 CHECK-IN / WAITING ]  (Patient joins active queue)
                                            │
                                            ▼
  [ 🩺 IN-SESSION ENCOUNTER ]   <─── (Doctor reviews patient history & diagnoses symptoms)
         │
         ├───> [ 💊 NEW PRESCRIPTION ] ───> [ ⏳ PENDING ]
         │                                      │
         ▼                                      ▼
  [ ✅ APPOINTMENT COMPLETED ]         [ 🏥 DISPENSING / PHARMACY ]
                                                │
                                                ├───> [ 🌓 PARTIAL fulfillment ]
                                                │
                                                └───> [ 💚 COMPLETED dispensing ]
```

*   **Queue States:**
    `BOOKED` (Booked online) ──> `WAITING` (Checked in at reception) ──> `IN_SESSION` (With doctor) ──> `DONE` (Encounter complete)
*   **Prescription Lifecycle:**
    Saved as `PENDING` ──> Dispensary fulfills items ──> Updates status to `PARTIAL` or `COMPLETED`.
