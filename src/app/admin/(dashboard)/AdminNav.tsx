// Lead Enrichment Application - Admin Navigation
// Navigation bar for admin dashboard

'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Settings, LogOut, Zap, LayoutDashboard, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ProjectSelector from '@/components/admin/ProjectSelector';

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
    } catch {
      toast.error('Logout failed');
    }
  };

  const isSettingsActive = pathname.startsWith('/admin/settings') && !pathname.includes('api-keys');
  const isApiKeysActive = pathname.includes('/admin/settings/api-keys');
  const isDashboardActive = pathname === '/admin';

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2 text-xl font-bold hover:text-primary transition-colors">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              Lead Enrichment
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/admin"
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
                  isDashboardActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/admin/settings"
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
                  isSettingsActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Settings className="w-4 h-4" />
                AI Settings
              </Link>
              <Link
                href="/admin/settings/api-keys"
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
                  isApiKeysActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Key className="w-4 h-4" />
                API Keys
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ProjectSelector />
            <Button
              variant="ghost"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
