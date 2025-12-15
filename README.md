# City Light Pole Management API

Backend API for managing city light poles, issues, and maintenance built with NestJS, TypeORM, and PostgreSQL.

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for TypeScript
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Swagger/OpenAPI** - API documentation
- **bcryptjs** - Password hashing
- **qrcode** - QR code generation

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Server
PORT=3011
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/city_light_pole_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Public Base URL (for file URLs)
PUBLIC_BASE_URL=http://localhost:3011

# Upload Directory
UPLOAD_DIR=./uploads
```

### 3. Setup PostgreSQL Database

```bash
# Create database
createdb city_light_pole_db

# Or using psql
psql -U postgres
CREATE DATABASE city_light_pole_db;
```

## Run Order (Local Dev)

1. **Start PostgreSQL** (ensure it's running on your system)

2. **In city-light-pole-api:**
   ```bash
   npm install
   npm run dev-run
   ```

   The `dev-run` script will:
   - Validate environment variables
   - Run database migrations
   - Run seed script (creates default users and sample data)
   - Start the API in watch mode

3. **Access the API:**
   - API: http://localhost:3011/api/v1
   - Swagger Docs: http://localhost:3011/api/docs
   - OpenAPI JSON: http://localhost:3011/api/docs-json

## Default Seeded Credentials

After running the seed script, you can login with:

- **Admin:**
  - Email: `admin@city.gov`
  - Password: `admin123`

- **Maintenance Engineer:**
  - Email: `engineer@city.gov`
  - Password: `engineer123`

- **Supervisor Viewer:**
  - Email: `viewer@city.gov`
  - Password: `viewer123`

## Scripts

- `npm run dev-run` - Run migrations, seed, and start dev server
- `npm run start:dev` - Start dev server with watch mode
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run seed` - Run database seed
- `npm run migration:generate` - Generate a new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration
- `npm run openapi:export` - Export OpenAPI schema to `openapi.json`

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register (ADMIN only)

### Users
- `GET /api/v1/users` - Get all users (ADMIN)
- `PATCH /api/v1/users/:id/role` - Update user role (ADMIN)
- `PATCH /api/v1/users/:id/status` - Update user status (ADMIN)

### Light Poles
- `POST /api/v1/poles` - Create pole (ADMIN)
- `GET /api/v1/poles` - List poles (with filters)
- `GET /api/v1/poles/:id` - Get pole details
- `PATCH /api/v1/poles/:id` - Update pole (ADMIN)
- `POST /api/v1/poles/:id/qr` - Generate QR code (ADMIN)

### Issues
- `POST /api/v1/issues` - Create issue (ADMIN, ENGINEER)
- `GET /api/v1/issues` - List issues
- `GET /api/v1/issues/:id` - Get issue details
- `PATCH /api/v1/issues/:id/status` - Update issue status (ADMIN, ENGINEER)
- `POST /api/v1/issues/:id/attachments` - Upload attachment (ADMIN, ENGINEER)

### Maintenance
- `POST /api/v1/maintenance/schedules` - Create schedule
- `GET /api/v1/maintenance/schedules` - List schedules
- `PATCH /api/v1/maintenance/schedules/:id` - Update schedule
- `POST /api/v1/maintenance/logs` - Create log
- `GET /api/v1/maintenance/logs` - List logs
- `POST /api/v1/maintenance/logs/:id/attachments` - Upload attachment

### Reports
- `GET /api/v1/reports/summary` - Get summary statistics
- `GET /api/v1/reports/faulty-by-district` - Get faulty poles by district
- `GET /api/v1/reports/maintenance-cost` - Get maintenance cost report
- `GET /api/v1/reports/inspection` - Get inspection report

## User Roles

- **ADMIN** - Full access to all features
- **MAINTENANCE_ENGINEER** - Can create/update issues and maintenance logs
- **SUPERVISOR_VIEWER** - Read-only access

## File Uploads

Uploaded files are stored in the `./uploads` directory:
- QR codes: `./uploads/qr/`
- Issue attachments: `./uploads/issues/`
- Maintenance attachments: `./uploads/maintenance/`

Files are served statically at `/uploads/*` using the `PUBLIC_BASE_URL`.

## License

UNLICENSED


