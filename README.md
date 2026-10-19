# FlexTenure

> **Demo and testing only.** This project is made only for demonstration and testing purposes. It does not process real payments or transfer money.

FlexTenure is a React and Express application for merchant onboarding, customer accounts, and purchase plan records. It is an early-stage product prototype: it does not collect payments, create card mandates, verify credit, or settle funds.

## Repository layout

```text
backend/
  middleware/   JWT authentication and role checks
  models/       User, Merchant, Transaction, Pilot (Mongoose)
  routes/       Authentication, merchant/customer dashboards, plans, enquiries
  server.js     Express API and production frontend hosting
frontend/
  public/       HTML shell
  src/
    components/ Shared UI
    context/    Authentication state
    pages/      Public pages and customer/merchant workspaces
    App.js      Client-side routes
package.json    Root development scripts
```

This is one Express API application with route modules, plus one React frontend. The route modules are not separate microservices.

## Requirements

- Node.js 18 or newer
- MongoDB (local instance or MongoDB Atlas)

## Run locally

1. Install packages from the repository root: `npm install`, then `npm run install:all`.
2. Copy `backend/.env.example` to `backend/.env` and set a private, randomly generated `JWT_SECRET` and a valid `MONGO_URI`.
3. Run `npm run dev` from the repository root. The React app is served at `http://localhost:3000`; the API is at `http://localhost:5000`.

The API can start when MongoDB is unavailable so its health endpoint remains reachable, but database-backed registration, login, and dashboards will not work until MongoDB connects. Check `GET /api/health`; it returns HTTP 200 when connected and HTTP 503 when the database is unavailable.

## Current functionality

- Customer and merchant registration and login with JWT authentication.
- Merchant business profile management and plan record creation for an existing customer account.
- Merchant and customer dashboards showing stored plan information.
- Public merchant enquiry form.
- Role-protected API routes and dashboard pages.

Plan records support an explicitly simulated payment flow. Customers can record demo success or failure attempts; successful simulations update balances, while failed simulations do not. These records are for demonstration only and are not proof of a charge, repayment, approval, or settlement. The application never collects payment credentials or transfers money.

## Production build

Build the frontend with `npm run build`. Set the production environment variables for the backend, including `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL`, then start the backend with `npm start` from the repository root. When `frontend/build` exists, Express serves the React app and its client-side routes from the same origin as `/api`.

Deploy the repository as one backend service with the frontend build included, or deploy the frontend separately and set its API proxy/base URL accordingly. Configure HTTPS, production database access controls, backups, and secret management in the hosting provider before onboarding real users.

## Demo payment system

Eligible customer plans have a **Pay Now · Demo** action. The confirmation screen lets the customer simulate success or failure. Successful demo payments reduce the stored plan balance and advance its schedule; failures are recorded without changing the balance. Request keys and conditional single-document MongoDB updates prevent duplicate submissions from deducting twice. Receipts and merchant history are visibly marked as demo activity. No payment gateway, provider, external API, real payment details, or live money movement is used.

Run the backend checks with `npm test --prefix backend`.
