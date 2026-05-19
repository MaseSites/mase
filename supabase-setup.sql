-- ============================================================
-- MASE Admin Dashboard — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Chat Messages (every message sent to MaseAI)
CREATE TABLE IF NOT EXISTS mase_chat_messages (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  session_id  text NOT NULL,
  role        text NOT NULL CHECK (role IN ('user','bot')),
  message     text NOT NULL,
  page_url    text,
  page_title  text,
  language    text DEFAULT 'de'
);

-- 2. Leads (captured from chatbot interactions)
CREATE TABLE IF NOT EXISTS mase_leads (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  session_id  text,
  name        text,
  email       text,
  phone       text,
  branche     text,
  ziel        text,
  budget      text,
  service_interest text,
  message     text,
  source      text DEFAULT 'chatbot',
  status      text DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','closed','lost')),
  notes       text
);

-- 3. Page Views (every page visit)
CREATE TABLE IF NOT EXISTS mase_page_views (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now(),
  session_id   text NOT NULL,
  page_url     text NOT NULL,
  page_title   text,
  referrer     text,
  time_on_page int,
  scroll_depth int,
  device_type  text,
  language     text
);

-- 4. Events (button clicks and key interactions)
CREATE TABLE IF NOT EXISTS mase_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  session_id  text NOT NULL,
  event_type  text NOT NULL,
  event_label text,
  page_url    text,
  element_id  text,
  element_text text
);

-- ============================================================
-- Row Level Security (allow public INSERT, restrict SELECT)
-- ============================================================

ALTER TABLE mase_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mase_leads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mase_page_views    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mase_events        ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) can INSERT data (website tracking)
CREATE POLICY "allow_public_insert_chat"
  ON mase_chat_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow_public_insert_leads"
  ON mase_leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow_public_insert_views"
  ON mase_page_views FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow_public_insert_events"
  ON mase_events FOR INSERT TO anon WITH CHECK (true);

-- Only authenticated users (service_role) can SELECT
CREATE POLICY "allow_auth_select_chat"
  ON mase_chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_auth_select_leads"
  ON mase_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_auth_select_views"
  ON mase_page_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_auth_select_events"
  ON mase_events FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to UPDATE leads (for status management)
CREATE POLICY "allow_auth_update_leads"
  ON mase_leads FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- Useful indexes for dashboard queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_chat_session   ON mase_chat_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_created   ON mase_chat_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status   ON mase_leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created  ON mase_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_views_page     ON mase_page_views (page_url);
CREATE INDEX IF NOT EXISTS idx_views_created  ON mase_page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type    ON mase_events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON mase_events (created_at DESC);
