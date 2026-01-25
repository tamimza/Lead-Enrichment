// Lead Enrichment Application - Admin Navigation
// Navigation bar for admin dashboard

'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Logged out successfully');
        router.push('/admin/login');
        router.refresh();
      }
    } catch (error) {
      toast.error('Logout failed');
      console.error('Logout error:', error);
    }
  };

  const isSettingsActive = pathname.startsWith('/admin/settings');
  const isDashboardActive = pathname === '/admin';

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-xl font-bold text-gray-900 hover:text-teal-600 transition-colors">
              Lead Enrichment
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/admin"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isDashboardActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/settings"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  isSettingsActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                AI Settings
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
