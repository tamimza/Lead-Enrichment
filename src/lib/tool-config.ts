// Tool Configuration
// Central definition of all available tools for enrichment

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'builtin' | 'mcp';
  tier: 'standard' | 'medium' | 'premium'; // Minimum tier required
}

// All available tools in the system
export const ALL_AVAILABLE_TOOLS: ToolDefinition[] = [
  // Built-in Claude Agent SDK tools
  {
    id: 'WebSearch',
    name: 'Web Search',
    description: 'Search the web for information using web search',
    category: 'builtin',
    tier: 'standard',
  },
  {
    id: 'WebFetch',
    name: 'Web Fetch',
    description: 'Fetch and extract content from specific URLs',
    category: 'builtin',
    tier: 'standard',
  },

  // Custom MCP tools (defined in src/agent/mcp-tools.ts)
  {
    id: 'scrape_company_website',
    name: 'Scrape Company Website',
    description: 'Extract structured data from company websites (about, products, team, contact)',
    category: 'mcp',
    tier: 'medium',
  },
  {
    id: 'scrape_linkedin',
    name: 'Scrape LinkedIn',
    description: 'Extract professional info from LinkedIn profiles (requires Puppeteer)',
    category: 'mcp',
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
      return ['WebSearch', 'WebFetch'];
    case 'medium':
      return ['WebSearch', 'WebFetch', 'scrape_company_website'];
    case 'premium':
      return ['WebSearch', 'WebFetch', 'scrape_company_website', 'scrape_linkedin'];
  }
}

// Separate tools by category
export function categorizeTools(toolIds: string[]): {
  builtinTools: string[];
  mcpTools: string[];
} {
  const builtinTools: string[] = [];
  const mcpTools: string[] = [];

  for (const toolId of toolIds) {
    const tool = ALL_AVAILABLE_TOOLS.find(t => t.id === toolId);
    if (tool) {
      if (tool.category === 'builtin') {
        builtinTools.push(toolId);
      } else {
        mcpTools.push(toolId);
      }
    }
  }

  return { builtinTools, mcpTools };
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
