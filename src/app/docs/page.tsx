'use client';

// Documentation Page - Updated with full system documentation
// Design: Left sidebar navigation, Main content with diagrams

import { useState } from 'react';
import Link from 'next/link';

// Navigation structure
const navigation = [
  {
    title: '',
    items: [
      { name: 'Overview', href: '#overview' },
      { name: 'How It Works', href: '#how-it-works' },
      { name: 'Architecture', href: '#architecture' },
    ],
  },
  {
    title: 'Enrichment Tiers',
    items: [
      { name: 'Standard Tier', href: '#standard-tier' },
      { name: 'Medium Tier', href: '#medium-tier' },
      { name: 'Premium Tier', href: '#premium-tier' },
    ],
  },
  {
    title: 'Technical',
    items: [
      { name: 'Tech Stack', href: '#tech-stack' },
      { name: 'AI Agent Tools', href: '#ai-tools' },
      { name: 'Database Schema', href: '#database' },
      { name: 'API Reference', href: '#api-endpoints' },
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
            <p className="text-xl text-gray-600">AI-powered lead research and personalized outreach generation.</p>
          </div>

          {/* Content Sections */}
          <div className="prose prose-gray max-w-none">
            {/* The Problem */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Problem Does This Solve?</h2>

              <p className="text-gray-600 mb-6 text-lg">
                Sales teams spend hours researching leads manually. This platform automates the entire process using Claude AI.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                  <p className="text-red-800 font-semibold mb-2">Manual Process</p>
                  <p className="text-3xl font-bold text-red-900">8-15 hours</p>
                  <p className="text-red-600 text-sm">for 100 leads</p>
                </div>
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-6">
                  <p className="text-teal-800 font-semibold mb-2">With Lead Enrichment</p>
                  <p className="text-3xl font-bold text-teal-900">2-5 minutes</p>
                  <p className="text-teal-600 text-sm">per lead, fully automated</p>
                </div>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* How It Works */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="how-it-works">How It Works</h2>

              <div className="space-y-4 mb-8">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Lead Submits Info</h4>
                    <p className="text-gray-600 text-sm">User fills out form with name, company, email, and optional LinkedIn/website</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Claude Agent Researches</h4>
                    <p className="text-gray-600 text-sm">AI autonomously searches the web, scrapes company websites, and gathers LinkedIn data</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Insights Generated</h4>
                    <p className="text-gray-600 text-sm">Structured output with role summary, company focus, key insights, and challenges</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email Drafted</h4>
                    <p className="text-gray-600 text-sm">Personalized introduction email ready to copy and send</p>
                  </div>
                </div>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Architecture Diagram */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="architecture">System Architecture</h2>

              {/* Visual Flow Diagram */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6 overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Phase Labels */}
                  <div className="flex justify-between mb-4 text-xs font-semibold uppercase tracking-wider">
                    <span className="text-teal-600">Phase 1: Ingestion</span>
                    <span className="text-amber-600">Phase 2: Enrichment</span>
                    <span className="text-purple-600">Phase 3: Output</span>
                  </div>

                  {/* Main Flow */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Connect Form */}
                    <div className="bg-white border-2 border-teal-500 rounded-lg p-3 text-center shadow-sm w-28">
                      <div className="text-2xl mb-1">📝</div>
                      <div className="text-xs font-semibold text-gray-900">/connect</div>
                      <div className="text-xs text-gray-500">Form</div>
                    </div>

                    <div className="text-gray-400">→</div>

                    {/* API */}
                    <div className="bg-white border border-gray-300 rounded-lg p-3 text-center shadow-sm w-28">
                      <div className="text-2xl mb-1">⚡</div>
                      <div className="text-xs font-semibold text-gray-900">API</div>
                      <div className="text-xs text-gray-500">Validate</div>
                    </div>

                    <div className="text-gray-400">→</div>

                    {/* Queue */}
                    <div className="bg-white border border-gray-300 rounded-lg p-3 text-center shadow-sm w-28">
                      <div className="text-2xl mb-1">📮</div>
                      <div className="text-xs font-semibold text-gray-900">Redis</div>
                      <div className="text-xs text-gray-500">Queue</div>
                    </div>

                    <div className="text-gray-400">→</div>

                    {/* Worker */}
                    <div className="bg-white border-2 border-amber-500 rounded-lg p-3 text-center shadow-sm w-28">
                      <div className="text-2xl mb-1">🤖</div>
                      <div className="text-xs font-semibold text-gray-900">Claude</div>
                      <div className="text-xs text-gray-500">Agent</div>
                    </div>

                    <div className="text-gray-400">→</div>

                    {/* Database */}
                    <div className="bg-white border border-gray-300 rounded-lg p-3 text-center shadow-sm w-28">
                      <div className="text-2xl mb-1">🗄️</div>
                      <div className="text-xs font-semibold text-gray-900">PostgreSQL</div>
                      <div className="text-xs text-gray-500">Store</div>
                    </div>

                    <div className="text-gray-400">→</div>

                    {/* Admin */}
                    <div className="bg-white border-2 border-purple-500 rounded-lg p-3 text-center shadow-sm w-28">
                      <div className="text-2xl mb-1">📊</div>
                      <div className="text-xs font-semibold text-gray-900">/admin</div>
                      <div className="text-xs text-gray-500">Dashboard</div>
                    </div>
                  </div>

                  {/* Claude Tools */}
                  <div className="mt-6 flex justify-center">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 inline-block">
                      <div className="text-xs font-semibold text-amber-700 uppercase mb-2 text-center">Claude Agent Tools</div>
                      <div className="flex gap-3">
                        <div className="bg-white border border-amber-300 rounded px-3 py-1.5 text-xs">
                          <span className="font-semibold">WebSearch</span>
                          <span className="text-gray-500 ml-1">Google</span>
                        </div>
                        <div className="bg-white border border-amber-300 rounded px-3 py-1.5 text-xs">
                          <span className="font-semibold">WebFetch</span>
                          <span className="text-gray-500 ml-1">Pages</span>
                        </div>
                        <div className="bg-white border border-amber-300 rounded px-3 py-1.5 text-xs">
                          <span className="font-semibold">Scrape</span>
                          <span className="text-gray-500 ml-1">Websites</span>
                        </div>
                        <div className="bg-white border border-amber-300 rounded px-3 py-1.5 text-xs">
                          <span className="font-semibold">LinkedIn</span>
                          <span className="text-gray-500 ml-1">Profiles</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text-based Detailed Flow */}
              <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre className="text-sm text-gray-100 whitespace-pre">
{`┌─────────────────────────────────────────────────────────────────────────────────┐
│                            LEAD ENRICHMENT FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

  INGESTION                    ENRICHMENT                         OUTPUT
  ─────────                    ──────────                         ──────

  User visits                  BullMQ Worker                      Admin views
  /connect                     picks up job                       /admin
      │                              │                                │
      ▼                              ▼                                ▼
┌──────────┐                  ┌──────────────┐                 ┌──────────────┐
│  Form    │                  │  Claude AI   │                 │  Dashboard   │
│ Submitted│                  │    Agent     │                 │   Results    │
└────┬─────┘                  └──────┬───────┘                 └──────────────┘
     │                               │
     ▼                               ▼
┌──────────┐                  ┌──────────────┐
│ Validate │                  │  TOOL CALLS  │
│  + Save  │                  │──────────────│
└────┬─────┘                  │ • WebSearch  │
     │                        │ • WebFetch   │
     ▼                        │ • Scrape Web │
┌──────────┐                  │ • LinkedIn   │
│  Queue   │                  └──────┬───────┘
│   Job    │                         │
└──────────┘                         ▼
                              ┌──────────────┐
                              │  Structured  │
                              │   Output:    │
                              │──────────────│
                              │ • Summary    │
                              │ • Insights   │
                              │ • Challenges │
                              │ • Email      │
                              └──────────────┘`}
                </pre>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Enrichment Tiers */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Enrichment Tiers</h2>
              <p className="text-gray-600 mb-6">
                Choose the level of research depth based on lead importance. Each tier balances cost, speed, and detail.
              </p>

              {/* Standard Tier */}
              <div className="border border-gray-200 rounded-xl p-6 mb-4" id="standard-tier">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm font-semibold">Standard</span>
                  <span className="text-sm text-gray-500">Quick insights • ~30 seconds</span>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Tools Used</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• WebSearch (1-2 calls)</li>
                      <li>• WebFetch (optional)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Output</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Role summary (inferred)</li>
                      <li>• Company focus</li>
                      <li>• 2-3 key insights</li>
                      <li>• 3-4 paragraph email (100-150 words)</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  <strong>Config:</strong> 5 max turns • No LinkedIn • Best for high-volume, lower-priority leads
                </div>
              </div>

              {/* Medium Tier */}
              <div className="border-2 border-amber-200 bg-amber-50/30 rounded-xl p-6 mb-4" id="medium-tier">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-md text-sm font-semibold">Medium</span>
                  <span className="text-sm text-gray-500">Company research • ~2 minutes</span>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Tools Used</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• WebSearch (3-4 calls)</li>
                      <li>• WebFetch</li>
                      <li>• <strong>scrape_company_website</strong> (Cheerio)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Output</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Detailed role summary</li>
                      <li>• Company info (industry, products, tech stack)</li>
                      <li>• 3-4 key insights</li>
                      <li>• 2-3 likely challenges</li>
                      <li>• 3-4 paragraph email (150-200 words)</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  <strong>Config:</strong> 8 max turns • $1.00 budget cap • No LinkedIn • Best for mid-priority leads
                </div>
              </div>

              {/* Premium Tier */}
              <div className="border-2 border-purple-200 bg-purple-50/30 rounded-xl p-6 mb-8" id="premium-tier">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-md text-sm font-semibold">Premium</span>
                  <span className="text-sm text-gray-500">Full research • ~5 minutes</span>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Tools Used</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• WebSearch (5-8 calls)</li>
                      <li>• WebFetch</li>
                      <li>• <strong>scrape_company_website</strong> (Cheerio)</li>
                      <li>• <strong>scrape_linkedin</strong> (Puppeteer)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Output</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Comprehensive role summary</li>
                      <li>• Full company info + recent news</li>
                      <li>• Person info (bio, experience, expertise)</li>
                      <li>• 3-5 key insights</li>
                      <li>• 2-4 challenges + talking points</li>
                      <li>• 4-5 paragraph email (200-300 words)</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  <strong>Config:</strong> 15 max turns • $2.00 budget cap • Full LinkedIn access • Best for high-value leads
                </div>
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
                      <td className="px-4 py-3 text-sm text-gray-900">Frontend</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Next.js 16 + React 19</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Server-side rendered web app</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Styling</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Tailwind CSS 4</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Utility-first CSS</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Database</td>
                      <td className="px-4 py-3 text-sm text-gray-600">PostgreSQL</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Lead storage + audit trail</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Queue</td>
                      <td className="px-4 py-3 text-sm text-gray-600">BullMQ + Upstash Redis</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Background job processing</td>
                    </tr>
                    <tr className="bg-teal-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-semibold">AI</td>
                      <td className="px-4 py-3 text-sm text-teal-700 font-semibold">Claude Agent SDK</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Agentic AI with tool use</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Scraping</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Cheerio + Puppeteer</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Website + LinkedIn extraction</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Validation</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Zod</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Schema validation</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Hosting</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Vercel + Railway</td>
                      <td className="px-4 py-3 text-sm text-gray-600">App + Worker deployment</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* AI Tools */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="ai-tools">AI Agent Tools (MCP)</h2>
              <p className="text-gray-600 mb-4">
                Claude uses the Model Context Protocol (MCP) to access custom scraping tools:
              </p>

              <div className="space-y-4 mb-8">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">Built-in</span>
                    <code className="text-sm font-semibold text-gray-900">WebSearch</code>
                  </div>
                  <p className="text-sm text-gray-600">Search the web using Google. Returns search results with titles, URLs, and snippets.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">Built-in</span>
                    <code className="text-sm font-semibold text-gray-900">WebFetch</code>
                  </div>
                  <p className="text-sm text-gray-600">Fetch and read web pages. Converts HTML to readable markdown.</p>
                </div>
                <div className="border border-teal-200 bg-teal-50/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-1 rounded">Custom MCP</span>
                    <code className="text-sm font-semibold text-gray-900">scrape_company_website</code>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Extracts structured data from company websites using Cheerio:</p>
                  <ul className="text-xs text-gray-500 space-y-1 ml-4">
                    <li>• Meta tags (title, description, OG data)</li>
                    <li>• About section content</li>
                    <li>• Products/services mentioned</li>
                    <li>• Team members (if listed)</li>
                    <li>• Contact info and social links</li>
                  </ul>
                </div>
                <div className="border border-purple-200 bg-purple-50/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded">Custom MCP</span>
                    <code className="text-sm font-semibold text-gray-900">scrape_linkedin</code>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Extracts professional data from LinkedIn profiles using Puppeteer:</p>
                  <ul className="text-xs text-gray-500 space-y-1 ml-4">
                    <li>• Name, headline, location</li>
                    <li>• About/summary section</li>
                    <li>• Work experience history</li>
                    <li>• Education background</li>
                    <li>• Falls back to meta tags if login wall detected</li>
                  </ul>
                </div>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Database */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="database">Database Schema</h2>
              <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`-- Leads Table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  linkedin_url TEXT,
  company_website TEXT,
  enrichment_tier VARCHAR(20) CHECK (tier IN ('standard', 'medium', 'premium')),
  status VARCHAR(50) CHECK (status IN ('pending', 'processing', 'enriched', 'failed')),
  enrichment_data JSONB,
  enrichment_sources JSONB,
  draft_email TEXT,
  error_message TEXT,
  expires_at TIMESTAMP,  -- 90-day retention
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Audit Trail Table
CREATE TABLE enrichment_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  tier VARCHAR(20),
  status VARCHAR(20),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  tool_calls INTEGER,
  tools_used TEXT[],
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd DECIMAL(10, 6)
);`}
                </pre>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
                <h4 className="font-semibold text-amber-800 mb-1">Data Retention</h4>
                <p className="text-sm text-amber-700">
                  A daily cron job (<code>/api/cron/cleanup</code>) automatically deletes leads older than 90 days
                  to comply with data retention policies.
                </p>
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
                  <p className="text-sm text-gray-600">Submit a new lead for enrichment. Queues job automatically.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">GET</span>
                    <code className="text-sm text-gray-900">/api/health</code>
                  </div>
                  <p className="text-sm text-gray-600">Health check for database and Redis connectivity.</p>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-3">Protected Endpoints</h3>
              <div className="space-y-3 mb-8">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">GET</span>
                    <code className="text-sm text-gray-900">/api/leads?page=1&limit=25&status=enriched</code>
                  </div>
                  <p className="text-sm text-gray-600">List leads with pagination and filtering.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">DELETE</span>
                    <code className="text-sm text-gray-900">/api/leads/[id]</code>
                  </div>
                  <p className="text-sm text-gray-600">Delete a lead from the database.</p>
                </div>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Environment Setup */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="environment-setup">Environment Setup</h2>
              <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/lead_enrichment

# Redis (use rediss:// for TLS/Upstash)
REDIS_URL=redis://localhost:6379

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Admin Auth
ADMIN_PASSWORD=your-secure-password

# Data Retention Cron
CRON_SECRET=your-cron-secret

# Optional
DEBUG=true`}
                </pre>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Production */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="production">Production Deployment</h2>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Component</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Web App</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Vercel</td>
                      <td className="px-4 py-3 text-sm text-gray-500">Auto-deploys from GitHub</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Worker</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Railway</td>
                      <td className="px-4 py-3 text-sm text-gray-500">npm run worker</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Database</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Neon / Supabase</td>
                      <td className="px-4 py-3 text-sm text-gray-500">Serverless PostgreSQL</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Redis</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Upstash</td>
                      <td className="px-4 py-3 text-sm text-gray-500">Serverless Redis with TLS</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`# Clone and install
git clone https://github.com/your-repo/lead-enrichment
cd lead-enrichment && npm install

# Run migrations
psql $DATABASE_URL -f migrations/001_create_leads.sql
psql $DATABASE_URL -f migrations/002_add_enrichment_fields.sql
psql $DATABASE_URL -f migrations/003_create_enrichment_audit.sql
psql $DATABASE_URL -f migrations/004_add_medium_tier.sql

# Start locally
npm run dev      # Web app on :3000
npm run worker   # Background worker`}
                </pre>
              </div>

            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
