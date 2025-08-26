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
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here
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
<<<<<<< HEAD
- **Debug policies:** Use `EXPLAIN` to see policy evaluation
=======
- **Debug policies:** Use `EXPLAIN` to see policy evaluation

## Telegram Bot Integration

The SOAP Manager includes a Telegram bot that allows Indonesian language commands for interacting with patient data.

### Bot Setup

1. **Create a Telegram Bot:**
   ```bash
   # Message @BotFather on Telegram
   /newbot
   # Follow prompts to get your bot token
   ```

2. **Configure Environment Variables:**
   ```bash
   # Add to your .env file
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   TELEGRAM_WEBHOOK_SECRET=your_random_secret_here
   ```

3. **Set Webhook URL:**
   ```bash
   # Replace with your deployed app URL
   curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://your-app-domain.com/webhooks/telegram",
       "secret_token": "your_random_secret_here"
     }'
   ```

4. **Verify Webhook:**
   ```bash
   curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
   ```

### Supported Commands

The bot understands Indonesian natural language commands:

#### Diagnosis Queries
```
apa diagnosis bintang
diagnosis bintang putra
dx nisa
```

#### Medication Management
```
pasien bintang tambahkan obat injeksi cefotaxime untuk 2 hari
tambah obat paracetamol 500mg po tid untuk bintang 3 hari
beri injeksi ceftriaxone 1g iv q8h untuk nisa 5 hari
```

### Command Examples

**Single Patient Match:**
```
User: apa diagnosis bintang
Bot: 🏥 Diagnosis Bintang Putra:
     Post-operative pneumonia, improving
```

**Multiple Patient Disambiguation:**
```
User: tambah obat cefotaxime untuk bintang 2 hari
Bot: 🔍 Ditemukan beberapa pasien dengan nama tersebut. Pilih pasien yang dimaksud:
     [Bintang — RS Husada / Bangsal Mawar / Kamar 12]
     [Bintang Putra — RS Mitra / Bangsal Melati / Kamar 5]
```

**Medication Added:**
```
User: (after selecting patient)
Bot: ✅ Obat ditambahkan untuk Bintang Putra:

     Plan Aktif
     - Inj. Cefotaxime 1g IV q8h (2 hari, sampai 28 Aug)
     
     ---- Plan Selesai
     - Inf. Paracetamol 500mg PO bid (3 hari, selesai 27 Aug)
```

### Security Features

- **Secret Token Validation**: Webhook verifies `X-Telegram-Bot-Api-Secret-Token` header
- **Payload Size Limits**: Maximum 10KB payload size to prevent abuse
- **User Authentication**: Each Telegram user ID maps to system user permissions
- **Request Timeouts**: 10-second timeout for webhook processing
- **Idempotency**: Update ID tracking prevents duplicate processing

### Troubleshooting

**Bot Not Responding:**
```bash
# Check webhook status
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"

# Check server logs for webhook errors
# Verify TELEGRAM_WEBHOOK_SECRET matches setWebhook secret_token
```

**Commands Not Working:**
- Ensure patient names exist in database
- Check user has access permissions to patients
- Verify medication parsing with simple commands first

**Disambiguation Issues:**
- Selections expire after some time (restart with new command)
- Patient list limited to 5 matches for performance
>>>>>>> main
