// Lead Enrichment Application - Type Definitions

export type LeadStatus = 'pending' | 'processing' | 'enriched' | 'failed';
export type EnrichmentTier = 'standard' | 'medium' | 'premium';

export interface CompanyInfo {
  description?: string;
  industry?: string;
  size?: string;
  founded?: string;
  headquarters?: string;
  products_services?: string[];
  recent_news?: string[];
  tech_stack?: string[];
  social_links?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface PersonInfo {
  bio?: string;
  current_role?: string;
  experience_years?: number;
  expertise_areas?: string[];
  recent_posts?: string[];
  education?: string;
  certifications?: string[];
}

export interface EnrichmentSource {
  type: 'web_search' | 'web_fetch' | 'inference';
  url?: string;
  fetched_at: string;
  data_points: string[];
}

export interface EnrichmentData {
  role_summary: string;
  company_focus: string;
  key_insights: string[];
  company_info?: CompanyInfo;
  person_info?: PersonInfo;
  likely_challenges?: string[];
  potential_value_props?: string[];
  talking_points?: string[];
  confidence_score?: number;
  data_freshness?: 'real_time' | 'cached' | 'inferred';
}

export interface Lead {
  id: string;
  fullName: string;
  companyName: string;
  jobTitle?: string;
  email: string;
  linkedinUrl?: string;
  companyWebsite?: string;
  status: LeadStatus;
  enrichmentTier: EnrichmentTier;
  enrichmentData?: EnrichmentData;
  enrichmentSources?: EnrichmentSource[];
  emailSubject?: string;
  draftEmail?: string;
  errorMessage?: string;
  createdAt: Date;
  processedAt?: Date;
  expiresAt?: Date;
}

// Database row interface (snake_case from Postgres)
export interface LeadRow {
  id: string;
  full_name: string;
  company_name: string;
  job_title: string | null;
  email: string;
  linkedin_url: string | null;
  company_website: string | null;
  status: LeadStatus;
  enrichment_tier: EnrichmentTier;
  enrichment_data: EnrichmentData | null;
  enrichment_sources: EnrichmentSource[] | null;
  email_subject: string | null;
  draft_email: string | null;
  error_message: string | null;
  created_at: Date;
  processed_at: Date | null;
  expires_at: Date | null;
}

// Form submission data
export interface LeadFormData {
  fullName: string;
  companyName: string;
  jobTitle?: string;
  email: string;
  linkedinUrl?: string;
  companyWebsite?: string;
  enrichmentTier?: EnrichmentTier;
}

// API response types
export interface LeadCreateResponse {
  id: string;
  status: LeadStatus;
  message: string;
}

export interface LeadsListResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
  timestamp: string;
}

// Re-export enrichment config types
export * from './enrichment-config';
