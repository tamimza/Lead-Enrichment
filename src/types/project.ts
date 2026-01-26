// Project types for business context

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

  // Status
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface ScrapedWebsiteData {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  keywords: string[];
  headings: string[];
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
