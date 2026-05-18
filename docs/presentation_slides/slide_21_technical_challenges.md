# Slide 21: Technical Challenges / التحديات التقنية
## Obstacles Faced & Architectural Fixes / التحديات وحلولها

*   **1. Sync Failures in Unstable Networks (انقطاع الاتصال):**
    *   *Challenge:* When mobile devices temporarily lose network connection, the WebSocket drops.
    *   *Solution:* Integrated automatic socket reconnection retry algorithms and Zustand local client fallback states.
*   **2. Database Integrity Under Concurrent Bookings (حجوزات متزامنة):**
    *   *Challenge:* Multiple users trying to claim the same queue slot simultaneously.
    *   *Solution:* Implemented transactional database locks and database constraints on unique `nationalId` and `queueNumber` combinations within clinic timetables.
*   **3. UI Direction Instability (شاشات RTL/LTR الهجينة):**
    *   *Challenge:* Displaying technical English acronyms inside RTL Arabic sentences often breaks visual alignment.
    *   *Solution:* Configured custom semantic Tailwind utilities to cleanly isolate LTR elements within RTL parent containers.
