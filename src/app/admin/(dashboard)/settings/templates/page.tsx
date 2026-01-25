'use client';

import { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../layout';
import toast from 'react-hot-toast';
import type { TemplateLibraryItem, EnrichmentTierConfig } from '@/types/enrichment-config';

const CATEGORIES = ['SaaS', 'FinTech', 'Healthcare', 'Enterprise', 'Startup', 'Agency', 'E-commerce', 'Other'];

export default function TemplatesPage() {
  const context = useContext(SettingsContext);
  const [templates, setTemplates] = useState<TemplateLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateLibraryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<EnrichmentTierConfig | 'all'>('all');

  const { activeConfig, selectedTier, refreshConfigs } = context || {
    activeConfig: null,
    selectedTier: 'standard' as EnrichmentTierConfig,
    refreshConfigs: async () => {},
  };

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      let url = '/api/admin/template-library';
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterTier !== 'all') params.append('tier', filterTier);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [filterCategory, filterTier]);

  const handleApplyTemplate = async (template: TemplateLibraryItem) => {
    const name = prompt(`Enter a name for the new configuration:`, `${template.name} Config`);
    if (!name) return;

    try {
      const response = await fetch('/api/admin/template-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          tier: selectedTier,
          name,
        }),
      });

      if (response.ok) {
        toast.success('Configuration created from template');
        await refreshConfigs();
      } else {
        toast.error('Failed to apply template');
      }
    } catch {
      toast.error('Failed to apply template');
    }
  };

  const handleSaveAsTemplate = async (data: { name: string; description: string; category: string; tags: string[] }) => {
    if (!activeConfig) return;

    try {
      const response = await fetch('/api/admin/template-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId: activeConfig.id,
          ...data,
        }),
      });

      if (response.ok) {
        toast.success('Template saved to library');
        setShowSaveModal(false);
        await fetchTemplates();
      } else {
        toast.error('Failed to save template');
      }
    } catch {
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      const response = await fetch(`/api/admin/template-library/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Template deleted');
        await fetchTemplates();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete template');
      }
    } catch {
      toast.error('Failed to delete template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Template Library</h2>
            <p className="text-sm text-gray-500">Pre-built configurations for different industries and use cases.</p>
          </div>
          {activeConfig && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Save Current as Template
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Tier:</span>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value as EnrichmentTierConfig | 'all')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Tiers</option>
              <option value="standard">Standard</option>
              <option value="medium">Medium</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-600 font-medium">No templates found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or save your current config as a template.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                      {template.category}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      template.tier === 'premium' ? 'bg-purple-100 text-purple-700' :
                      template.tier === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {template.tier}
                    </span>
                    {template.isSystemTemplate && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        System
                      </span>
                    )}
                  </div>
                </div>
                {!template.isSystemTemplate && (
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              {template.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{template.description}</p>
              )}

              {/* Config Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-gray-50 rounded px-2 py-1">
                  <span className="text-gray-500">Max Turns:</span>
                  <span className="ml-1 font-medium text-gray-900">{template.configSnapshot.maxTurns}</span>
                </div>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <span className="text-gray-500">Budget:</span>
                  <span className="ml-1 font-medium text-gray-900">${template.configSnapshot.maxBudgetUsd}</span>
                </div>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <span className="text-gray-500">Tone:</span>
                  <span className="ml-1 font-medium text-gray-900 capitalize">{template.configSnapshot.emailTone}</span>
                </div>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <span className="text-gray-500">Tools:</span>
                  <span className="ml-1 font-medium text-gray-900">{template.configSnapshot.allowedTools?.length || 0}</span>
                </div>
              </div>

              {/* Tags */}
              {template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Used {template.useCount} times
                </span>
                <button
                  onClick={() => handleApplyTemplate(template)}
                  className="px-3 py-1.5 bg-teal-50 text-teal-700 text-sm font-medium rounded-lg hover:bg-teal-100 transition-colors"
                >
                  Apply Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Details Modal */}
      {selectedTemplate && (
        <TemplateDetailsModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onApply={() => handleApplyTemplate(selectedTemplate)}
        />
      )}

      {/* Save Template Modal */}
      {showSaveModal && activeConfig && (
        <SaveTemplateModal
          configName={activeConfig.name}
          tier={activeConfig.tier}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveAsTemplate}
        />
      )}
    </div>
  );
}

function TemplateDetailsModal({
  template,
  onClose,
  onApply,
}: {
  template: TemplateLibraryItem;
  onClose: () => void;
  onApply: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
        </div>

        <div className="p-6 space-y-4">
          <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-auto max-h-64">
            {JSON.stringify(template.configSnapshot, null, 2)}
          </pre>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Apply Template
          </button>
        </div>
      </div>
    </div>
  );
}

function SaveTemplateModal({
  configName,
  tier,
  onClose,
  onSave,
}: {
  configName: string;
  tier: EnrichmentTierConfig;
  onClose: () => void;
  onSave: (data: { name: string; description: string; category: string; tags: string[] }) => void;
}) {
  const [name, setName] = useState(`${configName} Template`);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [tagsInput, setTagsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    await onSave({ name, description, category, tags });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Save as Template</h3>
          <p className="text-sm text-gray-500 mt-1">Save your current {tier} configuration to the template library.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={2}
              placeholder="Describe what this template is optimized for"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="b2b, outbound, tech"
            />
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
              disabled={isSaving || !name}
              className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
