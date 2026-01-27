import { getActiveFullConfigForTier } from './enrichment-config-db';
import type { FullEnrichmentConfig, EnrichmentTierConfig } from '@/types/enrichment-config';

// =============================================================================
// Default Configurations (Fallback when no DB config exists)
// =============================================================================

const DEFAULT_CONFIGS: Record<EnrichmentTierConfig, Omit<FullEnrichmentConfig, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>> = {
  standard: {
    tier: 'standard',
    name: 'Default Standard',
    isActive: true,
    maxTurns: 5,
    maxToolCalls: 4,
    maxBudgetUsd: 0,
    allowedTools: ['web_search', 'web_fetch'],
    emailTone: 'professional',
    emailMinWords: 100,
    emailMaxWords: 150,
    playbook: [],
    priorities: [],
    rules: [],
    blacklist: [],
  },
  medium: {
    tier: 'medium',
    name: 'Default Medium',
    isActive: true,
    maxTurns: 8,
    maxToolCalls: 6,
    maxBudgetUsd: 1.0,
    allowedTools: ['web_search', 'web_fetch', 'scrape_company_website'],
    emailTone: 'professional',
    emailMinWords: 150,
    emailMaxWords: 200,
    playbook: [],
    priorities: [],
    rules: [],
    blacklist: [],
  },
  premium: {
    tier: 'premium',
    name: 'Default Premium',
    isActive: true,
    maxTurns: 15,
    maxToolCalls: 10,
    maxBudgetUsd: 2.0,
    allowedTools: ['web_search', 'web_fetch', 'scrape_company_website', 'scrape_linkedin'],
    emailTone: 'professional',
    emailMinWords: 200,
    emailMaxWords: 300,
    playbook: [],
    priorities: [],
    rules: [],
    blacklist: [],
  },
};

// =============================================================================
// Config Loader
// =============================================================================

export interface LoadedConfig {
  config: FullEnrichmentConfig | null;
  isDefault: boolean;
  tier: EnrichmentTierConfig;
}

/**
 * Load the active configuration for a given tier.
 * Falls back to hardcoded defaults if no config exists in the database.
 */
export async function loadConfigForTier(
  tier: EnrichmentTierConfig,
  orgId?: string
): Promise<LoadedConfig> {
  try {
    const config = await getActiveFullConfigForTier(tier, orgId);

    if (config) {
      console.log(`[ConfigLoader] Loaded active config for tier ${tier}: ${config.name}`);
      return {
        config,
        isDefault: false,
        tier,
      };
    }

    console.log(`[ConfigLoader] No active config found for tier ${tier}, using defaults`);
    return {
      config: null,
      isDefault: true,
      tier,
    };
  } catch (error) {
    console.error(`[ConfigLoader] Error loading config for tier ${tier}:`, error);
    return {
      config: null,
      isDefault: true,
      tier,
    };
  }
}

/**
 * Get the effective configuration values for a tier.
 * If a DB config exists, returns those values.
 * Otherwise, returns hardcoded defaults.
 */
export function getEffectiveConfig(loadedConfig: LoadedConfig): {
  maxTurns: number;
  maxToolCalls: number;
  maxBudgetUsd: number;
  allowedTools: string[];
  emailTone: string;
  emailMinWords: number;
  emailMaxWords: number;
} {
  if (loadedConfig.config) {
    return {
      maxTurns: loadedConfig.config.maxTurns,
      maxToolCalls: loadedConfig.config.maxToolCalls,
      maxBudgetUsd: loadedConfig.config.maxBudgetUsd,
      allowedTools: loadedConfig.config.allowedTools,
      emailTone: loadedConfig.config.emailTone,
      emailMinWords: loadedConfig.config.emailMinWords,
      emailMaxWords: loadedConfig.config.emailMaxWords,
    };
  }

  const defaults = DEFAULT_CONFIGS[loadedConfig.tier];
  return {
    maxTurns: defaults.maxTurns,
    maxToolCalls: defaults.maxToolCalls,
    maxBudgetUsd: defaults.maxBudgetUsd,
    allowedTools: defaults.allowedTools,
    emailTone: defaults.emailTone,
    emailMinWords: defaults.emailMinWords,
    emailMaxWords: defaults.emailMaxWords,
  };
}

/**
 * Get the blacklist items for filtering output.
 * Returns empty array if using defaults.
 */
export function getBlacklistItems(loadedConfig: LoadedConfig): string[] {
  if (!loadedConfig.config) {
    return [];
  }

  return loadedConfig.config.blacklist
    .filter(item => item.isEnabled)
    .map(item => item.value);
}

/**
 * Get blacklist items formatted for the prompt.
 * Groups by type for clearer instructions to the AI.
 */
export function getBlacklistForPrompt(loadedConfig: LoadedConfig): {
  words: string[];
  phrases: string[];
  topics: string[];
  competitors: string[];
} {
  if (!loadedConfig.config) {
    return { words: [], phrases: [], topics: [], competitors: [] };
  }

  const items = loadedConfig.config.blacklist.filter(item => item.isEnabled);

  return {
    words: items.filter(i => i.itemType === 'word').map(i => i.value),
    phrases: items.filter(i => i.itemType === 'phrase').map(i => i.value),
    topics: items.filter(i => i.itemType === 'topic').map(i => i.value),
    competitors: items.filter(i => i.itemType === 'competitor').map(i => i.value),
  };
}

/**
 * Get blacklist items with their replacements for smart filtering.
 */
export function getBlacklistWithReplacements(loadedConfig: LoadedConfig): Array<{
  value: string;
  type: string;
  replacement?: string;
}> {
  if (!loadedConfig.config) {
    return [];
  }

  return loadedConfig.config.blacklist
    .filter(item => item.isEnabled)
    .map(item => ({
      value: item.value,
      type: item.itemType,
      replacement: item.replacement,
    }));
}

/**
 * Apply blacklist filtering to generated content.
 * Replaces blacklisted items with their replacements or removes them.
 */
export function applyBlacklistToContent(
  content: string,
  loadedConfig: LoadedConfig
): string {
  const blacklistItems = getBlacklistWithReplacements(loadedConfig);

  if (blacklistItems.length === 0) {
    return content;
  }

  let filteredContent = content;

  for (const item of blacklistItems) {
    if (item.type === 'regex') {
      try {
        const regex = new RegExp(item.value, 'gi');
        filteredContent = filteredContent.replace(regex, item.replacement || '');
      } catch {
        console.warn(`[ConfigLoader] Invalid regex pattern: ${item.value}`);
      }
    } else {
      // Word, phrase, topic, competitor - use word boundary matching
      const escapedValue = item.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedValue}\\b`, 'gi');
      filteredContent = filteredContent.replace(regex, item.replacement || '');
    }
  }

  // Clean up any double spaces or awkward punctuation from removals
  filteredContent = filteredContent
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/([.,!?;:])\s*([.,!?;:])/g, '$1')
    .trim();

  return filteredContent;
}

/**
 * Check if a specific tool is allowed for the current config.
 */
export function isToolAllowed(toolName: string, loadedConfig: LoadedConfig): boolean {
  const config = getEffectiveConfig(loadedConfig);
  return config.allowedTools.includes(toolName);
}

/**
 * Get the list of enabled information priorities, in order.
 */
export function getPriorityInstructions(loadedConfig: LoadedConfig): string[] {
  if (!loadedConfig.config) {
    return [];
  }

  return loadedConfig.config.priorities
    .filter(p => p.isEnabled)
    .sort((a, b) => a.priorityOrder - b.priorityOrder)
    .map(p => {
      let instruction = `- ${p.name}`;
      if (p.description) {
        instruction += `: ${p.description}`;
      }
      if (p.extractionHint) {
        instruction += ` (Hint: ${p.extractionHint})`;
      }
      if (p.isRequired) {
        instruction += ' [REQUIRED]';
      }
      return instruction;
    });
}

/**
 * Get the enabled thinking rules for prompt building.
 */
export function getThinkingRules(loadedConfig: LoadedConfig): Array<{
  condition: string;
  action: string;
}> {
  if (!loadedConfig.config) {
    return [];
  }

  return loadedConfig.config.rules
    .filter(r => r.isEnabled)
    .sort((a, b) => a.ruleOrder - b.ruleOrder)
    .map(r => {
      let condition = '';
      switch (r.conditionType) {
        case 'data_found':
          condition = `If you find ${r.conditionField || 'relevant data'}`;
          break;
        case 'data_missing':
          condition = `If you cannot find ${r.conditionField || 'expected data'}`;
          break;
        case 'value_matches':
          condition = `If ${r.conditionField} ${r.conditionOperator} "${r.conditionValue}"`;
          break;
        case 'value_contains':
          condition = `If ${r.conditionField} contains "${r.conditionValue}"`;
          break;
        case 'custom':
          condition = r.conditionValue || 'Under certain conditions';
          break;
      }

      let action = '';
      switch (r.actionType) {
        case 'add_insight':
          action = `add an insight about ${r.actionValue.value || 'this finding'}`;
          break;
        case 'modify_tone':
          action = `adjust the tone to be more ${r.actionValue.value || 'appropriate'}`;
          break;
        case 'include_section':
          action = `include a section about ${r.actionValue.value || 'this topic'}`;
          break;
        case 'exclude_section':
          action = `do not include ${r.actionValue.value || 'this section'}`;
          break;
        case 'set_priority':
          action = `prioritize ${r.actionValue.value || 'this information'}`;
          break;
        case 'custom':
          action = r.actionValue.value || 'take appropriate action';
          break;
      }

      return { condition, action };
    });
}

/**
 * Get the email template sections in order.
 */
export function getEmailSections(loadedConfig: LoadedConfig): Array<{
  name: string;
  instructions: string;
  required: boolean;
}> {
  if (!loadedConfig.config?.emailTemplate) {
    return [];
  }

  return loadedConfig.config.emailTemplate.sections
    .sort((a, b) => a.order - b.order)
    .map(s => ({
      name: s.name,
      instructions: s.instructions,
      required: s.required,
    }));
}

/**
 * Get the playbook steps for search guidance.
 */
export function getPlaybookSteps(
  loadedConfig: LoadedConfig,
  currentTier: EnrichmentTierConfig
): Array<{
  name: string;
  searchType: string;
  queryTemplate: string;
  skipIfFound?: string[];
}> {
  if (!loadedConfig.config) {
    return [];
  }

  return loadedConfig.config.playbook
    .filter(s => s.isEnabled)
    .filter(s => !s.requiredTier || tierMeetsRequirement(currentTier, s.requiredTier))
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map(s => ({
      name: s.name,
      searchType: s.searchType,
      queryTemplate: s.queryTemplate,
      skipIfFound: s.skipIfFound,
    }));
}

/**
 * Check if current tier meets or exceeds the required tier.
 */
function tierMeetsRequirement(
  current: EnrichmentTierConfig,
  required: EnrichmentTierConfig
): boolean {
  const tierOrder: Record<EnrichmentTierConfig, number> = {
    standard: 1,
    medium: 2,
    premium: 3,
  };

  return tierOrder[current] >= tierOrder[required];
}
