// Project types for business context

export type SetupMethod = 'ai_assisted' | 'template' | 'manual';
export type AIGenerationStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface Project {
  id: string;
  name: string;

  // Company info
  companyName: string;
  companyWebsite: string | null;
  companyDescription: string | null;

  // What they sell
  products: string[];
  valuePropositions: string[];
  differentiators: string[];

  // Target customer
  targetCustomerProfile: string | null;
  industryFocus: string[];

  // Competitors (auto-merged into blacklist)
  competitors: string[];

  // Sender info for email signature
  senderName: string | null;
  senderTitle: string | null;
  senderEmail: string | null;
  calendarLink: string | null;

  // Scraped data
  scrapedData: ScrapedWebsiteData | null;
  scrapedAt: Date | null;

  // Setup method
  setupMethod: SetupMethod;
  sourceTemplateId: string | null;
  aiGenerationStatus: AIGenerationStatus;
  aiGenerationError: string | null;

  // Usage limits
  maxLeadsPerMonth: number;
  leadsUsedThisMonth: number;
  usageResetDate: Date;

  // Status
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface ScrapedWebsiteData {
  title: string | null;
  description: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  keywords: string[];
  headings: string[];
  paragraphs: string[];
  links: { text: string; href: string }[];
  aboutText: string | null;
  productMentions: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
  };
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  techStack: string[];
  rawText: string;
  suggestedIndustry?: string;
}

export interface CreateProjectRequest {
  name: string;
  companyName: string;
  companyWebsite?: string;
  companyDescription?: string;
  products?: string[];
  valuePropositions?: string[];
  differentiators?: string[];
  targetCustomerProfile?: string;
  industryFocus?: string[];
  competitors?: string[];
  senderName?: string;
  senderTitle?: string;
  senderEmail?: string;
  calendarLink?: string;
  setupMethod?: SetupMethod;
  sourceTemplateId?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  companyName?: string;
  companyWebsite?: string;
  companyDescription?: string;
  products?: string[];
  valuePropositions?: string[];
  differentiators?: string[];
  targetCustomerProfile?: string;
  industryFocus?: string[];
  competitors?: string[];
  senderName?: string;
  senderTitle?: string;
  senderEmail?: string;
  calendarLink?: string;
  isActive?: boolean;
}

// Business context for prompt injection
export interface BusinessContext {
  companyName: string;
  companyDescription: string | null;
  products: string[];
  valuePropositions: string[];
  differentiators: string[];
  targetCustomerProfile: string | null;
  industryFocus: string[];
  competitors: string[];
  senderName: string | null;
  senderTitle: string | null;
  senderEmail: string | null;
  calendarLink: string | null;
}
