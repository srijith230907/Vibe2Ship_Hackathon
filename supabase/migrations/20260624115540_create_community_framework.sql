/*
# CivicSnap Community Framework Schema

## Overview
Creates the community system for CivicSnap — apartments/neighborhoods with role-based
membership, invite codes, and community-scoped issues.

## New Tables

1. `communities`
   - `id` (uuid, PK)
   - `name` (text) — e.g. "Prestige Apartments"
   - `description` (text)
   - `invite_code` (text, unique) — 6-digit alphanumeric code for joining
   - `center_lat` / `center_lng` (numeric) — map center for the community
   - `boundary_radius` (int) — radius in meters for issue scoping
   - `created_at` (timestamptz)

2. `community_members`
   - `id` (uuid, PK)
   - `community_id` (uuid, FK → communities)
   - `user_name` (text) — display name from Google profile
   - `user_email` (text) — email from Google profile
   - `user_avatar` (text) — avatar URL from Google profile
   - `role` (text) — 'head' | 'maintenance' | 'resident'
   - `street_cred` (int, default 0) — gamification points
   - `joined_at` (timestamptz)

3. `community_issues`
   - `id` (uuid, PK)
   - `community_id` (uuid, FK → communities)
   - `title` (text)
   - `category` (text)
   - `status` (text) — 'open' | 'in-progress' | 'resolved'
   - `lat` / `lng` (numeric)
   - `address` (text)
   - `reported_by` (text) — member name
   - `severity` (int)
   - `confidence` (int)
   - `ai_description` (text)
   - `verifications` (int, default 0)
   - `image` (text)
   - `created_at` (timestamptz)

## Security
- RLS enabled on all tables.
- All tables allow anon + authenticated CRUD (presentation/demo app with mock auth).
- This is intentional: the app uses a mocked Google login for presentation purposes,
  so there are no real Supabase auth sessions to gate on.

## Notes
- `community_members` stores Google profile data (name, email, avatar) directly since
  we're using mock auth rather than Supabase Auth.
- Invite codes are unique and generated as 6-char alphanumeric strings.
*/

-- Communities table
CREATE TABLE IF NOT EXISTS communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  invite_code text UNIQUE NOT NULL,
  center_lat numeric NOT NULL DEFAULT 40.7128,
  center_lng numeric NOT NULL DEFAULT -74.006,
  boundary_radius int NOT NULL DEFAULT 1000,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_communities" ON communities;
CREATE POLICY "anon_select_communities" ON communities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_communities" ON communities;
CREATE POLICY "anon_insert_communities" ON communities FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_communities" ON communities;
CREATE POLICY "anon_update_communities" ON communities FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Community members table
CREATE TABLE IF NOT EXISTS community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_email text NOT NULL,
  user_avatar text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'resident',
  street_cred int NOT NULL DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(community_id, user_email)
);

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_members" ON community_members;
CREATE POLICY "anon_select_members" ON community_members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_members" ON community_members;
CREATE POLICY "anon_insert_members" ON community_members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_members" ON community_members;
CREATE POLICY "anon_update_members" ON community_members FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_members" ON community_members;
CREATE POLICY "anon_delete_members" ON community_members FOR DELETE
  TO anon, authenticated USING (true);

-- Community issues table
CREATE TABLE IF NOT EXISTS community_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  address text NOT NULL DEFAULT '',
  reported_by text NOT NULL DEFAULT '',
  severity int NOT NULL DEFAULT 5,
  confidence int NOT NULL DEFAULT 90,
  ai_description text NOT NULL DEFAULT '',
  verifications int NOT NULL DEFAULT 0,
  image text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_issues" ON community_issues;
CREATE POLICY "anon_select_issues" ON community_issues FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_issues" ON community_issues;
CREATE POLICY "anon_insert_issues" ON community_issues FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_issues" ON community_issues;
CREATE POLICY "anon_update_issues" ON community_issues FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_issues" ON community_issues;
CREATE POLICY "anon_delete_issues" ON community_issues FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_issues_community_id ON community_issues(community_id);
CREATE INDEX IF NOT EXISTS idx_communities_invite_code ON communities(invite_code);
