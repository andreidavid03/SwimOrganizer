-- ============================================================
-- DATE DE TEST — rulează o singură dată în SQL Editor
-- Creează: 2 cluburi + 3 utilizatori de test + îi invită la eveniment
-- ============================================================

-- 1. Cluburi de test
INSERT INTO clubs (id, name, city) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'CS Neptun București', 'București'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'CS Delfin Constanța', 'Constanța')
ON CONFLICT DO NOTHING;

-- 2. Utilizatori de test în auth.users
-- Parola pentru toți: Test1234!
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role
) VALUES
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'antrenor.neptun@test.ro',
    crypt('Test1234!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'antrenor.delfin@test.ro',
    crypt('Test1234!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    'cronometror@test.ro',
    crypt('Test1234!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), 'authenticated', 'authenticated'
  )
ON CONFLICT DO NOTHING;

-- 3. Profile pentru utilizatorii de test
INSERT INTO profiles (id, full_name, club_id, is_admin) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Mihai Ionescu', 'aaaaaaaa-0000-0000-0000-000000000001', false),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Elena Popescu', 'aaaaaaaa-0000-0000-0000-000000000002', false),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'Ion Dumitrescu', null, false)
ON CONFLICT DO NOTHING;

-- 4. Găsește evenimentul "Cupa prieteniei" și invită utilizatorii de test
DO $$
DECLARE
  v_event_id UUID;
  v_organizer_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_organizer_id FROM profiles WHERE is_admin = true LIMIT 1;

  IF v_event_id IS NOT NULL AND v_organizer_id IS NOT NULL THEN
    -- Invitații în event_invitations
    INSERT INTO event_invitations (event_id, email, role, invited_by) VALUES
      (v_event_id, 'antrenor.neptun@test.ro', 'antrenor', v_organizer_id),
      (v_event_id, 'antrenor.delfin@test.ro', 'antrenor', v_organizer_id),
      (v_event_id, 'cronometror@test.ro', 'cronometror', v_organizer_id)
    ON CONFLICT DO NOTHING;

    -- Adaugă direct și ca roluri active (simulează că au acceptat)
    INSERT INTO user_event_roles (user_id, event_id, role, assigned_by) VALUES
      ('bbbbbbbb-0000-0000-0000-000000000001', v_event_id, 'antrenor', v_organizer_id),
      ('bbbbbbbb-0000-0000-0000-000000000002', v_event_id, 'antrenor', v_organizer_id),
      ('bbbbbbbb-0000-0000-0000-000000000003', v_event_id, 'cronometror', v_organizer_id)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Date de test create pentru evenimentul: %', v_event_id;
  ELSE
    RAISE NOTICE 'Nu s-a găsit eveniment sau organizator!';
  END IF;
END $$;

SELECT 'Done! Conturi test create:' as status,
  'antrenor.neptun@test.ro / Test1234!' as cont1,
  'antrenor.delfin@test.ro / Test1234!' as cont2,
  'cronometror@test.ro / Test1234!' as cont3;
