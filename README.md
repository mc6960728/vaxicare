# Vaxicare Application API

Backend REST API for vaccination management system built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

----

## Quick Setup

### Prerequisites
- Node.js >= 18
- PostgreSQL database (Supabase recommended)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd vaxicare-app

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npm run prisma:generate

# Setup database tables
npm run prisma:push

# (Optional) Seed data
npm run prisma:seed

# Start server
npm run dev
```

Server runs at: `http://localhost:3000`

---

## Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key-min-32-characters
CORS_ORIGIN=*
BCRYPT_SALT_ROUNDS=10
```

---

## Supabase Setup

### 1. Create Project
- Go to https://supabase.com
- Create new project
- Copy **Connection Pooling URL** from Settings → Database

### 2. Configure Database
Update `.env`:
```env
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-region.pooler.supabase.com:6543/postgres
```

### 3. Setup Tables
```bash
npm run prisma:push      # Creates all tables
npm run prisma:generate  # Generates Prisma client
```

### 4. Schema Migrations

#### Fresh Setup (New Developer):
```bash
# Run SQL file in Supabase SQL Editor
database/create-all-tables-fresh-setup.sql
```

#### Schema Changes (Add/Update/Remove columns):
```bash
npm run migrate up       # Run pending migrations
npm run migrate down     # Rollback last migration
npm run migrate status   # Check migration status
```

#### Creating New Migration:
1. Copy existing file from `database/migrations/scripts/`
2. Rename: `YYYYMMDD_XXX_description.ts`
3. Update `name`, `up()`, `down()` functions
4. Register in `database/migrations/scripts/index.ts`
5. Run `npm run migrate up`

---

## Available Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run build            # Build for production
npm start                # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to database
npm run prisma:studio    # Open database GUI
npm run migrate up       # Run pending migrations
npm run migrate down     # Rollback last migration

# Seed Data
npm run seed:admin       # Seed admin user
npm run seed:vaccines    # Seed vaccines
npm run seed:schedules   # Seed vaccine schedules
npm run seed:centers     # Seed vaccination centers
npm run seed:staff       # Seed medical staff
npm run seed:knowledge   # Seed knowledge base articles
npm run seed:all         # Seed everything (in order)

# Flush Data
npm run flush:all        # Clear all data (keeps admins)

# Code Quality
npm run lint             # Run linter
npm run format           # Format code
```

---

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Health Check
```
GET /    # Database health check
```
---

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Auth:** JWT + OTP
- **Validation:** Zod

---

## Project Structure

```
src/
├── config/         # Configuration
├── controllers/    # Route handlers
├── services/       # Business logic
├── routes/         # API routes
├── middleware/     # Auth, validation, etc.
├── utils/          # Helper functions
└── server.ts       # Entry point

prisma/
├── schema.prisma   # Database schema
└── seeds/          # All seed files
    ├── seed-add-admin.ts
    ├── seed-vaccines.ts
    ├── seed-vaccine-schedules.ts
    ├── seed-vaccination-centers.ts
    ├── seed-medical-staff.ts
    ├── seed-knowledge-base.ts
    └── flush-data.ts

database/
├── create-all-tables-fresh-setup.sql  # Fresh DB setup
└── migrations/                         # Schema migrations
    └── scripts/                        # Migration files
```

---

## Security

- JWT authentication
- Bcrypt password hashing
- Role-based access control
- Input validation with Zod
- Helmet.js security headers
- CORS configuration

---

## Support

For issues, create a GitHub issue or contact the development team.

## License

ISC

## Author

Meena Chauhan
---

## Manual Database Setup (Alternative Method)

If `npm run prisma:push` fails, use manual SQL files:

### Fresh Database Setup

1. Open Supabase Dashboard → SQL Editor
2. Open: `database/create-all-tables-fresh-setup.sql`
3. Copy entire content → Paste → RUN
4. Run: `npm run prisma:generate`
5. Seed data: `npm run seed:all`

⚠️ **Warning:** This deletes ALL existing data!

### Schema Changes (Migrations)

```bash
npm run migrate up       # Run pending migrations
npm run migrate down     # Rollback last migration
npm run migrate status   # Check status
```

### Flush Data (Keep Tables)

```bash
npm run flush:all        # Clear all data
npm run flush:vaccines   # Clear vaccine data only
npm run flush:users      # Clear users (keeps admins)
```
