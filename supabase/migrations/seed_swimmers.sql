-- ============================================================
-- SWIMMERS + REGISTRATIONS MOCK
-- Rulează după seed_test_data.sql
-- ============================================================

DO $$
DECLARE
  v_event_id UUID;
  v_probe_crawl_mic UUID;   -- 4-7 crawl cu ajutatoare Baiet
  v_probe_pluta_mic UUID;   -- 4-7 crawl pluta Baiet
  v_probe_crawl_mare UUID;  -- 8-12 crawl Baiet
  v_probe_spate_mare UUID;  -- 8-12 spate Baiet
  v_probe_crawl_open UUID;  -- 13+ crawl Baiet
  v_club1 UUID := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_club2 UUID := 'aaaaaaaa-0000-0000-0000-000000000002';
  v_parent1 UUID := 'bbbbbbbb-0000-0000-0000-000000000001';
  v_parent2 UUID := 'bbbbbbbb-0000-0000-0000-000000000002';
BEGIN
  SELECT id INTO v_event_id FROM events ORDER BY created_at DESC LIMIT 1;
  IF v_event_id IS NULL THEN RAISE NOTICE 'No event found'; RETURN; END IF;

  -- Găsește probele (4-7 băieți)
  SELECT ep.id INTO v_probe_pluta_mic
  FROM event_probes ep
  JOIN event_categories ec ON ec.id = ep.category_id
  WHERE ec.event_id = v_event_id AND ec.age_group_min = 4 AND ec.gender = 'M' AND ep.stroke = 'crawl_pluta'
  LIMIT 1;

  SELECT ep.id INTO v_probe_crawl_mic
  FROM event_probes ep
  JOIN event_categories ec ON ec.id = ep.category_id
  WHERE ec.event_id = v_event_id AND ec.age_group_min = 4 AND ec.gender = 'M' AND ep.stroke = 'crawl_ajutatoare'
  LIMIT 1;

  SELECT ep.id INTO v_probe_crawl_mare
  FROM event_probes ep
  JOIN event_categories ec ON ec.id = ep.category_id
  WHERE ec.event_id = v_event_id AND ec.age_group_min = 8 AND ec.gender = 'M' AND ep.stroke = 'crawl'
  LIMIT 1;

  SELECT ep.id INTO v_probe_spate_mare
  FROM event_probes ep
  JOIN event_categories ec ON ec.id = ep.category_id
  WHERE ec.event_id = v_event_id AND ec.age_group_min = 8 AND ec.gender = 'M' AND ep.stroke = 'spate'
  LIMIT 1;

  SELECT ep.id INTO v_probe_crawl_open
  FROM event_probes ep
  JOIN event_categories ec ON ec.id = ep.category_id
  WHERE ec.event_id = v_event_id AND ec.age_group_min = 13 AND ec.gender = 'M' AND ep.stroke = 'crawl'
  LIMIT 1;

  -- Creează înotători (club 1 - Neptun)
  INSERT INTO swimmers (id, full_name, birth_year, gender, club_id, parent_id) VALUES
    ('cccccccc-0001-0000-0000-000000000001', 'Alexandru Ionescu', 2019, 'M', v_club1, v_parent1),
    ('cccccccc-0002-0000-0000-000000000001', 'Radu Ionescu', 2020, 'M', v_club1, v_parent1),
    ('cccccccc-0003-0000-0000-000000000001', 'Mihai Constantin', 2019, 'M', v_club1, v_parent1),
    ('cccccccc-0004-0000-0000-000000000001', 'Andrei Popa', 2018, 'M', v_club1, v_parent1),
    ('cccccccc-0005-0000-0000-000000000001', 'David Stoica', 2017, 'M', v_club1, v_parent1),
    ('cccccccc-0006-0000-0000-000000000001', 'Luca Gheorghe', 2016, 'M', v_club1, v_parent1),
    ('cccccccc-0007-0000-0000-000000000001', 'Matei Dinu', 2014, 'M', v_club1, v_parent1),
    ('cccccccc-0008-0000-0000-000000000001', 'Vlad Rusu', 2013, 'M', v_club1, v_parent1)
  ON CONFLICT DO NOTHING;

  -- Creează înotători (club 2 - Delfin)
  INSERT INTO swimmers (id, full_name, birth_year, gender, club_id, parent_id) VALUES
    ('cccccccc-0001-0000-0000-000000000002', 'Bogdan Popescu', 2020, 'M', v_club2, v_parent2),
    ('cccccccc-0002-0000-0000-000000000002', 'Ionuț Marin', 2019, 'M', v_club2, v_parent2),
    ('cccccccc-0003-0000-0000-000000000002', 'Cristian Voicu', 2018, 'M', v_club2, v_parent2),
    ('cccccccc-0004-0000-0000-000000000002', 'Florin Neagu', 2017, 'M', v_club2, v_parent2),
    ('cccccccc-0005-0000-0000-000000000002', 'Sorin Tudose', 2016, 'M', v_club2, v_parent2),
    ('cccccccc-0006-0000-0000-000000000002', 'Gabriel Stan', 2015, 'M', v_club2, v_parent2),
    ('cccccccc-0007-0000-0000-000000000002', 'Cătălin Ion', 2013, 'M', v_club2, v_parent2),
    ('cccccccc-0008-0000-0000-000000000002', 'Tudor Manea', 2012, 'M', v_club2, v_parent2)
  ON CONFLICT DO NOTHING;

  -- Înscrie la probe (cu timpi de referință)
  IF v_probe_crawl_mic IS NOT NULL THEN
    INSERT INTO registrations (swimmer_id, probe_id, seed_time) VALUES
      ('cccccccc-0001-0000-0000-000000000001', v_probe_crawl_mic, '00:00:28.5'),
      ('cccccccc-0002-0000-0000-000000000001', v_probe_crawl_mic, '00:00:32.1'),
      ('cccccccc-0001-0000-0000-000000000002', v_probe_crawl_mic, '00:00:29.8'),
      ('cccccccc-0002-0000-0000-000000000002', v_probe_crawl_mic, '00:00:31.0'),
      ('cccccccc-0003-0000-0000-000000000001', v_probe_crawl_mic, null),
      ('cccccccc-0003-0000-0000-000000000002', v_probe_crawl_mic, null)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_probe_crawl_mare IS NOT NULL THEN
    INSERT INTO registrations (swimmer_id, probe_id, seed_time) VALUES
      ('cccccccc-0004-0000-0000-000000000001', v_probe_crawl_mare, '00:00:22.3'),
      ('cccccccc-0005-0000-0000-000000000001', v_probe_crawl_mare, '00:00:24.8'),
      ('cccccccc-0003-0000-0000-000000000002', v_probe_crawl_mare, '00:00:23.1'),
      ('cccccccc-0004-0000-0000-000000000002', v_probe_crawl_mare, '00:00:25.5'),
      ('cccccccc-0005-0000-0000-000000000002', v_probe_crawl_mare, '00:00:21.9'),
      ('cccccccc-0006-0000-0000-000000000001', v_probe_crawl_mare, '00:00:26.4'),
      ('cccccccc-0006-0000-0000-000000000002', v_probe_crawl_mare, '00:00:23.7'),
      ('cccccccc-0007-0000-0000-000000000001', v_probe_crawl_mare, '00:00:20.5')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_probe_crawl_open IS NOT NULL THEN
    INSERT INTO registrations (swimmer_id, probe_id, seed_time) VALUES
      ('cccccccc-0007-0000-0000-000000000002', v_probe_crawl_open, '00:00:18.2'),
      ('cccccccc-0008-0000-0000-000000000001', v_probe_crawl_open, '00:00:19.5'),
      ('cccccccc-0008-0000-0000-000000000002', v_probe_crawl_open, '00:00:17.8')
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Înotători și înscrieri create pentru evenimentul %', v_event_id;
END $$;
