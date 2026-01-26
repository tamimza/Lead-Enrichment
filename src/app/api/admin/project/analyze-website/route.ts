import { NextRequest, NextResponse } from 'next/server';
import { analyzeWebsite, extractSuggestions } from '@/lib/website-analyzer';
import { updateProjectScrapedData, getProject } from '@/lib/project-db';
import { z } from 'zod';

const AnalyzeWebsiteSchema = z.object({
  url: z.string().min(1),
  projectId: z.string().uuid().optional(),
});

// POST /api/admin/project/analyze-website - Scrape and analyze a website
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = AnalyzeWebsiteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { url, projectId } = validationResult.data;

    console.log(`[API] Analyzing website: ${url}`);

    // Scrape the website
    const scrapedData = await analyzeWebsite(url);

    // Extract suggestions from scraped data
    const suggestions = extractSuggestions(scrapedData);

    // If projectId provided, save scraped data to project
    if (projectId) {
      const project = await getProject(projectId);
      if (project) {
        await updateProjectScrapedData(projectId, scrapedData);
        console.log(`[API] Saved scraped data to project: ${projectId}`);
      }
    }

    return NextResponse.json({
      scrapedData,
      suggestions,
    });
  } catch (error) {
    console.error('POST /api/admin/project/analyze-website error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to analyze website: ${errorMessage}` },
      { status: 500 }
    );
  }
}
