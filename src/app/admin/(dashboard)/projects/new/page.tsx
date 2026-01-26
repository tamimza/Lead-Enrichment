'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Sparkles, FileText, Pencil, Globe,
  Loader2, Check, Building2, User, Mail, Calendar, Wand2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { SetupMethod } from '@/types/project';
import type { GeneratedTierConfig } from '@/lib/ai-config-generator';

// =============================================================================
// Types
// =============================================================================

interface WizardState {
  step: number;
  // Step 1: Basics
  projectName: string;
  companyName: string;
  websiteUrl: string;
  setupMethod: SetupMethod;
  // Step 2: Template selection (if template method)
  templateId: string | null;
  // Step 3: Business context (generated or manual)
  companyDescription: string;
  products: string[];
  valuePropositions: string[];
  differentiators: string[];
  targetCustomerProfile: string;
  industryFocus: string[];
  competitors: string[];
  // Step 5: Sender info
  senderName: string;
  senderTitle: string;
  senderEmail: string;
  calendarLink: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: string;
}

// =============================================================================
// Component
// =============================================================================

export default function NewProjectWizard() {
  const router = useRouter();
  const [state, setState] = useState<WizardState>({
    step: 1,
    projectName: '',
    companyName: '',
    websiteUrl: '',
    setupMethod: 'ai_assisted',
    templateId: null,
    companyDescription: '',
    products: [],
    valuePropositions: [],
    differentiators: [],
    targetCustomerProfile: '',
    industryFocus: [],
    competitors: [],
    senderName: '',
    senderTitle: '',
    senderEmail: '',
    calendarLink: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [configSummary, setConfigSummary] = useState<{
    standard: { name: string; maxTurns: number; maxBudget: number };
    medium: { name: string; maxTurns: number; maxBudget: number };
    premium: { name: string; maxTurns: number; maxBudget: number };
  } | null>(null);

  // Store full generated configs for saving
  const [generatedConfigs, setGeneratedConfigs] = useState<{
    standard: GeneratedTierConfig;
    medium: GeneratedTierConfig;
    premium: GeneratedTierConfig;
  } | null>(null);

  // Array input helpers
  const [newProduct, setNewProduct] = useState('');
  const [newValueProp, setNewValueProp] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newCompetitor, setNewCompetitor] = useState('');

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  // =============================================================================
  // Step Navigation
  // =============================================================================

  const canProceed = (): boolean => {
    switch (state.step) {
      case 1:
        return !!state.projectName && !!state.companyName;
      case 2:
        if (state.setupMethod === 'template') {
          return !!state.templateId;
        }
        return true; // AI and manual can proceed
      case 3:
        return !!state.companyDescription;
      case 4:
        return true; // Summary step
      case 5:
        return true; // Sender info is optional
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (state.step === 1 && state.setupMethod === 'ai_assisted') {
      // Start AI generation
      await handleAIGeneration();
    } else if (state.step === 2 && state.setupMethod === 'template') {
      // Apply template
      await handleTemplateApplication();
    } else if (state.step === 5) {
      // Final step - create project
      await handleCreateProject();
    } else {
      setState((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const handleBack = () => {
    if (state.step > 1) {
      setState((prev) => ({ ...prev, step: prev.step - 1 }));
    }
  };

  // =============================================================================
  // AI Generation
  // =============================================================================

  const handleAIGeneration = async () => {
    setIsLoading(true);
    setGenerationProgress('Analyzing website...');
    setState((prev) => ({ ...prev, step: 2 }));

    try {
      // Step 1: Scrape website if provided
      let scrapedData = null;
      if (state.websiteUrl) {
        setGenerationProgress('Scraping website content...');
        const scrapeResponse = await fetch('/api/admin/project/analyze-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: state.websiteUrl }),
        });

        if (scrapeResponse.ok) {
          const data = await scrapeResponse.json();
          scrapedData = data.scrapedData;
        }
      }

      // Step 2: Generate full configs with AI (playbook, priorities, rules, email template, blacklist)
      setGenerationProgress('Generating AI configuration (playbook, priorities, email template...)');
      const generateResponse = await fetch('/api/admin/project/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: state.projectName,
          companyName: state.companyName,
          websiteUrl: state.websiteUrl,
          scrapedData,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}));
        console.error('Generate API error:', errorData);
        throw new Error(errorData.error || 'Failed to generate configuration');
      }

      const generated = await generateResponse.json();
      console.log('[Wizard] AI generation response:', {
        hasBusinessContext: !!generated.businessContext,
        hasConfigs: !!generated.configs,
        configTiers: generated.configs ? Object.keys(generated.configs) : [],
      });

      if (!generated.configs || !generated.configs.standard) {
        console.error('[Wizard] AI generation returned incomplete data:', generated);
        throw new Error('AI generation returned incomplete configuration');
      }

      setGenerationProgress('Configuration generated!');

      // Update state with generated data
      setState((prev) => ({
        ...prev,
        step: 3,
        companyDescription: generated.businessContext.companyDescription || '',
        products: generated.businessContext.products || [],
        valuePropositions: generated.businessContext.valuePropositions || [],
        differentiators: generated.businessContext.differentiators || [],
        targetCustomerProfile: generated.businessContext.targetCustomerProfile || '',
        industryFocus: generated.businessContext.industryFocus || [],
        competitors: generated.businessContext.competitors || [],
      }));

      // Store config summary for display
      setConfigSummary({
        standard: {
          name: generated.configs.standard.name,
          maxTurns: generated.configs.standard.maxTurns,
          maxBudget: generated.configs.standard.maxBudgetUsd,
        },
        medium: {
          name: generated.configs.medium.name,
          maxTurns: generated.configs.medium.maxTurns,
          maxBudget: generated.configs.medium.maxBudgetUsd,
        },
        premium: {
          name: generated.configs.premium.name,
          maxTurns: generated.configs.premium.maxTurns,
          maxBudget: generated.configs.premium.maxBudgetUsd,
        },
      });

      // Store full configs for saving to database
      setGeneratedConfigs(generated.configs);

      toast.success('AI generation complete!');
    } catch (error) {
      console.error('AI generation failed:', error);
      toast.error('AI generation failed. Switching to manual setup.');
      setState((prev) => ({ ...prev, step: 3, setupMethod: 'manual' }));
    } finally {
      setIsLoading(false);
      setGenerationProgress('');
    }
  };

  // =============================================================================
  // Template Application
  // =============================================================================

  const handleTemplateApplication = async () => {
    // For template setup, we just move to step 3 with empty context
    // The template will be applied when creating the project
    setState((prev) => ({ ...prev, step: 3 }));
  };

  // =============================================================================
  // Create Project
  // =============================================================================

  const handleCreateProject = async () => {
    setIsLoading(true);

    // Debug: Log what we're about to send
    console.log('[Wizard] Creating project with:', {
      setupMethod: state.setupMethod,
      hasGeneratedConfigs: !!generatedConfigs,
      configTiers: generatedConfigs ? Object.keys(generatedConfigs) : [],
      standardPlaybook: generatedConfigs?.standard?.playbook?.length || 0,
    });

    try {
      const response = await fetch('/api/admin/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.projectName,
          companyName: state.companyName,
          companyWebsite: state.websiteUrl || undefined,
          companyDescription: state.companyDescription || undefined,
          products: state.products,
          valuePropositions: state.valuePropositions,
          differentiators: state.differentiators,
          targetCustomerProfile: state.targetCustomerProfile || undefined,
          industryFocus: state.industryFocus,
          competitors: state.competitors,
          senderName: state.senderName || undefined,
          senderTitle: state.senderTitle || undefined,
          senderEmail: state.senderEmail || undefined,
          calendarLink: state.calendarLink || undefined,
          setupMethod: state.setupMethod,
          sourceTemplateId: state.templateId || undefined,
          // Include generated configs if AI-assisted setup was used
          generatedConfigs: generatedConfigs || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const project = await response.json();
      toast.success('Project created successfully!');
      router.push(`/admin/settings?project=${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================================================
  // Render Steps
  // =============================================================================

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Create New Project</h2>
        <p className="text-muted-foreground">
          Enter your company details and choose how you want to set up your AI configuration.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              value={state.projectName}
              onChange={(e) => setState((prev) => ({ ...prev, projectName: e.target.value }))}
              placeholder="e.g., Q1 2024 Outreach"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Your Company Name *</Label>
            <Input
              id="companyName"
              value={state.companyName}
              onChange={(e) => setState((prev) => ({ ...prev, companyName: e.target.value }))}
              placeholder="e.g., Acme Corp"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Company Website</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="websiteUrl"
                value={state.websiteUrl}
                onChange={(e) => setState((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                placeholder="https://your-company.com"
                className="pl-9"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            For AI-assisted setup, we&apos;ll analyze your website to understand your business
          </p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label>Setup Method</Label>
        <RadioGroup
          value={state.setupMethod}
          onValueChange={(value) => setState((prev) => ({ ...prev, setupMethod: value as SetupMethod }))}
          className="grid gap-4"
        >
          {/* AI-Assisted */}
          <label
            htmlFor="ai_assisted"
            className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
              state.setupMethod === 'ai_assisted'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'hover:border-muted-foreground/50'
            }`}
          >
            <RadioGroupItem value="ai_assisted" id="ai_assisted" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-medium">AI-Assisted</span>
                <Badge variant="default" className="text-xs">Recommended</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                We&apos;ll scrape your website and use AI to generate customized enrichment
                settings, email templates, and search playbooks tailored to your business.
              </p>
            </div>
          </label>

          {/* Template */}
          <label
            htmlFor="template"
            className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
              state.setupMethod === 'template'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'hover:border-muted-foreground/50'
            }`}
          >
            <RadioGroupItem value="template" id="template" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Start from Template</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a pre-built template for your industry (SaaS, FinTech, Healthcare, etc.)
                and customize it to your needs.
              </p>
            </div>
          </label>

          {/* Manual */}
          <label
            htmlFor="manual"
            className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
              state.setupMethod === 'manual'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'hover:border-muted-foreground/50'
            }`}
          >
            <RadioGroupItem value="manual" id="manual" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Manual Setup</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Start with a blank project and configure everything yourself. Best for advanced
                users who want full control.
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>
    </div>
  );

  const renderStep2Loading = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <Wand2 className="w-8 h-8 text-primary animate-pulse" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Generating Your Configuration</h2>
        <p className="text-muted-foreground">{generationProgress}</p>
      </div>
      <div className="flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">This may take 30-60 seconds...</span>
      </div>
    </div>
  );

  const renderStep2Template = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Choose a Template</h2>
        <p className="text-muted-foreground">
          Select a pre-built template that matches your industry.
        </p>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <label
            key={template.id}
            className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
              state.templateId === template.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'hover:border-muted-foreground/50'
            }`}
          >
            <input
              type="radio"
              name="template"
              value={template.id}
              checked={state.templateId === template.id}
              onChange={() => setState((prev) => ({ ...prev, templateId: template.id }))}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{template.name}</span>
                <Badge variant="secondary">{template.category}</Badge>
                <Badge variant="outline">{template.tier}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Business Context</h2>
        <p className="text-muted-foreground">
          {state.setupMethod === 'ai_assisted'
            ? 'Review and edit the AI-generated context about your business.'
            : 'Enter information about your company to personalize outreach.'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Company Description *</Label>
          <Textarea
            id="description"
            value={state.companyDescription}
            onChange={(e) => setState((prev) => ({ ...prev, companyDescription: e.target.value }))}
            placeholder="What does your company do? What problems do you solve?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Products / Services</Label>
          <div className="flex gap-2">
            <Input
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              placeholder="Add a product"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newProduct.trim()) {
                  e.preventDefault();
                  setState((prev) => ({ ...prev, products: [...prev.products, newProduct.trim()] }));
                  setNewProduct('');
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (newProduct.trim()) {
                  setState((prev) => ({ ...prev, products: [...prev.products, newProduct.trim()] }));
                  setNewProduct('');
                }
              }}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.products.map((p, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {p}
                <button
                  onClick={() =>
                    setState((prev) => ({ ...prev, products: prev.products.filter((_, idx) => idx !== i) }))
                  }
                >
                  &times;
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Value Propositions</Label>
          <div className="flex gap-2">
            <Input
              value={newValueProp}
              onChange={(e) => setNewValueProp(e.target.value)}
              placeholder="e.g., Save 10 hours/week"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newValueProp.trim()) {
                  e.preventDefault();
                  setState((prev) => ({
                    ...prev,
                    valuePropositions: [...prev.valuePropositions, newValueProp.trim()],
                  }));
                  setNewValueProp('');
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (newValueProp.trim()) {
                  setState((prev) => ({
                    ...prev,
                    valuePropositions: [...prev.valuePropositions, newValueProp.trim()],
                  }));
                  setNewValueProp('');
                }
              }}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.valuePropositions.map((v, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {v}
                <button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      valuePropositions: prev.valuePropositions.filter((_, idx) => idx !== i),
                    }))
                  }
                >
                  &times;
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Industry Focus</Label>
          <div className="flex gap-2">
            <Input
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              placeholder="e.g., SaaS, FinTech"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newIndustry.trim()) {
                  e.preventDefault();
                  setState((prev) => ({
                    ...prev,
                    industryFocus: [...prev.industryFocus, newIndustry.trim()],
                  }));
                  setNewIndustry('');
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (newIndustry.trim()) {
                  setState((prev) => ({
                    ...prev,
                    industryFocus: [...prev.industryFocus, newIndustry.trim()],
                  }));
                  setNewIndustry('');
                }
              }}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.industryFocus.map((ind, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {ind}
                <button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      industryFocus: prev.industryFocus.filter((_, idx) => idx !== i),
                    }))
                  }
                >
                  &times;
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Competitors (auto-added to blacklist)</Label>
          <div className="flex gap-2">
            <Input
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              placeholder="e.g., ZoomInfo, Apollo"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCompetitor.trim()) {
                  e.preventDefault();
                  setState((prev) => ({
                    ...prev,
                    competitors: [...prev.competitors, newCompetitor.trim()],
                  }));
                  setNewCompetitor('');
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (newCompetitor.trim()) {
                  setState((prev) => ({
                    ...prev,
                    competitors: [...prev.competitors, newCompetitor.trim()],
                  }));
                  setNewCompetitor('');
                }
              }}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.competitors.map((c, i) => (
              <Badge key={i} variant="destructive" className="gap-1">
                {c}
                <button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      competitors: prev.competitors.filter((_, idx) => idx !== i),
                    }))
                  }
                >
                  &times;
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Configuration Summary</h2>
        <p className="text-muted-foreground">
          Here&apos;s a summary of your project configuration. You can edit these settings later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {state.companyName}
          </CardTitle>
          <CardDescription>{state.projectName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">{state.companyDescription || 'Not provided'}</p>
          </div>

          {state.products.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Products</h4>
              <div className="flex flex-wrap gap-1">
                {state.products.map((p, i) => (
                  <Badge key={i} variant="secondary">{p}</Badge>
                ))}
              </div>
            </div>
          )}

          {state.industryFocus.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Industries</h4>
              <div className="flex flex-wrap gap-1">
                {state.industryFocus.map((ind, i) => (
                  <Badge key={i} variant="outline">{ind}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {configSummary && (
        <div className="grid grid-cols-3 gap-4">
          {(['standard', 'medium', 'premium'] as const).map((tier) => (
            <Card key={tier}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm capitalize">{tier} Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Max turns: {configSummary[tier].maxTurns}</div>
                  <div>Budget: ${configSummary[tier].maxBudget.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <Check className="w-4 h-4 inline mr-1 text-green-600" />
          Default configurations for all 3 tiers will be created automatically.
          You can customize playbooks, priorities, rules, and templates in the Settings page.
        </p>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Sender Information</h2>
        <p className="text-muted-foreground">
          Add your contact details for email signatures. This is optional and can be added later.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="senderName">Your Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="senderName"
              value={state.senderName}
              onChange={(e) => setState((prev) => ({ ...prev, senderName: e.target.value }))}
              placeholder="John Smith"
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="senderTitle">Your Title</Label>
          <Input
            id="senderTitle"
            value={state.senderTitle}
            onChange={(e) => setState((prev) => ({ ...prev, senderTitle: e.target.value }))}
            placeholder="Account Executive"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="senderEmail">Your Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="senderEmail"
              type="email"
              value={state.senderEmail}
              onChange={(e) => setState((prev) => ({ ...prev, senderEmail: e.target.value }))}
              placeholder="john@company.com"
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="calendarLink">Calendar Link</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="calendarLink"
              type="url"
              value={state.calendarLink}
              onChange={(e) => setState((prev) => ({ ...prev, calendarLink: e.target.value }))}
              placeholder="https://calendly.com/you"
              className="pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // =============================================================================
  // Main Render
  // =============================================================================

  const steps = ['Basics', 'Setup', 'Context', 'Summary', 'Sender'];

  // Determine which step to show for step 2
  const renderStep2 = () => {
    if (isLoading) return renderStep2Loading();
    if (state.setupMethod === 'template') return renderStep2Template();
    // For manual, skip step 2 entirely
    return null;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, i) => (
            <div
              key={step}
              className={`flex items-center gap-2 ${
                i + 1 <= state.step ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i + 1 < state.step
                    ? 'bg-primary text-primary-foreground'
                    : i + 1 === state.step
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1 < state.step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-sm hidden sm:inline">{step}</span>
            </div>
          ))}
        </div>
        <div className="h-2 bg-muted rounded-full">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${((state.step - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          {state.step === 1 && renderStep1()}
          {state.step === 2 && renderStep2()}
          {state.step === 3 && renderStep3()}
          {state.step === 4 && renderStep4()}
          {state.step === 5 && renderStep5()}
        </CardContent>
      </Card>

      {/* Navigation */}
      {!isLoading && (
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleBack} disabled={state.step === 1}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()}>
            {state.step === 5 ? (
              <>
                Create Project
                <Check className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
