'use client';

import { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../layout';
import toast from 'react-hot-toast';
import type { ThinkingRule, CreateRuleRequest, ConditionType, ActionType, ThinkingRuleAction } from '@/types/enrichment-config';

const CONDITION_TYPES: { value: ConditionType; label: string }[] = [
  { value: 'data_found', label: 'Data Found' },
  { value: 'data_missing', label: 'Data Missing' },
  { value: 'value_matches', label: 'Value Matches' },
  { value: 'value_contains', label: 'Value Contains' },
  { value: 'custom', label: 'Custom Condition' },
];

const ACTION_TYPES: { value: ActionType; label: string }[] = [
  { value: 'add_insight', label: 'Add Insight' },
  { value: 'modify_tone', label: 'Modify Tone' },
  { value: 'include_section', label: 'Include Section' },
  { value: 'exclude_section', label: 'Exclude Section' },
  { value: 'set_priority', label: 'Set Priority' },
  { value: 'custom', label: 'Custom Action' },
];

export default function RulesPage() {
  const context = useContext(SettingsContext);
  const [rules, setRules] = useState<ThinkingRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ThinkingRule | null>(null);

  const { activeConfig } = context || { activeConfig: null };

  const fetchRules = async () => {
    if (!activeConfig) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/rules`);
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules);
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeConfig) {
      fetchRules();
    } else {
      setRules([]);
    }
  }, [activeConfig]);

  const handleCreateRule = async (data: CreateRuleRequest) => {
    if (!activeConfig) return;
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Rule created');
        setShowModal(false);
        await fetchRules();
      } else {
        toast.error('Failed to create rule');
      }
    } catch {
      toast.error('Failed to create rule');
    }
  };

  const handleUpdateRule = async (ruleId: string, data: Partial<ThinkingRule>) => {
    if (!activeConfig) return;
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, ...data }),
      });

      if (response.ok) {
        toast.success('Rule updated');
        setEditingRule(null);
        await fetchRules();
      } else {
        toast.error('Failed to update rule');
      }
    } catch {
      toast.error('Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!activeConfig) return;
    if (!confirm('Delete this rule?')) return;

    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/rules?ruleId=${ruleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Rule deleted');
        await fetchRules();
      } else {
        toast.error('Failed to delete rule');
      }
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const handleToggleRule = async (rule: ThinkingRule) => {
    await handleUpdateRule(rule.id, { isEnabled: !rule.isEnabled });
  };

  if (!activeConfig) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p className="text-gray-600 font-medium">No Active Configuration</p>
        <p className="text-sm text-gray-500 mt-1">Create and activate a configuration first to manage thinking rules.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Thinking Rules</h2>
            <p className="text-sm text-gray-500">Define IF/THEN logic for how the AI interprets and acts on data.</p>
          </div>
          <button
            onClick={() => {
              setEditingRule(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Add Rule
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No thinking rules defined yet.</p>
            <p className="text-sm text-gray-400 mt-1">Add rules to guide how the AI interprets data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-lg border transition-all ${
                  rule.isEnabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{rule.name}</span>
                      {!rule.isEnabled && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-600">
                          Disabled
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">
                        IF
                      </span>
                      <span className="text-gray-600">
                        {rule.conditionType.replace('_', ' ')}
                        {rule.conditionField && ` "${rule.conditionField}"`}
                        {rule.conditionValue && ` ${rule.conditionOperator} "${rule.conditionValue}"`}
                      </span>
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg font-medium">
                        THEN
                      </span>
                      <span className="text-gray-600">
                        {rule.actionType.replace('_', ' ')}
                        {rule.actionValue.value && `: ${rule.actionValue.value}`}
                      </span>
                    </div>

                    {rule.description && (
                      <p className="text-sm text-gray-500 mt-2">{rule.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleRule(rule)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        rule.isEnabled ? 'text-teal-600 hover:bg-teal-50' : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {rule.isEnabled ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        )}
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setEditingRule(rule);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <RuleModal
          rule={editingRule}
          onClose={() => {
            setShowModal(false);
            setEditingRule(null);
          }}
          onCreate={handleCreateRule}
          onUpdate={editingRule ? (data) => handleUpdateRule(editingRule.id, data) : undefined}
        />
      )}
    </div>
  );
}

function RuleModal({
  rule,
  onClose,
  onCreate,
  onUpdate,
}: {
  rule: ThinkingRule | null;
  onClose: () => void;
  onCreate: (data: CreateRuleRequest) => void;
  onUpdate?: (data: Partial<ThinkingRule>) => void;
}) {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [conditionType, setConditionType] = useState<ConditionType>(rule?.conditionType || 'data_found');
  const [conditionField, setConditionField] = useState(rule?.conditionField || '');
  const [conditionValue, setConditionValue] = useState(rule?.conditionValue || '');
  const [actionType, setActionType] = useState<ActionType>(rule?.actionType || 'add_insight');
  const [actionValue, setActionValue] = useState(rule?.actionValue?.value || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const actionObj: ThinkingRuleAction = {
      type: actionType,
      value: actionValue || undefined,
    };

    const data = {
      name,
      description: description || undefined,
      conditionType,
      conditionField: conditionField || undefined,
      conditionValue: conditionValue || undefined,
      actionType,
      actionValue: actionObj,
    };

    if (rule && onUpdate) {
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
            {rule ? 'Edit Rule' : 'Add Rule'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., Startup Tone Adjustment"
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
              placeholder="What this rule does"
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded text-xs">IF</span>
              Condition
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition Type</label>
                <select
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value as ConditionType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  {CONDITION_TYPES.map((ct) => (
                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field (optional)</label>
                <input
                  type="text"
                  value={conditionField}
                  onChange={(e) => setConditionField(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="e.g., company_info.funding_stage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value (optional)</label>
                <input
                  type="text"
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="e.g., Series A, startup"
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs">THEN</span>
              Action
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as ActionType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  {ACTION_TYPES.map((at) => (
                    <option key={at.value} value={at.value}>{at.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Value</label>
                <input
                  type="text"
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="e.g., friendly and casual, growth metrics"
                />
              </div>
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
              disabled={isSaving || !name}
              className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : rule ? 'Save Changes' : 'Add Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
