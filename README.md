# 🛡️ SecureShield: Insurance Management Platform

A professional, enterprise-grade full-stack Insurance Management Platform built to streamline digital insurance operations. The application digitizes complex workflows by allowing **Administrators**, **Insurance Agents**, and **Customers** to securely manage policies, claim requests, premium payment tracking, compliance documentation, and analytics reports.

---

## 🚀 Project Overview

The platform solves core operational challenges in the insurance lifecycle:
- **Agents** can digitize customer records and assign active policies.
- **Customers** can track policy coverage, pay upcoming premiums online, and upload proof documents.
- **Administrators** can review business performance, oversee users, and manage claims.

It features a responsive, modern UI design built on glassmorphism principles, strict type safety via TypeScript, robust validations, role-based route protections, and transaction-safe private file storage.

---

## 🎨 Application Screenshots

### 🔑 Authentication & Portal Entry
| Login Screen |
|:---:|
| ![Login Screen](client/public/Screenshot%202026-08-03%20182610.png) |

---

### 📊 Dashboards
| 🛠️ Administrator Control Panel | 💼 Insurance Agent Workspace | 👤 Customer Client Portal |
|:---:|:---:|:---:|
| ![Admin Dashboard](client/public/Screenshot%202026-08-03%20182622.png) | ![Agent Dashboard](client/public/Screenshot%202026-08-03%20182842.png) | ![Customer Dashboard](client/public/Screenshot%202026-08-03%20182714.png) |

---

### 📋 Operations & Forms
| 👥 User Management | 📝 Customer Registration | ➕ Create Policy Form |
|:---:|:---:|:---:|
| ![User List](client/public/Screenshot%202026-08-03%20182630.png) | ![Customer Profiles](client/public/Screenshot%202026-08-03%20182637.png) | ![Add Policy](client/public/Screenshot%202026-08-03%20182642.png) |

| 📄 Active Policies Registry | 📁 Documents Storage Center | 📤 Upload File Dialog |
|:---:|:---:|:---:|
| ![Policies List](client/public/Screenshot%202026-08-03%20182714.png) | ![Documents Center](client/public/Screenshot%202026-08-03%20182816.png) | ![Upload Modal](client/public/Screenshot%202026-08-03%20182834.png) |

---

### 💳 Payments & Claims
| 💸 Record Premium Payment | 📜 Claim Filing Portal | 🔍 Claim Review & Evaluation |
|:---:|:---:|:---:|
| ![Record Payment](client/public/Screenshot%202026-08-03%20182810.png) | ![Claim Form](client/public/Screenshot%202026-08-03%20182722.png) | ![Claim Details](client/public/Screenshot%202026-08-03%20182732.png) |

---

### 📈 Reports & Business Performance
| 📉 Annual Breakdown & Metrics |
|:---:|
| ![Reports Page](client/public/Screenshot%202026-08-03%20182848.png) |

---

## 🛠️ Tech Stack

### Frontend Client
- **Framework**: React 19 (TypeScript)
- **Tooling**: Vite (Fast Bundler & HMR)
- **Styling**: Tailwind CSS v4 (Modern responsive grid & utilities)
- **State Management**: Zustand (Lightweight store)
- **Form Handling**: React Hook Form (Uncontrolled form validation)
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios (with credentials and central error interception)
- **Notifications**: Sonner (Toast notifications)
- **Charts**: Chart.js + React Chartjs 2

### Backend Server
- **Runtime**: Node.js & Express
- **Language**: TypeScript
- **Database ORM**: Prisma ORM
- **Database Engine**: PostgreSQL
- **Security**: JSON Web Tokens (JWT), bcrypt (password hashing), Helmet (HTTP security headers)
- **Loggers & Parsers**: Morgan, Cookie-Parser
- **File Uploads**: Multer (configured with private disk path & mime filter)
- **Validation**: Zod (Schema parsing)
- **Reports Generation**: PDFKit (PDF receipt exports)

---

## 📐 System Architecture

The project is architected as a decoupled Client-Server model communicating via a RESTful API:

```mermaid
graph TD
    subgraph Client Application
        V[Vite React SPA] --> Z[Zustand Store]
        V --> R[React Router v7]
        V --> A[Axios HTTP Client]
    end

    subgraph API Gateways & Middleware
        A -- HTTP Requests with Cookie --> C[CORS / Cookies Handler]
        C --> H[Helmet HTTP Security]
        H --> JWT[JWT Auth Middleware]
        JWT --> RL[Role Authorization check]
    end

    subgraph Backend Server Controllers
        RL --> AC[Auth / User Controller]
        RL --> PC[Policy Controller]
        RL --> CC[Claims Controller]
        RL --> DC[Documents Controller]
        RL --> MC[Payments & Reports Controller]
    end

    subgraph Database & File Storage
        AC & PC & CC & DC & MC --> PO[Prisma ORM Client]
        PO --> DB[(PostgreSQL Database)]
        DC --> FS[(Private Disk Uploads folder)]
    end
```

---

## 🔑 Authentication Flow

Access to resources is protected using JWTs stored in secure, HttpOnly cookies:

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Server API
    participant DB

    User->>Frontend: Enter credentials
    Frontend->>Server API: POST /api/auth/login (Payload)
    Server API->>DB: Fetch user by email
    DB-->>Server API: User record + hashed pass
    Server API->>Server API: Verify password using bcrypt
    alt Credentials Valid
        Server API->>Server API: Generate JWT token containing ID & Role
        Server API-->>Frontend: HTTP 200 + Set-Cookie (token, HttpOnly, Secure)
        Frontend->>Frontend: Redirect to Dashboard based on Role
    else Credentials Invalid
        Server API-->>Frontend: HTTP 401 Unauthorized (ApiError)
        Frontend->>Frontend: Render Error Toast
    end
```

---

## 🗄️ Database Design Summary

Our PostgreSQL database schema includes 7 tables structured around standard relational constraints:

```mermaid
erDiagram
    USER ||--o| CUSTOMER : "userId relation"
    USER ||--o{ POLICY : "agentId assigns"
    USER ||--o{ CLAIM : "reviewedById evaluates"
    USER ||--o{ NOTIFICATION : "receives"
    CUSTOMER ||--o{ POLICY : "owns"
    CUSTOMER ||--o{ DOCUMENT : "belongs to"
    POLICY ||--o{ PREMIUM_PAYMENT : "generates"
    POLICY ||--o{ CLAIM : "files"
    POLICY ||--o{ DOCUMENT : "associated with"
    CLAIM ||--o{ DOCUMENT : "supporting file"
```

### Table Relationships
- **User**: Holds authentication credentials, roles (`ADMIN`, `AGENT`, `CUSTOMER`), and active account states.
- **Customer**: Links to a `User` (1-to-1 Cascade). Stores demographics, address, and DOB.
- **Policy**: Owned by a `Customer` and managed by an `Agent` (User). Stores coverage, premiums, and active dates.
- **PremiumPayment**: Relates to a `Policy` (1-to-Many). Unique constraint on `[policyId, dueDate]` to prevent duplicate billing cycles.
- **Claim**: Linked to a `Policy`. Reviewed by a User (agent or admin) with dates and feedback remarks.
- **Document**: Poly-associated container storing physical files with links to `Customer`, `Policy`, or `Claim`.
- **Notification**: Log of system-level action alerts pushed to users.

---

## 📂 Folder Structure

```
insurance-management-platform/
├── client/
│   ├── public/              # Static files & Screenshots
│   ├── src/
│   │   ├── api/             # API request definitions (axios instances)
│   │   ├── components/      # Reusable form fields, layout, and table modules
│   │   ├── context/         # React application contexts
│   │   ├── hooks/           # Custom React hooks (e.g. auth hooks)
│   │   ├── layouts/         # Shared dashboard wrappers
│   │   ├── pages/           # Module specific pages (Auth, Claims, Policies, Reports)
│   │   ├── routes/          # Frontend routing configuration
│   │   ├── store/           # Zustand stores for centralized state
│   │   ├── types/           # Type declarations (auth, business entities)
│   │   └── utils/           # Formatters & Helpers
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/
│   ├── prisma/
│   │   ├── schema.prisma    # PostgreSQL Schema model definition
│   │   └── seed.ts          # Database seed script for dummy parameters
│   ├── src/
│   │   ├── app.ts           # Express application declaration & middlewares
│   │   ├── server.ts        # Server entry point listener
│   │   ├── middleware/      # Global error and JWT Auth handlers
│   │   ├── modules/         # Domain-driven backend folders (claims, users, etc.)
│   │   │   └── [module]/
│   │   │       ├── controllers/
│   │   │       ├── routes/
│   │   │       ├── services/
│   │   │       ├── types.ts
│   │   │       └── validators.ts
│   │   └── utils/           # Shared ApiResponses & Error constructs
│   ├── package.json
│   └── tsconfig.json
├── README.md
└── .gitignore
```

---

## ⚙️ Environment Variables

### Backend Configuration (`server/.env`)
Create a `.env` file inside the `server/` directory and configure the variables:
```bash
# PostgreSQL Connection URL
DATABASE_URL="postgresql://username:password@localhost:5432/insurance_db?schema=public"

# Network Port
PORT=5040

# Security Key for Hashing Cookies and Signatures
JWT_SECRET="generate_a_cryptographically_secure_string_here"
JWT_EXPIRES_IN="7d"

# Mode configuration
NODE_ENV="DEVELOPMENT" # Set to 'PRODUCTION' in production environments
```

### Client Configuration (`client/.env`)
Create a `.env` file inside the `client/` directory:
```bash
VITE_API_URL="http://localhost:5040/api"
```

---

## 🛠️ Installation & Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org) server running locally or hosted

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/insurance-management-platform.git
cd insurance-management-platform
```

### Step 2: Database Setup
1. Create a blank database in PostgreSQL named `insurance_db`.
2. Configure `server/.env` with your credentials.
3. Migrate the schema and generate the Prisma Client:
```bash
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
```
4. Populate the database with default parameters and sample profiles (Admins, Agents, and Policyholders):
```bash
npm run prisma:seed
```

### Step 3: Run the Backend Server
```bash
npm run dev
# The backend is now listening at http://localhost:5040
```

### Step 4: Run the Client Application
Open a new terminal window:
```bash
cd client
npm install
npm run dev
# The client dashboard is now active at http://localhost:5173
```

---

## 📋 Project Modules

### 1. Authentication Portal
Provides credentials authentication for system users, generating signed JWT payloads. Roles dictate frontend dashboard redirection and route authorization.

### 2. User & Customer Management
Provides administrators the ability to manage system employees and toggle activity states. Agents can register profiles, configure address information, and update policyholder records.

### 3. Policy Registry
Permits the generation of coverages, calculation of premium payouts, status controls (`ACTIVE`, `EXPIRED`, `CANCELLED`), and automated agent task tracking.

### 4. Premium Tracking
Calculates future premium dues, schedules billing cycles, tracks payments, handles transactions, and flags overdue premium records.

### 5. Claims Evaluation
Provides customers with claims filing portals, enables uploads of supporting files, and gives agents authorization to review, reject, or approve claims.

### 6. File Documents Center
Private file locker allowing categorized uploads (`ID_PROOF`, `POLICY`, `CLAIM`). Multer intercepts requests, enforces constraints (max size 5 MB, restricted extensions list), and Controller triggers filesystem cleanups on failures.

### 7. Analytical Reports
Generates business growth parameters, monthly collections, approval rates, payouts, and client signups compiled into annual summaries with interactive charts.

---

## 🌐 Deployment Guide

### Database Provisioning
Ensure a production PostgreSQL instance is provisioned (e.g. via Supabase, AWS RDS, Neon, or Railway) and execute migrations to initialize database tables:
```bash
npx prisma migrate deploy
```

### Server Deployment (Express)
1. Transpile TypeScript source code:
```bash
npm run build
```
2. Spin up the Node cluster:
```bash
npm run start
```
3. Host on platforms like Render, Railway, or Heroku. Configure environment variables in the host dashboard.

### Client Deployment (Vite)
1. Build the minified production client:
```bash
npm run build
```
2. Serve the static assets inside `client/dist` from platforms like Vercel, Netlify, or AWS S3 + CloudFront. Ensure routing fallback configs (`index.html`) are active to handle client-side URLs.

---

## 🚀 Future Improvements
- **Automated Renewals**: Set up server cron triggers to automatically notify or charge card payments on policy expiry.
- **Bulk Operations**: Enable bulk customer list imports via CSV.
- **Enhanced Notifications**: Integrate Twilio or SendGrid APIs to deliver SMS/Email policy renewals and payment updates.
- **Unit Tests**: Implement testing suites using Jest/Vitest for key backend APIs.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👤 Author Information

- **Developer**: Sahil Kayasth
- **GitHub**: [@SahilKayasth-16](https://github.com/SahilKayasth-16)
- **LinkedIn**: [Sahil Kayasth](https://www.linkedin.com/in/sahil-kayasth/)
- **Email**: sahil.kayasth@example.com