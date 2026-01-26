'use client';

import { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../layout';
import { toast } from 'sonner';
import {
  Mail, MessageSquare, Sparkles, Type, AlignLeft,
  GripVertical, Plus, Pencil, Trash2, Loader2,
  CheckCircle2, Briefcase, Coffee, FileText, Users
} from 'lucide-react';
import type { EmailTemplate, EmailSection, EmailTone } from '@/types/enrichment-config';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const TONES: { value: EmailTone; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'professional', label: 'Professional', description: 'Business-focused, clear and direct', icon: <Briefcase className="w-5 h-5" /> },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable tone', icon: <Users className="w-5 h-5" /> },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational', icon: <Coffee className="w-5 h-5" /> },
  { value: 'formal', label: 'Formal', description: 'Traditional business style', icon: <FileText className="w-5 h-5" /> },
  { value: 'conversational', label: 'Conversational', description: 'Natural dialogue feel', icon: <MessageSquare className="w-5 h-5" /> },
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
        toast.success('Template saved successfully');
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
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No Active Configuration</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create and activate a configuration first to manage the email template.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Template
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize how AI generates outreach emails
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Template
            </>
          )}
        </Button>
      </div>

      {/* Tone Selection */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">Email Tone</CardTitle>
              <CardDescription>Select the voice and style of your emails</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {TONES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={cn(
                  'relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-md',
                  tone === t.value
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-muted-foreground'
                )}
              >
                {tone === t.value && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                  tone === t.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {t.icon}
                </div>
                <div className={cn('font-medium text-sm', tone === t.value ? 'text-primary' : 'text-foreground')}>
                  {t.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {t.description}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subject & Writing Style */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Type className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Subject Line & Style</CardTitle>
              <CardDescription>Define the subject template and writing guidelines</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line Template</Label>
            <Input
              id="subject"
              value={subjectTemplate}
              onChange={(e) => setSubjectTemplate(e.target.value)}
              placeholder="{{specific_observation}} at {{company_name}}"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Available variables: {"{{name}}"}, {"{{company_name}}"}, {"{{specific_observation}}"}
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="writingStyle">Writing Style Instructions</Label>
            <Textarea
              id="writingStyle"
              value={writingStyle}
              onChange={(e) => setWritingStyle(e.target.value)}
              placeholder="Knowledgeable and consultative. Show deep understanding of their business while being respectful of their time. Use specific data points from research."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opening" className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">1</span>
                Opening Style
              </Label>
              <Textarea
                id="opening"
                value={openingStyle}
                onChange={(e) => setOpeningStyle(e.target.value)}
                placeholder="Lead with a specific, researched insight about their company or recent activity..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing" className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">N</span>
                Closing Style
              </Label>
              <Textarea
                id="closing"
                value={closingStyle}
                onChange={(e) => setClosingStyle(e.target.value)}
                placeholder="Offer value regardless of their interest - share a relevant insight or resource..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Length Constraints */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlignLeft className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-base">Length Constraints</CardTitle>
              <CardDescription>Control the email length</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="minPara">Minimum Paragraphs</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="minPara"
                  type="number"
                  value={minParagraphs}
                  onChange={(e) => setMinParagraphs(parseInt(e.target.value))}
                  min={1}
                  max={10}
                  className="w-24"
                />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/30 transition-all"
                    style={{ width: `${(minParagraphs / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="maxPara">Maximum Paragraphs</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="maxPara"
                  type="number"
                  value={maxParagraphs}
                  onChange={(e) => setMaxParagraphs(parseInt(e.target.value))}
                  min={1}
                  max={20}
                  className="w-24"
                />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(maxParagraphs / 20) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Sections */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Email Sections</CardTitle>
                <CardDescription>Define the structure of your emails. Drag to reorder.</CardDescription>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingSection(null);
                setShowSectionModal(true);
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No sections defined yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add sections to structure the email output</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setEditingSection(null);
                  setShowSectionModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add First Section
              </Button>
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
                  className={cn(
                    'group flex items-center gap-3 p-4 rounded-lg border bg-background cursor-move transition-all',
                    draggedIndex === index
                      ? 'ring-2 ring-primary border-primary shadow-lg scale-[1.02]'
                      : 'border-border hover:border-muted-foreground hover:shadow-sm'
                  )}
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold',
                      draggedIndex === index ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      {index + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{section.name}</span>
                      {section.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{section.instructions}</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingSection(section);
                        setShowSectionModal(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSection(section.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Modal */}
      <SectionModal
        section={editingSection}
        open={showSectionModal}
        onClose={() => {
          setShowSectionModal(false);
          setEditingSection(null);
        }}
        onCreate={handleAddSection}
        onUpdate={editingSection ? handleUpdateSection : undefined}
      />
    </div>
  );
}

function SectionModal({
  section,
  open,
  onClose,
  onCreate,
  onUpdate,
}: {
  section: EmailSection | null;
  open: boolean;
  onClose: () => void;
  onCreate: (data: Omit<EmailSection, 'id' | 'order'>) => void;
  onUpdate?: (data: EmailSection) => void;
}) {
  const [name, setName] = useState(section?.name || '');
  const [instructions, setInstructions] = useState(section?.instructions || '');
  const [example, setExample] = useState(section?.example || '');
  const [required, setRequired] = useState(section?.required || false);

  useEffect(() => {
    if (open) {
      setName(section?.name || '');
      setInstructions(section?.instructions || '');
      setExample(section?.example || '');
      setRequired(section?.required || false);
    }
  }, [open, section]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (section && onUpdate) {
      onUpdate({ ...section, name, instructions, example: example || undefined, required });
    } else {
      onCreate({ name, instructions, example: example || undefined, required });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{section ? 'Edit Section' : 'Add New Section'}</DialogTitle>
          <DialogDescription>
            Define what this section should contain in the generated email
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sectionName">Section Name</Label>
            <Input
              id="sectionName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Personalized Hook, Value Proposition"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sectionInstructions">Instructions</Label>
            <Textarea
              id="sectionInstructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe what the AI should write in this section..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sectionExample">Example (optional)</Label>
            <Textarea
              id="sectionExample"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="Provide an example of what this section might look like..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label htmlFor="sectionRequired" className="font-medium">Required Section</Label>
              <p className="text-xs text-muted-foreground">This section must be included in every email</p>
            </div>
            <Switch
              id="sectionRequired"
              checked={required}
              onCheckedChange={setRequired}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name || !instructions}>
              {section ? 'Save Changes' : 'Add Section'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
