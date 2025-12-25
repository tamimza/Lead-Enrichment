// Lead Enrichment Application - Homepage
// Redirects to /connect

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/connect');
}
