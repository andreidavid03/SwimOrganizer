<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design system

Before any UI work, read `DESIGN.md` — it defines the design tokens (`brand-*`/`slate-*` only), the shared components in `src/components/ui/`, and the mandatory mobile rules (bottom tab bar, 44px touch targets, safe areas). Reuse those components instead of writing inline styles; never use emoji as icons (use `lucide-react`).
