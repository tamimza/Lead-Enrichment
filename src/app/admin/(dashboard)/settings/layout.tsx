'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, AlertCircle } from 'lucide-react';
import SettingsNav from '@/components/admin/settings/SettingsNav';
import TierSelector from '@/components/admin/settings/TierSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EnrichmentConfig, EnrichmentTierConfig } from '@/types/enrichment-config';
import type { Project } from '@/types/project';

interface SettingsContextValue {
  selectedTier: EnrichmentTierConfig;
  setSelectedTier: (tier: EnrichmentTierConfig) => void;
  configs: EnrichmentConfig[];
  activeConfig: EnrichmentConfig | null;
  activeProject: Project | null;
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
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch active project and configs in parallel
      const [projectRes, configRes] = await Promise.all([
        fetch('/api/admin/project?active=true'),
        fetch('/api/admin/enrichment-config'),
      ]);

      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setActiveProject(projectData.project || null);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfigs(configData.configs || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeConfig = configs.find(c => c.tier === selectedTier && c.isActive) || null;

  const contextValue: SettingsContextValue = {
    selectedTier,
    setSelectedTier,
    configs,
    activeConfig,
    activeProject,
    isLoading,
    refreshConfigs: fetchData,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">AI Enrichment Settings</h1>
                {activeProject && (
                  <Badge variant="outline" className="gap-1">
                    <Building2 className="w-3 h-3" />
                    {activeProject.name}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Configure how the AI agent researches leads and generates outreach emails.
              </p>
            </div>
          </div>

          {!activeProject && !isLoading && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-800">
                  No active project. Create a project to scope your settings.
                </p>
              </div>
              <Link href="/admin/projects/new">
                <Button size="sm">Create Project</Button>
              </Link>
            </div>
          )}
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
