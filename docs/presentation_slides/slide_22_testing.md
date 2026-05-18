# Slide 22: Testing / استراتيجية الاختبار
## Ensuring Safety & Operational Reliability / ضمان جودة النظام

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                            TESTING MATRIX SUMMARY                            │
├───────────────────┬───────────────────────────────────┬──────────────────────┤
│ Test Level        │ Focus Area                        │ Tools Used           │
├───────────────────┼───────────────────────────────────┼──────────────────────┤
│ Unit Testing      │ Core services, date functions,     │ Jest / Node          │
│                   │ reliability calculations          │ Test Utilities       │
├───────────────────┼───────────────────────────────────┼──────────────────────┤
│ Integration       │ Auth tokens, database queries,    │ Postman /            │
│                   │ WebSocket event distribution      │ Supertest            │
├───────────────────┼───────────────────────────────────┼──────────────────────┤
│ User Acceptance   │ Patient reservation flows,        │ Manual Simulation    │
│ (UAT)             │ prescription dispensing logs      │ on multiple screens  │
└───────────────────┴───────────────────────────────────┴──────────────────────┘
```

*   **Testing Strategy (منهجية الاختبار):**
    *   **Unit Phase:** Evaluated standalone calculation functions to ensure mathematical predictability.
    *   **Integration Phase:** Verified REST endpoint routing, validating database writes after each request.
    *   **User Acceptance Phase:** Conducted end-to-end simulations of the patient journey (booking ──> check-in ──> diagnosis ──> prescription dispensing).
