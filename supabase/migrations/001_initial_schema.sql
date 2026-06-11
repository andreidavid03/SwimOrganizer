-- ============================================================
-- SwimOrganizer — Schema inițială
-- ============================================================

-- ENUM-uri
CREATE TYPE gender_type AS ENUM ('M', 'F');
CREATE TYPE stroke_type AS ENUM ('crawl', 'spate', 'bras', 'crawl_pluta', 'crawl_ajutatoare');
CREATE TYPE heat_status AS ENUM ('pending', 'active', 'completed');
CREATE TYPE user_role AS ENUM ('organizator', 'antrenor', 'cronometror', 'staff', 'parinte');

-- ============================================================
-- CLUBURI
-- ============================================================
CREATE TABLE clubs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  city        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PROFILURI UTILIZATORI (extend auth.users)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  club_id     UUID REFERENCES clubs(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: creează profil automat la înregistrare
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ÎNOTĂTORI
-- ============================================================
CREATE TABLE swimmers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT NOT NULL,
  birth_year  INT NOT NULL CHECK (birth_year >= 2000 AND birth_year <= 2030),
  gender      gender_type NOT NULL,
  club_id     UUID NOT NULL REFERENCES clubs(id) ON DELETE RESTRICT,
  parent_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- EVENIMENTE (COMPETIȚII)
-- ============================================================
CREATE TABLE events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  edition                 INT NOT NULL DEFAULT 1,
  date                    DATE NOT NULL,
  time                    TIME NOT NULL DEFAULT '09:00',
  location                TEXT NOT NULL DEFAULT '',
  entry_fee               NUMERIC(10,2) NOT NULL DEFAULT 0,
  lanes_count             INT NOT NULL DEFAULT 8 CHECK (lanes_count >= 4 AND lanes_count <= 10),
  registration_open       BOOLEAN NOT NULL DEFAULT false,
  registration_deadline   TIMESTAMPTZ,
  seeding_done            BOOLEAN NOT NULL DEFAULT false,
  published               BOOLEAN NOT NULL DEFAULT false,
  created_by              UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ROLURI UTILIZATORI PER EVENIMENT
-- ============================================================
CREATE TABLE user_event_roles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  role          user_role NOT NULL,
  assigned_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id, role)
);

-- ============================================================
-- CATEGORII EVENIMENT (per an naștere + gen)
-- ============================================================
CREATE TABLE event_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  age_group_min   INT NOT NULL,   -- ex: 4
  age_group_max   INT NOT NULL,   -- ex: 7 (NULL = open)
  gender          gender_type NOT NULL,
  birth_year      INT,            -- NULL = open (13+), altfel an specific
  label           TEXT NOT NULL,  -- ex: "8 ani Băieți", "13 Open Fete"
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PROBE (RACES) PER CATEGORIE
-- ============================================================
CREATE TABLE event_probes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  UUID NOT NULL REFERENCES event_categories(id) ON DELETE CASCADE,
  stroke       stroke_type NOT NULL,
  has_float    BOOLEAN NOT NULL DEFAULT false,
  order_index  INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ÎNSCRIERI
-- ============================================================
CREATE TABLE registrations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id            UUID NOT NULL REFERENCES swimmers(id) ON DELETE RESTRICT,
  probe_id              UUID NOT NULL REFERENCES event_probes(id) ON DELETE RESTRICT,
  seed_time             INTERVAL,   -- NULL dacă nu are timp de referință
  registered_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid                  BOOLEAN NOT NULL DEFAULT false,
  paid_at               TIMESTAMPTZ,
  payment_confirmed_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE (swimmer_id, probe_id)
);

-- ============================================================
-- SERII (HEATS)
-- ============================================================
CREATE TABLE heats (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_id     UUID NOT NULL REFERENCES event_probes(id) ON DELETE CASCADE,
  heat_number  INT NOT NULL,
  status       heat_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (probe_id, heat_number)
);

-- ============================================================
-- CULOARE PER SERIE
-- ============================================================
CREATE TABLE heat_lanes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  heat_id       UUID NOT NULL REFERENCES heats(id) ON DELETE CASCADE,
  lane_number   INT NOT NULL,
  swimmer_id    UUID REFERENCES swimmers(id) ON DELETE SET NULL,  -- NULL = culoar gol
  seed_time     INTERVAL,
  result_time   INTERVAL,   -- introdus de cronometror
  dns           BOOLEAN NOT NULL DEFAULT false,  -- Did Not Start
  dq            BOOLEAN NOT NULL DEFAULT false,  -- Disqualified
  recorded_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recorded_at   TIMESTAMPTZ,
  UNIQUE (heat_id, lane_number)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_club ON profiles(club_id);
CREATE INDEX idx_swimmers_club ON swimmers(club_id);
CREATE INDEX idx_swimmers_parent ON swimmers(parent_id);
CREATE INDEX idx_user_event_roles_user ON user_event_roles(user_id);
CREATE INDEX idx_user_event_roles_event ON user_event_roles(event_id);
CREATE INDEX idx_event_categories_event ON event_categories(event_id);
CREATE INDEX idx_event_probes_category ON event_probes(category_id);
CREATE INDEX idx_registrations_swimmer ON registrations(swimmer_id);
CREATE INDEX idx_registrations_probe ON registrations(probe_id);
CREATE INDEX idx_heats_probe ON heats(probe_id);
CREATE INDEX idx_heat_lanes_heat ON heat_lanes(heat_id);
CREATE INDEX idx_heat_lanes_swimmer ON heat_lanes(swimmer_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE swimmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_event_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_probes ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE heats ENABLE ROW LEVEL SECURITY;
ALTER TABLE heat_lanes ENABLE ROW LEVEL SECURITY;

-- Helper: verifică dacă utilizatorul curent are un rol specific la un eveniment
CREATE OR REPLACE FUNCTION has_event_role(p_event_id UUID, p_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_event_roles
    WHERE event_id = p_event_id
      AND user_id = auth.uid()
      AND role = p_role
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: verifică dacă utilizatorul curent are ORICE rol la un eveniment
CREATE OR REPLACE FUNCTION has_any_event_role(p_event_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_event_roles
    WHERE event_id = p_event_id
      AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── CLUBS ───────────────────────────────────────────────────
-- Toată lumea autentificată poate vedea cluburile
CREATE POLICY "clubs_read" ON clubs FOR SELECT TO authenticated USING (true);
-- Doar organizatorii pot crea/modifica cluburi (verificăm via events)
CREATE POLICY "clubs_insert" ON clubs FOR INSERT TO authenticated WITH CHECK (true);

-- ─── PROFILES ────────────────────────────────────────────────
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- ─── SWIMMERS ────────────────────────────────────────────────
CREATE POLICY "swimmers_read_own" ON swimmers FOR SELECT TO authenticated
  USING (parent_id = auth.uid());
CREATE POLICY "swimmers_insert_own" ON swimmers FOR INSERT TO authenticated
  WITH CHECK (parent_id = auth.uid());
CREATE POLICY "swimmers_update_own" ON swimmers FOR UPDATE TO authenticated
  USING (parent_id = auth.uid());

-- Organizatorii, antrenorii, cronometrorii, staff văd toți înotătorii din evenimentele lor
CREATE POLICY "swimmers_read_event_staff" ON swimmers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      JOIN event_probes ep ON ep.id = r.probe_id
      JOIN event_categories ec ON ec.id = ep.category_id
      WHERE r.swimmer_id = swimmers.id
        AND has_any_event_role(ec.event_id)
    )
  );

-- ─── EVENTS ──────────────────────────────────────────────────
CREATE POLICY "events_read_published" ON events FOR SELECT TO authenticated
  USING (published = true OR created_by = auth.uid() OR has_any_event_role(id));
CREATE POLICY "events_insert" ON events FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "events_update_organizer" ON events FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR has_event_role(id, 'organizator'));

-- ─── USER_EVENT_ROLES ─────────────────────────────────────────
CREATE POLICY "roles_read" ON user_event_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_event_role(event_id, 'organizator'));
CREATE POLICY "roles_insert" ON user_event_roles FOR INSERT TO authenticated
  WITH CHECK (has_event_role(event_id, 'organizator') OR
              EXISTS (SELECT 1 FROM events WHERE id = event_id AND created_by = auth.uid()));
CREATE POLICY "roles_delete" ON user_event_roles FOR DELETE TO authenticated
  USING (has_event_role(event_id, 'organizator'));

-- ─── EVENT_CATEGORIES ────────────────────────────────────────
CREATE POLICY "categories_read" ON event_categories FOR SELECT TO authenticated
  USING (has_any_event_role(event_id) OR
         EXISTS (SELECT 1 FROM events WHERE id = event_id AND published = true));
CREATE POLICY "categories_write" ON event_categories FOR ALL TO authenticated
  USING (has_event_role(event_id, 'organizator') OR
         EXISTS (SELECT 1 FROM events WHERE id = event_id AND created_by = auth.uid()));

-- ─── EVENT_PROBES ─────────────────────────────────────────────
CREATE POLICY "probes_read" ON event_probes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM event_categories ec
    WHERE ec.id = event_probes.category_id
      AND (has_any_event_role(ec.event_id) OR
           EXISTS (SELECT 1 FROM events WHERE id = ec.event_id AND published = true))
  ));
CREATE POLICY "probes_write" ON event_probes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM event_categories ec
    WHERE ec.id = event_probes.category_id
      AND (has_event_role(ec.event_id, 'organizator') OR
           EXISTS (SELECT 1 FROM events WHERE id = ec.event_id AND created_by = auth.uid()))
  ));

-- ─── REGISTRATIONS ───────────────────────────────────────────
CREATE POLICY "registrations_read_own" ON registrations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM swimmers s WHERE s.id = registrations.swimmer_id AND s.parent_id = auth.uid()));
CREATE POLICY "registrations_read_staff" ON registrations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM event_probes ep
    JOIN event_categories ec ON ec.id = ep.category_id
    WHERE ep.id = registrations.probe_id AND has_any_event_role(ec.event_id)
  ));
CREATE POLICY "registrations_insert" ON registrations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM swimmers s WHERE s.id = registrations.swimmer_id AND s.parent_id = auth.uid()));
CREATE POLICY "registrations_update_organizer" ON registrations FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM event_probes ep
    JOIN event_categories ec ON ec.id = ep.category_id
    WHERE ep.id = registrations.probe_id AND has_event_role(ec.event_id, 'organizator')
  ));

-- ─── HEATS ───────────────────────────────────────────────────
CREATE POLICY "heats_read" ON heats FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM event_probes ep
    JOIN event_categories ec ON ec.id = ep.category_id
    WHERE ep.id = heats.probe_id
      AND (has_any_event_role(ec.event_id) OR
           EXISTS (SELECT 1 FROM events WHERE id = ec.event_id AND published = true))
  ));
CREATE POLICY "heats_write" ON heats FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM event_probes ep
    JOIN event_categories ec ON ec.id = ep.category_id
    WHERE ep.id = heats.probe_id
      AND (has_event_role(ec.event_id, 'organizator') OR
           EXISTS (SELECT 1 FROM events WHERE id = ec.event_id AND created_by = auth.uid()))
  ));

-- ─── HEAT_LANES ──────────────────────────────────────────────
CREATE POLICY "lanes_read" ON heat_lanes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM heats h
    JOIN event_probes ep ON ep.id = h.probe_id
    JOIN event_categories ec ON ec.id = ep.category_id
    WHERE h.id = heat_lanes.heat_id
      AND (has_any_event_role(ec.event_id) OR
           EXISTS (SELECT 1 FROM events WHERE id = ec.event_id AND published = true))
  ));
CREATE POLICY "lanes_write_organizer" ON heat_lanes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM heats h
    JOIN event_probes ep ON ep.id = h.probe_id
    JOIN event_categories ec ON ec.id = ep.category_id
    WHERE h.id = heat_lanes.heat_id
      AND (has_event_role(ec.event_id, 'organizator') OR
           EXISTS (SELECT 1 FROM events WHERE id = ec.event_id AND created_by = auth.uid()))
  ));
-- Cronometrorii pot introduce/actualiza timpii
CREATE POLICY "lanes_update_cronometror" ON heat_lanes FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM heats h
    JOIN event_probes ep ON ep.id = h.probe_id
    JOIN event_categories ec ON ec.id = ep.category_id
    WHERE h.id = heat_lanes.heat_id
      AND has_event_role(ec.event_id, 'cronometror')
  ));
