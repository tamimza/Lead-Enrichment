'use client';

// Documentation Page
// Design: Left sidebar navigation, Main content

import { useState } from 'react';
import Link from 'next/link';

// Navigation structure
const navigation = [
  {
    title: 'General',
    items: [
      { name: 'Getting Started', href: '#getting-started' },
      { name: 'Architecture', href: '#architecture' },
      { name: 'Tech Stack', href: '#tech-stack' },
    ],
  },
  {
    title: 'Core Features',
    items: [
      { name: 'AI Enrichment', href: '#ai-enrichment' },
      { name: 'Queue System', href: '#queue-system' },
      { name: 'Database', href: '#database' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { name: 'Endpoints', href: '#api-endpoints' },
      { name: 'Authentication', href: '#authentication' },
    ],
  },
  {
    title: 'Deployment',
    items: [
      { name: 'Environment Setup', href: '#environment-setup' },
      { name: 'Production', href: '#production' },
    ],
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Sidebar - Navigation */}
      <aside className="w-64 border-r border-gray-200 fixed h-full overflow-y-auto bg-white">
        <div className="p-6">
          <Link href="/connect" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">Lead Enrichment</span>
          </Link>

          <nav className="space-y-6">
            {navigation.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-teal-700 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={`block py-1.5 text-sm transition-colors ${
                          activeSection === item.href.slice(1)
                            ? 'text-teal-700 font-medium'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={() => setActiveSection(item.href.slice(1))}
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/docs" className="hover:text-teal-600">Docs</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900">Getting Started</span>
          </nav>

          {/* Page Title */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3" id="getting-started">Getting Started</h1>
            <p className="text-xl text-gray-600">Project overview and setup instructions.</p>
          </div>

          {/* Content Sections */}
          <div className="prose prose-gray max-w-none">
            {/* Overview */}
            <section className="mb-12" id="overview">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Lead Enrichment Platform</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Overview</h3>
              <p className="text-gray-600 mb-4">
                The Lead Enrichment Platform is an AI-powered solution that automates lead research
                and generates personalized outreach emails. It replaces manual research with intelligent
                automation using Claude AI.
              </p>
              <p className="text-gray-600 mb-6">
                This platform transforms basic lead information into rich profiles with AI-generated
                insights and ready-to-send personalized emails.
              </p>

              <hr className="my-8 border-gray-200" />

              {/* Key Features */}
              <h3 className="text-xl font-semibold text-gray-800 mb-4" id="key-features">Key Features</h3>
              <div className="grid gap-4 mb-8">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">AI-Powered Enrichment</h4>
                  <p className="text-sm text-gray-600">Claude AI analyzes lead data and generates role summaries, company insights, and key professional highlights.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">Personalized Email Generation</h4>
                  <p className="text-sm text-gray-600">Automatically generates 150-200 word personalized outreach emails with soft CTAs.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">Queue-Based Processing</h4>
                  <p className="text-sm text-gray-600">BullMQ handles background job processing with rate limiting and automatic retries.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">Admin Dashboard</h4>
                  <p className="text-sm text-gray-600">View enrichment results, manage leads, and copy email drafts from a protected dashboard.</p>
                </div>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Quick Start */}
              <h3 className="text-xl font-semibold text-gray-800 mb-4" id="quick-start">Quick Start</h3>
              <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`# Clone the repository
git clone https://github.com/your-repo/lead-enrichment.git
cd lead-enrichment

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Start development server
npm run dev

# In another terminal, start the worker
npm run worker`}
                </pre>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Architecture */}
              <h3 className="text-xl font-semibold text-gray-800 mb-4" id="architecture">Architecture</h3>
              <div className="bg-gray-50 rounded-lg p-6 mb-6 font-mono text-sm">
                <pre className="text-gray-700 whitespace-pre-wrap">
{`┌─────────────────────────────────────────────────────────────┐
│                      USER FLOW                               │
└─────────────────────────────────────────────────────────────┘

   /connect (Form)           Background Worker         /admin
        │                          │                      │
        ▼                          ▼                      ▼
  ┌──────────┐              ┌──────────┐           ┌──────────┐
  │  Submit  │──────────────│  Claude  │──────────▶│  View &  │
  │   Lead   │   BullMQ     │    AI    │   Store   │  Manage  │
  └──────────┘   Queue      └──────────┘   in DB   └──────────┘
        │                                                │
        ▼                                                ▼
   PostgreSQL ◀──────────────────────────────────────────┘`}
                </pre>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Tech Stack */}
              <h3 className="text-xl font-semibold text-gray-800 mb-4" id="tech-stack">Tech Stack</h3>
              <div className="overflow-x-auto mb-8">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Layer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Technology</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Framework</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Next.js 16</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Full-stack React framework</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Language</td>
                      <td className="px-4 py-3 text-sm text-gray-600">TypeScript</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Type-safe development</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Database</td>
                      <td className="px-4 py-3 text-sm text-gray-600">PostgreSQL</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Lead storage & state</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Queue</td>
                      <td className="px-4 py-3 text-sm text-gray-600">BullMQ + Redis</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Background job processing</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">AI</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Claude API</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Lead enrichment & email gen</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Validation</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Zod</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Schema validation</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Data Flow */}
              <h3 className="text-xl font-semibold text-gray-800 mb-4" id="data-flow">Data Flow</h3>

              <h4 className="font-semibold text-gray-900 mb-2">1. Lead Submission</h4>
              <p className="text-gray-600 mb-4">
                User submits lead via <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">/connect</code> form.
                Data is validated with Zod, inserted into PostgreSQL with status <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">pending</code>,
                and a job is queued in BullMQ.
              </p>

              <h4 className="font-semibold text-gray-900 mb-2">2. Background Processing</h4>
              <p className="text-gray-600 mb-4">
                The worker picks up the job, updates status to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">processing</code>,
                calls Claude API with the lead data, parses the structured response, and updates the database
                with enrichment data and draft email.
              </p>

              <h4 className="font-semibold text-gray-900 mb-2">3. Admin Review</h4>
              <p className="text-gray-600 mb-8">
                Admins view enriched leads in the dashboard, review AI-generated insights, and copy personalized
                email drafts for outreach.
              </p>

              <hr className="my-8 border-gray-200" />

              {/* AI Enrichment */}
              <h3 className="text-xl font-semibold text-gray-800 mb-4" id="ai-enrichment">AI Enrichment</h3>
              <p className="text-gray-600 mb-4">
                The enrichment engine uses Claude Sonnet to analyze lead data and generate structured insights:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`// Enrichment Output Structure
{
  role_summary: "Senior full-stack developer with 5+ years...",
  company_focus: "Enterprise SaaS solutions for healthcare...",
  key_insights: [
    "Led migration to microservices architecture",
    "Speaker at React conferences",
    "Open source contributor"
  ],
  draft_email: "Hi John, I noticed your work at..."
}`}
                </pre>
              </div>

              <h4 className="font-semibold text-gray-900 mb-2">JSON Extraction</h4>
              <p className="text-gray-600 mb-4">
                The system uses a multi-layer extraction strategy to handle Claude&apos;s varied response formats:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`function extractJSON(text: string): any {
  // Try 1: Direct JSON parse
  try { return JSON.parse(text); } catch {}

  // Try 2: Extract from markdown code blocks
  const codeBlock = text.match(/\`\`\`(?:json)?\\s*([\\s\\S]*?)\`\`\`/);
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1]); } catch {}
  }

  // Try 3: Find JSON object pattern
  const jsonMatch = text.match(/\\{[\\s\\S]*\\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);

  throw new Error('No valid JSON found');
}`}
                </pre>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Queue System */}
              <h3 className="text-xl font-semibold text-gray-800 mb-4" id="queue-system">Queue System</h3>
              <p className="text-gray-600 mb-4">
                BullMQ provides production-grade job processing with these configurations:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`{
  attempts: 3,                    // Retry failed jobs
  backoff: {
    type: 'exponential',          // 2s → 4s → 8s delays
    delay: 2000
  },
  limiter: {
    max: 10,                      // Rate limit
    duration: 60000               // 10 jobs per minute
  },
  concurrency: 2,                 // Parallel processing
  removeOnComplete: { age: 3600 } // Cleanup completed jobs
}`}
                </pre>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Database */}
              <h3 className="text-xl font-semibold text-gray-800 mb-4" id="database">Database Schema</h3>
              <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Input Data
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  linkedin_url TEXT,
  company_website TEXT,

  -- Processing State
  status VARCHAR(50) CHECK (status IN (
    'pending', 'processing', 'enriched', 'failed'
  )),

  -- AI Output
  enrichment_data JSONB,
  draft_email TEXT,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(email);`}
                </pre>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* API Endpoints */}
              <h3 className="text-xl font-semibold text-gray-800 mb-4" id="api-endpoints">API Endpoints</h3>

              <h4 className="font-semibold text-gray-900 mb-3">Public Endpoints</h4>
              <div className="space-y-3 mb-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">POST</span>
                    <code className="text-sm text-gray-900">/api/leads</code>
                  </div>
                  <p className="text-sm text-gray-600">Submit a new lead for enrichment. Returns lead ID and status.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">GET</span>
                    <code className="text-sm text-gray-900">/api/health</code>
                  </div>
                  <p className="text-sm text-gray-600">Check database and Redis connectivity status.</p>
                </div>
              </div>

              <h4 className="font-semibold text-gray-900 mb-3">Protected Endpoints (Require Auth)</h4>
              <div className="space-y-3 mb-8">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">GET</span>
                    <code className="text-sm text-gray-900">/api/leads</code>
                  </div>
                  <p className="text-sm text-gray-600">List leads with pagination. Query: <code className="bg-gray-100 px-1 rounded">?page=1&limit=25&status=enriched</code></p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">GET</span>
                    <code className="text-sm text-gray-900">/api/leads/[id]</code>
                  </div>
                  <p className="text-sm text-gray-600">Get single lead with full enrichment data.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">DELETE</span>
                    <code className="text-sm text-gray-900">/api/leads/[id]</code>
                  </div>
                  <p className="text-sm text-gray-600">Delete a lead from the database.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">POST</span>
                    <code className="text-sm text-gray-900">/api/auth</code>
                  </div>
                  <p className="text-sm text-gray-600">Admin login. Sets HTTP-only session cookie (24h expiry).</p>
                </div>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Environment Setup */}
              <h3 className="text-xl font-semibold text-gray-800 mb-4" id="environment-setup">Environment Setup</h3>
              <p className="text-gray-600 mb-4">
                Create a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">.env.local</code> file with the following variables:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/lead_enrichment

# Redis
REDIS_URL=redis://localhost:6379

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Admin Auth
ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=random-32-char-string

# Optional
NODE_ENV=development`}
                </pre>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Production */}
              <h3 className="text-xl font-semibold text-gray-800 mb-4" id="production">Production Deployment</h3>

              <h4 className="font-semibold text-gray-900 mb-2">Recommended Architecture</h4>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Component</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Service</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Web App</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Vercel (Next.js)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Worker</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Railway / Render</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Database</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Neon / AWS RDS</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Redis</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Upstash</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4 className="font-semibold text-gray-900 mb-2">Production Features</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mb-6">
                <li>Security headers (HSTS, CSP, X-Frame-Options)</li>
                <li>Connection pooling (20 max connections)</li>
                <li>Redis TLS support</li>
                <li>Graceful shutdown handling</li>
                <li>Health check endpoint</li>
                <li>Rate limiting on worker</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
