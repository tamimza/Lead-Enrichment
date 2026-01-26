// Lead Enrichment Application - Admin Dashboard
// /admin - View and manage leads with filtering and pagination

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Eye, Trash2, RefreshCw, ChevronLeft, ChevronRight, Copy, ExternalLink, Filter } from 'lucide-react';
import type { Lead, LeadsListResponse, LeadStatus } from '@/types';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const STATUS_VARIANTS: Record<LeadStatus, 'warning' | 'info' | 'success' | 'destructive'> = {
  pending: 'warning',
  processing: 'info',
  enriched: 'success',
  failed: 'destructive',
};

const TIER_VARIANTS: Record<string, 'secondary' | 'warning' | 'default'> = {
  standard: 'secondary',
  medium: 'warning',
  premium: 'default',
};

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [pagination.page, statusFilter]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/leads?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }

      const data: LeadsListResponse = await response.json();
      setLeads(data.leads);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success('Email copied to clipboard');
  };

  const handleDelete = async (leadId: string, leadName: string) => {
    if (!confirm(`Are you sure you want to delete "${leadName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete lead');
      }

      toast.success('Lead deleted successfully');
      fetchLeads();
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Leads Dashboard
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and track your enriched leads
            </p>
          </div>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{pagination.total}</span>
              <span className="text-sm text-muted-foreground">total leads</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filter by status</span>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as LeadStatus | 'all');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="enriched">Enriched</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchLeads()}
              className="ml-auto"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-muted-foreground">
              <p className="font-medium">No leads found</p>
              <p className="text-sm mt-1">Leads will appear here once submitted</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Leads Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="font-medium">{lead.fullName}</div>
                      {lead.jobTitle && (
                        <div className="text-xs text-muted-foreground mt-0.5">{lead.jobTitle}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.companyName}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {lead.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={TIER_VARIANTS[lead.enrichmentTier || 'standard']}>
                        {lead.enrichmentTier || 'standard'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[lead.status]}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(lead.id, lead.fullName)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          <Card className="mt-6">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page <span className="font-medium text-foreground">{pagination.page}</span> of{' '}
                  <span className="font-medium text-foreground">{pagination.totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Lead Detail Modal */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedLead?.fullName}</DialogTitle>
            <DialogDescription>{selectedLead?.companyName}</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-180px)] pr-2">
            <div className="space-y-6 pb-4">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Card className="p-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Company</div>
                    <div className="text-sm font-medium mt-1">{selectedLead?.companyName}</div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Title</div>
                    <div className="text-sm font-medium mt-1">{selectedLead?.jobTitle || 'N/A'}</div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Email</div>
                    <div className="text-sm font-medium mt-1 break-all">{selectedLead?.email}</div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Status</div>
                    <div className="mt-1">
                      <Badge variant={STATUS_VARIANTS[selectedLead?.status || 'pending']}>
                        {selectedLead?.status}
                      </Badge>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Enrichment Tier</div>
                    <div className="mt-1">
                      <Badge variant={TIER_VARIANTS[selectedLead?.enrichmentTier || 'standard']}>
                        {selectedLead?.enrichmentTier || 'standard'}
                      </Badge>
                    </div>
                  </Card>
                  {selectedLead?.linkedinUrl && (
                    <Card className="p-3 sm:col-span-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">LinkedIn</div>
                      <a
                        href={selectedLead.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary mt-1 hover:underline flex items-center gap-1 break-all"
                      >
                        {selectedLead.linkedinUrl}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </Card>
                  )}
                  {selectedLead?.companyWebsite && (
                    <Card className="p-3 sm:col-span-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Company Website</div>
                      <a
                        href={selectedLead.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary mt-1 hover:underline flex items-center gap-1 break-all"
                      >
                        {selectedLead.companyWebsite}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </Card>
                  )}
                </div>
              </div>

              {/* Enrichment Data */}
              {selectedLead?.enrichmentData && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">Enrichment Data</h4>
                    {selectedLead.enrichmentData.confidence_score !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        Confidence: {selectedLead.enrichmentData.confidence_score}%
                        {selectedLead.enrichmentData.data_freshness && (
                          <Badge variant="secondary" className="ml-2">
                            {selectedLead.enrichmentData.data_freshness}
                          </Badge>
                        )}
                      </span>
                    )}
                  </div>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4 space-y-4">
                      <div>
                        <div className="text-xs text-primary font-semibold uppercase tracking-wide">Role Summary</div>
                        <p className="text-sm mt-2 leading-relaxed">{selectedLead.enrichmentData.role_summary}</p>
                      </div>
                      <Separator />
                      <div>
                        <div className="text-xs text-primary font-semibold uppercase tracking-wide">Company Focus</div>
                        <p className="text-sm mt-2 leading-relaxed">{selectedLead.enrichmentData.company_focus}</p>
                      </div>
                      <Separator />
                      <div>
                        <div className="text-xs text-primary font-semibold uppercase tracking-wide">Key Insights</div>
                        <ul className="mt-2 space-y-2">
                          {selectedLead.enrichmentData.key_insights.map((insight, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                              <span className="leading-relaxed">{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Company Info */}
                      {selectedLead.enrichmentData.company_info && (
                        <>
                          <Separator />
                          <div>
                            <div className="text-xs text-primary font-semibold uppercase tracking-wide mb-2">
                              Company Details
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {selectedLead.enrichmentData.company_info.industry && (
                                <div>
                                  <span className="text-muted-foreground">Industry:</span>{' '}
                                  {selectedLead.enrichmentData.company_info.industry}
                                </div>
                              )}
                              {selectedLead.enrichmentData.company_info.size && (
                                <div>
                                  <span className="text-muted-foreground">Size:</span>{' '}
                                  {selectedLead.enrichmentData.company_info.size}
                                </div>
                              )}
                            </div>
                            {selectedLead.enrichmentData.company_info.description && (
                              <p className="text-sm mt-2">{selectedLead.enrichmentData.company_info.description}</p>
                            )}
                          </div>
                        </>
                      )}

                      {/* Challenges */}
                      {selectedLead.enrichmentData.likely_challenges && selectedLead.enrichmentData.likely_challenges.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <div className="text-xs text-primary font-semibold uppercase tracking-wide">Likely Challenges</div>
                            <ul className="mt-2 space-y-1">
                              {selectedLead.enrichmentData.likely_challenges.map((challenge, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-400 mt-2" />
                                  <span>{challenge}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}

                      {/* Talking Points */}
                      {selectedLead.enrichmentData.talking_points && selectedLead.enrichmentData.talking_points.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <div className="text-xs text-primary font-semibold uppercase tracking-wide">Conversation Starters</div>
                            <ul className="mt-2 space-y-1">
                              {selectedLead.enrichmentData.talking_points.map((point, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Enrichment Sources */}
              {selectedLead?.enrichmentSources && selectedLead.enrichmentSources.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Data Sources</h4>
                  <Card>
                    <CardContent className="pt-4 space-y-2">
                      {selectedLead.enrichmentSources.map((source, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Badge variant={source.type === 'web_search' ? 'info' : source.type === 'web_fetch' ? 'success' : 'secondary'}>
                            {source.type.replace('_', ' ')}
                          </Badge>
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate max-w-xs"
                            >
                              {source.url}
                            </a>
                          )}
                          {source.data_points.length > 0 && (
                            <span className="text-muted-foreground text-xs">
                              ({source.data_points.length} data points)
                            </span>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Draft Email */}
              {selectedLead?.draftEmail && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                    <h4 className="text-sm font-semibold">Draft Email</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyEmail(selectedLead.draftEmail!)}
                    >
                      <Copy className="w-4 h-4 mr-1.5" />
                      Copy to Clipboard
                    </Button>
                  </div>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedLead.draftEmail}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Error Message */}
              {selectedLead?.status === 'failed' && selectedLead.errorMessage && (
                <div>
                  <h4 className="text-sm font-semibold text-destructive mb-3">Error Details</h4>
                  <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-4">
                      <p className="text-sm text-destructive">{selectedLead.errorMessage}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <Separator className="mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground uppercase tracking-wide">Created At</div>
                    <div className="font-medium mt-1">{formatDate(selectedLead?.createdAt)}</div>
                  </div>
                  {selectedLead?.processedAt && (
                    <div>
                      <div className="text-muted-foreground uppercase tracking-wide">Processed At</div>
                      <div className="font-medium mt-1">{formatDate(selectedLead.processedAt)}</div>
                    </div>
                  )}
                  {selectedLead?.expiresAt && (
                    <div>
                      <div className="text-muted-foreground uppercase tracking-wide">Expires At</div>
                      <div className="font-medium mt-1">{formatDate(selectedLead.expiresAt)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedLead(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
