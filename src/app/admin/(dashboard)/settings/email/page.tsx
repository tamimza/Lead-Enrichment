'use client';

import { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../layout';
import toast from 'react-hot-toast';
import type { EmailTemplate, EmailSection, EmailTone } from '@/types/enrichment-config';

const TONES: { value: EmailTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'conversational', label: 'Conversational' },
];

export default function EmailTemplatePage() {
  const context = useContext(SettingsContext);
  const [, setTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<EmailSection | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Form state
  const [tone, setTone] = useState<EmailTone>('professional');
  const [writingStyle, setWritingStyle] = useState('');
  const [openingStyle, setOpeningStyle] = useState('');
  const [closingStyle, setClosingStyle] = useState('');
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [sections, setSections] = useState<EmailSection[]>([]);
  const [minParagraphs, setMinParagraphs] = useState(3);
  const [maxParagraphs, setMaxParagraphs] = useState(5);

  const { activeConfig } = context || { activeConfig: null };

  const fetchTemplate = async () => {
    if (!activeConfig) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/email-template`);
      if (response.ok) {
        const data = await response.json();
        if (data.template) {
          setTemplate(data.template);
          setTone(data.template.tone);
          setWritingStyle(data.template.writingStyle || '');
          setOpeningStyle(data.template.openingStyle || '');
          setClosingStyle(data.template.closingStyle || '');
          setSubjectTemplate(data.template.subjectTemplate || '');
          setSections(data.template.sections || []);
          setMinParagraphs(data.template.minParagraphs);
          setMaxParagraphs(data.template.maxParagraphs);
        }
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeConfig) {
      fetchTemplate();
    } else {
      setTemplate(null);
      resetForm();
    }
  }, [activeConfig]);

  const resetForm = () => {
    setTone('professional');
    setWritingStyle('');
    setOpeningStyle('');
    setClosingStyle('');
    setSubjectTemplate('');
    setSections([]);
    setMinParagraphs(3);
    setMaxParagraphs(5);
  };

  const handleSave = async () => {
    if (!activeConfig) return;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/enrichment-config/${activeConfig.id}/email-template`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tone,
          writingStyle: writingStyle || undefined,
          openingStyle: openingStyle || undefined,
          closingStyle: closingStyle || undefined,
          subjectTemplate: subjectTemplate || undefined,
          sections,
          minParagraphs,
          maxParagraphs,
        }),
      });

      if (response.ok) {
        toast.success('Template saved');
        await fetchTemplate();
      } else {
        toast.error('Failed to save template');
      }
    } catch {
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = (section: Omit<EmailSection, 'id' | 'order'>) => {
    const newSection: EmailSection = {
      ...section,
      id: `section-${Date.now()}`,
      order: sections.length,
    };
    setSections([...sections, newSection]);
    setShowSectionModal(false);
  };

  const handleUpdateSection = (updatedSection: EmailSection) => {
    setSections(sections.map(s => s.id === updatedSection.id ? updatedSection : s));
    setShowSectionModal(false);
    setEditingSection(null);
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId).map((s, i) => ({ ...s, order: i })));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSections = [...sections];
    const [dragged] = newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, dragged);
    setSections(newSections.map((s, i) => ({ ...s, order: i })));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (!activeConfig) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-600 font-medium">No Active Configuration</p>
        <p className="text-sm text-gray-500 mt-1">Create and activate a configuration first to manage the email template.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tone & Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tone & Style</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as EmailTone)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Template</label>
            <input
              type="text"
              value={subjectTemplate}
              onChange={(e) => setSubjectTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Quick question about {{company_name}}"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Writing Style Instructions</label>
          <textarea
            value={writingStyle}
            onChange={(e) => setWritingStyle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            rows={2}
            placeholder="Use short sentences. Avoid jargon. Be direct and value-focused."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Style</label>
            <textarea
              value={openingStyle}
              onChange={(e) => setOpeningStyle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={2}
              placeholder="Start with a personalized reference to their recent work or company news"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Closing Style</label>
            <textarea
              value={closingStyle}
              onChange={(e) => setClosingStyle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={2}
              placeholder="End with a clear, low-commitment call to action"
            />
          </div>
        </div>
      </div>

      {/* Length Constraints */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Length Constraints</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Paragraphs</label>
            <input
              type="number"
              value={minParagraphs}
              onChange={(e) => setMinParagraphs(parseInt(e.target.value))}
              min={1}
              max={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Paragraphs</label>
            <input
              type="number"
              value={maxParagraphs}
              onChange={(e) => setMaxParagraphs(parseInt(e.target.value))}
              min={1}
              max={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Email Sections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Email Sections</h2>
            <p className="text-sm text-gray-500">Define the structure of the email. Drag to reorder.</p>
          </div>
          <button
            onClick={() => {
              setEditingSection(null);
              setShowSectionModal(true);
            }}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Add Section
          </button>
        </div>

        {sections.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No sections defined yet.</p>
            <p className="text-sm text-gray-400 mt-1">Add sections to structure the email output.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-4 rounded-lg border bg-white cursor-move transition-all ${
                  draggedIndex === index ? 'ring-2 ring-teal-500 border-teal-300' : 'border-gray-200'
                }`}
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
                    <span className="font-medium text-gray-900">{section.name}</span>
                    {section.required && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{section.instructions}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingSection(section);
                      setShowSectionModal(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
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

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      {/* Section Modal */}
      {showSectionModal && (
        <SectionModal
          section={editingSection}
          onClose={() => {
            setShowSectionModal(false);
            setEditingSection(null);
          }}
          onCreate={handleAddSection}
          onUpdate={editingSection ? handleUpdateSection : undefined}
        />
      )}
    </div>
  );
}

function SectionModal({
  section,
  onClose,
  onCreate,
  onUpdate,
}: {
  section: EmailSection | null;
  onClose: () => void;
  onCreate: (data: Omit<EmailSection, 'id' | 'order'>) => void;
  onUpdate?: (data: EmailSection) => void;
}) {
  const [name, setName] = useState(section?.name || '');
  const [instructions, setInstructions] = useState(section?.instructions || '');
  const [example, setExample] = useState(section?.example || '');
  const [required, setRequired] = useState(section?.required || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (section && onUpdate) {
      onUpdate({ ...section, name, instructions, example: example || undefined, required });
    } else {
      onCreate({ name, instructions, example: example || undefined, required });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {section ? 'Edit Section' : 'Add Section'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., Personalized Hook"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={3}
              placeholder="Instructions for what this section should contain"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Example (optional)</label>
            <textarea
              value={example}
              onChange={(e) => setExample(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={2}
              placeholder="An example of what this section might look like"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="required" className="text-sm font-medium text-gray-700">
              Required section
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
              disabled={!name || !instructions}
              className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {section ? 'Save Changes' : 'Add Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
