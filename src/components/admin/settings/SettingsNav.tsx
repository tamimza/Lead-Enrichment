'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, ClipboardList, ArrowUpDown, Lightbulb, Mail, Ban, Library } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const navItems = [
  { name: 'Overview', href: '/admin/settings', icon: LayoutGrid },
  { name: 'Research Playbook', href: '/admin/settings/playbook', icon: ClipboardList },
  { name: 'Information Priorities', href: '/admin/settings/priorities', icon: ArrowUpDown },
  { name: 'Thinking Rules', href: '/admin/settings/rules', icon: Lightbulb },
  { name: 'Email Template', href: '/admin/settings/email', icon: Mail },
  { name: 'Blacklist', href: '/admin/settings/blacklist', icon: Ban },
  { name: 'Template Library', href: '/admin/settings/templates', icon: Library },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="w-56 flex-shrink-0">
      <Card className="overflow-hidden">
        <ul className="divide-y divide-border">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2',
                    isActive
                      ? 'bg-primary/5 text-primary border-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </nav>
  );
}
