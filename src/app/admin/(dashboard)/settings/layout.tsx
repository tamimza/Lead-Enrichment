'use client';

import { useState, useEffect } from 'react';
import SettingsNav from '@/components/admin/settings/SettingsNav';
import TierSelector from '@/components/admin/settings/TierSelector';
import type { EnrichmentConfig, EnrichmentTierConfig } from '@/types/enrichment-config';

interface SettingsContextValue {
  selectedTier: EnrichmentTierConfig;
  setSelectedTier: (tier: EnrichmentTierConfig) => void;
  configs: EnrichmentConfig[];
  activeConfig: EnrichmentConfig | null;
  isLoading: boolean;
  refreshConfigs: () => Promise<void>;
}

import { createContext, useContext } from 'react';

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsLayout');
  }
  return context;
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedTier, setSelectedTier] = useState<EnrichmentTierConfig>('standard');
  const [configs, setConfigs] = useState<EnrichmentConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/enrichment-config');
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.configs);
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const activeConfig = configs.find(c => c.tier === selectedTier && c.isActive) || null;

  const contextValue: SettingsContextValue = {
    selectedTier,
    setSelectedTier,
    configs,
    activeConfig,
    isLoading,
    refreshConfigs: fetchConfigs,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AI Enrichment Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure how the AI agent researches leads and generates outreach emails.
          </p>
        </div>

        <TierSelector />

        <div className="flex gap-6 mt-6">
          <SettingsNav />
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </SettingsContext.Provider>
  );
}
