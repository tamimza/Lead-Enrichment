'use client';

import { useState, useEffect, useContext } from 'react';
import { SettingsContext } from './layout';
import toast from 'react-hot-toast';
import type { EnrichmentConfig, CreateEnrichmentConfigRequest, EmailTone } from '@/types/enrichment-config';
import { ALL_AVAILABLE_TOOLS, getToolsForTier, getDefaultToolsForTier } from '@/lib/tool-config';

export default function SettingsOverviewPage() {
  const context = useContext(SettingsContext);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EnrichmentConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tierConfigs, setTierConfigs] = useState<EnrichmentConfig[]>([]);

  const { selectedTier, configs, activeConfig, isLoading, refreshConfigs } = context || {
    selectedTier: 'standard',
    configs: [],
    activeConfig: null,
    isLoading: true,
    refreshConfigs: async () => {},
  };

  useEffect(() => {
    const filtered = configs.filter(c => c.tier === selectedTier);
    setTierConfigs(filtered);
  }, [configs, selectedTier]);

  const handleCreateConfig = async (data: CreateEnrichmentConfigRequest) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/enrichment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tier: selectedTier }),
      });

      if (response.ok) {
        toast.success('Configuration created');
        setShowCreateModal(false);
        await refreshConfigs();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create configuration');
      }
    } catch {
      toast.error('Failed to create configuration');
    } finally {
      setIsCreating(false);
    }
  };

  const handleActivateConfig = async (configId: string) => {
    try {
      const response = await fetch(`/api/admin/enrichment-config/${configId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      if (response.ok) {
        toast.success('Configuration activated');
        await refreshConfigs();
      } else {
        toast.error('Failed to activate configuration');
      }
    } catch {
      toast.error('Failed to activate configuration');
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      const response = await fetch(`/api/admin/enrichment-config/${configId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Configuration deleted');
        await refreshConfigs();
      } else {
        toast.error('Failed to delete configuration');
      }
    } catch {
      toast.error('Failed to delete configuration');
    }
  };

  const handleEditConfig = (config: EnrichmentConfig) => {
    setEditingConfig(config);
    setShowEditModal(true);
  };

  const handleUpdateConfig = async (configId: string, data: Partial<EnrichmentConfig>) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/enrichment-config/${configId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Configuration updated');
        setShowEditModal(false);
        setEditingConfig(null);
        await refreshConfigs();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update configuration');
      }
    } catch {
      toast.error('Failed to update configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Configuration Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Active Configuration</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            New Configuration
          </button>
        </div>

        {activeConfig ? (
          <div className="bg-teal-50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-teal-900">{activeConfig.name}</h3>
                <p className="text-sm text-teal-700 mt-1">{activeConfig.description || 'No description'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditConfig(activeConfig)}
                  className="px-3 py-1 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Edit
                </button>
                <span className="px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
                  Active
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-6 gap-4">
              <div>
                <div className="text-xs text-teal-600 font-medium">Max Turns</div>
                <div className="text-lg font-semibold text-teal-900">{activeConfig.maxTurns}</div>
              </div>
              <div>
                <div className="text-xs text-teal-600 font-medium">Max Tool Calls</div>
                <div className="text-lg font-semibold text-teal-900">{activeConfig.maxToolCalls}</div>
              </div>
              <div>
                <div className="text-xs text-teal-600 font-medium">Budget</div>
                <div className="text-lg font-semibold text-teal-900">${activeConfig.maxBudgetUsd}</div>
              </div>
              <div>
                <div className="text-xs text-teal-600 font-medium">Email Words</div>
                <div className="text-lg font-semibold text-teal-900">{activeConfig.emailMinWords}-{activeConfig.emailMaxWords}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-teal-600 font-medium">Allowed Tools</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeConfig.allowedTools.map((tool) => (
                    <span key={tool} className="px-2 py-0.5 bg-teal-100 text-teal-800 text-xs rounded">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 font-medium">No active configuration</p>
            <p className="text-sm text-gray-500 mt-1">Using system defaults for {selectedTier} tier</p>
          </div>
        )}
      </div>

      {/* All Configurations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Configurations</h2>

        {tierConfigs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No configurations created for this tier yet.</p>
        ) : (
          <div className="space-y-3">
            {tierConfigs.map((config) => (
              <div
                key={config.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  config.isActive ? 'border-teal-200 bg-teal-50/50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{config.name}</h4>
                    {config.isActive && (
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {config.maxTurns} turns, ${config.maxBudgetUsd} budget
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {config.allowedTools.map((tool) => (
                      <span key={tool} className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditConfig(config)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  {!config.isActive && (
                    <button
                      onClick={() => handleActivateConfig(config.id)}
                      className="px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-100 rounded-lg transition-colors"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteConfig(config.id)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Allowed Tools</div>
              <div className="font-semibold text-gray-900">
                {activeConfig?.allowedTools.join(', ') || 'Default tools'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email Tone</div>
              <div className="font-semibold text-gray-900 capitalize">
                {activeConfig?.emailTone || 'Professional'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Max Agent Turns</div>
              <div className="font-semibold text-gray-900">
                {activeConfig?.maxTurns || (selectedTier === 'standard' ? 5 : selectedTier === 'medium' ? 8 : 15)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Configuration Modal */}
      {showCreateModal && (
        <CreateConfigModal
          tier={selectedTier}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateConfig}
          isCreating={isCreating}
        />
      )}

      {/* Edit Configuration Modal */}
      {showEditModal && editingConfig && (
        <EditConfigModal
          config={editingConfig}
          onClose={() => {
            setShowEditModal(false);
            setEditingConfig(null);
          }}
          onUpdate={handleUpdateConfig}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function CreateConfigModal({
  tier,
  onClose,
  onCreate,
  isCreating,
}: {
  tier: string;
  onClose: () => void;
  onCreate: (data: CreateEnrichmentConfigRequest) => void;
  isCreating: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxTurns, setMaxTurns] = useState(tier === 'standard' ? 6 : tier === 'medium' ? 10 : 15);
  const [maxToolCalls, setMaxToolCalls] = useState(tier === 'standard' ? 4 : tier === 'medium' ? 6 : 10);
  const [maxBudget, setMaxBudget] = useState(tier === 'standard' ? 0.3 : tier === 'medium' ? 0.5 : 1.2);
  const [emailMinWords, setEmailMinWords] = useState(tier === 'standard' ? 100 : tier === 'medium' ? 150 : 200);
  const [emailMaxWords, setEmailMaxWords] = useState(tier === 'standard' ? 150 : tier === 'medium' ? 200 : 300);
  const [selectedTools, setSelectedTools] = useState<string[]>(
    getDefaultToolsForTier(tier as 'standard' | 'medium' | 'premium')
  );

  const availableTools = getToolsForTier(tier as 'standard' | 'medium' | 'premium');

  const handleToolToggle = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId)
        ? prev.filter(t => t !== toolId)
        : [...prev, toolId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      tier: tier as 'standard' | 'medium' | 'premium',
      name,
      description: description || undefined,
      maxTurns,
      maxToolCalls,
      maxBudgetUsd: maxBudget,
      emailMinWords,
      emailMaxWords,
      allowedTools: selectedTools,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Create New Configuration</h3>
          <p className="text-sm text-gray-500 mt-1">For {tier} tier enrichment</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
              placeholder="My Configuration"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Turns</label>
              <input
                type="number"
                value={maxTurns}
                onChange={(e) => setMaxTurns(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                min={1}
                max={50}
              />
              <p className="text-xs text-gray-400 mt-1">API rounds</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Tool Calls</label>
              <input
                type="number"
                value={maxToolCalls}
                onChange={(e) => setMaxToolCalls(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                min={1}
                max={50}
              />
              <p className="text-xs text-gray-400 mt-1">Total tool invocations</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget ($)</label>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                min={0}
                max={100}
                step={0.01}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Min Words</label>
              <input
                type="number"
                value={emailMinWords}
                onChange={(e) => setEmailMinWords(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                min={50}
                max={500}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Max Words</label>
              <input
                type="number"
                value={emailMaxWords}
                onChange={(e) => setEmailMaxWords(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                min={100}
                max={1000}
              />
            </div>
          </div>

          {/* Allowed Tools */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Tools
              <span className="text-xs text-gray-400 ml-1">(for {tier} tier)</span>
            </label>
            <div className="space-y-2">
              {availableTools.map((tool) => (
                <label
                  key={tool.id}
                  className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedTools.includes(tool.id)
                      ? 'border-teal-300 bg-teal-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTools.includes(tool.id)}
                    onChange={() => handleToolToggle(tool.id)}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        tool.category === 'mcp'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {tool.category === 'mcp' ? 'MCP' : 'Built-in'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{tool.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !name || selectedTools.length === 0}
              className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditConfigModal({
  config,
  onClose,
  onUpdate,
  isSaving,
}: {
  config: EnrichmentConfig;
  onClose: () => void;
  onUpdate: (configId: string, data: Partial<EnrichmentConfig>) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(config.name);
  const [description, setDescription] = useState(config.description || '');
  const [maxTurns, setMaxTurns] = useState(config.maxTurns);
  const [maxToolCalls, setMaxToolCalls] = useState(config.maxToolCalls);
  const [maxBudget, setMaxBudget] = useState(config.maxBudgetUsd);
  const [emailMinWords, setEmailMinWords] = useState(config.emailMinWords);
  const [emailMaxWords, setEmailMaxWords] = useState(config.emailMaxWords);
  const [emailTone, setEmailTone] = useState(config.emailTone);
  const [selectedTools, setSelectedTools] = useState<string[]>(config.allowedTools);

  const handleToolToggle = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId)
        ? prev.filter(t => t !== toolId)
        : [...prev, toolId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(config.id, {
      name,
      description: description || undefined,
      maxTurns,
      maxToolCalls,
      maxBudgetUsd: maxBudget,
      emailMinWords,
      emailMaxWords,
      emailTone,
      allowedTools: selectedTools,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">Edit Configuration</h3>
          <p className="text-sm text-gray-500 mt-1">{config.tier} tier - {config.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Tone</label>
              <select
                value={emailTone}
                onChange={(e) => setEmailTone(e.target.value as EmailTone)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
              >
                <option value="professional">Professional</option>
                <option value="professional_friendly">Professional & Friendly</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          {/* Agent Settings */}
          <div className="border-t border-gray-200 pt-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Agent Settings</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Turns
                  <span className="text-xs text-gray-400 ml-1">(API rounds)</span>
                </label>
                <input
                  type="number"
                  value={maxTurns}
                  onChange={(e) => setMaxTurns(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                  min={1}
                  max={50}
                />
                <p className="text-xs text-gray-500 mt-1">Increase if getting max_turns error</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Tool Calls
                  <span className="text-xs text-gray-400 ml-1">(total)</span>
                </label>
                <input
                  type="number"
                  value={maxToolCalls}
                  onChange={(e) => setMaxToolCalls(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                  min={1}
                  max={50}
                />
                <p className="text-xs text-gray-500 mt-1">Limits tool invocations per job</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget ($)</label>
                <input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                  min={0}
                  max={100}
                  step={0.01}
                />
              </div>
            </div>
          </div>

          {/* Allowed Tools */}
          <div className="border-t border-gray-200 pt-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Allowed Tools</h4>
            <p className="text-xs text-gray-500 mb-3">Select which tools the AI can use during enrichment</p>
            <div className="space-y-2">
              {ALL_AVAILABLE_TOOLS.map((tool) => {
                const tierOrder = { standard: 1, medium: 2, premium: 3 };
                const configTierLevel = tierOrder[config.tier as keyof typeof tierOrder];
                const toolTierLevel = tierOrder[tool.tier];
                const isAvailableForTier = toolTierLevel <= configTierLevel;

                return (
                  <label
                    key={tool.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      !isAvailableForTier
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : selectedTools.includes(tool.id)
                        ? 'border-teal-300 bg-teal-50 cursor-pointer'
                        : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTools.includes(tool.id)}
                      onChange={() => isAvailableForTier && handleToolToggle(tool.id)}
                      disabled={!isAvailableForTier}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{tool.name}</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded ${
                          tool.category === 'mcp'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {tool.category === 'mcp' ? 'MCP' : 'Built-in'}
                        </span>
                        {!isAvailableForTier && (
                          <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                            {tool.tier}+ only
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{tool.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Email Settings */}
          <div className="border-t border-gray-200 pt-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Email Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Words</label>
                <input
                  type="number"
                  value={emailMinWords}
                  onChange={(e) => setEmailMinWords(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                  min={50}
                  max={500}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Words</label>
                <input
                  type="number"
                  value={emailMaxWords}
                  onChange={(e) => setEmailMaxWords(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                  min={100}
                  max={1000}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name || selectedTools.length === 0}
              className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
