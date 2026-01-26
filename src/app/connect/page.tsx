// Lead Enrichment Application - Public Lead Submission Form
// /connect - Allows prospects to submit their information for enrichment

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Zap } from 'lucide-react';
import { LeadSchema } from '@/lib/validations';
import type { LeadFormData } from '@/lib/validations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export default function ConnectPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    fullName: '',
    companyName: '',
    jobTitle: '',
    email: '',
    linkedinUrl: '',
    companyWebsite: '',
    enrichmentTier: 'standard',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consentChecked, setConsentChecked] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate form data
      const validated = LeadSchema.parse(formData);

      // Submit to API
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 400 && errorData.details) {
          // Validation errors
          const fieldErrors: Record<string, string> = {};
          errorData.details.forEach((err: { path: string[]; message: string }) => {
            const field = err.path[0];
            fieldErrors[field] = err.message;
          });
          setErrors(fieldErrors);
          toast.error('Please fix the errors in the form');
          return;
        } else if (response.status === 409) {
          // Duplicate email
          toast.error('This email has already been submitted');
          setErrors({ email: 'This email has already been submitted' });
          return;
        } else {
          throw new Error(errorData.message || 'Failed to submit');
        }
      }

      // Success
      toast.success('Thank you! Your information has been submitted.');

      // Reset form
      setFormData({
        fullName: '',
        companyName: '',
        jobTitle: '',
        email: '',
        linkedinUrl: '',
        companyWebsite: '',
        enrichmentTier: 'standard',
      });
      setConsentChecked(false);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && (error as { name: string }).name === 'ZodError' && 'errors' in error) {
        // Client-side validation errors
        const zodError = error as { errors: Array<{ path: string[]; message: string }> };
        const fieldErrors: Record<string, string> = {};
        zodError.errors.forEach((err) => {
          const field = err.path[0];
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        toast.error('Please fix the errors in the form');
      } else {
        toast.error('Failed to submit. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const tiers = [
    { id: 'standard', name: 'Standard', description: 'Quick insights', color: 'border-primary bg-primary/5' },
    { id: 'medium', name: 'Medium', description: 'Company research', color: 'border-amber-500 bg-amber-50' },
    { id: 'premium', name: 'Premium', description: 'Full web research', color: 'border-purple-500 bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 py-12 px-4 sm:px-6 lg:px-8">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-b z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/connect" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">Lead Enrichment</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/docs"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-md mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Connect With Us
          </h1>
          <p className="text-lg text-muted-foreground">
            Share your information and we&apos;ll reach out with personalized insights
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Sarah Johnson"
                  className={cn(errors.fullName && 'border-destructive')}
                  required
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Acme Corp"
                  className={cn(errors.companyName && 'border-destructive')}
                  required
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName}</p>
                )}
              </div>

              {/* Job Title */}
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="VP of Engineering"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="sarah@acme.com"
                  className={cn(errors.email && 'border-destructive')}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                <Input
                  type="url"
                  id="linkedinUrl"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className={cn(errors.linkedinUrl && 'border-destructive')}
                />
                {errors.linkedinUrl && (
                  <p className="text-sm text-destructive">{errors.linkedinUrl}</p>
                )}
              </div>

              {/* Company Website */}
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Company Website</Label>
                <Input
                  type="url"
                  id="companyWebsite"
                  name="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={handleChange}
                  placeholder="https://acme.com"
                  className={cn(errors.companyWebsite && 'border-destructive')}
                />
                {errors.companyWebsite && (
                  <p className="text-sm text-destructive">{errors.companyWebsite}</p>
                )}
              </div>

              {/* Enrichment Tier */}
              <div className="space-y-2">
                <Label>Enrichment Level</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {tiers.map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, enrichmentTier: tier.id as 'standard' | 'medium' | 'premium' }))}
                      className={cn(
                        'p-3 border-2 rounded-lg text-left transition-all',
                        formData.enrichmentTier === tier.id
                          ? tier.color
                          : 'border-border hover:border-muted-foreground'
                      )}
                    >
                      <div className="font-medium">{tier.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{tier.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Consent Disclosure */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Data Usage Disclosure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground space-y-2">
                    <p>By submitting this form, you acknowledge that:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>We will use AI to research publicly available information about you and your company</li>
                      {(formData.enrichmentTier === 'medium' || formData.enrichmentTier === 'premium') && (
                        <li>We will access your company website and search public web sources</li>
                      )}
                      {formData.enrichmentTier === 'premium' && (
                        <li>We may access your public LinkedIn profile for additional context</li>
                      )}
                      <li>We will generate a personalized outreach message based on our findings</li>
                      <li>Your data will be retained for 90 days and then automatically deleted</li>
                    </ul>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="consent"
                      checked={consentChecked}
                      onCheckedChange={setConsentChecked}
                    />
                    <Label htmlFor="consent" className="text-xs cursor-pointer">
                      I understand and consent to the data processing described above
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !consentChecked}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </form>

            <p className="mt-6 text-xs text-center text-muted-foreground">
              Questions about our data practices? Contact us at privacy@example.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
