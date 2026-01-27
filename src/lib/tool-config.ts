// Tool Configuration
// Central definition of all available tools for enrichment

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'server' | 'custom';
  tier: 'standard' | 'medium' | 'premium'; // Minimum tier required
  // Server tool specific fields
  serverType?: 'web_search_20250305' | 'web_fetch_20250910';
  betaHeader?: string;
}

// All available tools in the system
export const ALL_AVAILABLE_TOOLS: ToolDefinition[] = [
  // Server tools (Anthropic executes these)
  {
    id: 'web_search',
    name: 'Web Search',
    description: 'Search the web for information using web search',
    category: 'server',
    tier: 'standard',
    serverType: 'web_search_20250305',
  },
  {
    id: 'web_fetch',
    name: 'Web Fetch',
    description: 'Fetch and extract content from specific URLs',
    category: 'server',
    tier: 'standard',
    serverType: 'web_fetch_20250910',
    betaHeader: 'web-fetch-2025-09-10',
  },

  // Custom tools (we execute these)
  {
    id: 'scrape_company_website',
    name: 'Scrape Company Website',
    description: 'Extract structured data from company websites (about, products, team, contact)',
    category: 'custom',
    tier: 'medium',
  },
  {
    id: 'scrape_linkedin',
    name: 'Scrape LinkedIn',
    description: 'Extract professional info from LinkedIn profiles (requires Puppeteer)',
    category: 'custom',
    tier: 'premium',
  },
];

// Get tools available for a specific tier
export function getToolsForTier(tier: 'standard' | 'medium' | 'premium'): ToolDefinition[] {
  const tierOrder = { standard: 1, medium: 2, premium: 3 };
  const currentTierLevel = tierOrder[tier];

  return ALL_AVAILABLE_TOOLS.filter(tool => {
    const toolTierLevel = tierOrder[tool.tier];
    return toolTierLevel <= currentTierLevel;
  });
}

// Get default tools for a tier
export function getDefaultToolsForTier(tier: 'standard' | 'medium' | 'premium'): string[] {
  switch (tier) {
    case 'standard':
      return ['web_search', 'web_fetch'];
    case 'medium':
      return ['web_search', 'web_fetch', 'scrape_company_website'];
    case 'premium':
      return ['web_search', 'web_fetch', 'scrape_company_website', 'scrape_linkedin'];
  }
}

// Separate tools by category (server vs custom)
export function categorizeTools(toolIds: string[]): {
  serverTools: ToolDefinition[];
  customTools: ToolDefinition[];
} {
  const serverTools: ToolDefinition[] = [];
  const customTools: ToolDefinition[] = [];

  for (const toolId of toolIds) {
    const tool = ALL_AVAILABLE_TOOLS.find(t => t.id === toolId);
    if (tool) {
      if (tool.category === 'server') {
        serverTools.push(tool);
      } else {
        customTools.push(tool);
      }
    }
  }

  return { serverTools, customTools };
}

// Get required beta headers for given tools
export function getRequiredBetaHeaders(toolIds: string[]): string[] {
  const headers: string[] = [];
  for (const toolId of toolIds) {
    const tool = ALL_AVAILABLE_TOOLS.find(t => t.id === toolId);
    if (tool?.betaHeader && !headers.includes(tool.betaHeader)) {
      headers.push(tool.betaHeader);
    }
  }
  return headers;
}

// Validate that all tools in the array are valid
export function validateTools(toolIds: string[]): { valid: boolean; invalidTools: string[] } {
  const validToolIds = ALL_AVAILABLE_TOOLS.map(t => t.id);
  const invalidTools = toolIds.filter(id => !validToolIds.includes(id));
  return {
    valid: invalidTools.length === 0,
    invalidTools,
  };
}
