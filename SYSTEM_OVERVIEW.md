# 📘 Stratis IT Management Suite - System Overview

## 🏗️ Technical Architecture

This system is a **Single Page Application (SPA)** built with a modern frontend and a robust PHP backend, designed for performance and ease of deployment on shared hosting (like Hostinger).

### 1. Technology Stack

#### **Frontend (Client-Side)**
-   **Core Framework:** React 18
-   **Language:** TypeScript (TSX) - For type safety and better developer experience.
-   **Build Tool:** Vite 6.0 - Extremely fast build and dev server.
-   **Routing:** Custom routing / SPA logic (Client-side handled in `App.tsx`).
-   **Styling:** Tailwind CSS (via utility classes in `index.css`).
-   **HTTP Client:** Native `fetch` API with custom wrappers (`services/api.ts`).
-   **Icons:** Lucide React (Modern, crisp SVG icons).
-   **UI Components:** Custom built (Modals, Tables, Forms) without heavy external UI libraries.
-   **PDF Generation:** `jspdf` & `jspdf-autotable` - For generating invoices and reports client-side.
-   **Notifications:** `react-hot-toast` - For toast notifications.

#### **Backend (Server-Side)**
-   **Language:** PHP 8.x - Lightweight, functional API.
-   **Architecture:** RESTful API.
-   **Database:** MySQL / MariaDB.
-   **Authentication:** Session-based (PHP `$_SESSION`) with secure cookie handling.
-   **Email:** PHPMailer - For sending SMTP emails (notifications, resets).
-   **Security:**
    -   PDO (PHP Data Objects) for SQL injection prevention.
    -   CSRF protection (via session tokens).
    -   Input validation and sanitization.
    -   Secure password hashing (`password_hash` / `bcrypt`).

#### **Infrastructure & Deployment**
-   **Hosting:** Hostinger (Shared Hosting).
-   **Web Server:** Apache (configured via `.htaccess`).
-   **Version Control:** Git (GitHub).
-   **CI/CD:** Hostinger Git Integration (Auto-pull from `main` branch) + Cron Job for backup deployment.

---

## 📂 Project Structure

### **Root Directory**
| File / Folder | Description |
| :--- | :--- |
| `App.tsx` | Main application component, handles routing and global state (Auth). |
| `index.html` | Entry point for the React app. |
| `vite.config.ts` | Configuration for the build tool (proxies, plugins). |
| `tsconfig.json` | TypeScript configuration. |
| `package.json` | Dependencies and scripts (`npm run dev`, `npm run build`). |
| `.htaccess` | Apache configuration for routing all requests to `index.html` (SPA support). |

### **backend** (`php_backend/api/`)
This folder contains the raw PHP API endpoints.

| File | Purpose |
| :--- | :--- |
| `config.php` | Database connection, CORS headers, Session start. **Core file.** |
| `auth.php` | Login, Logout, Check Session. |
| `projects.php` | CRUD operations for Projects. |
| `clients.php` | Manage Clients. |
| `dashboard.php` | Aggregated data for the dashboard (stats, charts). |
| `users.php` | User management (Admin only). |
| `upload.php` | Handles file uploads (images, documents). |
| `send_invoice.php` | Sends PDF invoices via email. |

### **frontend** (`components/` & `services/`)
| Folder | Description |
| :--- | :--- |
| `components/` | Reusable React components (e.g., `Navbar`, `ProjectModal`, `ClientManager`). |
| `services/` | API interaction logic (`api.ts` handles all fetch calls). |
| `dist/` | **Production Build.** This is what gets deployed to the server. Contains optimized JS/CSS. |

---

## 🚀 Key Features

1.  **Project Management:**
    -   Create, Edit, Delete Projects.
    -   Track status (Pending, In Progress, Completed).
    -   Assign Developers and calculate costs.
    -   Manage Milestones/Payments.

2.  **Financial Tracking:**
    -   Revenue vs. Cost calculation.
    -   Profit margin analysis.
    -   Payment tracking (Advance, Final, Additional Costs).

3.  **Role-Based Access Control (RBAC):**
    -   **Superadmin:** Full access, can view passwords, manage admins.
    -   **Admin:** Can manage projects/clients.
    -   **User:** Read-only or limited access (configurable).

4.  **Client Management:**
    -   Database of clients.
    -   Contact details and project history.

5.  **Automated Invoicing:**
    -   Generate professional PDF invoices.
    -   Email invoices directly to clients.

---

## 🔄 Deployment Workflow

The system is designed for **Zero-Downtime Deployment**:

1.  **Local Development:** You work on `localhost`.
2.  **Build:** Run `npm run build` to create optimized files in `dist/`.
3.  **Push:** `git push` to GitHub.
4.  **Deploy:**
    -   **Auto:** Hostinger pulls changes automatically via Git integration.
    -   **Cron:** A fallback script (`deploy.php`) creates a "self-updating" mechanism every 5 mins.

This architecture ensures a **modern, fast, and scalable** application running on cost-effective infrastructure.
