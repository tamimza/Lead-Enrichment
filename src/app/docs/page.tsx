'use client';

// Documentation Page
// Design: Left sidebar navigation, Main content

import { useState } from 'react';
import Link from 'next/link';

// Navigation structure
const navigation = [
  {
    title: '',
    items: [
      { name: 'Overview', href: '#overview' },
      { name: 'Setup', href: '#setup' },
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
  const [activeSection, setActiveSection] = useState('overview');

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
            {navigation.map((section, idx) => (
              <div key={idx}>
                {section.title && (
                  <h3 className="text-sm font-semibold text-teal-700 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                )}
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
            <span className="text-gray-900">Overview</span>
          </nav>

          {/* Page Title */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3" id="overview">Lead Enrichment Platform</h1>
            <p className="text-xl text-gray-600">AI-powered intelligence for sales outreach.</p>
          </div>

          {/* Content Sections */}
          <div className="prose prose-gray max-w-none">
            {/* The Problem */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Problem Does This Solve?</h2>

              <p className="text-gray-600 mb-6 text-lg">
                Imagine a sales team with hundreds or thousands of leads - names, emails, companies, job titles.
              </p>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">What they do today:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="text-gray-400">1.</span>
                    <span>Open LinkedIn</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-gray-400">2.</span>
                    <span>Google the company</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-gray-400">3.</span>
                    <span>Try to understand what the person does</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-gray-400">4.</span>
                    <span>Think &quot;what should I say?&quot;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-gray-400">5.</span>
                    <span>Write a custom email</span>
                  </li>
                </ul>
                <p className="text-gray-500 mt-4 text-sm">That takes 5-10 minutes per lead.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                  <p className="text-red-800 font-semibold mb-2">Manual Process</p>
                  <p className="text-3xl font-bold text-red-900">8-15 hours</p>
                  <p className="text-red-600 text-sm">for 100 leads</p>
                </div>
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-6">
                  <p className="text-teal-800 font-semibold mb-2">With Lead Enrichment</p>
                  <p className="text-3xl font-bold text-teal-900">5-10 seconds</p>
                  <p className="text-teal-600 text-sm">per lead, fully automated</p>
                </div>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Intelligence Not Databases */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Intelligence, Not Databases</h2>

              <p className="text-gray-600 mb-4">
                We&apos;re not scraping LinkedIn. We&apos;re not buying contact databases. We&apos;re not crawling the web.
              </p>

              <p className="text-gray-600 mb-6">
                <strong className="text-gray-900">We sell intelligence.</strong> You provide the basic lead info you already have,
                and Claude AI generates intelligent insights about the person&apos;s role, their company&apos;s focus, and crafts
                a personalized outreach email - all without the legal and ethical risks of data scraping.
              </p>

              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-teal-900 mb-1">Claude gives you intelligence without the risk</p>
                    <p className="text-teal-700 text-sm">No scraping. No data buying. No compliance headaches. Just smart, personalized outreach.</p>
                  </div>
                </div>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Key Features */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Features</h2>
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

              {/* Setup */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="setup">Setup</h2>
              <p className="text-gray-600 mb-4">
                Get started by cloning the repository and following the setup instructions.
              </p>

              <a
                href="https://github.com/tamimza/Lead-Enrichment"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors mb-6"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                View on GitHub
              </a>

              <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`# Clone the repository
git clone https://github.com/tamimza/Lead-Enrichment.git
cd Lead-Enrichment

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
psql -d your_database -f migrations/001_create_leads.sql

# Start development server
npm run dev

# In another terminal, start the worker
npm run worker`}
                </pre>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Architecture */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="architecture">Architecture</h2>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="tech-stack">Tech Stack</h2>
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

              {/* AI Enrichment */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="ai-enrichment">AI Enrichment</h2>
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

              <hr className="my-8 border-gray-200" />

              {/* Queue System */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="queue-system">Queue System</h2>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="database">Database Schema</h2>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="api-endpoints">API Endpoints</h2>

              <h3 className="font-semibold text-gray-900 mb-3">Public Endpoints</h3>
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

              <h3 className="font-semibold text-gray-900 mb-3">Protected Endpoints (Require Auth)</h3>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="environment-setup">Environment Setup</h2>
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

# Optional
NODE_ENV=development`}
                </pre>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Production */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="production">Production Deployment</h2>

              <h3 className="font-semibold text-gray-900 mb-2">Recommended Architecture</h3>
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

              <h3 className="font-semibold text-gray-900 mb-2">Production Features</h3>
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
