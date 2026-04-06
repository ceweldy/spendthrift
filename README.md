# SPENDTHRIFT (Next.js PRD Rebuild)

Rebuilt from single-file static prototype into a modular PRD architecture using:
- Next.js 14 App Router
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Zustand state store

## Flow (MVP)
Landing → Quiz → Archetype Reveal → Game → Checkout Modal → Results

## Scripts
```bash
npm run dev
npm run build
npm run export   # static export via output: 'export'
pnpm run build
```

## Static deploy support
`next.config.mjs` is configured with:
- `output: 'export'`
- `trailingSlash: true`
- `basePath` + `assetPrefix` auto-adjusted for GitHub Pages project repos

Output is generated in `out/` after build.

## Legacy reference
Original single-file prototype is preserved at:
- `legacy/index.legacy.html`
