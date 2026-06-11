-- Adaugă coloana is_admin la profiles
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Funcție helper: verifică dacă utilizatorul curent e admin global
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Actualizează RLS pentru clubs: adminii pot face orice
DROP POLICY IF EXISTS "clubs_insert" ON clubs;
CREATE POLICY "clubs_all_admin" ON clubs FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Actualizează RLS pentru profiles: adminii pot vedea toate profilele
CREATE POLICY "profiles_read_admin" ON profiles FOR SELECT TO authenticated
  USING (is_admin());

-- După ce rulezi această migrare, dă-ți is_admin = true în Supabase:
-- UPDATE profiles SET is_admin = true WHERE id = 'uuid-ul-tau-din-auth.users';
