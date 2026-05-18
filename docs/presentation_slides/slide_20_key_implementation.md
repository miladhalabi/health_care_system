# Slide 20: Key Implementation Details / تفاصيل برمجية هامة
## Core Logic: Smart Scheduling & Attendance / المنطق البرمجي

*   **1. Reliability & Compliance System / نظام قياس الموثوقية:**
    *   To prevent fake bookings, the backend tracks missed appointments.
    *   If a patient defaults, their database `missedAppointments` count increases, automatically updating their `reliabilityScore` using a custom algorithm.
*   **2. Live Active Ticket Refresh / تحديث التذكرة المباشرة:**
    *   When a receptionist changes an appointment status or a doctor starts a new session, the system calculates the remaining wait time.
    *   Socket.io broadcasts this event to all active patients in the queue room.

```javascript
// Example: Core logic to recalculate queue positions dynamically
function calculateQueuePositions(activeAppointments) {
  return activeAppointments.map((appointment, index) => ({
    id: appointment.id,
    queueNumber: appointment.queueNumber,
    position: index + 1,
    estimatedWaitTime: (index + 1) * 15 // 15 mins per patient
  }));
}
```
