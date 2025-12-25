# Lead Enrichment Application

Automated lead research and personalized email generation powered by Claude AI. Prospects submit their information via a form, and Claude automatically generates personalized outreach emails based on intelligent analysis.

## Features

- **AI-Powered Research:** Claude analyzes lead information to generate insights
- **Personalized Emails:** Automatically creates tailored outreach messages
- **Queue-Based Processing:** Background workers handle enrichment asynchronously
- **Admin Dashboard:** View leads, enrichment data, and draft emails
- **Production Ready:** Built with Next.js, TypeScript, PostgreSQL, and Redis

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Queue:** BullMQ + Redis
- **AI:** Anthropic Claude API (Sonnet 4.5)
- **Styling:** Tailwind CSS
- **Validation:** Zod

## Prerequisites

- Node.js 18+
- PostgreSQL (local installation or cloud provider)
- Redis (local or cloud provider)
- Anthropic API key ([Get one here](https://console.anthropic.com/))

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd lead-enrichment
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Database (update with your PostgreSQL connection)
DATABASE_URL=postgresql://username:password@localhost:5432/lead_enrichment

# Redis
REDIS_URL=redis://localhost:6379

# Claude API Key
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Admin Password
ADMIN_PASSWORD=your-secure-password

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Setup Database

```bash
# Create database
createdb lead_enrichment

# Run migration
npm run db:migrate
```

### 4. Start Redis

```bash
# macOS with Homebrew
brew services start redis

# Linux
sudo systemctl start redis

# Or manually
redis-server
```

### 5. Run the Application

You need **two terminal windows**:

**Terminal 1: Next.js Server**

```bash
npm run dev
```

**Terminal 2: Worker Process**

```bash
npm run worker
```

### 6. Test the Flow

1. Visit http://localhost:3000/connect
2. Submit a test lead with real information
3. Watch worker logs for processing
4. Visit http://localhost:3000/admin to view results

## How It Works

### Architecture Flow

```
User Form → PostgreSQL → Redis Queue → Claude Worker → Results → Admin Dashboard
```

1. **Form Submission** - User submits information at `/connect`
2. **Database Storage** - Lead saved to PostgreSQL with status `pending`
3. **Queue Job** - Enrichment job added to BullMQ queue
4. **AI Processing** - Worker sends lead data to Claude API
5. **Enrichment** - Claude generates insights and personalized email
6. **Storage** - Results saved back to database with status `enriched`
7. **Dashboard View** - Admin views enriched leads at `/admin`

## API Endpoints

### POST /api/leads

Create a new lead and queue for enrichment.

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "companyName": "Acme Corp",
    "jobTitle": "VP Engineering",
    "email": "jane@acme.com",
    "linkedinUrl": "https://linkedin.com/in/janedoe",
    "companyWebsite": "https://acme.com"
  }'
```

### GET /api/leads

List leads with pagination and filtering.

```bash
curl "http://localhost:3000/api/leads?page=1&limit=25&status=enriched" \
  -H "Cookie: admin_session=your-session-token"
```

### GET /api/health

System health check.

```bash
curl http://localhost:3000/api/health
```

## Development

### Available Scripts

```bash
npm run dev          # Start Next.js dev server
npm run worker       # Start enrichment worker
npm run build        # Build for production
npm run start        # Start production server
npm run db:migrate   # Run database migrations
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
npm run verify       # Verify setup
```

### Database Access

```bash
# Connect to database
psql $DATABASE_URL

# Useful queries
SELECT id, full_name, company_name, status, created_at FROM leads;
SELECT * FROM leads WHERE status = 'enriched' ORDER BY created_at DESC;
```

### Redis Access

```bash
# Connect to Redis CLI
redis-cli

# Check queue length
LLEN bull:enrichment:wait

# View active jobs
LLEN bull:enrichment:active
```

## Project Structure

```
lead-enrichment/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── connect/          # Public submission form
│   │   ├── admin/            # Admin dashboard
│   │   │   ├── (auth)/       # Login page
│   │   │   └── (dashboard)/  # Protected dashboard
│   │   └── api/              # API routes
│   ├── lib/                  # Core utilities
│   │   ├── db.ts             # Database client
│   │   ├── queue.ts          # BullMQ queue
│   │   ├── auth.ts           # Authentication
│   │   └── validations.ts    # Zod schemas
│   ├── agent/                # Claude enrichment worker
│   │   └── enrichment-worker-alt.ts
│   └── types/                # TypeScript types
├── migrations/               # Database migrations
├── scripts/                  # Utility scripts
│   ├── run-worker.ts         # Worker entry point
│   ├── env-loader.ts         # Environment loader
│   ├── migrate.ts            # Migration runner
│   └── verify-setup.ts       # Setup verification
└── .env.example              # Environment template
```

## Deployment

### Vercel (Web App)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Worker Deployment

The worker is a long-running background process and needs to be deployed separately from the Next.js app.

**Recommended platforms:**

- **Railway** - Simple deployment with automatic restarts
- **Render** - Background worker service
- **Fly.io** - Lightweight container hosting

**Configuration example (Railway):**

```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npm run worker",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## Environment Variables for Production

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379
ANTHROPIC_API_KEY=sk-ant-api03-...
ADMIN_PASSWORD=secure-password-here
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

## Troubleshooting

### Worker Not Processing Jobs

```bash
# Check Redis is running
redis-cli ping  # Should return PONG

# Check queue has jobs
redis-cli LLEN bull:enrichment:wait

# Check worker logs for errors
npm run worker
```

### Database Connection Failed

```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check PostgreSQL is running
pg_isready
```

### Claude API Errors

```bash
# Verify API key is set
echo $ANTHROPIC_API_KEY

# Check worker logs for specific error messages
```

## Costs

### Estimated Monthly Costs (100 leads)

| Service                  | Cost              |
| ------------------------ | ----------------- |
| Claude API (Sonnet 4.5)  | $10-20            |
| Vercel (Hobby)           | Free              |
| Database (e.g., Neon)    | Free tier         |
| Redis (e.g., Upstash)    | Free tier         |
| Worker hosting (Railway) | $5                |
| **Total**                | **~$15-25/month** |

### Per Lead

- Claude API: ~$0.10-0.20 per enrichment
- Database/Redis: Negligible
- Bandwidth: Negligible

## Security Notes

- Admin dashboard protected by session authentication
- CORS headers configured for API security
- Input validation with Zod schemas
- SQL injection protection via parameterized queries
- Environment variables for sensitive data
- Rate limiting on worker (configurable in `run-worker.ts`)

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Check existing issues for solutions
- Review the code documentation

---

**Built with Claude AI** | Powered by [Anthropic](https://anthropic.com)
