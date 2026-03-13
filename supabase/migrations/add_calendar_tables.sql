-- Migration: Add Calendar Events and Vacation Requests tables
-- Description: Local calendar module with event management and vacation request workflow
-- Date: 2026-03-12

BEGIN;

-- Drop old tables if they exist (safe since this is a new feature with no production data)
DROP TABLE IF EXISTS public.vacation_requests CASCADE;
DROP TABLE IF EXISTS public.calendar_events CASCADE;
DROP TABLE IF EXISTS public.google_calendar_tokens CASCADE;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Table: calendar_events
-- ============================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),

    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT false,

    -- Event categorization
    event_type TEXT DEFAULT 'manual' CHECK (event_type IN ('manual', 'fiscal', 'legal', 'labor', 'vacation', 'meeting', 'reminder')),
    color TEXT DEFAULT '#6366f1',

    -- Linking
    client_id UUID,
    client_name TEXT,

    -- Visibility: personal = only creator sees it, team = all see it
    visibility TEXT DEFAULT 'team' CHECK (visibility IN ('personal', 'team')),

    -- For vacation events, link back to the request
    vacation_request_id UUID,

    -- Metadata
    user_name TEXT -- Name of the creator for display
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view team events"
    ON public.calendar_events FOR SELECT
    TO authenticated
    USING (visibility = 'team' OR created_by = auth.uid());

CREATE POLICY "Users can create events"
    ON public.calendar_events FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update own events"
    ON public.calendar_events FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Users can delete own events"
    ON public.calendar_events FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Service role full access on calendar_events"
    ON public.calendar_events FOR ALL
    TO service_role
    USING (true);

-- Updated_at trigger
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for date range queries
CREATE INDEX idx_calendar_events_dates ON public.calendar_events(start_date, end_date);
CREATE INDEX idx_calendar_events_type ON public.calendar_events(event_type);
CREATE INDEX idx_calendar_events_created_by ON public.calendar_events(created_by);

-- ============================================
-- Table: vacation_requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.vacation_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Requester info
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_name TEXT NOT NULL,
    user_email TEXT,

    -- Vacation period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL,

    -- Details
    reason TEXT,

    -- Review workflow
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_by_name TEXT,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    -- Link to the calendar event created on approval
    calendar_event_id UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL
);

ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own vacation requests"
    ON public.vacation_requests FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own vacation requests"
    ON public.vacation_requests FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending requests"
    ON public.vacation_requests FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Service role full access on vacation_requests"
    ON public.vacation_requests FOR ALL
    TO service_role
    USING (true);

-- Updated_at trigger
CREATE TRIGGER update_vacation_requests_updated_at
    BEFORE UPDATE ON public.vacation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_vacation_requests_user ON public.vacation_requests(user_id);
CREATE INDEX idx_vacation_requests_status ON public.vacation_requests(status);
CREATE INDEX idx_vacation_requests_dates ON public.vacation_requests(start_date, end_date);

COMMIT;
