-- ============================================================
-- 003 — Fix signup RLS + primul admin automat + invitații
-- ============================================================

-- 1. GRANT explicit pentru trigger-ul de signup
--    Supabase rulează triggerul handle_new_user() prin supabase_auth_admin.
--    SECURITY DEFINER face funcția să ruleze ca owner (postgres),
--    dar adăugăm și grant explicit ca fallback.
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT, UPDATE ON TABLE public.profiles TO supabase_auth_admin;

-- 2. Refacere handle_new_user() — fix search_path + primul user devine admin
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Primul user din sistem primește automat is_admin = true
  SELECT COUNT(*) = 0 INTO v_is_admin
  FROM auth.users
  WHERE id != NEW.id;

  INSERT INTO public.profiles (id, is_admin)
  VALUES (NEW.id, v_is_admin)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop și recreeaza trigger-ul (pentru siguranță)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Adaugă is_admin dacă nu există (dacă 002 n-a rulat)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 4. Funcție is_admin() — dacă nu există
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 5. RLS clubs — admins pot face orice
DROP POLICY IF EXISTS "clubs_insert" ON clubs;
DROP POLICY IF EXISTS "clubs_all_admin" ON clubs;
CREATE POLICY "clubs_all_admin" ON clubs FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- 6. Admins pot vedea toate profilele
DROP POLICY IF EXISTS "profiles_read_admin" ON profiles;
CREATE POLICY "profiles_read_admin" ON profiles FOR SELECT TO authenticated
  USING (is_admin());

-- 7. Admins pot gestiona toate evenimentele
DROP POLICY IF EXISTS "events_all_admin" ON events;
CREATE POLICY "events_all_admin" ON events FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- TABELUL INVITAȚII
-- ============================================================
CREATE TABLE IF NOT EXISTS event_invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  role         user_role NOT NULL DEFAULT 'antrenor',
  token        UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_by   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message      TEXT NOT NULL DEFAULT '',
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, email)
);

CREATE INDEX IF NOT EXISTS idx_invitations_event ON event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON event_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON event_invitations(email);

ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;

-- Organizatorul evenimentului poate vedea + crea invitații
CREATE POLICY "invitations_read" ON event_invitations FOR SELECT TO authenticated
  USING (
    invited_by = auth.uid()
    OR has_event_role(event_id, 'organizator')
    OR EXISTS (SELECT 1 FROM events WHERE id = event_id AND created_by = auth.uid())
  );

CREATE POLICY "invitations_insert" ON event_invitations FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND (
      has_event_role(event_id, 'organizator')
      OR EXISTS (SELECT 1 FROM events WHERE id = event_id AND created_by = auth.uid())
    )
  );

CREATE POLICY "invitations_delete" ON event_invitations FOR DELETE TO authenticated
  USING (
    has_event_role(event_id, 'organizator')
    OR EXISTS (SELECT 1 FROM events WHERE id = event_id AND created_by = auth.uid())
  );

-- Oricine autentificat poate citi invitația cu token-ul (pentru acceptare)
CREATE POLICY "invitations_read_by_token" ON event_invitations FOR SELECT TO authenticated
  USING (true);
