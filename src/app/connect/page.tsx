// Lead Enrichment Application - Public Lead Submission Form
// /connect - Allows prospects to submit their information for enrichment

'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { LeadSchema } from '@/lib/validations';
import type { LeadFormData } from '@/lib/validations';

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
          errorData.details.forEach((err: any) => {
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

      // Optional: redirect to a success page
      // router.push('/connect/success');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        // Client-side validation errors
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        toast.error('Please fix the errors in the form');
      } else {
        toast.error('Failed to submit. Please try again.');
        console.error('Form submission error:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/connect" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900">Lead Enrichment</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/docs"
                className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="/admin"
                className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-md mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Connect With Us
          </h1>
          <p className="text-lg text-gray-600">
            Share your information and we&apos;ll reach out with personalized insights
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg px-8 py-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Sarah Johnson"
                required
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.companyName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Acme Corp"
                required
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
              )}
            </div>

            {/* Job Title */}
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="VP of Engineering"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="sarah@acme.com"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* LinkedIn URL */}
            <div>
              <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn Profile
              </label>
              <input
                type="url"
                id="linkedinUrl"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.linkedinUrl ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://linkedin.com/in/yourprofile"
              />
              {errors.linkedinUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.linkedinUrl}</p>
              )}
            </div>

            {/* Company Website */}
            <div>
              <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 mb-1">
                Company Website
              </label>
              <input
                type="url"
                id="companyWebsite"
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.companyWebsite ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://acme.com"
              />
              {errors.companyWebsite && (
                <p className="mt-1 text-sm text-red-600">{errors.companyWebsite}</p>
              )}
            </div>

            {/* Enrichment Tier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enrichment Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, enrichmentTier: 'standard' }))}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    formData.enrichmentTier === 'standard'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">Standard</div>
                  <div className="text-xs text-gray-500 mt-1">Quick insights</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, enrichmentTier: 'medium' }))}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    formData.enrichmentTier === 'medium'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">Medium</div>
                  <div className="text-xs text-gray-500 mt-1">Company research</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, enrichmentTier: 'premium' }))}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    formData.enrichmentTier === 'premium'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">Premium</div>
                  <div className="text-xs text-gray-500 mt-1">Full web research</div>
                </button>
              </div>
            </div>

            {/* Enhanced Consent Disclosure */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Data Usage Disclosure</h4>
              <div className="text-xs text-gray-600 space-y-2">
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
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-xs text-gray-700">
                  I understand and consent to the data processing described above
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !consentChecked}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-gray-500">
            Questions about our data practices? Contact us at privacy@example.com
          </p>
        </div>
      </div>
    </div>
  );
}
