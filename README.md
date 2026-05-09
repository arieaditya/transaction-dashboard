<img width="1445" height="996" alt="Screenshot 2026-05-09 at 16 46 30" src="https://github.com/user-attachments/assets/719ee81c-630a-4c19-9a72-8b8b9b90c74e" />

# Transaction Dashboard Fullstack Prep

A small full-stack transaction operations dashboard built to practice and demonstrate Vue/Nuxt, Node.js, and PostgreSQL integration in a realistic payment-operations workflow. The project includes a Nuxt 3 + Vuetify frontend, an Express API, and a PostgreSQL database with transaction and refund flows.

## Overview

This project simulates an internal payment operations dashboard where an operator can:

- view transactions
- filter by status and payment method
- inspect transaction details
- request a refund
- read data from PostgreSQL through an Express API

The goal of this project is to strengthen practical full-stack skills in areas I wanted to improve: Vue/Nuxt data fetching, TypeScript in Vue, Node.js backend routing, and PostgreSQL relational queries.

## Tech Stack

### Frontend

- Nuxt 3
- Vue 3
- Vuetify
- TypeScript
- `useFetch` / `$fetch` for API integration

### Backend

- Node.js
- Express
- PostgreSQL client via `pg` Pool

### Database

- PostgreSQL
- Relational schema with `customers`, `transactions`, and `refunds` tables

## Features

- Transaction dashboard with KPI summary cards
- Search and filter by transaction status and payment method
- Transaction detail page
- Refund request flow
- PostgreSQL-backed transaction data
- Joined customer + transaction query results from backend
- Basic loading, empty, and error states in the frontend 

## Project Structure

```bash
.
├── api/
│   ├── .env
│   ├── package.json
│   └── src/
│       ├── db.js
│       ├── index.js
│       └── routes/
│           └── transactions.js
├── app/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── data/
│   └── types/
├── database/
│   ├── schema.sql
│   └── seed.sql
└── README.md
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/arieaditya/transaction-dashboard
cd transaction-dashboard
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd api
npm install
cd ..
```

## Database Setup

Make sure PostgreSQL is installed and running locally. Then create a database named `transaction_dashboard`, apply the schema, and seed sample data. PostgreSQL’s standard workflow is to create the database first and then run `CREATE TABLE` and `INSERT` scripts against it.

### 1. Create database

```sql
CREATE DATABASE transaction_dashboard;
```

### 2. Run schema

```bash
psql -U postgres -d transaction_dashboard -f database/schema.sql
```

### 3. Run seed

```bash
psql -U postgres -d transaction_dashboard -f database/seed.sql
```

### 4. Verify data

```sql
SELECT * FROM customers;
SELECT * FROM transactions;
SELECT * FROM refunds;
```

## Backend Setup

Create `api/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transaction_dashboard
DB_USER=postgres
DB_PASSWORD=your_postgres_password
PORT=3001
```

Then start the API:

```bash
cd api
npm run dev
```

Expected local API base URL:

```bash
http://localhost:3001
```

## Frontend Setup

Start the Nuxt app from the project root:

```bash
npm run dev
```

Expected local frontend URL:

```bash
http://localhost:3000
```

## API Endpoints

### Health check

```http
GET /health
```

### Get all transactions

```http
GET /transactions
```

### Get one transaction by ID

```http
GET /transactions/:id
```

### Request refund for a transaction

```http
POST /transactions/:id/refund
Content-Type: application/json
```

Example request body:

```json
{
  "reason": "Customer requested refund"
}
```

## Architecture Notes

The frontend uses Nuxt 3 with Vuetify for the UI layer and `useFetch()` for loading data from the API, which is an SSR-friendly Nuxt composable for fetching endpoint data. User-triggered mutations such as refund actions use `$fetch()` and then refresh the dashboard state.

The backend uses Express route modules and a PostgreSQL connection pool via `pg`. Database queries use joins between `transactions` and `customers` so the frontend receives display-ready transaction rows in a single response. Pooling is the recommended pattern in node-postgres for reusing database connections efficiently.

The PostgreSQL schema is intentionally small:

- `customers` stores customer identity fields
- `transactions` stores payment records
- `refunds` stores refund events linked to transactions

This structure is enough to support relational queries, detail views, and refund workflows without overcomplicating the demo.

## Example SQL Join

This is the kind of query used by the backend transaction list endpoint:

```sql
SELECT
  t.id,
  c.name AS customer_name,
  c.email,
  t.amount,
  t.payment_method,
  t.status,
  t.created_at
FROM transactions t
JOIN customers c ON c.id = t.customer_id
ORDER BY t.created_at DESC;
```

PostgreSQL joins combine rows from related tables based on matching keys, which is why the schema uses foreign keys between customers, transactions, and refunds.

## Screenshots

Transaction Dashboard Overview

<img width="1445" height="996" alt="Screenshot 2026-05-09 at 16 46 30" src="https://github.com/user-attachments/assets/719ee81c-630a-4c19-9a72-8b8b9b90c74e" />

Refund flow

<img width="1441" height="992" alt="Screenshot 2026-05-09 at 19 11 55" src="https://github.com/user-attachments/assets/4d286a17-c7c2-4304-8f74-ecf3028406a4" />

Empty or error state

<img width="1443" height="805" alt="Screenshot 2026-05-09 at 19 11 15" src="https://github.com/user-attachments/assets/511ea29d-3fdd-4fad-ad76-281037726810" />

Example:

```md

```

## Current Status

### Implemented

- Frontend dashboard layout
- Transaction list pages with detail slider
- Express API routes
- PostgreSQL schema and seed data
- Refund endpoint
- API-driven frontend integration

### Planned / Nice to Have

- Better loading skeletons
- Authentication or protected routes
- Sorting and query params
- Docker setup
- Deployment guide

## Why I Built This

I built this project as focused practice for a full-stack workflow involving Vue/Nuxt, Node.js, and PostgreSQL, especially around internal dashboard patterns and transaction operations. It is meant to be a compact but realistic demonstration of frontend, backend, and database integration rather than a large production application.

## Notes

This project is intended for local development and portfolio/demo use. Environment variables should not be committed, and generated/dependency folders such as `node_modules`, `.nuxt`, and build output should be ignored in Git. [web:338][web:340]
