# SOAP Manager

A clean SvelteKit application for medical records management with Supabase authentication.

## Features

- **SvelteKit** with TypeScript for robust development
- **Tailwind CSS** for modern styling
- **Supabase Auth** with magic link authentication
- **Session-aware routing** with automatic redirects
- **Asia/Jakarta timezone** defaults
- **ESLint & Prettier** for code quality

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase project details
   ```

3. **Start development server:**
   ```bash
   make dev
   # or directly: ./scripts/dev.sh
   ```

The app will be available at `http://localhost:5173`

## Environment Variables

Create a `.env` file with:

```env
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Available Commands

### Application Commands
- `make dev` - Start development server
- `make build` - Build for production
- `make lint` - Run ESLint
- `make format` - Format code with Prettier
- `make install` - Install dependencies
- `make clean` - Clean build artifacts

### Database Commands
- `make db-start` - Start Supabase local development
- `make db-stop` - Stop Supabase local development
- `make db-reset` - Reset database and apply all migrations
- `make db-push` - Push local schema changes to remote database
- `make db-pull` - Pull remote schema changes to local
- `make db-migrate` - Apply migrations (schema → RLS → seed)
- `make db-status` - Show database migration status

## Authentication

⚠️ **Currently Disabled for Development**

Authentication is temporarily disabled to allow development without Supabase configuration. The app runs in development mode with a visible indicator in the navbar.

**To enable authentication:**
1. Configure your Supabase project details in `.env`
2. Update `src/routes/+layout.svelte` to re-enable the `ProtectedRoute` component

**When enabled, the app uses Supabase magic link authentication:**
1. Users enter their email on `/login`
2. Magic link is sent to their email
3. Clicking the link authenticates and redirects to the app
4. Session is maintained across page reloads
5. Users can sign out from the navbar

## Architecture

- **Session Management**: Global stores in `src/lib/auth.ts`
- **Route Protection**: `ProtectedRoute` component wraps authenticated pages
- **Layout**: Session-aware layout with navbar for authenticated users
- **Timezone**: All operations default to Asia/Jakarta timezone

## Development

The application follows SvelteKit conventions:
- Routes in `src/routes/`
- Components in `src/lib/components/`
- Utilities in `src/lib/`
- Global styles in `src/app.css`

Code quality is maintained through ESLint and Prettier configurations.

## Database Schema & Migrations

The application uses PostgreSQL with Supabase and includes:

### Database Structure
- **Hospital**: Medical facilities with contact information
- **Bangsal**: Hospital wards/departments
- **Patient**: Patient records with medical record numbers
- **SOAP**: Medical notes (Subjective, Objective, Assessment, Plan)

### Migration Files
Located in `app/sql/`:
- `01_schema.sql` - Tables, indexes, and triggers
- `02_rls.sql` - Row Level Security policies
- `03_seed.sql` - Test data for development

### Key Features
- **Row Level Security (RLS)**: Users can only access their own data
- **Fuzzy Search**: `pg_trgm` extension for patient name search
- **Performance Indexes**: Optimized queries for patient and SOAP records
- **Timezone Support**: All timestamps use `timestamptz` with Asia/Jakarta default

### Database Setup

1. **Initial Setup:**
   ```bash
   # Start Supabase local development
   make db-start
   
   # Apply all migrations (schema + RLS + seed data)
   make db-reset
   ```

2. **Development Workflow:**
   ```bash
   # Reset and reapply all migrations
   make db-reset
   
   # Push local changes to remote
   make db-push
   
   # Pull remote changes to local
   make db-pull
   ```

3. **RLS Testing:**
   ```sql
   -- Test as owner user (should return data)
   SELECT * FROM patient WHERE full_name ILIKE '%bintang%';
   
   -- Test fuzzy search ranking
   SELECT full_name, similarity(full_name, 'bintang') as score 
   FROM patient 
   WHERE full_name % 'bintang' 
   ORDER BY score DESC;
   ```

### Common RLS Debugging

- **Check current user:** `SELECT auth.uid();`
- **Verify RLS is enabled:** `SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- **Test cross-user access:** Switch user context and verify no data leakage
- **Debug policies:** Use `EXPLAIN` to see policy evaluation