'use client';

import { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../layout';
import toast from 'react-hot-toast';
import type { InformationPriority, CreatePriorityRequest } from '@/types/enrichment-config';

const CATEGORIES = ['company', 'person', 'industry', 'technology', 'financial', 'news', 'social'];

export default function PrioritiesPage() {
  const context = useContext(SettingsContext);
  const [priorities, setPriorities] = useState<InformationPriority[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPriority, setEditingPriority] = useState<InformationPriority | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { activeConfig } = context || { activeConfig: null };

  const fetchPriorities = async () => {
    if (!activeConfig) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/priorities`);
      if (response.ok) {
        const data = await response.json();
        setPriorities(data.priorities);
      }
    } catch (error) {
      console.error('Failed to fetch priorities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeConfig) {
      fetchPriorities();
    } else {
      setPriorities([]);
    }
  }, [activeConfig]);

  const handleCreatePriority = async (data: CreatePriorityRequest) => {
    if (!activeConfig) return;
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/priorities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Priority added');
        setShowModal(false);
        await fetchPriorities();
      } else {
        toast.error('Failed to add priority');
      }
    } catch {
      toast.error('Failed to add priority');
    }
  };

  const handleUpdatePriority = async (priorityId: string, data: Partial<InformationPriority>) => {
    if (!activeConfig) return;
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/priorities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priorityId, ...data }),
      });

      if (response.ok) {
        toast.success('Priority updated');
        setEditingPriority(null);
        await fetchPriorities();
      } else {
        toast.error('Failed to update priority');
      }
    } catch {
      toast.error('Failed to update priority');
    }
  };

  const handleDeletePriority = async (priorityId: string) => {
    if (!activeConfig) return;
    if (!confirm('Delete this priority?')) return;

    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/priorities?priorityId=${priorityId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Priority deleted');
        await fetchPriorities();
      } else {
        toast.error('Failed to delete priority');
      }
    } catch {
      toast.error('Failed to delete priority');
    }
  };

  const handleTogglePriority = async (priority: InformationPriority) => {
    await handleUpdatePriority(priority.id, { isEnabled: !priority.isEnabled });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPriorities = [...priorities];
    const [dragged] = newPriorities.splice(draggedIndex, 1);
    newPriorities.splice(index, 0, dragged);
    setPriorities(newPriorities);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || !activeConfig) {
      setDraggedIndex(null);
      return;
    }

    try {
      const priorityIds = priorities.map(p => p.id);
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/priorities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priorityIds }),
      });

      if (response.ok) {
        toast.success('Order updated');
      } else {
        toast.error('Failed to update order');
        await fetchPriorities();
      }
    } catch {
      toast.error('Failed to update order');
      await fetchPriorities();
    }

    setDraggedIndex(null);
  };

  if (!activeConfig) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        <p className="text-gray-600 font-medium">No Active Configuration</p>
        <p className="text-sm text-gray-500 mt-1">Create and activate a configuration first to manage priorities.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Information Priorities</h2>
            <p className="text-sm text-gray-500">Define what information the AI should prioritize gathering. Drag to reorder.</p>
          </div>
          <button
            onClick={() => {
              setEditingPriority(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Add Priority
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : priorities.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No priorities defined yet.</p>
            <p className="text-sm text-gray-400 mt-1">Add priorities to guide what information the AI should focus on.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {priorities.map((priority, index) => (
              <div
                key={priority.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-move transition-all ${
                  priority.isEnabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
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
                    <span className="font-medium text-gray-900">{priority.name}</span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 capitalize">
                      {priority.category}
                    </span>
                    {priority.isRequired && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        Required
                      </span>
                    )}
                  </div>
                  {priority.description && (
                    <p className="text-sm text-gray-500 truncate">{priority.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-4 rounded-sm ${
                          i < Math.ceil(priority.weight / 2)
                            ? 'bg-teal-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{priority.weight}</span>
                  </div>

                  <button
                    onClick={() => handleTogglePriority(priority)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      priority.isEnabled ? 'text-teal-600 hover:bg-teal-50' : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {priority.isEnabled ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setEditingPriority(priority);
                      setShowModal(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeletePriority(priority.id)}
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

      {showModal && (
        <PriorityModal
          priority={editingPriority}
          onClose={() => {
            setShowModal(false);
            setEditingPriority(null);
          }}
          onCreate={handleCreatePriority}
          onUpdate={editingPriority ? (data) => handleUpdatePriority(editingPriority.id, data) : undefined}
        />
      )}
    </div>
  );
}

function PriorityModal({
  priority,
  onClose,
  onCreate,
  onUpdate,
}: {
  priority: InformationPriority | null;
  onClose: () => void;
  onCreate: (data: CreatePriorityRequest) => void;
  onUpdate?: (data: Partial<InformationPriority>) => void;
}) {
  const [name, setName] = useState(priority?.name || '');
  const [description, setDescription] = useState(priority?.description || '');
  const [category, setCategory] = useState(priority?.category || 'company');
  const [weight, setWeight] = useState(priority?.weight || 5);
  const [isRequired, setIsRequired] = useState(priority?.isRequired || false);
  const [extractionHint, setExtractionHint] = useState(priority?.extractionHint || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const data = {
      name,
      description: description || undefined,
      category,
      weight,
      isRequired,
      extractionHint: extractionHint || undefined,
    };
    if (priority && onUpdate) {
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
            {priority ? 'Edit Priority' : 'Add Priority'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., Recent Funding Information"
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
              placeholder="What information this priority covers"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (1-10)</label>
              <input
                type="range"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value))}
                min={1}
                max={10}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-3"
              />
              <div className="text-center text-sm text-gray-600 mt-1">{weight}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Extraction Hint</label>
            <textarea
              value={extractionHint}
              onChange={(e) => setExtractionHint(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={2}
              placeholder="Instructions for how to find this information"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRequired"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="isRequired" className="text-sm font-medium text-gray-700">
              Required (must be found before completing enrichment)
            </label>
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
              {isSaving ? 'Saving...' : priority ? 'Save Changes' : 'Add Priority'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
