# Slide 11: Constraints / المحددات البرمجية والتقنية
## Technical and Operational Limitations / المعوقات التقنية والتنظيمية

*   **1. Technical Constraints (المحددات التقنية):**
    *   **Internet Connectivity:** WebSockets require stable client-server channels. The architecture must degrade gracefully during network fluctuations.
    *   **Storage Limitations:** Storing JSON-structured medical records efficiently without slowing down transactional database lookups.
    *   **Cross-Browser Support:** Ensured by avoiding browser-specific APIs and building clean standard JavaScript/Tailwind configurations.
*   **2. Resource & Time Limitations (محددات الوقت والموارد):**
    *   Tested under simulated local network environments using synthetic database seeds.
    *   Developed fully using lightweight open-source database engines and languages without relying on costly enterprise licensing.
*   **3. Policy & Legal Constraints (محددات قانونية وتدقيقية):**
    *   In the absence of a localized health privacy law (like HIPAA), custom system audit trails were implemented to log unauthorized record views.
