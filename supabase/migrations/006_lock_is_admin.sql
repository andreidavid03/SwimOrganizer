-- ============================================================
-- 006 — Blochează auto-promovarea la admin (privilege escalation)
-- ============================================================
-- Politica "profiles_update_own" permitea unui user să facă UPDATE pe orice
-- coloană a propriului profil, inclusiv is_admin. Oricine se putea face admin
-- printr-un apel direct la API. Restrângem: la update pe propriul profil,
-- is_admin trebuie să rămână neschimbat față de valoarea curentă.

CREATE OR REPLACE FUNCTION current_is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- noua valoare a is_admin trebuie să coincidă cu cea din DB (nu poți schimba singur)
    AND is_admin = current_is_admin()
  );

-- Adminii pot administra flag-ul is_admin al altora (ex: promovarea unui organizator).
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
