// Lead Enrichment Application - Dashboard Layout
// Protected layout that requires authentication

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import AdminNav from './AdminNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME);

  // Redirect to login if not authenticated
  if (!sessionToken) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main>{children}</main>
    </div>
  );
}
