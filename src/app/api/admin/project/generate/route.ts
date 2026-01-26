import { NextRequest, NextResponse } from 'next/server';
import { generateProjectConfig } from '@/lib/ai-config-generator';
import type { ScrapedWebsiteData } from '@/types/project';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectName, companyName, websiteUrl, scrapedData } = body as {
      projectName: string;
      companyName: string;
      websiteUrl?: string;
      scrapedData?: ScrapedWebsiteData;
    };

    if (!projectName || !companyName) {
      return NextResponse.json(
        { error: 'Project name and company name are required' },
        { status: 400 }
      );
    }

    console.log('[Project Generate] Starting AI generation for:', companyName);

    const generated = await generateProjectConfig({
      projectName,
      companyName,
      websiteUrl,
      scrapedData,
    });

    console.log('[Project Generate] Successfully generated config for:', companyName);
    console.log('[Project Generate] Response includes:', {
      hasBusinessContext: !!generated.businessContext,
      hasConfigs: !!generated.configs,
      standardPlaybookSteps: generated.configs?.standard?.playbook?.length || 0,
      standardPriorities: generated.configs?.standard?.priorities?.length || 0,
      standardRules: generated.configs?.standard?.thinkingRules?.length || 0,
      standardBlacklist: generated.configs?.standard?.blacklist?.length || 0,
    });

    return NextResponse.json(generated);
  } catch (error) {
    console.error('[Project Generate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate configuration' },
      { status: 500 }
    );
  }
}
