// Website analyzer using Cheerio (no AI, cost-efficient)

import * as cheerio from 'cheerio';
import type { ScrapedWebsiteData } from '@/types/project';

// =============================================================================
// Industry Keywords for Detection
// =============================================================================

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'SaaS': ['software', 'saas', 'platform', 'cloud', 'api', 'subscription', 'app'],
  'FinTech': ['finance', 'fintech', 'banking', 'payment', 'financial', 'trading', 'investment'],
  'Healthcare': ['health', 'medical', 'patient', 'clinic', 'healthcare', 'pharma', 'hospital'],
  'E-commerce': ['shop', 'store', 'ecommerce', 'retail', 'marketplace', 'shopping', 'buy'],
  'Enterprise': ['enterprise', 'corporate', 'business', 'b2b', 'workforce', 'operations'],
  'AI/ML': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'data science', 'automation'],
  'Security': ['security', 'cybersecurity', 'protection', 'compliance', 'privacy', 'secure'],
  'Marketing': ['marketing', 'advertising', 'campaign', 'brand', 'content', 'seo', 'analytics'],
  'HR/Recruiting': ['hr', 'hiring', 'recruiting', 'talent', 'employee', 'workforce', 'people'],
  'Developer Tools': ['developer', 'api', 'sdk', 'devops', 'infrastructure', 'code', 'deploy'],
};

// =============================================================================
// Main Scraping Function
// =============================================================================

export async function analyzeWebsite(url: string): Promise<ScrapedWebsiteData> {
  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  console.log(`[WebsiteAnalyzer] Fetching: ${normalizedUrl}`);

  const response = await fetch(normalizedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract meta tags
  const title = $('title').text().trim() || null;
  const description = $('meta[name="description"]').attr('content')?.trim() || null;
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || null;
  const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() || null;
  const keywordsStr = $('meta[name="keywords"]').attr('content') || '';
  const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k.length > 0);

  // Extract headings
  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 200) {
      headings.push(text);
    }
  });

  // Extract paragraphs (for AI context)
  const paragraphs: string[] = [];
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 50 && text.length < 500) {
      paragraphs.push(text);
    }
  });

  // Extract links (for navigation context)
  const links: { text: string; href: string }[] = [];
  $('a').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href') || '';
    if (text && text.length < 50 && href.startsWith('/')) {
      links.push({ text, href });
    }
  });

  // Extract about text (look for common about sections)
  let aboutText: string | null = null;
  const aboutSelectors = [
    '#about', '.about', '[class*="about"]',
    '#mission', '.mission', '[class*="mission"]',
    '#who-we-are', '.who-we-are',
    'section:contains("About")',
    'div:contains("We are")',
  ];

  for (const selector of aboutSelectors) {
    const aboutEl = $(selector).first();
    if (aboutEl.length) {
      const text = aboutEl.text().trim().slice(0, 1000);
      if (text.length > 50) {
        aboutText = text;
        break;
      }
    }
  }

  // Extract product mentions (look for features/products sections)
  const productMentions: string[] = [];
  const productSelectors = [
    '#features', '.features', '[class*="features"]',
    '#products', '.products', '[class*="products"]',
    '#solutions', '.solutions', '[class*="solutions"]',
    '#services', '.services', '[class*="services"]',
  ];

  for (const selector of productSelectors) {
    $(selector).find('h2, h3, h4, li, .feature-title, .product-name').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 100 && text.length > 3) {
        productMentions.push(text);
      }
    });
  }

  // Extract social links
  const socialLinks: ScrapedWebsiteData['socialLinks'] = {};
  $('a[href*="linkedin.com"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('linkedin.com/company')) {
      socialLinks.linkedin = href;
    }
  });
  $('a[href*="twitter.com"], a[href*="x.com"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) socialLinks.twitter = href;
  });
  $('a[href*="facebook.com"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) socialLinks.facebook = href;
  });
  $('a[href*="youtube.com"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) socialLinks.youtube = href;
  });

  // Extract contact info
  const contactInfo: ScrapedWebsiteData['contactInfo'] = {};

  // Email
  const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    contactInfo.email = emailMatch[0];
  }

  // Phone
  const phoneMatch = html.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  if (phoneMatch) {
    contactInfo.phone = phoneMatch[0];
  }

  // Tech stack detection (basic)
  const techStack: string[] = [];
  const scriptSrcs = $('script[src]').map((_, el) => $(el).attr('src') || '').get();
  const allSrcs = scriptSrcs.join(' ').toLowerCase();

  if (allSrcs.includes('react') || html.includes('__NEXT_DATA__')) techStack.push('React');
  if (allSrcs.includes('vue')) techStack.push('Vue.js');
  if (allSrcs.includes('angular')) techStack.push('Angular');
  if (allSrcs.includes('jquery')) techStack.push('jQuery');
  if (html.includes('__NEXT_DATA__')) techStack.push('Next.js');
  if (allSrcs.includes('gtag') || allSrcs.includes('google-analytics')) techStack.push('Google Analytics');
  if (allSrcs.includes('segment')) techStack.push('Segment');
  if (allSrcs.includes('intercom')) techStack.push('Intercom');
  if (allSrcs.includes('hubspot')) techStack.push('HubSpot');
  if (allSrcs.includes('stripe')) techStack.push('Stripe');

  // Get raw text (limited)
  $('script, style, nav, footer, header').remove();
  const rawText = $('body').text()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);

  // Detect industry from content
  const fullText = [title, description, aboutText, ...keywords, ...headings].join(' ').toLowerCase();
  let suggestedIndustry: string | undefined;

  for (const [industry, industryKeywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const matchCount = industryKeywords.filter(k => fullText.includes(k.toLowerCase())).length;
    if (matchCount >= 2) {
      suggestedIndustry = industry;
      break;
    }
  }

  console.log(`[WebsiteAnalyzer] Extracted: title="${title}", headings=${headings.length}, products=${productMentions.length}, industry=${suggestedIndustry}`);

  return {
    title,
    description,
    metaDescription: description, // Alias for AI generator compatibility
    ogTitle,
    ogDescription,
    keywords,
    headings: headings.slice(0, 20),
    paragraphs: paragraphs.slice(0, 10),
    links: links.slice(0, 20),
    aboutText,
    productMentions: [...new Set(productMentions)].slice(0, 15),
    socialLinks,
    contactInfo,
    techStack: [...new Set(techStack)],
    rawText,
    suggestedIndustry,
  };
}

// =============================================================================
// Extract Suggestions from Scraped Data
// =============================================================================

export interface WebsiteSuggestions {
  companyDescription: string | null;
  products: string[];
  valuePropositions: string[];
  industryFocus: string[];
}

export function extractSuggestions(scrapedData: ScrapedWebsiteData): WebsiteSuggestions {
  // Company description - prefer OG description, then meta description, then about text
  const companyDescription =
    scrapedData.ogDescription ||
    scrapedData.description ||
    (scrapedData.aboutText ? scrapedData.aboutText.slice(0, 300) : null);

  // Products - from product mentions and headings
  const products = scrapedData.productMentions
    .filter(p => p.length > 5 && p.length < 50)
    .slice(0, 5);

  // Value propositions - extract from headings that look like benefits
  const valueKeywords = ['save', 'increase', 'reduce', 'improve', 'boost', 'grow', 'faster', 'easier', 'better', 'automate'];
  const valuePropositions = scrapedData.headings
    .filter(h => valueKeywords.some(k => h.toLowerCase().includes(k)))
    .slice(0, 5);

  // Industry focus - detect from keywords and text
  const industryFocus: string[] = [];
  const fullText = [
    scrapedData.title,
    scrapedData.description,
    scrapedData.aboutText,
    ...scrapedData.keywords,
    ...scrapedData.headings,
  ].join(' ').toLowerCase();

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const matchCount = keywords.filter(k => fullText.includes(k.toLowerCase())).length;
    if (matchCount >= 2) {
      industryFocus.push(industry);
    }
  }

  return {
    companyDescription,
    products,
    valuePropositions,
    industryFocus: industryFocus.slice(0, 3),
  };
}
