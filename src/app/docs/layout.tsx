// Documentation Layout
// Three-column layout: Left sidebar, Main content, Right TOC

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation - Lead Enrichment Platform',
  description: 'Technical documentation for the Lead Enrichment Platform',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}
