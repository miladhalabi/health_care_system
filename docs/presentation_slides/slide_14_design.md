# Slide 14: System Design / تصميم النظام
## Layered Structure & Component Interaction / التفاعل بين المكونات

```text
  [Citizen Client]            [REST API Server]          [WebSocket Hub]          [PostgreSQL]
         │                            │                         │                       │
         │─── 1. Book Appointment ───>│                         │                       │
         │                            │─── 2. Write Record ────>│                       │
         │                            │                         │──────────────────────>│
         │                            │                         │   (Save Event)        │
         │                            │<── 3. Acknowledge ──────│                       │
         │<── 4. Booking Response ───│                         │                       │
         │                            │                         │                       │
         │                            │─── 5. Advance Queue ───>│                       │
         │                            │                         │─── 6. Broadcast ─────>│
         │<───────────────────────────┼─────────────────────────│   (Live Update)       │
```

*   **Separation of Concerns (فصل الاهتمامات):**
    *   **Controllers** process incoming HTTP requests and map them cleanly to HTTP responses.
    *   **Services** hold the domain intelligence (e.g. recalculating queue position or calculating compliance scores).
    *   **Prisma Client** isolates low-level SQL syntax, keeping business code clean and readable.
*   **State-driven Interfaces:**
    *   React portals utilize lightweight **Zustand stores** to coordinate local UI updates, automatically refreshing components when Socket events arrive.
