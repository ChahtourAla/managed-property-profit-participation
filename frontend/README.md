# Menzel frontend

Next.js frontend for the Menzel platform for participation in tokenized real-estate projects.

The interface is role-based and consumes the backend API located in the `backend` directory.

## Requirements

- Node.js 18+
- Backend running on `http://localhost:3001`

## Installation

From the `frontend` directory:

```bash
npm install
```

Create `.env.local` from `.env.local.example`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development

```bash
npm run dev
```

The application is available at [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint checks
npm run build      # Production build
npm start          # Start the production build
```

## Authentication

Public pages:

- `/login`
- `/register`

The `/dashboard/*` routes require an authenticated session. Navigation items and features are filtered according to the current role.

Available roles:

- `OWNER`: properties and contracts
- `EASYCOIN`: validation, instruments, subscriptions, and settlement
- `INVESTOR`: available instruments, subscriptions, holdings, and rewards
- `AUDITOR`: reports, settlement, and audit
- `PAYMENT_VERIFIER`: funding confirmations
- `LEGAL_ADMIN`: legal validation and controls
- `ADMIN`: user administration and platform supervision

For local demo accounts, the password used by the interface is `Password123!`. In a real environment, use the accounts and credentials provided by the backend.

## Main routes

- `/dashboard` — role-based overview
- `/dashboard/my-properties` — Owner property profiles
- `/dashboard/properties` — property directory
- `/dashboard/properties/:propertyId` — property details
- `/dashboard/investments` — instruments, investors, and subscriptions
- `/dashboard/holdings` — holdings and Easycoin redemption
- `/dashboard/reports` — reports, reconciliation, and rewards
- `/dashboard/transactions` — settlements, rewards, and closed contracts
- `/dashboard/users` — Admin user management
- `/dashboard/profile` — user profile
- `/dashboard/settings` — settings

## Backend integration

HTTP requests are centralized in `lib/backend-api.ts`. The API prefix is added automatically:

```text
${NEXT_PUBLIC_BACKEND_URL}/api
```

Property data is used to display property names in instrument, report, settlement, and subscription cards and dropdowns.

The frontend does not replace backend authorization checks. Roles and permissions must remain configured and validated by the API.

## Main structure

```text
app/                 Next.js pages and layouts
components/          Reusable UI components
lib/backend-api.ts   HTTP client and backend types
lib/navigation.ts    Role-filtered navigation
lib/session.tsx      User session management
lib/role-config.ts   Roles and demo users
public/               Static assets, including the Menzel logo
```

## Pre-release checks

```bash
npm run typecheck
npm run lint
npm run build
```
