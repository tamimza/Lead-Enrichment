// Lead Enrichment Application - Type Definitions

export type LeadStatus = 'pending' | 'processing' | 'enriched' | 'failed';

export interface EnrichmentData {
  role_summary: string;
  company_focus: string;
  key_insights: string[];
  recent_activity?: string;
  tech_stack?: string[];
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
  enrichmentData?: EnrichmentData;
  draftEmail?: string;
  errorMessage?: string;
  createdAt: Date;
  processedAt?: Date;
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
  enrichment_data: EnrichmentData | null;
  draft_email: string | null;
  error_message: string | null;
  created_at: Date;
  processed_at: Date | null;
}

// Form submission data
export interface LeadFormData {
  fullName: string;
  companyName: string;
  jobTitle?: string;
  email: string;
  linkedinUrl?: string;
  companyWebsite?: string;
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
