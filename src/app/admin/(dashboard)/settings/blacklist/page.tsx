'use client';

import { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../layout';
import toast from 'react-hot-toast';
import type { BlacklistItem, BlacklistItemType, CreateBlacklistItemRequest } from '@/types/enrichment-config';

const ITEM_TYPES: { value: BlacklistItemType; label: string; description: string }[] = [
  { value: 'word', label: 'Word', description: 'Single word to avoid' },
  { value: 'phrase', label: 'Phrase', description: 'Multi-word phrase' },
  { value: 'topic', label: 'Topic', description: 'Subject to avoid discussing' },
  { value: 'competitor', label: 'Competitor', description: 'Competitor name to avoid' },
  { value: 'regex', label: 'Regex', description: 'Regular expression pattern' },
];

export default function BlacklistPage() {
  const context = useContext(SettingsContext);
  const [items, setItems] = useState<BlacklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BlacklistItem | null>(null);
  const [filter, setFilter] = useState<BlacklistItemType | 'all'>('all');

  const { activeConfig } = context || { activeConfig: null };

  const fetchItems = async () => {
    if (!activeConfig) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/blacklist`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch blacklist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeConfig) {
      fetchItems();
    } else {
      setItems([]);
    }
  }, [activeConfig]);

  const handleCreateItem = async (data: CreateBlacklistItemRequest) => {
    if (!activeConfig) return;
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Item added to blacklist');
        setShowModal(false);
        await fetchItems();
      } else {
        toast.error('Failed to add item');
      }
    } catch {
      toast.error('Failed to add item');
    }
  };

  const handleBulkCreate = async (itemsData: CreateBlacklistItemRequest[]) => {
    if (!activeConfig) return;
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsData }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Added ${data.created} items to blacklist`);
        setShowBulkModal(false);
        await fetchItems();
      } else {
        toast.error('Failed to add items');
      }
    } catch {
      toast.error('Failed to add items');
    }
  };

  const handleUpdateItem = async (itemId: string, data: Partial<BlacklistItem>) => {
    if (!activeConfig) return;
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/blacklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, ...data }),
      });

      if (response.ok) {
        toast.success('Item updated');
        setEditingItem(null);
        await fetchItems();
      } else {
        toast.error('Failed to update item');
      }
    } catch {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!activeConfig) return;
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/blacklist?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Item removed');
        await fetchItems();
      } else {
        toast.error('Failed to remove item');
      }
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleClearAll = async () => {
    if (!activeConfig) return;
    if (!confirm('Clear all blacklist items? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/blacklist?clearAll=true`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Cleared ${data.deleted} items`);
        await fetchItems();
      } else {
        toast.error('Failed to clear blacklist');
      }
    } catch {
      toast.error('Failed to clear blacklist');
    }
  };

  const handleToggleItem = async (item: BlacklistItem) => {
    await handleUpdateItem(item.id, { isEnabled: !item.isEnabled });
  };

  const filteredItems = filter === 'all' ? items : items.filter(i => i.itemType === filter);

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.itemType]) acc[item.itemType] = [];
    acc[item.itemType].push(item);
    return acc;
  }, {} as Record<string, BlacklistItem[]>);

  if (!activeConfig) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        <p className="text-gray-600 font-medium">No Active Configuration</p>
        <p className="text-sm text-gray-500 mt-1">Create and activate a configuration first to manage the blacklist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Blacklist Manager</h2>
            <p className="text-sm text-gray-500">Words, phrases, and topics to filter from generated content.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 text-teal-600 text-sm font-medium rounded-lg border border-teal-300 hover:bg-teal-50 transition-colors"
            >
              Bulk Import
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">Filter:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              filter === 'all' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({items.length})
          </button>
          {ITEM_TYPES.map((type) => {
            const count = items.filter(i => i.itemType === type.value).length;
            if (count === 0) return null;
            return (
              <button
                key={type.value}
                onClick={() => setFilter(type.value)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === type.value ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.label} ({count})
              </button>
            );
          })}
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="ml-auto px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No blacklist items defined yet.</p>
            <p className="text-sm text-gray-400 mt-1">Add items to filter from generated emails.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([type, typeItems]) => (
              <div key={type}>
                <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">{type}s</h3>
                <div className="flex flex-wrap gap-2">
                  {typeItems.map((item) => (
                    <div
                      key={item.id}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                        item.isEnabled
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-gray-100 border-gray-200 text-gray-500'
                      }`}
                    >
                      <span className={`text-sm ${!item.isEnabled && 'line-through'}`}>{item.value}</span>
                      {item.replacement && (
                        <span className="text-xs text-gray-500">→ {item.replacement}</span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleItem(item)}
                          className="p-0.5 hover:bg-red-100 rounded"
                          title={item.isEnabled ? 'Disable' : 'Enable'}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {item.isEnabled ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            )}
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowModal(true);
                          }}
                          className="p-0.5 hover:bg-red-100 rounded"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-0.5 hover:bg-red-100 rounded"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Single Item Modal */}
      {showModal && (
        <BlacklistItemModal
          item={editingItem}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onCreate={handleCreateItem}
          onUpdate={editingItem ? (data) => handleUpdateItem(editingItem.id, data) : undefined}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <BulkImportModal
          onClose={() => setShowBulkModal(false)}
          onImport={handleBulkCreate}
        />
      )}
    </div>
  );
}

function BlacklistItemModal({
  item,
  onClose,
  onCreate,
  onUpdate,
}: {
  item: BlacklistItem | null;
  onClose: () => void;
  onCreate: (data: CreateBlacklistItemRequest) => void;
  onUpdate?: (data: Partial<BlacklistItem>) => void;
}) {
  const [itemType, setItemType] = useState<BlacklistItemType>(item?.itemType || 'word');
  const [value, setValue] = useState(item?.value || '');
  const [reason, setReason] = useState(item?.reason || '');
  const [replacement, setReplacement] = useState(item?.replacement || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const data = {
      itemType,
      value,
      reason: reason || undefined,
      replacement: replacement || undefined,
    };
    if (item && onUpdate) {
      await onUpdate(data);
    } else {
      await onCreate(data);
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {item ? 'Edit Blacklist Item' : 'Add Blacklist Item'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value as BlacklistItemType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              disabled={!!item}
            >
              {ITEM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label} - {type.description}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {itemType === 'regex' ? 'Pattern' : 'Value'}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder={itemType === 'regex' ? '\\b(spam|cheap)\\b' : 'Enter value'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Replacement (optional)</label>
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Replace with this text (leave empty to remove)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Why is this blacklisted?"
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
              disabled={isSaving || !value}
              className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : item ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (items: CreateBlacklistItemRequest[]) => void;
}) {
  const [text, setText] = useState('');
  const [itemType, setItemType] = useState<BlacklistItemType>('word');
  const [isImporting, setIsImporting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsImporting(true);

    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const items: CreateBlacklistItemRequest[] = lines.map(value => ({
      itemType,
      value,
    }));

    await onImport(items);
    setIsImporting(false);
  };

  const lineCount = text.split('\n').map(l => l.trim()).filter(l => l).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Bulk Import</h3>
          <p className="text-sm text-gray-500 mt-1">Add multiple items at once, one per line.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type for all items</label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value as BlacklistItemType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {ITEM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Items (one per line) <span className="text-gray-400">- {lineCount} items</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
              rows={10}
              placeholder="spam
cheap
guaranteed
competitor name
..."
              required
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
              disabled={isImporting || lineCount === 0}
              className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : `Import ${lineCount} Items`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
