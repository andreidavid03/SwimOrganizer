-- Echipa evenimentului: adăugarea antrenorilor/ajutoarelor după email.

-- 1. Emailul în profiles (copiat din auth.users), ca să putem căuta utilizatori.
ALTER TABLE profiles ADD COLUMN email TEXT;
UPDATE profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Căutare profil după email exact — SECURITY DEFINER ocolește RLS,
--    dar expune un singur profil și doar la potrivire exactă.
CREATE OR REPLACE FUNCTION find_profile_by_email(p_email TEXT)
RETURNS TABLE (id UUID, full_name TEXT, email TEXT) AS $$
  SELECT id, full_name, email FROM profiles WHERE lower(email) = lower(p_email);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Organizatorul unui eveniment vede profilurile membrilor echipei sale.
CREATE POLICY "profiles_read_event_team" ON profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_event_roles r
    WHERE r.user_id = profiles.id
      AND has_event_role(r.event_id, 'organizator')
  ));
