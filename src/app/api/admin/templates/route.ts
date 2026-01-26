import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface TemplateRow {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  tier: string;
  config_snapshot: Record<string, unknown>;
  is_system_template: boolean;
  use_count: number;
  created_at: Date;
}

export async function GET() {
  try {
    const result = await pool.query<TemplateRow>(
      `SELECT * FROM template_library ORDER BY use_count DESC, name ASC`
    );

    const templates = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      tags: row.tags || [],
      tier: row.tier,
      configSnapshot: row.config_snapshot,
      isSystemTemplate: row.is_system_template,
      useCount: row.use_count,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('GET /api/admin/templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
