-- Migration 007: Seed Default Configurations for All Tiers
-- B2B SaaS Sales Outreach Use Case

-- =============================================================================
-- STANDARD TIER - Quick Research, Basic Company Info
-- =============================================================================

INSERT INTO enrichment_configs (
  tier, name, description, is_active, max_turns, max_budget_usd,
  allowed_tools, email_tone, email_min_words, email_max_words
) VALUES (
  'standard',
  'B2B SaaS - Standard',
  'Quick research configuration for B2B SaaS sales outreach. Focuses on basic company info and role context with efficient tool usage.',
  true,
  6,
  0.30,
  ARRAY['WebSearch', 'WebFetch', 'scrape_company_website'],
  'professional',
  100,
  150
);

-- =============================================================================
-- MEDIUM TIER - Comprehensive Web Research, Industry Context
-- =============================================================================

INSERT INTO enrichment_configs (
  tier, name, description, is_active, max_turns, max_budget_usd,
  allowed_tools, email_tone, email_min_words, email_max_words
) VALUES (
  'medium',
  'B2B SaaS - Medium',
  'Comprehensive research configuration for B2B SaaS sales. Deep web research with industry context and competitive awareness.',
  true,
  8,
  0.50,
  ARRAY['WebSearch', 'WebFetch', 'scrape_company_website'],
  'professional',
  150,
  200
);

-- =============================================================================
-- PREMIUM TIER - Deep Research, LinkedIn Insights, Competitive Analysis
-- =============================================================================

INSERT INTO enrichment_configs (
  tier, name, description, is_active, max_turns, max_budget_usd,
  allowed_tools, email_tone, email_min_words, email_max_words
) VALUES (
  'premium',
  'B2B SaaS - Premium',
  'Deep research configuration with LinkedIn insights and comprehensive competitive analysis. For high-value prospects requiring maximum personalization.',
  true,
  12,
  1.20,
  ARRAY['WebSearch', 'WebFetch', 'scrape_company_website', 'scrape_linkedin'],
  'conversational',
  200,
  300
);

-- =============================================================================
-- POPULATE PLAYBOOK STEPS, PRIORITIES, RULES, TEMPLATES, BLACKLIST
-- =============================================================================

DO $$
DECLARE
  standard_id UUID;
  medium_id UUID;
  premium_id UUID;
BEGIN

-- Get config IDs
SELECT id INTO standard_id FROM enrichment_configs WHERE tier = 'standard' AND name = 'B2B SaaS - Standard';
SELECT id INTO medium_id FROM enrichment_configs WHERE tier = 'medium' AND name = 'B2B SaaS - Medium';
SELECT id INTO premium_id FROM enrichment_configs WHERE tier = 'premium' AND name = 'B2B SaaS - Premium';

-- =============================================================================
-- STANDARD TIER DETAILS
-- =============================================================================

-- Standard Playbook Steps (6 steps)
INSERT INTO search_playbook_steps (config_id, step_order, name, description, search_type, query_template, required_variables, skip_if_found, required_tier) VALUES
(standard_id, 1, 'Company Overview Search', 'Search for basic company information and what they do', 'web_search', '{{company_name}} company overview products services', ARRAY['company_name'], NULL, 'standard'),
(standard_id, 2, 'Company Website Scrape', 'Scrape company website for detailed information', 'company_website', '{{company_website}}', ARRAY['company_website'], ARRAY['company_description', 'products_services'], 'standard'),
(standard_id, 3, 'Industry Context', 'Understand the industry and market context', 'web_search', '{{company_name}} industry market competitors', ARRAY['company_name'], ARRAY['industry'], 'standard'),
(standard_id, 4, 'Role Research', 'Research typical responsibilities for this role', 'web_search', '{{job_title}} responsibilities {{company_name}}', ARRAY['job_title', 'company_name'], ARRAY['role_summary'], 'standard'),
(standard_id, 5, 'Recent News', 'Find recent company news or announcements', 'web_search', '{{company_name}} news announcement 2024 2025', ARRAY['company_name'], ARRAY['recent_news'], 'standard'),
(standard_id, 6, 'Pain Points Research', 'Identify common challenges for this type of company', 'web_search', '{{industry}} challenges pain points {{job_title}}', ARRAY['industry', 'job_title'], NULL, 'standard');

-- Standard Information Priorities (8 priorities)
INSERT INTO information_priorities (config_id, priority_order, name, description, category, weight, is_required, extraction_hint) VALUES
(standard_id, 1, 'Company Description', 'What the company does and their value proposition', 'company', 10, true, 'Look for About page, company description, mission statement'),
(standard_id, 2, 'Products/Services', 'Main products or services offered', 'company', 9, true, 'Check products page, pricing page, or features section'),
(standard_id, 3, 'Role Summary', 'What this person likely does day-to-day', 'person', 8, true, 'Infer from job title and company type'),
(standard_id, 4, 'Industry', 'The industry or market segment', 'company', 7, true, 'Determine from company description and competitors'),
(standard_id, 5, 'Company Size', 'Approximate employee count or company stage', 'company', 6, false, 'Look for team page, LinkedIn, or Crunchbase data'),
(standard_id, 6, 'Key Challenges', 'Pain points this person likely faces', 'insights', 5, false, 'Infer from role and industry context'),
(standard_id, 7, 'Recent Activity', 'Recent news, funding, or announcements', 'company', 4, false, 'Check news, press releases, blog'),
(standard_id, 8, 'Technology Stack', 'Technologies they use if relevant', 'company', 3, false, 'Check job postings, BuiltWith, or website source');

-- Standard Thinking Rules (5 rules)
INSERT INTO thinking_rules (config_id, rule_order, name, description, condition_type, condition_field, condition_value, condition_operator, action_type, action_value) VALUES
(standard_id, 1, 'Startup Focus', 'Adjust approach for early-stage companies', 'value_contains', 'company_size', 'startup,seed,series a,early stage', 'contains', 'modify_tone', '{"type": "modify_tone", "value": "more casual and growth-focused"}'),
(standard_id, 2, 'Enterprise Tone', 'Use formal approach for large enterprises', 'value_contains', 'company_size', 'enterprise,fortune 500,10000+', 'contains', 'modify_tone', '{"type": "modify_tone", "value": "more formal and ROI-focused"}'),
(standard_id, 3, 'Recent Funding', 'Highlight growth if recent funding found', 'data_found', 'recent_funding', NULL, 'exists', 'add_insight', '{"type": "add_insight", "value": "growth trajectory and expansion plans"}'),
(standard_id, 4, 'Missing Website', 'Focus on inference when no website available', 'data_missing', 'company_website', NULL, 'not_exists', 'set_priority', '{"type": "set_priority", "value": "industry research and role inference"}'),
(standard_id, 5, 'Technical Role', 'Include tech context for technical roles', 'value_contains', 'job_title', 'CTO,engineer,developer,technical,IT', 'contains', 'include_section', '{"type": "include_section", "value": "technical capabilities and integration ease"}');

-- Standard Email Template with JSONB sections
INSERT INTO email_templates (config_id, name, subject_template, tone, writing_style, opening_style, closing_style, signature_template, min_paragraphs, max_paragraphs, sections)
VALUES (
  standard_id,
  'B2B SaaS Standard Template',
  'Quick question about {{company_name}}''s {{focus_area}}',
  'professional',
  'Concise and direct. Get to the point quickly while showing you''ve done basic research. Avoid fluff and generic statements.',
  'Start with a specific observation about their company or role - not a generic "I hope this finds you well"',
  'End with a low-commitment ask - suggest a brief call or offer to share relevant information',
  NULL,
  3,
  4,
  '[
    {"id": "greeting", "name": "Personalized Opening", "order": 0, "required": true, "instructions": "Reference something specific about their company or role. Show you did research.", "example": "I noticed {{company_name}} focuses on {{product_focus}} - the approach to {{specific_feature}} caught my attention."},
    {"id": "company_ref", "name": "Company Connection", "order": 1, "required": true, "instructions": "Connect your understanding of their business to why you''re reaching out.", "example": "Given your role leading {{department}} at a {{company_stage}} {{industry}} company..."},
    {"id": "value_prop", "name": "Value Statement", "order": 2, "required": true, "instructions": "Briefly state how you might help, tied to their likely challenges.", "example": "We help {{industry}} companies like yours {{specific_benefit}} without {{common_pain_point}}."},
    {"id": "cta", "name": "Call to Action", "order": 3, "required": true, "instructions": "Make a specific, low-commitment ask.", "example": "Would a 15-minute call this week make sense to explore if there''s a fit?"},
    {"id": "closing", "name": "Professional Close", "order": 4, "required": true, "instructions": "End warmly but professionally.", "example": "Either way, best of luck with {{recent_initiative_or_goal}}."}
  ]'::jsonb
);

-- Standard Blacklist
INSERT INTO blacklist_items (config_id, item_type, value, reason, replacement) VALUES
(standard_id, 'phrase', 'I hope this email finds you well', 'Generic and overused opener', NULL),
(standard_id, 'phrase', 'I wanted to reach out', 'Weak and passive language', NULL),
(standard_id, 'phrase', 'touch base', 'Corporate jargon', 'connect'),
(standard_id, 'phrase', 'pick your brain', 'Overused and slightly odd', 'get your thoughts'),
(standard_id, 'phrase', 'circle back', 'Corporate jargon', 'follow up'),
(standard_id, 'word', 'synergy', 'Buzzword, sounds insincere', 'collaboration'),
(standard_id, 'word', 'leverage', 'Overused business jargon', 'use'),
(standard_id, 'word', 'utilize', 'Unnecessarily formal', 'use'),
(standard_id, 'word', 'bandwidth', 'Jargon for availability', 'time'),
(standard_id, 'word', 'robust', 'Overused product descriptor', 'powerful'),
(standard_id, 'topic', 'pricing', 'Too early to discuss pricing', NULL),
(standard_id, 'topic', 'discount', 'Devalues the offering', NULL),
(standard_id, 'topic', 'free trial', 'Save for later in conversation', NULL),
(standard_id, 'phrase', 'game-changer', 'Hyperbolic and overused', NULL),
(standard_id, 'phrase', 'best-in-class', 'Empty marketing speak', NULL);

-- =============================================================================
-- MEDIUM TIER DETAILS
-- =============================================================================

-- Medium Playbook Steps (8 steps)
INSERT INTO search_playbook_steps (config_id, step_order, name, description, search_type, query_template, required_variables, skip_if_found, required_tier) VALUES
(medium_id, 1, 'Company Deep Dive', 'Comprehensive company overview search', 'web_search', '{{company_name}} company overview products services funding', ARRAY['company_name'], NULL, 'standard'),
(medium_id, 2, 'Website Analysis', 'Deep scrape of company website', 'company_website', '{{company_website}}', ARRAY['company_website'], NULL, 'standard'),
(medium_id, 3, 'Funding & Growth', 'Research funding history and growth trajectory', 'web_search', '{{company_name}} funding investors valuation growth', ARRAY['company_name'], ARRAY['recent_funding'], 'medium'),
(medium_id, 4, 'Competitive Landscape', 'Understand their competitive position', 'web_search', '{{company_name}} vs competitors alternatives {{industry}}', ARRAY['company_name', 'industry'], ARRAY['competitors'], 'medium'),
(medium_id, 5, 'Industry Trends', 'Research current industry trends and challenges', 'web_search', '{{industry}} trends challenges 2024 2025', ARRAY['industry'], ARRAY['industry_trends'], 'medium'),
(medium_id, 6, 'Person Research', 'Research the specific person and their background', 'web_search', '{{person_name}} {{company_name}} {{job_title}}', ARRAY['person_name', 'company_name', 'job_title'], ARRAY['person_background'], 'medium'),
(medium_id, 7, 'Recent News Deep', 'Find detailed recent company news', 'web_search', '{{company_name}} news announcement partnership launch 2024', ARRAY['company_name'], ARRAY['recent_news'], 'standard'),
(medium_id, 8, 'Tech Stack Research', 'Identify technologies they use', 'web_search', '{{company_name}} technology stack tools software', ARRAY['company_name'], ARRAY['tech_stack'], 'medium');

-- Medium Information Priorities (10 priorities)
INSERT INTO information_priorities (config_id, priority_order, name, description, category, weight, is_required, extraction_hint) VALUES
(medium_id, 1, 'Company Description', 'Detailed description of what the company does', 'company', 10, true, 'Get comprehensive overview from website and search'),
(medium_id, 2, 'Products & Features', 'Detailed product/service information', 'company', 10, true, 'Extract specific features, pricing tiers, use cases'),
(medium_id, 3, 'Role & Responsibilities', 'Detailed understanding of their role', 'person', 9, true, 'Research typical responsibilities and reporting structure'),
(medium_id, 4, 'Industry Position', 'Market position and competitive standing', 'company', 8, true, 'Understand where they fit in the market'),
(medium_id, 5, 'Company Stage & Size', 'Funding stage, employee count, growth phase', 'company', 8, true, 'Determine startup stage or enterprise maturity'),
(medium_id, 6, 'Key Challenges', 'Specific pain points for their role and company', 'insights', 7, true, 'Identify 2-3 specific challenges based on research'),
(medium_id, 7, 'Recent News & Activity', 'Latest announcements, launches, or changes', 'company', 6, false, 'Find anything recent to reference'),
(medium_id, 8, 'Technology Stack', 'Current tools and technologies', 'company', 5, false, 'Identify integration opportunities'),
(medium_id, 9, 'Competitive Context', 'Key competitors and differentiation', 'company', 4, false, 'Understand competitive dynamics'),
(medium_id, 10, 'Person Background', 'Career history and expertise areas', 'person', 4, false, 'Look for past experience and interests');

-- Medium Thinking Rules (7 rules)
INSERT INTO thinking_rules (config_id, rule_order, name, description, condition_type, condition_field, condition_value, condition_operator, action_type, action_value) VALUES
(medium_id, 1, 'High-Growth Company', 'Emphasize scalability for fast-growing companies', 'value_contains', 'recent_news', 'funding,raised,series,growth,expansion', 'contains', 'add_insight', '{"type": "add_insight", "value": "scalability and growth support capabilities"}'),
(medium_id, 2, 'Competitive Market', 'Address differentiation in crowded markets', 'data_found', 'competitors', NULL, 'exists', 'include_section', '{"type": "include_section", "value": "competitive differentiation and unique value"}'),
(medium_id, 3, 'Technical Decision Maker', 'Focus on technical merits for tech roles', 'value_contains', 'job_title', 'CTO,VP Engineering,Technical,Architect,Developer', 'contains', 'modify_tone', '{"type": "modify_tone", "value": "technically informed and detail-oriented"}'),
(medium_id, 4, 'Executive Level', 'Strategic focus for C-level executives', 'value_contains', 'job_title', 'CEO,COO,CFO,CMO,Chief,President,Founder', 'contains', 'modify_tone', '{"type": "modify_tone", "value": "strategic and ROI-focused"}'),
(medium_id, 5, 'Recent Product Launch', 'Reference new initiatives when found', 'value_contains', 'recent_news', 'launch,released,announced,new product,new feature', 'contains', 'add_insight', '{"type": "add_insight", "value": "support for their new initiative"}'),
(medium_id, 6, 'Enterprise Target', 'Adjust for enterprise sales motions', 'value_contains', 'company_size', 'enterprise,1000+,fortune', 'contains', 'include_section', '{"type": "include_section", "value": "enterprise security and compliance capabilities"}'),
(medium_id, 7, 'SMB Target', 'Adjust for SMB sales motions', 'value_contains', 'company_size', 'small,startup,SMB,10-50,50-200', 'contains', 'include_section', '{"type": "include_section", "value": "ease of implementation and quick time-to-value"}');

-- Medium Email Template
INSERT INTO email_templates (config_id, name, subject_template, tone, writing_style, opening_style, closing_style, signature_template, min_paragraphs, max_paragraphs, sections)
VALUES (
  medium_id,
  'B2B SaaS Medium Template',
  '{{specific_observation}} at {{company_name}}',
  'professional',
  'Knowledgeable and consultative. Show deep understanding of their business while being respectful of their time. Use specific data points from research.',
  'Lead with a specific, researched insight about their company or recent activity - make it clear you''ve done your homework',
  'Offer value regardless of their interest - share a relevant insight or resource. Make the next step easy and specific.',
  NULL,
  3,
  4,
  '[
    {"id": "hook", "name": "Research-Based Hook", "order": 0, "required": true, "instructions": "Open with a specific observation from your research that shows genuine understanding.", "example": "I saw {{company_name}}''s recent {{specific_news_or_achievement}} - {{specific_observation_about_it}}."},
    {"id": "context", "name": "Contextual Bridge", "order": 1, "required": true, "instructions": "Connect your research to a relevant business challenge or opportunity.", "example": "Growing {{metric}} while {{challenge}} is a common challenge for {{industry}} companies at your stage."},
    {"id": "value", "name": "Specific Value Proposition", "order": 2, "required": true, "instructions": "Present a specific, relevant way you could help based on their situation.", "example": "We''ve helped similar {{company_type}} companies {{specific_outcome}} by {{approach}}."},
    {"id": "proof", "name": "Credibility Point", "order": 3, "required": false, "instructions": "Add brief social proof or relevant example if it strengthens the message.", "example": "For example, {{similar_company}} saw {{specific_result}} within {{timeframe}}."},
    {"id": "cta", "name": "Clear Next Step", "order": 4, "required": true, "instructions": "Propose a specific, easy next step.", "example": "Would you be open to a 20-minute call {{specific_day_or_timeframe}} to explore if this could help {{company_name}}?"},
    {"id": "closing", "name": "Value-Add Close", "order": 5, "required": true, "instructions": "End with value even if they don''t respond.", "example": "Either way, I thought this {{resource_or_insight}} might be useful given {{their_situation}}."}
  ]'::jsonb
);

-- Medium Blacklist
INSERT INTO blacklist_items (config_id, item_type, value, reason, replacement) VALUES
(medium_id, 'phrase', 'I hope this email finds you well', 'Generic and overused opener', NULL),
(medium_id, 'phrase', 'I wanted to reach out', 'Weak and passive language', NULL),
(medium_id, 'phrase', 'touch base', 'Corporate jargon', 'connect'),
(medium_id, 'phrase', 'pick your brain', 'Overused and slightly odd', 'get your thoughts'),
(medium_id, 'phrase', 'circle back', 'Corporate jargon', 'follow up'),
(medium_id, 'word', 'synergy', 'Buzzword, sounds insincere', 'collaboration'),
(medium_id, 'word', 'leverage', 'Overused business jargon', 'use'),
(medium_id, 'word', 'utilize', 'Unnecessarily formal', 'use'),
(medium_id, 'word', 'bandwidth', 'Jargon for availability', 'time'),
(medium_id, 'word', 'robust', 'Overused product descriptor', 'powerful'),
(medium_id, 'topic', 'pricing', 'Too early to discuss pricing', NULL),
(medium_id, 'topic', 'discount', 'Devalues the offering', NULL),
(medium_id, 'topic', 'free trial', 'Save for later in conversation', NULL),
(medium_id, 'phrase', 'game-changer', 'Hyperbolic and overused', NULL),
(medium_id, 'phrase', 'best-in-class', 'Empty marketing speak', NULL),
(medium_id, 'phrase', 'thought leader', 'Presumptuous to assign', NULL),
(medium_id, 'phrase', 'low-hanging fruit', 'Cliche business term', 'quick wins'),
(medium_id, 'word', 'disruptive', 'Overused startup buzzword', 'innovative'),
(medium_id, 'phrase', 'move the needle', 'Vague business cliche', 'make a meaningful impact'),
(medium_id, 'phrase', 'at the end of the day', 'Filler phrase', NULL);

-- =============================================================================
-- PREMIUM TIER DETAILS
-- =============================================================================

-- Premium Playbook Steps (10 steps)
INSERT INTO search_playbook_steps (config_id, step_order, name, description, search_type, query_template, required_variables, skip_if_found, required_tier) VALUES
(premium_id, 1, 'Company Overview', 'Comprehensive company research', 'web_search', '{{company_name}} company overview mission products funding investors', ARRAY['company_name'], NULL, 'standard'),
(premium_id, 2, 'Website Deep Scrape', 'Thorough website analysis', 'company_website', '{{company_website}}', ARRAY['company_website'], NULL, 'standard'),
(premium_id, 3, 'LinkedIn Profile', 'Scrape LinkedIn for professional background', 'linkedin', '{{linkedin_url}}', ARRAY['linkedin_url'], NULL, 'premium'),
(premium_id, 4, 'Person Background', 'Research person''s career and expertise', 'web_search', '{{person_name}} {{job_title}} background experience interview podcast', ARRAY['person_name', 'job_title'], ARRAY['person_background'], 'premium'),
(premium_id, 5, 'Company Funding Deep', 'Detailed funding and investor research', 'web_search', '{{company_name}} funding series investors crunchbase valuation', ARRAY['company_name'], ARRAY['funding_details'], 'medium'),
(premium_id, 6, 'Competitive Analysis', 'Deep competitive landscape research', 'web_search', '{{company_name}} vs {{competitor}} comparison review', ARRAY['company_name'], NULL, 'premium'),
(premium_id, 7, 'Industry Analysis', 'Comprehensive industry trends and dynamics', 'web_search', '{{industry}} market trends forecast challenges opportunities 2024 2025', ARRAY['industry'], ARRAY['industry_analysis'], 'medium'),
(premium_id, 8, 'Recent Activity', 'Latest news, posts, and announcements', 'web_search', '{{company_name}} OR {{person_name}} news announcement post 2024', ARRAY['company_name', 'person_name'], ARRAY['recent_activity'], 'standard'),
(premium_id, 9, 'Tech Stack Analysis', 'Detailed technology research', 'web_search', '{{company_name}} technology stack engineering blog technical', ARRAY['company_name'], ARRAY['tech_stack'], 'medium'),
(premium_id, 10, 'Thought Leadership', 'Find their public content and opinions', 'web_search', '{{person_name}} interview podcast article opinion {{industry}}', ARRAY['person_name', 'industry'], ARRAY['thought_leadership'], 'premium');

-- Premium Information Priorities (12 priorities)
INSERT INTO information_priorities (config_id, priority_order, name, description, category, weight, is_required, extraction_hint) VALUES
(premium_id, 1, 'Person Deep Profile', 'Comprehensive professional background from LinkedIn and web', 'person', 10, true, 'Get career history, current role details, skills, and recent activity'),
(premium_id, 2, 'Company Full Profile', 'Complete company understanding', 'company', 10, true, 'Combine website, news, and search data for complete picture'),
(premium_id, 3, 'Role & Influence', 'Their specific role, team, and decision-making authority', 'person', 9, true, 'Understand their scope and influence in buying decisions'),
(premium_id, 4, 'Recent Posts & Content', 'Their recent LinkedIn posts, articles, or public statements', 'person', 9, true, 'Find topics they care about and their communication style'),
(premium_id, 5, 'Products In-Depth', 'Detailed product understanding with features and positioning', 'company', 8, true, 'Know their product as well as they do'),
(premium_id, 6, 'Market Position', 'Competitive position, differentiators, and market share', 'company', 8, true, 'Understand where they win and lose deals'),
(premium_id, 7, 'Growth & Funding', 'Funding history, growth metrics, and trajectory', 'company', 7, true, 'Understand their financial position and growth phase'),
(premium_id, 8, 'Key Challenges', 'Specific, researched pain points', 'insights', 7, true, 'Identify real challenges based on multiple data sources'),
(premium_id, 9, 'Technology Ecosystem', 'Current tech stack and integration landscape', 'company', 6, false, 'Identify integration opportunities and technical context'),
(premium_id, 10, 'Competitive Intelligence', 'Detailed competitive dynamics', 'company', 5, false, 'Understand their competitive battles'),
(premium_id, 11, 'Career Trajectory', 'Career path and professional interests', 'person', 5, false, 'Understand their ambitions and expertise areas'),
(premium_id, 12, 'Mutual Connections', 'Shared connections or communities', 'person', 4, false, 'Identify potential warm introduction paths');

-- Premium Thinking Rules (7 rules)
INSERT INTO thinking_rules (config_id, rule_order, name, description, condition_type, condition_field, condition_value, condition_operator, action_type, action_value) VALUES
(premium_id, 1, 'LinkedIn Content Found', 'Reference their posts and interests when LinkedIn data available', 'data_found', 'recent_posts', NULL, 'exists', 'add_insight', '{"type": "add_insight", "value": "specific reference to their recent post or stated interest"}'),
(premium_id, 2, 'Thought Leader', 'Treat as thought leader if public content found', 'data_found', 'thought_leadership', NULL, 'exists', 'modify_tone', '{"type": "modify_tone", "value": "peer-to-peer and intellectually engaging"}'),
(premium_id, 3, 'Technical Background', 'Deep technical discussion for technical backgrounds', 'value_contains', 'career_history', 'engineer,developer,technical,architecture', 'contains', 'include_section', '{"type": "include_section", "value": "technical depth and implementation details"}'),
(premium_id, 4, 'Executive Trajectory', 'Strategic focus for executive career paths', 'value_contains', 'job_title', 'VP,Director,Head of,Chief,C-level', 'contains', 'modify_tone', '{"type": "modify_tone", "value": "strategic and outcome-focused"}'),
(premium_id, 5, 'Recent Role Change', 'Acknowledge new role if recently changed', 'value_contains', 'recent_posts', 'new role,just joined,excited to announce,new chapter', 'contains', 'add_insight', '{"type": "add_insight", "value": "acknowledgment of their new role and fresh perspective"}'),
(premium_id, 6, 'Shared Interest', 'Connect on shared interests when found', 'data_found', 'expertise_areas', NULL, 'exists', 'include_section', '{"type": "include_section", "value": "connection based on shared professional interests"}'),
(premium_id, 7, 'Competitive Mention', 'Handle carefully if they mention competitors', 'value_contains', 'recent_posts', 'competitor names or comparison', 'contains', 'exclude_section', '{"type": "exclude_section", "value": "direct competitor comparisons unless favorable"}');

-- Premium Email Template
INSERT INTO email_templates (config_id, name, subject_template, tone, writing_style, opening_style, closing_style, signature_template, min_paragraphs, max_paragraphs, sections)
VALUES (
  premium_id,
  'B2B SaaS Premium Template',
  'Re: Your {{recent_topic_or_post}} on {{subject}}',
  'conversational',
  'Highly personalized and consultative. Write like a knowledgeable peer, not a salesperson. Reference specific research findings naturally. Show genuine interest in their work.',
  'Start with something specific and genuine - ideally referencing their recent post, article, or a specific company initiative. Make it feel like a natural conversation starter.',
  'End with value and optionality. Offer something useful regardless of their interest. Make the ask feel like an invitation, not a request.',
  E'Best,\n{{sender_name}}\n\nP.S. {{relevant_ps_based_on_research}}',
  4,
  5,
  '[
    {"id": "personal_hook", "name": "Personalized Opening", "order": 0, "required": true, "instructions": "Reference something specific from their LinkedIn, recent post, or public content. Make it genuine and specific.", "example": "Your recent post about {{topic}} really resonated - especially the point about {{specific_insight}}. It''s rare to see someone articulate {{observation}} so clearly."},
    {"id": "connection", "name": "Contextual Connection", "order": 1, "required": true, "instructions": "Bridge from their content/situation to a relevant observation about their business or role.", "example": "It got me thinking about how {{company_name}} is approaching {{challenge_or_opportunity}} - especially given {{specific_context_from_research}}."},
    {"id": "insight", "name": "Value-Add Insight", "order": 2, "required": true, "instructions": "Share a relevant insight or observation that demonstrates expertise without being salesy.", "example": "We''ve been seeing {{trend_or_pattern}} across {{industry}} companies tackling similar challenges. {{specific_insight_or_data_point}}."},
    {"id": "relevance", "name": "Relevant Experience", "order": 3, "required": true, "instructions": "Briefly mention how you''ve helped similar situations, with specific outcomes if possible.", "example": "Recently helped {{similar_company}} {{specific_outcome}} - the approach might be relevant given {{their_specific_situation}}."},
    {"id": "soft_cta", "name": "Conversational CTA", "order": 4, "required": true, "instructions": "Make a soft, conversational ask that doesn''t feel like a sales pitch.", "example": "Would love to hear your take on {{relevant_topic}} - would you be up for a quick chat sometime? No agenda, just curious about your perspective on {{specific_area}}."},
    {"id": "value_close", "name": "Value-Add Close", "order": 5, "required": true, "instructions": "End with something valuable regardless of their response.", "example": "Either way, thought you might find this {{resource}} interesting given your work on {{their_focus_area}}."}
  ]'::jsonb
);

-- Premium Blacklist (comprehensive)
INSERT INTO blacklist_items (config_id, item_type, value, reason, replacement) VALUES
(premium_id, 'phrase', 'I hope this email finds you well', 'Generic and overused opener', NULL),
(premium_id, 'phrase', 'I wanted to reach out', 'Weak and passive language', NULL),
(premium_id, 'phrase', 'touch base', 'Corporate jargon', 'connect'),
(premium_id, 'phrase', 'pick your brain', 'Overused and slightly odd', 'get your perspective'),
(premium_id, 'phrase', 'circle back', 'Corporate jargon', 'follow up'),
(premium_id, 'word', 'synergy', 'Buzzword, sounds insincere', 'collaboration'),
(premium_id, 'word', 'leverage', 'Overused business jargon', 'use'),
(premium_id, 'word', 'utilize', 'Unnecessarily formal', 'use'),
(premium_id, 'word', 'bandwidth', 'Jargon for availability', 'time'),
(premium_id, 'word', 'robust', 'Overused product descriptor', 'powerful'),
(premium_id, 'topic', 'pricing', 'Too early to discuss pricing', NULL),
(premium_id, 'topic', 'discount', 'Devalues the offering', NULL),
(premium_id, 'topic', 'free trial', 'Save for later in conversation', NULL),
(premium_id, 'phrase', 'game-changer', 'Hyperbolic and overused', NULL),
(premium_id, 'phrase', 'best-in-class', 'Empty marketing speak', NULL),
(premium_id, 'phrase', 'thought leader', 'Presumptuous to assign', NULL),
(premium_id, 'phrase', 'low-hanging fruit', 'Cliche business term', 'quick wins'),
(premium_id, 'word', 'disruptive', 'Overused startup buzzword', 'innovative'),
(premium_id, 'phrase', 'move the needle', 'Vague business cliche', 'make a meaningful impact'),
(premium_id, 'phrase', 'at the end of the day', 'Filler phrase', NULL),
(premium_id, 'phrase', 'per my last email', 'Passive aggressive', NULL),
(premium_id, 'phrase', 'just checking in', 'Low-value follow-up', NULL),
(premium_id, 'phrase', 'I know you''re busy', 'Assumes and apologizes', NULL),
(premium_id, 'phrase', 'quick question', 'Usually not quick', NULL),
(premium_id, 'word', 'revolutionary', 'Hyperbolic marketing speak', 'significant'),
(premium_id, 'word', 'unprecedented', 'Often inaccurate', 'notable'),
(premium_id, 'phrase', 'I''m sure you''re aware', 'Condescending', NULL),
(premium_id, 'phrase', 'to be honest', 'Implies dishonesty elsewhere', NULL),
(premium_id, 'topic', 'competitor bashing', 'Unprofessional and risky', NULL),
(premium_id, 'topic', 'contract terms', 'Too early for contract discussion', NULL);

-- =============================================================================
-- ADD TO TEMPLATE LIBRARY
-- =============================================================================

INSERT INTO template_library (name, description, category, tags, tier, config_snapshot, is_system_template)
VALUES (
  'B2B SaaS - Standard',
  'Quick research configuration optimized for B2B SaaS sales outreach. Efficient tool usage with focus on company basics.',
  'B2B SaaS',
  ARRAY['saas', 'b2b', 'sales', 'outreach', 'quick'],
  'standard',
  jsonb_build_object(
    'description', 'Quick research for B2B SaaS sales',
    'maxTurns', 6,
    'maxBudgetUsd', 0.30,
    'allowedTools', ARRAY['WebSearch', 'WebFetch', 'scrape_company_website'],
    'emailTone', 'professional',
    'emailMinWords', 100,
    'emailMaxWords', 150
  ),
  true
);

INSERT INTO template_library (name, description, category, tags, tier, config_snapshot, is_system_template)
VALUES (
  'B2B SaaS - Medium',
  'Comprehensive web research configuration for B2B SaaS sales. Deep company and industry analysis.',
  'B2B SaaS',
  ARRAY['saas', 'b2b', 'sales', 'outreach', 'comprehensive'],
  'medium',
  jsonb_build_object(
    'description', 'Comprehensive research for B2B SaaS sales',
    'maxTurns', 8,
    'maxBudgetUsd', 0.50,
    'allowedTools', ARRAY['WebSearch', 'WebFetch', 'scrape_company_website'],
    'emailTone', 'professional',
    'emailMinWords', 150,
    'emailMaxWords', 200
  ),
  true
);

INSERT INTO template_library (name, description, category, tags, tier, config_snapshot, is_system_template)
VALUES (
  'B2B SaaS - Premium',
  'Deep research configuration with LinkedIn insights for high-value B2B SaaS prospects. Maximum personalization.',
  'B2B SaaS',
  ARRAY['saas', 'b2b', 'sales', 'outreach', 'linkedin', 'premium', 'personalized'],
  'premium',
  jsonb_build_object(
    'description', 'Deep research with LinkedIn for B2B SaaS sales',
    'maxTurns', 12,
    'maxBudgetUsd', 1.20,
    'allowedTools', ARRAY['WebSearch', 'WebFetch', 'scrape_company_website', 'scrape_linkedin'],
    'emailTone', 'conversational',
    'emailMinWords', 200,
    'emailMaxWords', 300
  ),
  true
);

RAISE NOTICE 'Migration 007 complete: Seeded B2B SaaS configurations for all 3 tiers';

END $$;
