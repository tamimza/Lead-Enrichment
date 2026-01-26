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
    title: 'Configuration',
    items: [
      { name: 'Configuration System', href: '#configuration' },
      { name: 'Business Context', href: '#business-context' },
      { name: 'Research Playbook', href: '#playbook' },
      { name: 'Information Priorities', href: '#priorities' },
      { name: 'Thinking Rules', href: '#rules' },
      { name: 'Email Template', href: '#email-template' },
      { name: 'Blacklist', href: '#blacklist' },
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
      { name: 'Admin Dashboard', href: '#admin-dashboard' },
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
            <p className="text-xl text-gray-600">AI-powered lead research with Guided AI - not random exploration.</p>
          </div>

          {/* Content Sections */}
          <div className="prose prose-gray max-w-none">
            {/* Overview */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Makes This Different?</h2>

              <p className="text-gray-600 mb-6 text-lg">
                Unlike generic AI tools that randomly explore the web, this platform uses <strong>Guided AI</strong> that follows YOUR rules.
                You control exactly what the AI searches for, how it interprets data, and how it drafts emails.
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-5">
                  <div className="text-2xl mb-2">🏢</div>
                  <p className="text-teal-800 font-semibold mb-1">Business Context</p>
                  <p className="text-sm text-teal-700">Your company info, products, and value props power personalized outreach</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                  <div className="text-2xl mb-2">🎯</div>
                  <p className="text-blue-800 font-semibold mb-1">Configurable Playbooks</p>
                  <p className="text-sm text-blue-700">Define exact search steps, tools, and queries the AI should execute</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                  <div className="text-2xl mb-2">🧠</div>
                  <p className="text-amber-800 font-semibold mb-1">Thinking Rules</p>
                  <p className="text-sm text-amber-700">IF/THEN logic for how AI interprets and prioritizes information</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
                  <div className="text-2xl mb-2">✉️</div>
                  <p className="text-purple-800 font-semibold mb-1">Email Templates</p>
                  <p className="text-sm text-purple-700">Full control over tone, sections, subject lines, and style</p>
                </div>
              </div>

              <div className="bg-gray-900 text-gray-100 rounded-xl p-6 mb-8">
                <p className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-2">Key Principle</p>
                <p className="text-lg">
                  Guided AI follows <span className="text-teal-400 font-semibold">YOUR rules</span>, not random exploration.
                  Every search, every interpretation, every email section is defined by your configuration.
                </p>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* How It Works */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="how-it-works">How It Works</h2>

              <div className="space-y-4 mb-8">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Lead Submitted</h4>
                    <p className="text-gray-600 text-sm">User fills out form with name, company, email, and optional LinkedIn/website</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Business Context + Config Loaded</h4>
                    <p className="text-gray-600 text-sm">System loads project&apos;s business context (company info, products, value props) and enrichment config (playbook, priorities, rules, email template)</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Dynamic Prompt Built</h4>
                    <p className="text-gray-600 text-sm">Business context and config elements are injected into the system prompt - AI knows your company and what to do</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Claude Researches (Guided)</h4>
                    <p className="text-gray-600 text-sm">AI follows playbook steps, uses specified tools, applies thinking rules to interpret findings</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">5</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email Generated</h4>
                    <p className="text-gray-600 text-sm">Email drafted using template sections, tone, and style guidelines you defined</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">6</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Blacklist Filtered</h4>
                    <p className="text-gray-600 text-sm">Final email is scanned against blacklist words/topics - filtered items are removed</p>
                  </div>
                </div>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Architecture Diagram */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="architecture">System Architecture</h2>

              {/* Visual Flow Diagram */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6 overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Phase Labels */}
                  <div className="flex justify-between mb-4 text-xs font-semibold uppercase tracking-wider">
                    <span className="text-teal-600">Phase 1: Ingestion</span>
                    <span className="text-amber-600">Phase 2: Config + Enrichment</span>
                    <span className="text-purple-600">Phase 3: Output</span>
                  </div>

                  {/* Main Flow */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Connect Form */}
                    <div className="bg-white border-2 border-teal-500 rounded-lg p-3 text-center shadow-sm w-24">
                      <div className="text-xl mb-1">📝</div>
                      <div className="text-xs font-semibold text-gray-900">/connect</div>
                      <div className="text-xs text-gray-500">Form</div>
                    </div>

                    <div className="text-gray-400">→</div>

                    {/* API */}
                    <div className="bg-white border border-gray-300 rounded-lg p-3 text-center shadow-sm w-24">
                      <div className="text-xl mb-1">⚡</div>
                      <div className="text-xs font-semibold text-gray-900">API</div>
                      <div className="text-xs text-gray-500">Validate</div>
                    </div>

                    <div className="text-gray-400">→</div>

                    {/* Config */}
                    <div className="bg-white border-2 border-amber-400 rounded-lg p-3 text-center shadow-sm w-24">
                      <div className="text-xl mb-1">⚙️</div>
                      <div className="text-xs font-semibold text-gray-900">Config</div>
                      <div className="text-xs text-gray-500">Load DB</div>
                    </div>

                    <div className="text-gray-400">→</div>

                    {/* Worker */}
                    <div className="bg-white border-2 border-amber-500 rounded-lg p-3 text-center shadow-sm w-24">
                      <div className="text-xl mb-1">🤖</div>
                      <div className="text-xs font-semibold text-gray-900">Claude</div>
                      <div className="text-xs text-gray-500">Guided AI</div>
                    </div>

                    <div className="text-gray-400">→</div>

                    {/* Blacklist */}
                    <div className="bg-white border-2 border-red-400 rounded-lg p-3 text-center shadow-sm w-24">
                      <div className="text-xl mb-1">🚫</div>
                      <div className="text-xs font-semibold text-gray-900">Blacklist</div>
                      <div className="text-xs text-gray-500">Filter</div>
                    </div>

                    <div className="text-gray-400">→</div>

                    {/* Admin */}
                    <div className="bg-white border-2 border-purple-500 rounded-lg p-3 text-center shadow-sm w-24">
                      <div className="text-xl mb-1">📊</div>
                      <div className="text-xs font-semibold text-gray-900">/admin</div>
                      <div className="text-xs text-gray-500">Dashboard</div>
                    </div>
                  </div>

                  {/* Config Elements */}
                  <div className="mt-6 flex justify-center">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 inline-block">
                      <div className="text-xs font-semibold text-amber-700 uppercase mb-2 text-center">Dynamic Prompt Injection</div>
                      <div className="flex gap-2 flex-wrap justify-center">
                        <div className="bg-white border border-teal-400 rounded px-2 py-1 text-xs font-medium text-teal-700">Business Context</div>
                        <div className="bg-white border border-amber-300 rounded px-2 py-1 text-xs">Playbook</div>
                        <div className="bg-white border border-amber-300 rounded px-2 py-1 text-xs">Priorities</div>
                        <div className="bg-white border border-amber-300 rounded px-2 py-1 text-xs">Rules</div>
                        <div className="bg-white border border-amber-300 rounded px-2 py-1 text-xs">Email Template</div>
                        <div className="bg-white border border-amber-300 rounded px-2 py-1 text-xs">Blacklist</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Configuration System */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="configuration">Configuration System</h2>
              <p className="text-gray-600 mb-6">
                The heart of Guided AI. Each project has its own business context and enrichment configurations that control every aspect of the research and email generation process.
              </p>

              {/* Business Context */}
              <div className="border-2 border-teal-200 bg-teal-50/30 rounded-xl p-6 mb-4" id="business-context">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-md text-sm font-semibold">Business Context</span>
                  <span className="text-xs text-teal-600">Foundation for personalization</span>
                </div>
                <p className="text-gray-600 mb-4">
                  Your company&apos;s identity that the AI uses to personalize research and emails. This context is injected into every enrichment, ensuring the AI understands who you are and what you offer.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white border border-teal-200 rounded-lg p-4">
                    <h5 className="font-semibold text-teal-800 text-sm mb-2">Company Information</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Company Name</strong> - Your business name</li>
                      <li>• <strong>Description</strong> - What your company does</li>
                      <li>• <strong>Products/Services</strong> - What you offer</li>
                      <li>• <strong>Industry Focus</strong> - Sectors you serve</li>
                    </ul>
                  </div>
                  <div className="bg-white border border-teal-200 rounded-lg p-4">
                    <h5 className="font-semibold text-teal-800 text-sm mb-2">Value Messaging</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Value Propositions</strong> - Key benefits you provide</li>
                      <li>• <strong>Differentiators</strong> - What makes you unique</li>
                      <li>• <strong>Target Customer</strong> - Ideal customer profile</li>
                      <li>• <strong>Competitors</strong> - Who you compete with</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-white border border-teal-200 rounded-lg p-4">
                  <h5 className="font-semibold text-teal-800 text-sm mb-2">Sender Details</h5>
                  <p className="text-sm text-gray-600 mb-2">Used for email signatures and personalization:</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>• Sender Name</span>
                    <span>• Title/Role</span>
                    <span>• Email Address</span>
                    <span>• Calendar Link</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  <strong>AI-Assisted Setup:</strong> When creating a project, you can provide your website URL and the AI will automatically extract and populate your business context.
                </div>
              </div>

              {/* Research Playbook */}
              <div className="border border-gray-200 rounded-xl p-6 mb-4" id="playbook">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-md text-sm font-semibold">Research Playbook</span>
                </div>
                <p className="text-gray-600 mb-4">
                  Define the exact search steps the AI should execute. Each step specifies:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li><strong>Tool:</strong> Which tool to use (WebSearch, WebFetch, scrape_company_website, scrape_linkedin)</li>
                    <li><strong>Query Template:</strong> Search query with variables like {"{{company_name}}"}, {"{{person_name}}"}</li>
                    <li><strong>Purpose:</strong> What this step is trying to find</li>
                    <li><strong>Required:</strong> Whether this step must complete successfully</li>
                  </ul>
                </div>
                <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-100 overflow-x-auto">
                  <pre>{`Step 1: WebSearch "{{company_name}} company overview products"
Step 2: scrape_company_website (if website provided)
Step 3: WebSearch "{{person_name}} {{company_name}} role responsibilities"
Step 4: scrape_linkedin (Premium tier only)`}</pre>
                </div>
              </div>

              {/* Information Priorities */}
              <div className="border border-gray-200 rounded-xl p-6 mb-4" id="priorities">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm font-semibold">Information Priorities</span>
                </div>
                <p className="text-gray-600 mb-4">
                  Rank what information matters most. The AI will prioritize finding and including higher-ranked items.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ol className="text-sm text-gray-700 space-y-1">
                    <li>1. <strong>Company recent news</strong> - Product launches, funding, partnerships</li>
                    <li>2. <strong>Person&apos;s role and responsibilities</strong> - What they actually do</li>
                    <li>3. <strong>Company pain points</strong> - Challenges they might be facing</li>
                    <li>4. <strong>Tech stack</strong> - Tools and technologies they use</li>
                    <li>5. <strong>Company culture</strong> - Values and work environment</li>
                  </ol>
                </div>
              </div>

              {/* Thinking Rules */}
              <div className="border border-gray-200 rounded-xl p-6 mb-4" id="rules">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-md text-sm font-semibold">Thinking Rules</span>
                </div>
                <p className="text-gray-600 mb-4">
                  IF/THEN logic for how the AI should interpret findings and make decisions.
                </p>
                <div className="bg-gray-900 rounded-lg p-4 text-xs text-gray-100 overflow-x-auto">
                  <pre>{`IF company recently raised funding
  THEN mention growth trajectory, not cost savings

IF person is C-level executive
  THEN focus on strategic value, not operational details

IF company is a startup (<50 employees)
  THEN emphasize agility and speed benefits

IF no recent news found
  THEN focus on evergreen company information from website`}</pre>
                </div>
              </div>

              {/* Email Template */}
              <div className="border border-gray-200 rounded-xl p-6 mb-4" id="email-template">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-md text-sm font-semibold">Email Template</span>
                </div>
                <p className="text-gray-600 mb-4">
                  Full control over the generated email structure and style.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 text-sm mb-2">Structure</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Subject line template</li>
                      <li>• Opening hook style</li>
                      <li>• Custom sections (drag to reorder)</li>
                      <li>• Closing/CTA style</li>
                      <li>• Min/max paragraphs</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 text-sm mb-2">Tone Options</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Professional</li>
                      <li>• Friendly</li>
                      <li>• Casual</li>
                      <li>• Formal</li>
                      <li>• Conversational</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Blacklist */}
              <div className="border border-red-200 bg-red-50/30 rounded-xl p-6 mb-8" id="blacklist">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm font-semibold">Blacklist</span>
                </div>
                <p className="text-gray-600 mb-4">
                  Words and topics to never mention. Applied in two ways:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-red-200 rounded-lg p-4">
                    <h5 className="font-semibold text-red-800 text-sm mb-2">1. Prompt Injection</h5>
                    <p className="text-xs text-gray-600">Blacklist items are included in the system prompt, instructing the AI to avoid these topics during research and writing.</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-4">
                    <h5 className="font-semibold text-red-800 text-sm mb-2">2. Post-Processing Filter</h5>
                    <p className="text-xs text-gray-600">After email generation, a secondary filter scans for any blacklisted words and removes/replaces them.</p>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  <strong>Example blacklist items:</strong> competitor names, sensitive topics, pricing specifics, legal claims
                </div>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Enrichment Tiers */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Enrichment Tiers</h2>
              <p className="text-gray-600 mb-6">
                Choose the level of research depth based on lead importance. Each tier has different resource limits.
              </p>

              {/* Standard Tier */}
              <div className="border border-gray-200 rounded-xl p-6 mb-4" id="standard-tier">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm font-semibold">Standard</span>
                  <span className="text-sm text-gray-500">Quick insights</span>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Resource Limits</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>10</strong> max turns</li>
                      <li>• <strong>6</strong> tool calls</li>
                      <li>• <strong>$0.30</strong> budget cap</li>
                      <li>• No LinkedIn access</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Output</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Basic role summary</li>
                      <li>• Company focus</li>
                      <li>• 2-3 key insights</li>
                      <li>• <strong>100-150 word</strong> email</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Best for high-volume, lower-priority leads
                </div>
              </div>

              {/* Medium Tier */}
              <div className="border-2 border-amber-200 bg-amber-50/30 rounded-xl p-6 mb-4" id="medium-tier">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-md text-sm font-semibold">Medium</span>
                  <span className="text-sm text-gray-500">Company research</span>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Resource Limits</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>14</strong> max turns</li>
                      <li>• <strong>8</strong> tool calls</li>
                      <li>• <strong>$0.50</strong> budget cap</li>
                      <li>• No LinkedIn access</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Output</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Detailed role summary</li>
                      <li>• Company info (industry, products)</li>
                      <li>• 3-4 key insights + challenges</li>
                      <li>• <strong>150-200 word</strong> email</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Best for mid-priority leads with company website available
                </div>
              </div>

              {/* Premium Tier */}
              <div className="border-2 border-purple-200 bg-purple-50/30 rounded-xl p-6 mb-8" id="premium-tier">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-md text-sm font-semibold">Premium</span>
                  <span className="text-sm text-gray-500">Full web research + LinkedIn</span>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Resource Limits</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>18</strong> max turns</li>
                      <li>• <strong>10</strong> tool calls</li>
                      <li>• <strong>$1.20</strong> budget cap</li>
                      <li>• <strong>LinkedIn access enabled</strong></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Output</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Comprehensive role summary</li>
                      <li>• Full company info + recent news</li>
                      <li>• Person bio, experience, expertise</li>
                      <li>• <strong>200-300 word</strong> email</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Best for high-value leads where personalization matters most
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
                      <td className="px-4 py-3 text-sm text-gray-600">Next.js 15 + React 19</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Server-side rendered web app</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">UI Components</td>
                      <td className="px-4 py-3 text-sm text-gray-600">shadcn/ui + Radix</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Accessible component library</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Styling</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Tailwind CSS 4</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Utility-first CSS</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Database</td>
                      <td className="px-4 py-3 text-sm text-gray-600">PostgreSQL</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Lead storage + config + audit trail</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Queue</td>
                      <td className="px-4 py-3 text-sm text-gray-600">BullMQ + Upstash Redis</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Background job processing</td>
                    </tr>
                    <tr className="bg-teal-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-semibold">AI</td>
                      <td className="px-4 py-3 text-sm text-teal-700 font-semibold">Claude Agent SDK</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Guided AI with tool use + MCP</td>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="ai-tools">AI Agent Tools</h2>
              <p className="text-gray-600 mb-4">
                Claude uses built-in tools and custom MCP (Model Context Protocol) tools for scraping:
              </p>

              <div className="space-y-4 mb-8">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">Built-in</span>
                    <code className="text-sm font-semibold text-gray-900">WebSearch</code>
                  </div>
                  <p className="text-sm text-gray-600">Search the web using Google. Returns search results with titles, URLs, and snippets. Used for finding company info, news, and person details.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">Built-in</span>
                    <code className="text-sm font-semibold text-gray-900">WebFetch</code>
                  </div>
                  <p className="text-sm text-gray-600">Fetch and read web pages. Converts HTML to readable markdown. Used for reading articles, blog posts, and news pages.</p>
                </div>
                <div className="border border-teal-200 bg-teal-50/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-1 rounded">Custom MCP</span>
                    <code className="text-sm font-semibold text-gray-900">scrape_company_website</code>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Extracts structured data from company websites using <strong>Cheerio</strong> (fast, lightweight):</p>
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
                    <span className="text-xs text-purple-600 ml-2">Premium tier only</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Extracts professional data from LinkedIn profiles using <strong>Puppeteer</strong> (browser automation):</p>
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

              {/* Admin Dashboard */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="admin-dashboard">Admin Dashboard</h2>
              <p className="text-gray-600 mb-4">
                The admin dashboard at <code>/admin</code> provides full control over the system:
              </p>

              <div className="space-y-3 mb-8">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-semibold text-gray-900">/admin</code>
                  </div>
                  <p className="text-sm text-gray-600">Main dashboard - view all leads, filter by status, view enrichment details and draft emails</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-semibold text-gray-900">/admin/projects</code>
                  </div>
                  <p className="text-sm text-gray-600">Project management - create, switch between, and manage projects</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-semibold text-gray-900">/admin/settings</code>
                  </div>
                  <p className="text-sm text-gray-600">AI Settings overview - manage configurations per tier, set active config</p>
                </div>
                <div className="border border-teal-100 bg-teal-50/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-semibold text-gray-900">/admin/settings/business-context</code>
                  </div>
                  <p className="text-sm text-gray-600">Business Context - company info, products, value props, sender details</p>
                </div>
                <div className="border border-teal-100 bg-teal-50/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-semibold text-gray-900">/admin/settings/playbook</code>
                  </div>
                  <p className="text-sm text-gray-600">Research Playbook - define search steps, tools, and queries</p>
                </div>
                <div className="border border-blue-100 bg-blue-50/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-semibold text-gray-900">/admin/settings/priorities</code>
                  </div>
                  <p className="text-sm text-gray-600">Information Priorities - rank what data matters most</p>
                </div>
                <div className="border border-amber-100 bg-amber-50/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-semibold text-gray-900">/admin/settings/rules</code>
                  </div>
                  <p className="text-sm text-gray-600">Thinking Rules - IF/THEN logic for AI interpretation</p>
                </div>
                <div className="border border-purple-100 bg-purple-50/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-semibold text-gray-900">/admin/settings/email</code>
                  </div>
                  <p className="text-sm text-gray-600">Email Template - sections, tone, subject line, length constraints</p>
                </div>
                <div className="border border-red-100 bg-red-50/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-semibold text-gray-900">/admin/settings/blacklist</code>
                  </div>
                  <p className="text-sm text-gray-600">Blacklist - words and topics to never mention</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-semibold text-gray-900">/admin/settings/templates</code>
                  </div>
                  <p className="text-sm text-gray-600">Template Library - pre-built configurations for different industries</p>
                </div>
              </div>

              <hr className="my-8 border-gray-200" />

              {/* Database */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4" id="database">Database Schema</h2>

              <h3 className="font-semibold text-gray-900 mb-3">Core Tables</h3>
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
  enrichment_tier VARCHAR(20),
  status VARCHAR(50),
  enrichment_data JSONB,
  enrichment_sources JSONB,
  draft_email TEXT,
  error_message TEXT,
  expires_at TIMESTAMP,
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

              <h3 className="font-semibold text-gray-900 mb-3">Projects Table</h3>
              <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`-- Projects (Business Context)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  company_website TEXT,
  company_description TEXT,
  products TEXT[],               -- array of products/services
  value_propositions TEXT[],     -- key value props
  differentiators TEXT[],        -- what makes you unique
  target_customer_profile TEXT,  -- ideal customer description
  industry_focus TEXT[],         -- industries you serve
  competitors TEXT[],            -- competitor names
  sender_name VARCHAR(255),
  sender_title VARCHAR(255),
  sender_email VARCHAR(255),
  calendar_link TEXT,
  scraped_data JSONB,            -- website scraping results
  setup_method VARCHAR(20),      -- 'ai_assisted', 'template', 'manual'
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`}
                </pre>
              </div>

              <h3 className="font-semibold text-gray-900 mb-3">Configuration Tables</h3>
              <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
{`-- Enrichment Configurations (per tier, linked to project)
CREATE TABLE enrichment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),  -- links to project
  org_id UUID,  -- for multi-tenant support
  tier VARCHAR(20) NOT NULL,  -- standard, medium, premium
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Research Playbook Steps
CREATE TABLE search_playbook_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES enrichment_configs(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  tool_name VARCHAR(50) NOT NULL,  -- WebSearch, WebFetch, scrape_company_website, scrape_linkedin
  query_template TEXT,
  purpose TEXT,
  is_required BOOLEAN DEFAULT false
);

-- Information Priorities
CREATE TABLE information_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES enrichment_configs(id) ON DELETE CASCADE,
  priority_order INTEGER NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  weight INTEGER DEFAULT 1
);

-- Thinking Rules (IF/THEN)
CREATE TABLE thinking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES enrichment_configs(id) ON DELETE CASCADE,
  rule_order INTEGER NOT NULL,
  condition_text TEXT NOT NULL,  -- IF part
  action_text TEXT NOT NULL,     -- THEN part
  is_active BOOLEAN DEFAULT true
);

-- Email Templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES enrichment_configs(id) ON DELETE CASCADE,
  tone VARCHAR(50) DEFAULT 'professional',
  subject_template TEXT,
  opening_style TEXT,
  closing_style TEXT,
  writing_style TEXT,
  min_paragraphs INTEGER DEFAULT 3,
  max_paragraphs INTEGER DEFAULT 5,
  sections JSONB  -- array of {name, instructions, example, required, order}
);

-- Blacklist Items
CREATE TABLE blacklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES enrichment_configs(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL,  -- word, phrase, topic, competitor
  value TEXT NOT NULL,
  reason TEXT
);

-- Template Library (pre-built configs)
CREATE TABLE template_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  industry VARCHAR(100),
  tier VARCHAR(20) NOT NULL,
  config_snapshot JSONB NOT NULL,  -- full config as JSON
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
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

              <h3 className="font-semibold text-gray-900 mb-3">Protected Endpoints (Require Auth)</h3>
              <div className="space-y-3 mb-6">
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

              <h3 className="font-semibold text-gray-900 mb-3">Project Endpoints</h3>
              <div className="space-y-3 mb-6">
                <div className="border border-teal-200 bg-teal-50/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">GET</span>
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">POST</span>
                    <code className="text-sm text-gray-900">/api/admin/project</code>
                  </div>
                  <p className="text-sm text-gray-600">List all projects / Create new project with business context</p>
                </div>
                <div className="border border-teal-200 bg-teal-50/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">GET</span>
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded">PUT</span>
                    <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">DELETE</span>
                    <code className="text-sm text-gray-900">/api/admin/project/[id]</code>
                  </div>
                  <p className="text-sm text-gray-600">Get / Update / Delete specific project</p>
                </div>
                <div className="border border-teal-200 bg-teal-50/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">POST</span>
                    <code className="text-sm text-gray-900">/api/admin/project/[id]?action=activate</code>
                  </div>
                  <p className="text-sm text-gray-600">Set project as active (switches context for all operations)</p>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-3">Admin Config Endpoints</h3>
              <div className="space-y-3 mb-8">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">GET</span>
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">POST</span>
                    <code className="text-sm text-gray-900">/api/admin/enrichment-config</code>
                  </div>
                  <p className="text-sm text-gray-600">List all configs / Create new config</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">GET</span>
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded">PUT</span>
                    <code className="text-sm text-gray-900">/api/admin/enrichment-config/[id]</code>
                  </div>
                  <p className="text-sm text-gray-600">Get / Update specific config</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded">PUT</span>
                    <code className="text-sm text-gray-900">/api/admin/enrichment-config/[id]/playbook</code>
                  </div>
                  <p className="text-sm text-gray-600">Update research playbook steps</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded">PUT</span>
                    <code className="text-sm text-gray-900">/api/admin/enrichment-config/[id]/priorities</code>
                  </div>
                  <p className="text-sm text-gray-600">Update information priorities</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded">PUT</span>
                    <code className="text-sm text-gray-900">/api/admin/enrichment-config/[id]/rules</code>
                  </div>
                  <p className="text-sm text-gray-600">Update thinking rules</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded">PUT</span>
                    <code className="text-sm text-gray-900">/api/admin/enrichment-config/[id]/email-template</code>
                  </div>
                  <p className="text-sm text-gray-600">Update email template</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded">PUT</span>
                    <code className="text-sm text-gray-900">/api/admin/enrichment-config/[id]/blacklist</code>
                  </div>
                  <p className="text-sm text-gray-600">Update blacklist items</p>
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
psql $DATABASE_URL -f migrations/005_create_enrichment_configs.sql
psql $DATABASE_URL -f migrations/006_add_email_templates.sql
psql $DATABASE_URL -f migrations/007_create_template_library.sql

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
