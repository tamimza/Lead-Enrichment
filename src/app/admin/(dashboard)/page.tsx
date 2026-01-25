// Lead Enrichment Application - Admin Dashboard
// /admin - View and manage leads with filtering and pagination

'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { Lead, LeadsListResponse, LeadStatus } from '@/types';

const STATUS_COLORS: Record<LeadStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  enriched: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const TIER_COLORS: Record<string, string> = {
  standard: 'bg-gray-100 text-gray-700',
  medium: 'bg-amber-100 text-amber-800',
  premium: 'bg-purple-100 text-purple-800',
};

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
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

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/leads?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }

      const data: LeadsListResponse = await response.json();
      setLeads(data.leads);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to load leads');
      console.error('Fetch leads error:', error);
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
      fetchLeads(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete lead');
      console.error('Delete lead error:', error);
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
            <h2 className="text-2xl font-bold text-gray-900">
              Leads Dashboard
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track your enriched leads
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
              <span className="text-2xl font-bold text-gray-900">{pagination.total}</span>
              <span className="text-sm text-gray-500 ml-2">total leads</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-sm font-medium text-gray-600">Filter by status</span>
          </div>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as LeadStatus | '');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="enriched">Enriched</option>
            <option value="failed">Failed</option>
          </select>
          <button
            onClick={() => fetchLeads()}
            className="ml-auto p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500">No leads found</p>
          <p className="text-sm text-gray-400 mt-1">Leads will appear here once submitted</p>
        </div>
      ) : (
        <>
          {/* Leads Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lead.fullName}</div>
                      {lead.jobTitle && <div className="text-xs text-gray-400 mt-0.5">{lead.jobTitle}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lead.companyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {lead.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs font-medium rounded-md ${TIER_COLORS[lead.enrichmentTier || 'standard']}`}>
                        {lead.enrichmentTier || 'standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs font-medium rounded-md ${STATUS_COLORS[lead.status]}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id, lead.fullName)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <div className="text-sm text-gray-600">
              Page <span className="font-medium text-gray-900">{pagination.page}</span> of <span className="font-medium text-gray-900">{pagination.totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-colors"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-600/50 backdrop-blur-sm"
            onClick={() => setSelectedLead(null)}
          />

          {/* Modal Container - Centered */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div
              className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Fixed */}
              <div className="flex-shrink-0 bg-white rounded-t-xl border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center">
                <div className="min-w-0 flex-1 pr-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    {selectedLead.fullName}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{selectedLead.companyName}</p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <dt className="text-xs text-gray-500 uppercase tracking-wide">Company</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-1">{selectedLead.companyName}</dd>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <dt className="text-xs text-gray-500 uppercase tracking-wide">Title</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-1">{selectedLead.jobTitle || 'N/A'}</dd>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <dt className="text-xs text-gray-500 uppercase tracking-wide">Email</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-1 break-all">{selectedLead.email}</dd>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <dt className="text-xs text-gray-500 uppercase tracking-wide">Status</dt>
                    <dd className="mt-1">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[selectedLead.status]}`}>
                        {selectedLead.status}
                      </span>
                    </dd>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <dt className="text-xs text-gray-500 uppercase tracking-wide">Enrichment Tier</dt>
                    <dd className="mt-1">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${TIER_COLORS[selectedLead.enrichmentTier || 'standard']}`}>
                        {selectedLead.enrichmentTier || 'standard'}
                      </span>
                    </dd>
                  </div>
                  {selectedLead.linkedinUrl && (
                    <div className="bg-gray-50 rounded-lg p-3 sm:col-span-2">
                      <dt className="text-xs text-gray-500 uppercase tracking-wide">LinkedIn</dt>
                      <dd className="text-sm text-teal-600 mt-1 break-all">
                        <a href={selectedLead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {selectedLead.linkedinUrl}
                        </a>
                      </dd>
                    </div>
                  )}
                  {selectedLead.companyWebsite && (
                    <div className="bg-gray-50 rounded-lg p-3 sm:col-span-2">
                      <dt className="text-xs text-gray-500 uppercase tracking-wide">Company Website</dt>
                      <dd className="text-sm text-teal-600 mt-1 break-all">
                        <a href={selectedLead.companyWebsite} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {selectedLead.companyWebsite}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Enrichment Data */}
              {selectedLead.enrichmentData && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Enrichment Data</h4>
                    {selectedLead.enrichmentData.confidence_score !== undefined && (
                      <span className="text-xs text-gray-500">
                        Confidence: {selectedLead.enrichmentData.confidence_score}%
                        {selectedLead.enrichmentData.data_freshness && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            {selectedLead.enrichmentData.data_freshness}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-xl p-4 space-y-4">
                    <div>
                      <dt className="text-xs text-teal-700 font-semibold uppercase tracking-wide">Role Summary</dt>
                      <dd className="text-sm text-gray-800 mt-2 leading-relaxed">{selectedLead.enrichmentData.role_summary}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-teal-700 font-semibold uppercase tracking-wide">Company Focus</dt>
                      <dd className="text-sm text-gray-800 mt-2 leading-relaxed">{selectedLead.enrichmentData.company_focus}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-teal-700 font-semibold uppercase tracking-wide">Key Insights</dt>
                      <dd className="text-sm text-gray-800 mt-2">
                        <ul className="space-y-2">
                          {selectedLead.enrichmentData.key_insights.map((insight, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-teal-500 mt-2"></span>
                              <span className="leading-relaxed">{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                    {/* Premium enrichment: Company Info */}
                    {selectedLead.enrichmentData.company_info && (
                      <div className="pt-3 border-t border-teal-200">
                        <dt className="text-xs text-teal-700 font-semibold uppercase tracking-wide mb-2">Company Details</dt>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {selectedLead.enrichmentData.company_info.industry && (
                            <div><span className="text-gray-500">Industry:</span> {selectedLead.enrichmentData.company_info.industry}</div>
                          )}
                          {selectedLead.enrichmentData.company_info.size && (
                            <div><span className="text-gray-500">Size:</span> {selectedLead.enrichmentData.company_info.size}</div>
                          )}
                        </div>
                        {selectedLead.enrichmentData.company_info.description && (
                          <p className="text-sm text-gray-700 mt-2">{selectedLead.enrichmentData.company_info.description}</p>
                        )}
                        {selectedLead.enrichmentData.company_info.products_services && selectedLead.enrichmentData.company_info.products_services.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Products/Services: </span>
                            <span className="text-sm">{selectedLead.enrichmentData.company_info.products_services.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Premium enrichment: Challenges & Value Props */}
                    {selectedLead.enrichmentData.likely_challenges && selectedLead.enrichmentData.likely_challenges.length > 0 && (
                      <div className="pt-3 border-t border-teal-200">
                        <dt className="text-xs text-teal-700 font-semibold uppercase tracking-wide">Likely Challenges</dt>
                        <dd className="text-sm text-gray-800 mt-2">
                          <ul className="space-y-1">
                            {selectedLead.enrichmentData.likely_challenges.map((challenge, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-400 mt-2"></span>
                                <span>{challenge}</span>
                              </li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    )}
                    {selectedLead.enrichmentData.talking_points && selectedLead.enrichmentData.talking_points.length > 0 && (
                      <div className="pt-3 border-t border-teal-200">
                        <dt className="text-xs text-teal-700 font-semibold uppercase tracking-wide">Conversation Starters</dt>
                        <dd className="text-sm text-gray-800 mt-2">
                          <ul className="space-y-1">
                            {selectedLead.enrichmentData.talking_points.map((point, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-purple-400 mt-2"></span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enrichment Sources */}
              {selectedLead.enrichmentSources && selectedLead.enrichmentSources.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Sources</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                    {selectedLead.enrichmentSources.map((source, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          source.type === 'web_search' ? 'bg-blue-100 text-blue-700' :
                          source.type === 'web_fetch' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {source.type.replace('_', ' ')}
                        </span>
                        {source.url && (
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline truncate max-w-xs">
                            {source.url}
                          </a>
                        )}
                        {source.data_points.length > 0 && (
                          <span className="text-gray-400 text-xs">
                            ({source.data_points.length} data points)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Draft Email */}
              {selectedLead.draftEmail && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Draft Email</h4>
                    <button
                      onClick={() => handleCopyEmail(selectedLead.draftEmail!)}
                      className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy to Clipboard
                    </button>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedLead.draftEmail}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {selectedLead.status === 'failed' && selectedLead.errorMessage && (
                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-3">Error Details</h4>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-800">{selectedLead.errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-4 border-t border-gray-200">
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <dt className="text-gray-500 uppercase tracking-wide">Created At</dt>
                    <dd className="text-gray-900 font-medium mt-1">{formatDate(selectedLead.createdAt)}</dd>
                  </div>
                  {selectedLead.processedAt && (
                    <div>
                      <dt className="text-gray-500 uppercase tracking-wide">Processed At</dt>
                      <dd className="text-gray-900 font-medium mt-1">{formatDate(selectedLead.processedAt)}</dd>
                    </div>
                  )}
                  {selectedLead.expiresAt && (
                    <div>
                      <dt className="text-gray-500 uppercase tracking-wide">Expires At</dt>
                      <dd className="text-gray-900 font-medium mt-1">{formatDate(selectedLead.expiresAt)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

              {/* Modal Footer - Fixed */}
              <div className="flex-shrink-0 bg-gray-50 rounded-b-xl border-t border-gray-200 px-4 sm:px-6 py-3 flex justify-end">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
