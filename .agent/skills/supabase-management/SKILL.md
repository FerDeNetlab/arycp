---
name: supabase-management
description: "Provides ARYCP-specific patterns for Supabase database tables, Row Level Security (RLS) policies, migrations, authentication, and API route patterns. Use when the user says 'create a table', 'add RLS', 'database migration', 'supabase query', 'add auth', or works with any Supabase-related feature."
---

# Supabase Management for ARYCP

ARYCP-specific patterns for database, auth, and API routes with Supabase.

## When to use this skill
- Creating or modifying database tables
- Adding Row Level Security (RLS) policies
- Writing Supabase queries in API routes
- Managing authentication flows
- Creating database migrations
- User mentions "supabase", "database", "table", "RLS", "migration"

## Project Context

- **Supabase URL**: Set in `NEXT_PUBLIC_SUPABASE_URL` environment variable
- **Auth**: Supabase Auth with `@supabase/ssr` for Next.js
- **Client creation**: Via `src/lib/supabase/` utilities
- **API routes**: Next.js App Router at `src/app/api/`

## Table Creation Pattern

```sql
-- Always include these standard columns
CREATE TABLE IF NOT EXISTS public.table_name (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  
  -- Feature-specific columns here
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Enable RLS (ALWAYS)
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON public.table_name
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## RLS Policy Patterns

```sql
-- Authenticated users can read all rows
CREATE POLICY "Users can view all records"
  ON public.table_name FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own records
CREATE POLICY "Users can create own records"
  ON public.table_name FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can only update their own records
CREATE POLICY "Users can update own records"
  ON public.table_name FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Service role bypass (for API routes with service key)
CREATE POLICY "Service role full access"
  ON public.table_name FOR ALL
  TO service_role
  USING (true);
```

## API Route Pattern (Next.js App Router)

```typescript
// src/app/api/feature/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('table_name')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

## Service Role Pattern (Backend-only operations)

```typescript
// For operations that bypass RLS (admin tasks, cron jobs)
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

> **WARNING**: Never expose the service role key to the client. Only use in server-side code (API routes, server actions).

## Migration Workflow

1. Write SQL in `database/migrations/YYYYMMDD_description.sql`
2. Test in Supabase SQL Editor first
3. Apply to production via Supabase dashboard
4. Commit the migration file to git

```sql
-- database/migrations/20240115_add_feature_table.sql
-- Description: Add table for [feature name]
-- Author: [name]
-- Date: [date]

BEGIN;

-- Your migration SQL here

COMMIT;
```

## Auth Check Pattern

```typescript
// Verify user is authenticated in API routes
const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

## Checklist for New Tables

- [ ] Table includes `id`, `created_at`, `updated_at`, `created_by`
- [ ] RLS is enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] RLS policies cover SELECT, INSERT, UPDATE, DELETE
- [ ] Service role policy exists for backend operations
- [ ] `updated_at` trigger is created
- [ ] Migration SQL is saved in `database/migrations/`
- [ ] API route created with proper error handling
- [ ] Auth check included in protected routes

## Key Principles

- **RLS always on** — Every table must have RLS enabled
- **Least privilege** — Users only access their own data by default
- **Service role for admin** — Backend-only, never exposed to client
- **Migrations in git** — Track all schema changes
- **Error handling** — Always handle Supabase errors gracefully
