'use client';

import { useContext } from 'react';
import { SettingsContext } from '@/app/admin/(dashboard)/settings/layout';
import type { EnrichmentTierConfig } from '@/types/enrichment-config';

const tiers: { value: EnrichmentTierConfig; label: string; description: string }[] = [
  {
    value: 'standard',
    label: 'Standard',
    description: 'Fast enrichment with web search',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Balanced with company research',
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'Comprehensive with LinkedIn',
  },
];

export default function TierSelector() {
  const context = useContext(SettingsContext);

  if (!context) {
    return null;
  }

  const { selectedTier, setSelectedTier, activeConfig, isLoading } = context;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-700">Configuration Tier</h2>
        {activeConfig && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active: {activeConfig.name}
          </span>
        )}
        {!activeConfig && !isLoading && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Using defaults
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {tiers.map((tier) => (
          <button
            key={tier.value}
            onClick={() => setSelectedTier(tier.value)}
            className={`flex-1 px-4 py-3 rounded-lg border-2 text-left transition-all ${
              selectedTier === tier.value
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className={`text-sm font-semibold ${selectedTier === tier.value ? 'text-teal-700' : 'text-gray-900'}`}>
              {tier.label}
            </div>
            <div className={`text-xs mt-0.5 ${selectedTier === tier.value ? 'text-teal-600' : 'text-gray-500'}`}>
              {tier.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
