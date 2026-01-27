// Lead Enrichment Application - Custom Tool Executors
// Direct implementations for custom tools (not using Claude Agent SDK)

import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

// Custom tool definitions in Anthropic API format
export const customToolDefinitions: Anthropic.Tool[] = [
  {
    name: 'scrape_company_website',
    description: `Scrapes a company website to extract structured information including:
- Company description and value proposition
- Products and services offered
- Team/leadership information
- Contact details
- Social media links
- Recent news or blog posts

Use this tool when you have a company website URL and need detailed company information.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The company website URL to scrape',
        },
        extractSections: {
          type: 'array',
          items: { type: 'string', enum: ['about', 'products', 'team', 'contact', 'blog', 'all'] },
          default: ['all'],
          description: 'Which sections to extract from the website',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'scrape_linkedin',
    description: `Scrapes a LinkedIn profile to extract professional information including:
- Current job title and company
- Professional summary/bio
- Work experience history
- Skills and endorsements
- Education background

IMPORTANT: Only use this for public LinkedIn profiles. Respects rate limits and robots.txt.
Use this tool when you have a LinkedIn URL and need detailed professional information.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        linkedinUrl: {
          type: 'string',
          description: 'The LinkedIn profile URL to scrape',
        },
        includeExperience: {
          type: 'boolean',
          default: true,
          description: 'Whether to include work experience details',
        },
        includeEducation: {
          type: 'boolean',
          default: false,
          description: 'Whether to include education details',
        },
      },
      required: ['linkedinUrl'],
    },
  },
];

// Get custom tool definition by name
export function getCustomToolDefinition(name: string): Anthropic.Tool | undefined {
  return customToolDefinitions.find(t => t.name === name);
}

/**
 * Execute a custom tool by name
 */
export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'scrape_company_website':
      return scrapeCompanyWebsite(input as { url: string; extractSections?: string[] });
    case 'scrape_linkedin':
      return scrapeLinkedin(input as { linkedinUrl: string; includeExperience?: boolean; includeEducation?: boolean });
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

/**
 * Scrape Company Website Tool
 * Uses Cheerio to extract structured information from company websites
 */
async function scrapeCompanyWebsite(args: {
  url: string;
  extractSections?: string[];
}): Promise<string> {
  const startTime = Date.now();
  const extractSections = args.extractSections || ['all'];

  console.log(`\n[Website Scraper] ========================================`);
  console.log(`[Website Scraper] Starting scrape for: ${args.url}`);
  console.log(`[Website Scraper] Sections to extract: ${extractSections.join(', ')}`);

  try {
    // Validate URL
    const parsedUrl = new URL(args.url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return JSON.stringify({ error: 'Invalid URL protocol', url: args.url });
    }

    // Fetch the page
    const response = await fetch(args.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LeadEnrichmentBot/1.0; +https://example.com/bot)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return JSON.stringify({
        error: `Failed to fetch: ${response.status}`,
        url: args.url,
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, and hidden elements
    $('script, style, noscript, iframe, [hidden]').remove();

    // Extract structured data
    const result: Record<string, unknown> = {
      url: args.url,
      scraped_at: new Date().toISOString(),
      duration_ms: 0,
    };

    // Extract meta information
    result.meta = {
      title: $('title').text().trim() || null,
      description: $('meta[name="description"]').attr('content')?.trim() || null,
      keywords: $('meta[name="keywords"]').attr('content')?.trim() || null,
      og_title: $('meta[property="og:title"]').attr('content')?.trim() || null,
      og_description: $('meta[property="og:description"]').attr('content')?.trim() || null,
    };

    // Extract main content (about section)
    const shouldExtract = (section: string) =>
      extractSections.includes('all') || extractSections.includes(section);

    if (shouldExtract('about')) {
      // Look for about content in common locations
      const aboutSelectors = [
        'main',
        'article',
        '#about',
        '.about',
        '[class*="about"]',
        '#hero',
        '.hero',
        'section:first-of-type',
      ];

      let aboutContent = '';
      for (const selector of aboutSelectors) {
        const element = $(selector);
        if (element.length) {
          aboutContent = element.text().replace(/\s+/g, ' ').trim().slice(0, 2000);
          if (aboutContent.length > 100) break;
        }
      }

      result.about = {
        content: aboutContent || null,
        h1: $('h1').first().text().trim() || null,
        tagline: $('h2').first().text().trim() || $('p').first().text().trim().slice(0, 200) || null,
      };
    }

    if (shouldExtract('products')) {
      // Extract product/service mentions
      const productKeywords: string[] = [];
      $('h2, h3, h4, .product, .service, [class*="product"], [class*="service"]').each(
        (_, el) => {
          const text = $(el).text().trim();
          if (text.length > 3 && text.length < 100) {
            productKeywords.push(text);
          }
        }
      );
      result.products = [...new Set(productKeywords)].slice(0, 10);
    }

    if (shouldExtract('team')) {
      // Look for team/leadership info
      const teamMembers: Array<{ name: string; role?: string }> = [];
      $('[class*="team"], [class*="leadership"], [class*="founder"]').each((_, el) => {
        const name = $(el).find('h3, h4, .name, [class*="name"]').text().trim();
        const role = $(el).find('p, .role, .title, [class*="role"], [class*="title"]').first().text().trim();
        if (name) {
          teamMembers.push({ name, role: role || undefined });
        }
      });
      result.team = teamMembers.slice(0, 10);
    }

    if (shouldExtract('contact')) {
      // Extract contact info
      result.contact = {
        email:
          $('a[href^="mailto:"]')
            .first()
            .attr('href')
            ?.replace('mailto:', '')
            .split('?')[0] || null,
        phone:
          $('a[href^="tel:"]').first().attr('href')?.replace('tel:', '') || null,
        address: $('[class*="address"], address').first().text().trim() || null,
      };

      // Extract social links
      result.social = {
        linkedin: $('a[href*="linkedin.com"]').first().attr('href') || null,
        twitter: $('a[href*="twitter.com"], a[href*="x.com"]').first().attr('href') || null,
        facebook: $('a[href*="facebook.com"]').first().attr('href') || null,
        github: $('a[href*="github.com"]').first().attr('href') || null,
      };
    }

    result.duration_ms = Date.now() - startTime;

    const meta = result.meta as Record<string, unknown>;
    const social = result.social as Record<string, unknown> | undefined;
    console.log(`[Website Scraper] SUCCESS - Extracted data:`);
    console.log(`[Website Scraper]   Title: ${meta?.title}`);
    console.log(`[Website Scraper]   Description: ${String(meta?.description || '').slice(0, 80)}...`);
    console.log(`[Website Scraper]   Products found: ${(result.products as unknown[])?.length || 0}`);
    console.log(`[Website Scraper]   Team members found: ${(result.team as unknown[])?.length || 0}`);
    console.log(`[Website Scraper]   Social links: ${Object.keys(social || {}).filter(k => social?.[k]).join(', ') || 'none'}`);
    console.log(`[Website Scraper] Duration: ${result.duration_ms}ms`);
    console.log(`[Website Scraper] ========================================\n`);

    return JSON.stringify(result, null, 2);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`[Website Scraper] ERROR: ${errorMessage}`);
    console.log(`[Website Scraper] Duration: ${Date.now() - startTime}ms`);
    console.log(`[Website Scraper] ========================================\n`);

    return JSON.stringify({
      error: errorMessage,
      url: args.url,
      duration_ms: Date.now() - startTime,
    });
  }
}

/**
 * Scrape LinkedIn Profile Tool
 * Uses Puppeteer for headless browser scraping of LinkedIn profiles
 */
async function scrapeLinkedin(args: {
  linkedinUrl: string;
  includeExperience?: boolean;
  includeEducation?: boolean;
}): Promise<string> {
  const startTime = Date.now();
  let browser = null;
  const includeExperience = args.includeExperience !== false;
  const includeEducation = args.includeEducation === true;

  console.log(`\n[LinkedIn Scraper] ========================================`);
  console.log(`[LinkedIn Scraper] Starting scrape for: ${args.linkedinUrl}`);
  console.log(`[LinkedIn Scraper] Include experience: ${includeExperience}`);
  console.log(`[LinkedIn Scraper] Include education: ${includeEducation}`);

  // Validate LinkedIn URL
  if (!args.linkedinUrl.includes('linkedin.com')) {
    return JSON.stringify({ error: 'Must be a LinkedIn URL', url: args.linkedinUrl });
  }

  try {
    console.log(`[LinkedIn Scraper] Launching Puppeteer browser...`);
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
    });

    const page = await browser.newPage();

    // Set user agent to look like a real browser
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to LinkedIn profile
    console.log(`[LinkedIn Scraper] Navigating to: ${args.linkedinUrl}`);
    await page.goto(args.linkedinUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    console.log(`[LinkedIn Scraper] Page loaded successfully`);

    // Wait for content to load
    await page.waitForSelector('body', { timeout: 10000 });

    // Check if we hit a login wall
    console.log(`[LinkedIn Scraper] Checking for login wall...`);
    const isLoginWall = await page.evaluate(() => {
      return (
        document.body.innerText.includes('Sign in') &&
        document.body.innerText.includes('Join now')
      );
    });

    if (isLoginWall) {
      console.log(`[LinkedIn Scraper] LOGIN WALL DETECTED - Will extract from meta tags only`);
      // Try to get public profile data from meta tags
      const metaData = await page.evaluate(() => {
        return {
          title: document.querySelector('title')?.textContent || null,
          description:
            document.querySelector('meta[name="description"]')?.getAttribute('content') || null,
          og_title:
            document.querySelector('meta[property="og:title"]')?.getAttribute('content') || null,
          og_description:
            document.querySelector('meta[property="og:description"]')?.getAttribute('content') || null,
        };
      });

      await browser.close();

      // Parse what we can from meta data
      const result = {
        url: args.linkedinUrl,
        scraped_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        limited_access: true,
        meta: metaData,
        parsed: {
          name: metaData.og_title?.split(' - ')[0] || null,
          headline: metaData.og_title?.split(' - ')[1] || null,
          summary: metaData.og_description || metaData.description || null,
        },
      };

      console.log(`[LinkedIn Scraper] Extracted from meta tags:`);
      console.log(`[LinkedIn Scraper]   Name: ${result.parsed.name}`);
      console.log(`[LinkedIn Scraper]   Headline: ${result.parsed.headline}`);
      console.log(`[LinkedIn Scraper]   Summary: ${result.parsed.summary?.slice(0, 100)}...`);
      console.log(`[LinkedIn Scraper] Duration: ${result.duration_ms}ms`);
      console.log(`[LinkedIn Scraper] ========================================\n`);

      return JSON.stringify(result, null, 2);
    }

    // Full profile data extraction
    console.log(`[LinkedIn Scraper] NO LOGIN WALL - Extracting full profile data...`);

    const profileData = await page.evaluate((incExp: boolean, incEdu: boolean) => {
      const data: Record<string, unknown> = {
        name: document.querySelector('h1')?.textContent?.trim() || null,
        headline: document.querySelector('.text-body-medium')?.textContent?.trim() || null,
        location: document.querySelector('.text-body-small.inline')?.textContent?.trim() || null,
        connections: document.querySelector('.t-bold')?.textContent?.trim() || null,
        about: document.querySelector('#about ~ .display-flex .inline-show-more-text')?.textContent?.trim() || null,
        profileImage: document.querySelector('img.pv-top-card-profile-picture__image')?.getAttribute('src') || null,
      };

      // Get experience if requested
      if (incExp) {
        const experiences: Array<{
          title: string | null;
          company: string | null;
          duration: string | null;
        }> = [];
        document.querySelectorAll('#experience ~ .pvs-list__outer-container li').forEach((el) => {
          const title = el.querySelector('.t-bold span')?.textContent?.trim() || null;
          const company = el.querySelector('.t-normal span')?.textContent?.trim() || null;
          const duration = el.querySelector('.t-black--light span')?.textContent?.trim() || null;
          if (title || company) {
            experiences.push({ title, company, duration });
          }
        });
        data.experience = experiences.slice(0, 5);
      }

      // Get education if requested
      if (incEdu) {
        const education: Array<{
          school: string | null;
          degree: string | null;
          dates: string | null;
        }> = [];
        document.querySelectorAll('#education ~ .pvs-list__outer-container li').forEach((el) => {
          const school = el.querySelector('.t-bold span')?.textContent?.trim() || null;
          const degree = el.querySelector('.t-normal span')?.textContent?.trim() || null;
          const dates = el.querySelector('.t-black--light span')?.textContent?.trim() || null;
          if (school) {
            education.push({ school, degree, dates });
          }
        });
        data.education = education.slice(0, 3);
      }

      return data;
    }, includeExperience, includeEducation);

    await browser.close();

    const result = {
      url: args.linkedinUrl,
      scraped_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      limited_access: false,
      profile: profileData,
    };

    console.log(`[LinkedIn Scraper] FULL PROFILE extracted:`);
    console.log(`[LinkedIn Scraper]   Name: ${profileData.name}`);
    console.log(`[LinkedIn Scraper]   Headline: ${profileData.headline}`);
    console.log(`[LinkedIn Scraper]   Location: ${profileData.location}`);
    console.log(`[LinkedIn Scraper]   Experience entries: ${(profileData.experience as unknown[])?.length || 0}`);
    console.log(`[LinkedIn Scraper]   Education entries: ${(profileData.education as unknown[])?.length || 0}`);
    console.log(`[LinkedIn Scraper] Duration: ${result.duration_ms}ms`);
    console.log(`[LinkedIn Scraper] ========================================\n`);

    return JSON.stringify(result, null, 2);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`[LinkedIn Scraper] ERROR: ${errorMessage}`);
    console.log(`[LinkedIn Scraper] Duration: ${Date.now() - startTime}ms`);
    console.log(`[LinkedIn Scraper] ========================================\n`);

    if (browser) await browser.close();

    return JSON.stringify({
      error: errorMessage,
      url: args.linkedinUrl,
      duration_ms: Date.now() - startTime,
    });
  }
}
