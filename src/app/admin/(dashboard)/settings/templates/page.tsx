'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { SettingsContext } from '../layout';
import { toast } from 'sonner';
import type { TemplateLibraryItem, EnrichmentTierConfig } from '@/types/enrichment-config';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookTemplate, Trash2, Loader2, CheckCircle2, ArrowRight, Save, Sparkles
} from 'lucide-react';

const CATEGORIES = ['SaaS', 'FinTech', 'Healthcare', 'Enterprise', 'Startup', 'Agency', 'E-commerce', 'Other'];

export default function TemplatesPage() {
  const router = useRouter();
  const context = useContext(SettingsContext);
  const [templates, setTemplates] = useState<TemplateLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateLibraryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<EnrichmentTierConfig | 'all'>('all');

  const { activeConfig, refreshConfigs, setSelectedTier } = context || {
    activeConfig: null,
    refreshConfigs: async () => {},
    setSelectedTier: () => {},
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

  const handleApplyTemplate = (template: TemplateLibraryItem) => {
    setSelectedTemplate(template);
    setShowApplyModal(true);
  };

  const handleConfirmApply = async (name: string, activateNow: boolean) => {
    if (!selectedTemplate) return;

    try {
      // Create config from template
      const response = await fetch('/api/admin/template-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          tier: selectedTemplate.tier,
          name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await refreshConfigs();

        if (activateNow) {
          // Activate the new config
          const activateResponse = await fetch(`/api/admin/enrichment-config/${data.config.id}/activate`, {
            method: 'POST',
          });

          if (activateResponse.ok) {
            toast.success('Configuration created and activated!');
            // Switch to the template's tier and navigate to Overview
            setSelectedTier(selectedTemplate.tier);
            router.push('/admin/settings');
          } else {
            toast.success('Configuration created. Go to Overview to activate it.');
          }
        } else {
          toast.success(
            <div className="space-y-1">
              <div className="font-medium">Configuration created!</div>
              <div className="text-sm text-muted-foreground">
                Go to Overview to activate "{name}"
              </div>
            </div>
          );
        }

        setShowApplyModal(false);
        setSelectedTemplate(null);
        await fetchTemplates();
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
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookTemplate className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Template Library</CardTitle>
                <CardDescription>Pre-built configurations for different industries and use cases</CardDescription>
              </div>
            </div>
            {activeConfig && (
              <Button onClick={() => setShowSaveModal(true)}>
                <Save className="w-4 h-4 mr-2" />
                Save Current as Template
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">How Templates Work</p>
                <p className="text-blue-700">
                  Templates are pre-configured settings (playbook, priorities, rules, email style) that you can apply to quickly set up a new configuration.
                  When you apply a template, it creates a <strong>new configuration</strong> that you can then activate and customize.
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">Category:</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">Tier:</Label>
              <Select value={filterTier} onValueChange={(v) => setFilterTier(v as EnrichmentTierConfig | 'all')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookTemplate className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No templates found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or save your current config as a template.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{template.category}</Badge>
                      <Badge variant={
                        template.tier === 'premium' ? 'default' :
                        template.tier === 'medium' ? 'warning' : 'secondary'
                      }>
                        {template.tier}
                      </Badge>
                      {template.isSystemTemplate && (
                        <Badge variant="info">System</Badge>
                      )}
                    </div>
                  </div>
                  {!template.isSystemTemplate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {template.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.description}</p>
                )}

                {/* Config Summary */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-muted rounded px-2 py-1.5">
                    <span className="text-muted-foreground">Max Turns:</span>
                    <span className="ml-1 font-medium">{template.configSnapshot.maxTurns}</span>
                  </div>
                  <div className="bg-muted rounded px-2 py-1.5">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="ml-1 font-medium">${template.configSnapshot.maxBudgetUsd}</span>
                  </div>
                  <div className="bg-muted rounded px-2 py-1.5">
                    <span className="text-muted-foreground">Tone:</span>
                    <span className="ml-1 font-medium capitalize">{template.configSnapshot.emailTone || 'professional'}</span>
                  </div>
                  <div className="bg-muted rounded px-2 py-1.5">
                    <span className="text-muted-foreground">Tools:</span>
                    <span className="ml-1 font-medium">{template.configSnapshot.allowedTools?.length || 0}</span>
                  </div>
                </div>

                {/* Tags */}
                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-xs bg-muted rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    Used {template.useCount} times
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyTemplate(template)}
                  >
                    Apply Template
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Apply Template Modal */}
      {showApplyModal && selectedTemplate && (
        <ApplyTemplateModal
          template={selectedTemplate}
          onClose={() => {
            setShowApplyModal(false);
            setSelectedTemplate(null);
          }}
          onApply={handleConfirmApply}
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

function ApplyTemplateModal({
  template,
  onClose,
  onApply,
}: {
  template: TemplateLibraryItem;
  onClose: () => void;
  onApply: (name: string, activateNow: boolean) => Promise<void>;
}) {
  const [name, setName] = useState(`${template.name} Config`);
  const [activateNow, setActivateNow] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApplying(true);
    await onApply(name, activateNow);
    setIsApplying(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply Template: {template.name}</DialogTitle>
          <DialogDescription>
            Create a new configuration based on this template
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* What the template includes */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium">This template includes:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Max {template.configSnapshot.maxTurns} turns</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>${template.configSnapshot.maxBudgetUsd} budget</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="capitalize">{template.configSnapshot.emailTone || 'professional'} tone</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>{template.configSnapshot.allowedTools?.length || 0} tools</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              For tier: <Badge variant={template.tier === 'premium' ? 'default' : template.tier === 'medium' ? 'warning' : 'secondary'}>{template.tier}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="configName">Configuration Name</Label>
            <Input
              id="configName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your new config"
              required
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div>
              <Label htmlFor="activateNow" className="font-medium">Activate immediately</Label>
              <p className="text-xs text-muted-foreground">Set this as the active config for {template.tier} tier</p>
            </div>
            <Switch
              id="activateNow"
              checked={activateNow}
              onCheckedChange={setActivateNow}
            />
          </div>

          {!activateNow && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              The config will be created but not activated. Go to <strong>Overview</strong> to activate it later.
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isApplying || !name}>
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Apply Template
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save your current {tier} configuration to the template library
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateDesc">Description</Label>
            <Textarea
              id="templateDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is optimized for"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateCategory">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateTags">Tags (comma separated)</Label>
            <Input
              id="templateTags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="b2b, outbound, tech"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !name}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Template'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
