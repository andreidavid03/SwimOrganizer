-- Numele înotătorilor înscriși la un eveniment PUBLICAT devin vizibile tuturor
-- utilizatorilor autentificați — necesar pentru listele de start și rezultate.
-- (Până acum un părinte își vedea doar proprii copii în rezultate.)
CREATE POLICY "swimmers_read_published_event" ON swimmers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM registrations r
    JOIN event_probes ep ON ep.id = r.probe_id
    JOIN event_categories ec ON ec.id = ep.category_id
    JOIN events e ON e.id = ec.event_id
    WHERE r.swimmer_id = swimmers.id
      AND e.published = true
  ));
