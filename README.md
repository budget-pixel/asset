# Fixed Asset Manager

A fixed asset / capital asset register for tracking an organization's buildings, land,
machinery, vehicles, furniture, leasehold improvements, and construction in progress —
including straight-line depreciation, net book value, and the reports accounting needs
for balance-sheet reporting.

**Net book value = Original cost − Accumulated depreciation** (land and construction in
progress are not depreciated).

## Stack

- Next.js (App Router) + TypeScript
- Postgres via Prisma ORM
- Auth.js (NextAuth) credentials-based login, ADMIN / VIEWER roles
- Tailwind CSS + shadcn/ui
- Vitest for the depreciation calculation engine

## Setup

### 1. Database

You need a Postgres database. Any of these work:

**Option A — local Postgres via Homebrew:**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb fixed_assets
```

**Option B — Docker:**
```bash
docker run --name fixed-assets-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fixed_assets -p 5432:5432 -d postgres:16
```

**Option C — hosted (Neon, Supabase, etc.):** create a free Postgres instance and copy its
connection string.

### 2. Environment

Copy `.env.example` to `.env` and set `DATABASE_URL` to your database's connection string.
Generate an `AUTH_SECRET` with:
```bash
npx auth secret
```

### 3. Install, migrate, seed

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
```

The seed script creates the standard asset categories (Buildings, Land, Machinery &
Equipment, Vehicles, Furniture & Fixtures, Leasehold Improvements, Construction in
Progress), a few departments/locations, six sample assets, and an admin login:

```
username: admin
password: admin123
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, and from the dashboard click
**Run Depreciation** to post the depreciation schedule up through the current month for
every depreciable asset. Re-running it is safe — already-posted periods are skipped.

## Tests

```bash
npm test
```

Covers the straight-line depreciation engine (`src/lib/depreciation.ts`): monthly amount
calculation, non-depreciable categories, and rounding at the final period.

## Scope

This is v1: asset register, straight-line depreciation, and the two core reports (Fixed
Asset Register, Depreciation Expense). Disposals, transfers, impairment, and alternate
depreciation methods (declining-balance, units-of-production) are not implemented yet —
the schema was deliberately kept minimal rather than pre-built for them.
