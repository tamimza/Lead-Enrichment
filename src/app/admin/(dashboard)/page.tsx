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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Leads Dashboard
        </h2>
        <p className="text-gray-600">
          Total: {pagination.total} leads
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center space-x-4">
        <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
          Filter by status:
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as LeadStatus | '');
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="enriched">Enriched</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No leads found</p>
        </div>
      ) : (
        <>
          {/* Leads Table */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lead.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.companyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[lead.status]}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id, lead.fullName)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
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
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Enrichment Data</h4>
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
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
