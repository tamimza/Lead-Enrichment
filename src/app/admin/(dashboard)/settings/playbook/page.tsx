'use client';

import { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../layout';
import toast from 'react-hot-toast';
import type { SearchPlaybookStep, CreatePlaybookStepRequest, SearchType } from '@/types/enrichment-config';

export default function PlaybookPage() {
  const context = useContext(SettingsContext);
  const [steps, setSteps] = useState<SearchPlaybookStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingStep, setEditingStep] = useState<SearchPlaybookStep | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { activeConfig } = context || {
    activeConfig: null,
  };

  const fetchSteps = async () => {
    if (!activeConfig) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/playbook`);
      if (response.ok) {
        const data = await response.json();
        setSteps(data.steps);
      }
    } catch (error) {
      console.error('Failed to fetch playbook steps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeConfig) {
      fetchSteps();
    } else {
      setSteps([]);
    }
  }, [activeConfig]);

  const handleCreateStep = async (data: CreatePlaybookStepRequest) => {
    if (!activeConfig) return;
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/playbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Step created');
        setShowModal(false);
        await fetchSteps();
      } else {
        toast.error('Failed to create step');
      }
    } catch {
      toast.error('Failed to create step');
    }
  };

  const handleUpdateStep = async (stepId: string, data: Partial<SearchPlaybookStep>) => {
    if (!activeConfig) return;
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/playbook`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, ...data }),
      });

      if (response.ok) {
        toast.success('Step updated');
        setEditingStep(null);
        await fetchSteps();
      } else {
        toast.error('Failed to update step');
      }
    } catch {
      toast.error('Failed to update step');
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!activeConfig) return;
    if (!confirm('Delete this playbook step?')) return;

    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/playbook?stepId=${stepId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Step deleted');
        await fetchSteps();
      } else {
        toast.error('Failed to delete step');
      }
    } catch {
      toast.error('Failed to delete step');
    }
  };

  const handleToggleStep = async (step: SearchPlaybookStep) => {
    await handleUpdateStep(step.id, { isEnabled: !step.isEnabled });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSteps = [...steps];
    const [draggedStep] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(index, 0, draggedStep);
    setSteps(newSteps);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || !activeConfig) {
      setDraggedIndex(null);
      return;
    }

    try {
      const stepIds = steps.map(s => s.id);
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/playbook`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepIds }),
      });

      if (response.ok) {
        toast.success('Order updated');
      } else {
        toast.error('Failed to update order');
        await fetchSteps();
      }
    } catch {
      toast.error('Failed to update order');
      await fetchSteps();
    }

    setDraggedIndex(null);
  };

  if (!activeConfig) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-gray-600 font-medium">No Active Configuration</p>
        <p className="text-sm text-gray-500 mt-1">Create and activate a configuration first to manage the research playbook.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Research Playbook</h2>
            <p className="text-sm text-gray-500">Define the ordered search steps the AI agent will follow.</p>
          </div>
          <button
            onClick={() => {
              setEditingStep(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Add Step
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : steps.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No playbook steps defined yet.</p>
            <p className="text-sm text-gray-400 mt-1">Add steps to guide the AI&apos;s research process.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-move transition-all ${
                  step.isEnabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                } ${draggedIndex === index ? 'ring-2 ring-teal-500' : ''}`}
              >
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-sm font-medium text-gray-600">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{step.name}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      step.searchType === 'web_search' ? 'bg-blue-100 text-blue-700' :
                      step.searchType === 'company_website' ? 'bg-green-100 text-green-700' :
                      step.searchType === 'linkedin' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {step.searchType.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{step.queryTemplate}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStep(step)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      step.isEnabled ? 'text-teal-600 hover:bg-teal-50' : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={step.isEnabled ? 'Disable' : 'Enable'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {step.isEnabled ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setEditingStep(step);
                      setShowModal(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteStep(step.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Query Template Variables Reference */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Available Template Variables</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          {['{{person_name}}', '{{company_name}}', '{{job_title}}', '{{email}}', '{{linkedin_url}}', '{{company_website}}'].map((v) => (
            <code key={v} className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-mono text-xs">{v}</code>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <PlaybookStepModal
          step={editingStep}
          onClose={() => {
            setShowModal(false);
            setEditingStep(null);
          }}
          onCreate={handleCreateStep}
          onUpdate={editingStep ? (data) => handleUpdateStep(editingStep.id, data) : undefined}
        />
      )}
    </div>
  );
}

function PlaybookStepModal({
  step,
  onClose,
  onCreate,
  onUpdate,
}: {
  step: SearchPlaybookStep | null;
  onClose: () => void;
  onCreate: (data: CreatePlaybookStepRequest) => void;
  onUpdate?: (data: Partial<SearchPlaybookStep>) => void;
}) {
  const [name, setName] = useState(step?.name || '');
  const [description, setDescription] = useState(step?.description || '');
  const [searchType, setSearchType] = useState<SearchType>(step?.searchType || 'web_search');
  const [queryTemplate, setQueryTemplate] = useState(step?.queryTemplate || '');
  const [skipIfFound, setSkipIfFound] = useState(step?.skipIfFound?.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const data = {
      name,
      description: description || undefined,
      searchType,
      queryTemplate,
      skipIfFound: skipIfFound ? skipIfFound.split(',').map(s => s.trim()) : undefined,
    };
    if (step && onUpdate) {
      await onUpdate(data);
    } else {
      await onCreate(data);
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {step ? 'Edit Playbook Step' : 'Add Playbook Step'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Step Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., Search for company news"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="What this step accomplishes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Type</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as SearchType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="web_search">Web Search</option>
              <option value="company_website">Company Website</option>
              <option value="linkedin">LinkedIn</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Query Template</label>
            <textarea
              value={queryTemplate}
              onChange={(e) => setQueryTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
              rows={3}
              placeholder="{{company_name}} recent news funding announcements"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Use variables like {'{{company_name}}'}, {'{{person_name}}'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skip If Found (optional)</label>
            <input
              type="text"
              value={skipIfFound}
              onChange={(e) => setSkipIfFound(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="company_size, funding_info (comma separated)"
            />
            <p className="text-xs text-gray-500 mt-1">Skip this step if these data points are already found</p>
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
              disabled={isSaving || !name || !queryTemplate}
              className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : step ? 'Save Changes' : 'Add Step'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
