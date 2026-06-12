# SwimOrganizer — Sistem de design

Acest document este sursa de adevăr pentru orice lucru de UI. **Citește-l înainte de a scrie sau modifica orice componentă vizuală.** Regula de aur: dacă un element vizual există deja ca o componentă în `src/components/ui/`, folosește componenta — nu rescrie clasele inline.

## 1. Direcție vizuală

- **Aplicația (după login)** este pe temă **deschisă**: fundal `slate-50`, suprafețe albe, text `slate-900`.
- **Paginile publice și auth** (landing, login, register) sunt pe temă **închisă**: fundal `slate-950`, suprafețe `slate-800/900`, accente `brand-400/500`.
- Stil general: curat, aerisit, fără decorațiuni inutile. Carduri albe cu border subtil, nu umbre grele.

## 2. Tokens (definite în `src/app/globals.css` prin `@theme`)

### Culori

| Rol | Token | Regulă |
|---|---|---|
| Brand / acțiuni principale | `brand-*` (50–950) | **Nu folosi `blue-*` direct.** Butoane primare: `brand-600`, hover `brand-500`. Pe fundal închis: `brand-400/500`. |
| Neutre (text, borders, fundal) | `slate-*` | **Nu folosi `gray-*`.** Text principal `slate-900`, secundar `slate-500`, borders `slate-200` (light) / `slate-700` (dark). |
| Succes / plătit / publicat | `green-*` | Prin componenta `Badge variant="success"`. |
| Avertisment / draft / în așteptare | `amber-*` | `Badge variant="warning"`. Termene limită: text `amber-600`. |
| Eroare / pericol | `red-*` | `FormError`, `Button variant="danger"`. |

### Raze de colț

| Element | Clasă |
|---|---|
| Carduri, containere, empty states | `rounded-2xl` |
| Butoane, inputuri, iconuri-container | `rounded-xl` |
| Elemente mici de nav, chips de link | `rounded-lg` |
| Badge-uri, avatar | `rounded-full` |

### Tipografie

- Font: Inter (setat global). Nu introduce alte fonturi.
- Titlu pagină: `text-2xl font-bold text-slate-900` (folosește `PageHeader`).
- Titlu secțiune: `text-xl font-bold` sau `text-lg font-semibold` + `text-slate-800/900`.
- Corp: `text-sm`/`text-base`, secundar `text-slate-500`.

### Iconuri

- **Doar `lucide-react`. Niciodată emoji în UI.**
- Mărimi: `w-4 h-4` lângă text/butoane, `w-5 h-5` în nav, `w-10 h-10` în empty states.
- Pune `aria-hidden` pe iconuri pur decorative.
- Iconuri uzuale deja alese: `Waves` (logo/înotători), `CalendarDays` (date), `MapPin` (locație), `Building2` (cluburi), `UsersRound` (utilizatori), `ClipboardList` (înscrieri), `Trophy` (rezultate/concursuri), `Plus` (creare).

## 3. Componente (`src/components/ui/`, import din `@/components/ui`)

| Componentă | Când o folosești |
|---|---|
| `Button` / `ButtonLink` | Orice acțiune. Variante: `primary` (una singură pe ecran), `secondary`, `ghost` (anulare), `danger`. Mărimi: `md` implicit (44px), `lg` pentru formulare pe mobil, `sm` doar pentru acțiuni dense pe desktop. |
| `Card` / `CardLink` | Orice suprafață albă. `CardLink` pentru carduri clickabile (tot cardul e țintă de atingere). Pentru liste: `Card` cu `divide-y divide-slate-100`. |
| `Badge` | Statusuri: `success` / `warning` / `danger` / `info` / `neutral`. Nu inventa pastile noi. |
| `Label`, `Input`, `Select`, `Textarea`, `FormError` | Toate formularele. `tone="dark"` pe pagini auth/închise. |
| `EmptyState` | Orice listă goală — icon + titlu + (opțional) descriere și acțiune. Nu lăsa niciodată o pagină pur și simplu goală. |
| `PageHeader` | Titlul fiecărei pagini; suportă `description`, `action` (buton dreapta), `backHref` (breadcrumb înapoi). |
| `StatCard` | Cifre-cheie pe dashboard-uri. |
| `Logo` (`@/components/logo`) | Logo + wordmark; `tone="dark"` pe fundal închis. |
| `AppHeaderNav` + `AppTabBar` (`@/components/app-nav`) | Navigația aplicației utilizator. |
| `AdminSidebarNav` + `AdminMobileNav` (`@/components/admin-nav`) | Navigația panoului de administrare. |

**Când adaugi o componentă nouă:** o pui în `src/components/ui/`, o exporți din `index.ts`, primește `className` pentru extindere și folosește doar tokens din acest document. Dacă un pattern apare a treia oară inline, extrage-l în componentă.

## 4. Pattern-uri de pagină

- **Pagină de listă:** `PageHeader` cu acțiunea de creare în `action` → grilă de `CardLink` sau `Card` cu `divide-y` → `EmptyState` ca fallback.
- **Pagină de formular:** `PageHeader` cu `backHref` → `Card` cu `p-5 sm:p-6` și `max-w-lg` → câmpuri cu `space-y-5` → `FormError` → butoane: primar + `ghost` pentru anulare. Pe mobil butoanele se stivuiesc (`flex-col-reverse sm:flex-row` — primarul rămâne vizual primul).
- **Statusuri de loading pe butoane:** text schimbat („Se salvează...") + `disabled`.
- **Date:** întotdeauna `toLocaleDateString('ro-RO', …)`.

## 5. Mobile — set de instrucțiuni obligatoriu

Aplicația e folosită de părinți și antrenori **în primul rând pe telefon, la marginea bazinului**. Orice ecran nou se proiectează mobile-first.

1. **Scrie întâi clasele pentru mobil, apoi adaugă `sm:`/`md:`/`lg:`.** Breakpoint-uri: `sm` = telefon→tabletă, `md` = apariția sidebar-ului admin, `lg+` = desktop larg.
2. **Ținte de atingere ≥ 44px.** `Button` `md`/`lg` și `Input`/`Select` (h-12) respectă deja asta. Nu crea linkuri/iconuri clickabile mai mici de `w-10 h-10` fără padding compensatoriu.
3. **Navigație:**
   - Aplicația utilizator: pe `<sm` navigarea se face prin `AppTabBar` (bară fixă jos). Orice rută nouă de prim nivel se adaugă în lista din `app-nav.tsx` (maxim 5 taburi).
   - Admin: pe `<md` se folosește `AdminMobileNav` (taburi orizontale scrollabile sub header). Rutele noi se adaugă în `admin-nav.tsx`.
   - **Niciodată `hidden` pe navigație fără o alternativă mobilă.**
4. **Bara de jos cere spațiu:** orice layout care randează `AppTabBar` trebuie să aibă `pb-24 sm:pb-8` pe `<main>`; bara însăși are deja `pb-safe` (safe-area pentru iPhone). Utilitatea `pb-safe` e definită în `globals.css`; `viewportFit: 'cover'` e setat în root layout — nu le șterge.
5. **Inputurile au `text-base` (16px)** — sub 16px Safari iOS face zoom automat la focus. Nu micșora fontul inputurilor.
6. **Grile:** implicit o coloană; `sm:grid-cols-2` etc. Gap `gap-3` pe mobil, `sm:gap-4`.
7. **Rânduri care nu încap:** folosește `flex-wrap` + `gap-2` (titlu + badge-uri), nu lăsa overflow orizontal. Excepție intenționată: taburile scrollabile (`overflow-x-auto`).
8. **Tabele:** pe mobil nu se folosesc tabele late — listele se randează ca și carduri (pattern-ul existent). Dacă un tabel e inevitabil, învelește-l în `overflow-x-auto`.
9. **Header sticky** (`sticky top-0 z-10`) în aplicație; `AppTabBar` are `z-20`. Modalele/sheet-urile viitoare încep de la `z-30`.
10. **Testare:** verifică fiecare ecran la 375px lățime (iPhone SE/13 mini) înainte de a-l considera gata.

## 6. Ce NU facem

- ❌ Emoji ca iconuri.
- ❌ `gray-*` sau `blue-*` — doar `slate-*` și `brand-*`.
- ❌ Stiluri de buton/input/badge scrise inline când există componenta.
- ❌ Raze de colț în afara scării de la §2.
- ❌ Culori noi de accent fără a le adăuga întâi ca token în `globals.css` și aici.
- ❌ Navigație ascunsă pe mobil fără alternativă.
