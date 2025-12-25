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
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setSelectedLead(null)}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedLead.fullName}
              </h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Basic Information</h4>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-gray-500">Company</dt>
                    <dd className="text-sm text-gray-900">{selectedLead.companyName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Title</dt>
                    <dd className="text-sm text-gray-900">{selectedLead.jobTitle || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{selectedLead.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Status</dt>
                    <dd>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[selectedLead.status]}`}>
                        {selectedLead.status}
                      </span>
                    </dd>
                  </div>
                  {selectedLead.linkedinUrl && (
                    <div className="col-span-2">
                      <dt className="text-xs text-gray-500">LinkedIn</dt>
                      <dd className="text-sm text-blue-600">
                        <a href={selectedLead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {selectedLead.linkedinUrl}
                        </a>
                      </dd>
                    </div>
                  )}
                  {selectedLead.companyWebsite && (
                    <div className="col-span-2">
                      <dt className="text-xs text-gray-500">Company Website</dt>
                      <dd className="text-sm text-blue-600">
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
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Enrichment Data</h4>
                  <div className="bg-gray-50 p-4 rounded-md space-y-3">
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">Role Summary</dt>
                      <dd className="text-sm text-gray-900 mt-1">{selectedLead.enrichmentData.role_summary}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">Company Focus</dt>
                      <dd className="text-sm text-gray-900 mt-1">{selectedLead.enrichmentData.company_focus}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">Key Insights</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        <ul className="list-disc list-inside space-y-1">
                          {selectedLead.enrichmentData.key_insights.map((insight, i) => (
                            <li key={i}>{insight}</li>
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
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">Draft Email</h4>
                    <button
                      onClick={() => handleCopyEmail(selectedLead.draftEmail!)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedLead.draftEmail}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {selectedLead.status === 'failed' && selectedLead.errorMessage && (
                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-2">Error Details</h4>
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-sm text-red-900">{selectedLead.errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-4 border-t border-gray-200">
                <dl className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <dt className="text-gray-500">Created At</dt>
                    <dd className="text-gray-900">{formatDate(selectedLead.createdAt)}</dd>
                  </div>
                  {selectedLead.processedAt && (
                    <div>
                      <dt className="text-gray-500">Processed At</dt>
                      <dd className="text-gray-900">{formatDate(selectedLead.processedAt)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
