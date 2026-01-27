'use client';

import { useState, useEffect, useContext } from 'react';
import { SettingsContext } from './layout';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Check, Search, Mail, Clock, Loader2 } from 'lucide-react';
import type { EnrichmentConfig, CreateEnrichmentConfigRequest, EmailTone } from '@/types/enrichment-config';
import { ALL_AVAILABLE_TOOLS, getToolsForTier, getDefaultToolsForTier } from '@/lib/tool-config';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

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
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Configuration</CardTitle>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Configuration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeConfig ? (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-primary">{activeConfig.name}</h3>
                    <p className="text-sm text-primary/80 mt-1">{activeConfig.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleEditConfig(activeConfig)}>
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-6 gap-4">
                  <div>
                    <div className="text-xs text-primary font-medium">Max Turns</div>
                    <div className="text-lg font-semibold">{activeConfig.maxTurns}</div>
                  </div>
                  <div>
                    <div className="text-xs text-primary font-medium">Max Tool Calls</div>
                    <div className="text-lg font-semibold">{activeConfig.maxToolCalls}</div>
                  </div>
                  <div>
                    <div className="text-xs text-primary font-medium">Budget</div>
                    <div className="text-lg font-semibold">${activeConfig.maxBudgetUsd}</div>
                  </div>
                  <div>
                    <div className="text-xs text-primary font-medium">Email Words</div>
                    <div className="text-lg font-semibold">{activeConfig.emailMinWords}-{activeConfig.emailMaxWords}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-primary font-medium">Allowed Tools</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeConfig.allowedTools.map((tool) => (
                        <Badge key={tool} variant="secondary" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-muted rounded-lg p-6 text-center">
              <div className="text-muted-foreground">
                <p className="font-medium">No active configuration</p>
                <p className="text-sm mt-1">Using system defaults for {selectedTier} tier</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Configurations */}
      <Card>
        <CardHeader>
          <CardTitle>All {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          {tierConfigs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No configurations created for this tier yet.</p>
          ) : (
            <div className="space-y-3">
              {tierConfigs.map((config) => (
                <Card
                  key={config.id}
                  className={cn(
                    'transition-colors',
                    config.isActive ? 'border-primary/50 bg-primary/5' : ''
                  )}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{config.name}</h4>
                          {config.isActive && <Badge variant="success">Active</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {config.maxTurns} turns, ${config.maxBudgetUsd} budget
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {config.allowedTools.map((tool) => (
                            <Badge key={tool} variant="outline" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditConfig(config)}>
                          Edit
                        </Button>
                        {!config.isActive && (
                          <Button variant="ghost" size="sm" onClick={() => handleActivateConfig(config.id)}>
                            <Check className="w-4 h-4 mr-1" />
                            Activate
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConfig(config.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Allowed Tools</div>
                <div className="font-semibold">
                  {activeConfig?.allowedTools.join(', ') || 'Default tools'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email Tone</div>
                <div className="font-semibold capitalize">
                  {activeConfig?.emailTone || 'Professional'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Max Agent Turns</div>
                <div className="font-semibold">
                  {activeConfig?.maxTurns || (selectedTier === 'standard' ? 5 : selectedTier === 'medium' ? 8 : 15)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Configuration Modal */}
      <CreateConfigModal
        tier={selectedTier}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateConfig}
        isCreating={isCreating}
      />

      {/* Edit Configuration Modal */}
      {editingConfig && (
        <EditConfigModal
          config={editingConfig}
          open={showEditModal}
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
  open,
  onClose,
  onCreate,
  isCreating,
}: {
  tier: string;
  open: boolean;
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create New Configuration</DialogTitle>
          <DialogDescription>For {tier} tier enrichment</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] pr-2">
          <form id="create-config-form" onSubmit={handleSubmit} className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Configuration"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxTurns">Max Turns</Label>
                <Input
                  id="maxTurns"
                  type="number"
                  value={maxTurns}
                  onChange={(e) => setMaxTurns(parseInt(e.target.value))}
                  min={1}
                  max={50}
                />
                <p className="text-xs text-muted-foreground">API rounds</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxToolCalls">Max Tool Calls</Label>
                <Input
                  id="maxToolCalls"
                  type="number"
                  value={maxToolCalls}
                  onChange={(e) => setMaxToolCalls(parseInt(e.target.value))}
                  min={1}
                  max={50}
                />
                <p className="text-xs text-muted-foreground">Total tool invocations</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBudget">Max Budget ($)</Label>
                <Input
                  id="maxBudget"
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(parseFloat(e.target.value))}
                  min={0}
                  max={100}
                  step={0.01}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emailMinWords">Email Min Words</Label>
                <Input
                  id="emailMinWords"
                  type="number"
                  value={emailMinWords}
                  onChange={(e) => setEmailMinWords(parseInt(e.target.value))}
                  min={50}
                  max={500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailMaxWords">Email Max Words</Label>
                <Input
                  id="emailMaxWords"
                  type="number"
                  value={emailMaxWords}
                  onChange={(e) => setEmailMaxWords(parseInt(e.target.value))}
                  min={100}
                  max={1000}
                />
              </div>
            </div>

            {/* Allowed Tools */}
            <div className="space-y-2">
              <Label>
                Allowed Tools
                <span className="text-xs text-muted-foreground ml-1">(for {tier} tier)</span>
              </Label>
              <div className="space-y-2">
                {availableTools.map((tool) => (
                  <label
                    key={tool.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors',
                      selectedTools.includes(tool.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    <Switch
                      checked={selectedTools.includes(tool.id)}
                      onCheckedChange={() => handleToolToggle(tool.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{tool.name}</span>
                        <Badge variant={tool.category === 'custom' ? 'default' : 'secondary'} className="text-xs">
                          {tool.category === 'custom' ? 'Custom' : 'Server'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{tool.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-config-form"
            disabled={isCreating || !name || selectedTools.length === 0}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Configuration'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditConfigModal({
  config,
  open,
  onClose,
  onUpdate,
  isSaving,
}: {
  config: EnrichmentConfig;
  open: boolean;
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Configuration</DialogTitle>
          <DialogDescription>{config.tier} tier - {config.name}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] pr-2">
          <form id="edit-config-form" onSubmit={handleSubmit} className="space-y-5 pb-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tone">Email Tone</Label>
                <Select value={emailTone} onValueChange={(value) => setEmailTone(value as EmailTone)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="professional_friendly">Professional & Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            {/* Agent Settings */}
            <div className="border-t pt-5">
              <h4 className="text-sm font-semibold mb-3">Agent Settings</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-maxTurns">
                    Max Turns
                    <span className="text-xs text-muted-foreground ml-1">(API rounds)</span>
                  </Label>
                  <Input
                    id="edit-maxTurns"
                    type="number"
                    value={maxTurns}
                    onChange={(e) => setMaxTurns(parseInt(e.target.value))}
                    min={1}
                    max={50}
                  />
                  <p className="text-xs text-muted-foreground">Increase if getting max_turns error</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maxToolCalls">
                    Max Tool Calls
                    <span className="text-xs text-muted-foreground ml-1">(total)</span>
                  </Label>
                  <Input
                    id="edit-maxToolCalls"
                    type="number"
                    value={maxToolCalls}
                    onChange={(e) => setMaxToolCalls(parseInt(e.target.value))}
                    min={1}
                    max={50}
                  />
                  <p className="text-xs text-muted-foreground">Limits tool invocations per job</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maxBudget">Max Budget ($)</Label>
                  <Input
                    id="edit-maxBudget"
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(parseFloat(e.target.value))}
                    min={0}
                    max={100}
                    step={0.01}
                  />
                </div>
              </div>
            </div>

            {/* Allowed Tools */}
            <div className="border-t pt-5">
              <h4 className="text-sm font-semibold mb-3">Allowed Tools</h4>
              <p className="text-xs text-muted-foreground mb-3">Select which tools the AI can use during enrichment</p>
              <div className="space-y-2">
                {ALL_AVAILABLE_TOOLS.map((tool) => {
                  const tierOrder = { standard: 1, medium: 2, premium: 3 };
                  const configTierLevel = tierOrder[config.tier as keyof typeof tierOrder];
                  const toolTierLevel = tierOrder[tool.tier];
                  const isAvailableForTier = toolTierLevel <= configTierLevel;

                  return (
                    <label
                      key={tool.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                        !isAvailableForTier
                          ? 'border-muted bg-muted/50 opacity-50 cursor-not-allowed'
                          : selectedTools.includes(tool.id)
                          ? 'border-primary bg-primary/5 cursor-pointer'
                          : 'border-border hover:bg-muted cursor-pointer'
                      )}
                    >
                      <Switch
                        checked={selectedTools.includes(tool.id)}
                        onCheckedChange={() => isAvailableForTier && handleToolToggle(tool.id)}
                        disabled={!isAvailableForTier}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tool.name}</span>
                          <Badge variant={tool.category === 'custom' ? 'default' : 'secondary'} className="text-xs">
                            {tool.category === 'custom' ? 'Custom' : 'Server'}
                          </Badge>
                          {!isAvailableForTier && (
                            <Badge variant="warning" className="text-xs">
                              {tool.tier}+ only
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{tool.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Email Settings */}
            <div className="border-t pt-5">
              <h4 className="text-sm font-semibold mb-3">Email Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-emailMinWords">Min Words</Label>
                  <Input
                    id="edit-emailMinWords"
                    type="number"
                    value={emailMinWords}
                    onChange={(e) => setEmailMinWords(parseInt(e.target.value))}
                    min={50}
                    max={500}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emailMaxWords">Max Words</Label>
                  <Input
                    id="edit-emailMaxWords"
                    type="number"
                    value={emailMaxWords}
                    onChange={(e) => setEmailMaxWords(parseInt(e.target.value))}
                    min={100}
                    max={1000}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-config-form"
            disabled={isSaving || !name || selectedTools.length === 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
