# National Digital Health Platform (NHR Syria)

A unified, high-end healthcare platform designed to connect citizens, clinics, and pharmacies through a centralized National Health Record system. Built with a focus on real-time coordination, modern aesthetics, and professional reliability.

## 🌟 Portals

The system consists of three specialized portals connected to a central backend:

*   **🏥 Clinic Portal**: For doctors and receptionists. Manages real-time patient queues (Socket.io), medical histories, clinical encounters, and electronic prescriptions.
*   **👤 Patient Portal**: For citizens. Allows viewing medical history, tracking prescriptions, booking appointments, and remote queueing.
*   **💊 Pharmacy Portal**: For pharmacists. Enables searching for active prescriptions by National ID and managing the dispensing of medications.

## 🤖 Telegram Bot Integration

A zero-dependency, long-polling Telegram Bot service integrated directly into the backend for citizen patient workflows.

### Core Features:
*   **🔒 Secure Account Linking (`/login`):** Connects a citizen's Telegram account to their National ID. Automatically deletes credentials messages in the chat history for security.
*   **📅 Interactive Booking (`/menu`):** Multi-step inline selection flow (Governorate $\rightarrow$ Specialty $\rightarrow$ Clinic $\rightarrow$ Doctor $\rightarrow$ 7-day available slot search).
*   **🚶 Queue Management & Remote Check-In:**
    *   Remote check-in for scheduled bookings to start waiting.
    *   Direct walk-in queue joining.
    *   Live queue number updates.
*   **🔔 Real-Time Queue Alert notifications:**
    *   *Called Patient:* Notifies the called patient to enter the consultation room immediately.
    *   *Approaching Turns:* Automatically alerts the *next-in-line* and *second-in-line* waiting patients on Telegram to prepare them.
*   **📋 Bookings & Prescriptions:** View active appointments, cancel pending bookings, and view active electronic prescriptions.

### Bot Commands:
*   `/start` - Initialize greeting and prompt for account link.
*   `/login <national_id> <password>` - Link NHR account to Telegram (deletes message instantly).
*   `/menu` - Launch the primary inline service menu.
*   `/logout` - Unlink account from Telegram.

---

## 🛠 Tech Stack

### Backend
*   **Node.js & Express**: High-performance API layer.
*   **Prisma ORM (v6)**: Type-safe database management.
*   **PostgreSQL**: Relational data storage.
*   **Socket.io**: Real-time bidirectional communication for queue management.

### Frontend
*   **React (Vite)**: Modern frontend framework.
*   **Tailwind CSS (v4)**: Advanced utility-first styling with a custom Semantic Token architecture.
*   **DaisyUI**: Professional component library.
*   **Zustand**: Lightweight state management.

## 🎨 Theme System

The platform features a custom **Semantic Token architecture** based on the "National Trust" professional palette:

*   **Dark Mode First**: The system defaults to a sophisticated dark aesthetic on the first visit.
*   **Full Responsiveness**: All portals are designed to work seamlessly across desktop and mobile.
*   **Authoritative Aesthetic**: RTL-focused design with clean typography (Cairo font) and minimal "bubbly" elements.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (running locally or remotely)

### 1. Installation
Clone the repository and install dependencies from the root directory:

```bash
npm install
```

### 2. Database Setup
Go to the backend directory and configure your environment:

```bash
cd backend-nhr
cp .env.example .env
```

Edit the `.env` file with your database credentials. Then, run the migrations and seed the database:

```bash
npx prisma migrate dev
npx prisma db seed
```

### 3. Running the Project
The project uses npm workspaces. You can run individual components from the root:

**Run the Backend (Server):**
```bash
npm run dev:backend
```

**Run the Portals:**
```bash
# Run Clinic Portal (port 3000)
npm run dev:clinic

# Run Patient Portal (port 3001)
npm run dev:patient

# Run Pharmacy Portal (port 3002)
npm run dev:pharmacy
```

---

## 📂 Project Structure

```
.
├── apps/
│   ├── clinic-portal/    # Doctor & Receptionist UI
│   ├── patient-portal/   # Citizen UI
│   └── pharmacy-portal/  # Pharmacy UI
├── backend-nhr/          # Express API & Prisma Schema
├── packages/
│   └── shared/           # Shared theme, hooks, and components
├── dev_log.md            # Feature tracking and roadmap
└── package.json          # Root workspace configuration
```

## 📜 Development Guidelines
- **Semantic UI**: Always use semantic tokens (e.g., `text-content`, `bg-surface`) instead of hardcoded colors.
- **RTL Support**: The UI is Arabic-first; ensure layouts are balanced for right-to-left reading.
- **Components**: Prefer using the standardized NHR components (e.g., `.card-nhr`, `.btn-nhr-primary`) defined in `packages/shared/src/theme/foundation.css`.

---
*Created for the National Health System Development Initiative.*
