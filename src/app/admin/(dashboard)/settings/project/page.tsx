'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Project } from '@/types/project';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2, Globe, Target, Zap, Shield, User, Mail, Calendar,
  Loader2, Sparkles, Check, Plus, X, RefreshCw
} from 'lucide-react';

interface WebsiteSuggestions {
  companyDescription: string | null;
  products: string[];
  valuePropositions: string[];
  industryFocus: string[];
}

export default function ProjectSettingsPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<WebsiteSuggestions | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    companyWebsite: '',
    companyDescription: '',
    products: [] as string[],
    valuePropositions: [] as string[],
    differentiators: [] as string[],
    targetCustomerProfile: '',
    industryFocus: [] as string[],
    competitors: [] as string[],
    senderName: '',
    senderTitle: '',
    senderEmail: '',
    calendarLink: '',
  });

  // Input fields for adding items to arrays
  const [newProduct, setNewProduct] = useState('');
  const [newValueProp, setNewValueProp] = useState('');
  const [newDifferentiator, setNewDifferentiator] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newCompetitor, setNewCompetitor] = useState('');

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/project?active=true');
      if (response.ok) {
        const data = await response.json();
        if (data.project) {
          setProject(data.project);
          setFormData({
            name: data.project.name || '',
            companyName: data.project.companyName || '',
            companyWebsite: data.project.companyWebsite || '',
            companyDescription: data.project.companyDescription || '',
            products: data.project.products || [],
            valuePropositions: data.project.valuePropositions || [],
            differentiators: data.project.differentiators || [],
            targetCustomerProfile: data.project.targetCustomerProfile || '',
            industryFocus: data.project.industryFocus || [],
            competitors: data.project.competitors || [],
            senderName: data.project.senderName || '',
            senderTitle: data.project.senderTitle || '',
            senderEmail: data.project.senderEmail || '',
            calendarLink: data.project.calendarLink || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeWebsite = async () => {
    if (!formData.companyWebsite) {
      toast.error('Please enter a website URL first');
      return;
    }

    setIsAnalyzing(true);
    setSuggestions(null);

    try {
      const response = await fetch('/api/admin/project/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formData.companyWebsite,
          projectId: project?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
        toast.success('Website analyzed! Review the suggestions below.');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to analyze website');
      }
    } catch (error) {
      console.error('Failed to analyze website:', error);
      toast.error('Failed to analyze website');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = (field: keyof typeof formData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(value)
        ? [...new Set([...prev[field as keyof typeof prev] as string[], ...value])]
        : value,
    }));
    toast.success('Suggestion applied');
  };

  const handleSave = async () => {
    if (!formData.companyName) {
      toast.error('Company name is required');
      return;
    }

    // Auto-generate project name from company name if not set
    const dataToSave = {
      ...formData,
      name: formData.name || `${formData.companyName} Context`,
    };

    setIsSaving(true);

    try {
      const url = '/api/admin/project';
      const method = project ? 'PUT' : 'POST';
      const body = project
        ? { id: project.id, ...dataToSave }
        : dataToSave;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const savedProject = await response.json();
        setProject(savedProject);
        toast.success(project ? 'Project updated' : 'Project created');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save project');
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const addToArray = (field: 'products' | 'valuePropositions' | 'differentiators' | 'industryFocus' | 'competitors', value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }));
  };

  const removeFromArray = (field: 'products' | 'valuePropositions' | 'differentiators' | 'industryFocus' | 'competitors', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">
                {project ? `Business Context: ${project.companyName}` : 'Business Context'}
              </CardTitle>
              <CardDescription>
                {project
                  ? 'Update your company information to personalize AI-generated outreach emails'
                  : 'Tell the AI about YOUR company so it can personalize outreach emails'}
              </CardDescription>
            </div>
            {project && (
              <Badge variant="default" className="ml-auto flex-shrink-0">
                Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Why This Matters</p>
                <p className="text-blue-700">
                  Without business context, the AI doesn&apos;t know who is sending the email.
                  It can research the lead but can&apos;t connect their situation to YOUR value proposition.
                  Add your company info to get personalized emails that actually sell.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Company Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Your Company Name *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => {
                const companyName = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  companyName,
                  // Auto-generate project name from company name
                  name: prev.name || `${companyName} Context`,
                }));
              }}
              placeholder="e.g., Acme Corp"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyWebsite">Company Website</Label>
            <div className="flex gap-2">
              <Input
                id="companyWebsite"
                value={formData.companyWebsite}
                onChange={(e) => setFormData(prev => ({ ...prev, companyWebsite: e.target.value }))}
                placeholder="https://your-company.com"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleAnalyzeWebsite}
                disabled={isAnalyzing || !formData.companyWebsite}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Analyze Website
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click &quot;Analyze Website&quot; to auto-extract company info (uses Cheerio, no AI cost)
            </p>
          </div>

          {/* Suggestions from website analysis */}
          {suggestions && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-900">Suggestions from Website</span>
              </div>

              {suggestions.companyDescription && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-800">Description:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applySuggestion('companyDescription', suggestions.companyDescription!)}
                    >
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs text-green-700 bg-green-100 p-2 rounded">
                    {suggestions.companyDescription.slice(0, 200)}...
                  </p>
                </div>
              )}

              {suggestions.products.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-800">Products:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applySuggestion('products', suggestions.products)}
                    >
                      Apply All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.products.map((p, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.industryFocus.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-800">Industries:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applySuggestion('industryFocus', suggestions.industryFocus)}
                    >
                      Apply All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.industryFocus.map((ind, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {ind}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="companyDescription">Company Description</Label>
            <Textarea
              id="companyDescription"
              value={formData.companyDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, companyDescription: e.target.value }))}
              placeholder="What does your company do? What problems do you solve?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products & Value Props */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Products & Value Propositions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Products */}
          <div className="space-y-2">
            <Label>Products / Services</Label>
            <div className="flex gap-2">
              <Input
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                placeholder="Add a product or service"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('products', newProduct);
                    setNewProduct('');
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  addToArray('products', newProduct);
                  setNewProduct('');
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.products.map((product, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {product}
                  <button onClick={() => removeFromArray('products', i)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Value Propositions */}
          <div className="space-y-2">
            <Label>Value Propositions</Label>
            <p className="text-xs text-muted-foreground">What benefits do customers get?</p>
            <div className="flex gap-2">
              <Input
                value={newValueProp}
                onChange={(e) => setNewValueProp(e.target.value)}
                placeholder="e.g., Save 10 hours/week on research"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('valuePropositions', newValueProp);
                    setNewValueProp('');
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  addToArray('valuePropositions', newValueProp);
                  setNewValueProp('');
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.valuePropositions.map((vp, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {vp}
                  <button onClick={() => removeFromArray('valuePropositions', i)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Differentiators */}
          <div className="space-y-2">
            <Label>Differentiators</Label>
            <p className="text-xs text-muted-foreground">What makes you different from competitors?</p>
            <div className="flex gap-2">
              <Input
                value={newDifferentiator}
                onChange={(e) => setNewDifferentiator(e.target.value)}
                placeholder="e.g., AI-powered, Real-time data"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('differentiators', newDifferentiator);
                    setNewDifferentiator('');
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  addToArray('differentiators', newDifferentiator);
                  setNewDifferentiator('');
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.differentiators.map((diff, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {diff}
                  <button onClick={() => removeFromArray('differentiators', i)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target & Competitors */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Target Market & Competitors</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target Customer Profile */}
          <div className="space-y-2">
            <Label htmlFor="targetCustomerProfile">Target Customer Profile</Label>
            <Textarea
              id="targetCustomerProfile"
              value={formData.targetCustomerProfile}
              onChange={(e) => setFormData(prev => ({ ...prev, targetCustomerProfile: e.target.value }))}
              placeholder="e.g., B2B SaaS companies with 50-500 employees, SDR teams doing outbound"
              rows={2}
            />
          </div>

          {/* Industry Focus */}
          <div className="space-y-2">
            <Label>Industry Focus</Label>
            <div className="flex gap-2">
              <Input
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                placeholder="e.g., SaaS, FinTech, Healthcare"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('industryFocus', newIndustry);
                    setNewIndustry('');
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  addToArray('industryFocus', newIndustry);
                  setNewIndustry('');
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.industryFocus.map((ind, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {ind}
                  <button onClick={() => removeFromArray('industryFocus', i)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Competitors */}
          <div className="space-y-2">
            <Label>Competitors</Label>
            <p className="text-xs text-muted-foreground">
              These will be auto-merged into the blacklist - the AI will never mention them
            </p>
            <div className="flex gap-2">
              <Input
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                placeholder="e.g., ZoomInfo, Apollo"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('competitors', newCompetitor);
                    setNewCompetitor('');
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  addToArray('competitors', newCompetitor);
                  setNewCompetitor('');
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.competitors.map((comp, i) => (
                <Badge key={i} variant="destructive" className="gap-1">
                  <Shield className="w-3 h-3" />
                  {comp}
                  <button onClick={() => removeFromArray('competitors', i)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sender Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Sender Information (for email signature)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderName">Your Name</Label>
              <Input
                id="senderName"
                value={formData.senderName}
                onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderTitle">Your Title</Label>
              <Input
                id="senderTitle"
                value={formData.senderTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, senderTitle: e.target.value }))}
                placeholder="Account Executive"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderEmail">Your Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="senderEmail"
                  type="email"
                  value={formData.senderEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, senderEmail: e.target.value }))}
                  placeholder="john@company.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="calendarLink">Calendar Link (optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="calendarLink"
                  type="url"
                  value={formData.calendarLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, calendarLink: e.target.value }))}
                  placeholder="https://calendly.com/you"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={fetchProject} disabled={isSaving}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              {project ? 'Update Context' : 'Save & Activate'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
