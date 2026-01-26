'use client';

import { useContext } from 'react';
import { SettingsContext } from '@/app/admin/(dashboard)/settings/layout';
import type { EnrichmentTierConfig } from '@/types/enrichment-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const tiers: { value: EnrichmentTierConfig; label: string; description: string }[] = [
  { value: 'standard', label: 'Standard', description: 'Fast enrichment with web search' },
  { value: 'medium', label: 'Medium', description: 'Balanced with company research' },
  { value: 'premium', label: 'Premium', description: 'Comprehensive with LinkedIn' },
];

export default function TierSelector() {
  const context = useContext(SettingsContext);

  if (!context) {
    return null;
  }

  const { selectedTier, setSelectedTier, activeConfig, isLoading } = context;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Configuration Tier</CardTitle>
          {activeConfig && (
            <Badge variant="success">Active: {activeConfig.name}</Badge>
          )}
          {!activeConfig && !isLoading && (
            <Badge variant="secondary">Using defaults</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {tiers.map((tier) => (
            <button
              key={tier.value}
              onClick={() => setSelectedTier(tier.value)}
              className={cn(
                'flex-1 px-4 py-3 rounded-lg border-2 text-left transition-all',
                selectedTier === tier.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground hover:bg-muted'
              )}
            >
              <div className={cn(
                'text-sm font-semibold',
                selectedTier === tier.value ? 'text-primary' : 'text-foreground'
              )}>
                {tier.label}
              </div>
              <div className={cn(
                'text-xs mt-0.5',
                selectedTier === tier.value ? 'text-primary/80' : 'text-muted-foreground'
              )}>
                {tier.description}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
