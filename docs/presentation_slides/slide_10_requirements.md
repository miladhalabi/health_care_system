# Slide 10: Requirements / المتطلبات
## Functional & Non-Functional Specifications / المتطلبات الوظيفية وغير الوظيفية

### **🛠 Functional Requirements / المتطلبات الوظيفية**
*   **Patient Authentication:** Secure login using national identity number verification.
*   **Queueing Orchestration:** Receptionists check in booked patients; doctors advance queues; patients see their queue position update in real time.
*   **Medical Encounters:** Doctors write symptoms, clinical diagnoses, and prescriptions in a clean form.
*   **Rx Validation:** Pharmacists fetch digital prescriptions via patient National ID and mark them as dispensed.
*   **Security Logs:** Track critical modifications in database tables.

### **🔒 Non-Functional Requirements / المتطلبات غير الوظيفية**
*   **Real-time Latency:** Socket updates must deliver within `< 150ms`.
*   **Security:** Passwords hashed with `bcrypt`, sessions validated using JSON Web Tokens (JWT), and role-based protection (RBAC) enforced on all API routes.
*   **Usability:** Complete Arabic RTL support, highly responsive CSS grids for phones, and built-in dark mode settings.
*   **Portability:** Progressive Web Application (PWA) cache routing for partial offline access.
