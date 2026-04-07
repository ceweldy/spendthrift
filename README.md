# Spendthrift

A fast, card-driven shopping simulation game built with Next.js.

Spendthrift mixes personality-based onboarding, timed discount mechanics, and a risk/reward economy where every checkout can improve your score *or* increase regret.

---

## Project Overview

Spendthrift is a single-player browser game where you:

1. Take a short quiz to determine your shopping archetype.
2. Play through a 10-round card run.
3. Buy products, trigger special effects, and manage temporary modifiers.
4. Balance **budget**, **dopamine**, and **regret** to maximize final score.

The app is built as a client-side Next.js App Router experience and exports as static files for simple hosting.

---

## Core Gameplay Loop

### 1) Quiz → Archetype
- 5 quiz questions (`lib/game-data.ts`) score one of four archetypes:
  - `impulse_king`
  - `bargain_hawk`
  - `status_flexer`
  - `comfort_seeker`
- Archetype selection affects card draw weighting and scoring dynamics.

### 2) Round-based card play
- A run starts with:
  - Budget: **$500**
  - Round: **1 / 10**
- Each round deals a hand from `data/cards.json`:
  - weighted product cards + one special card (event/power/trap when available).

### 3) Shopping cards + effect cards
- **Product cards** can be added to cart (max 5).
- **Special cards** apply immediate or armed effects, including:
  - flash sales, shipping discounts, cashback, price match,
  - dopamine boosts, regret traps, delayed regret events.

### 4) Dopamine / Risk / Budget economy
- Checkout totals are computed in `lib/game-engine.ts`:
  - Product price modifiers stack (round sale, flash sale, price match, etc.).
  - Payment mode can be real-display or demo-free.
- On checkout:
  - Budget decreases by charged total (plus cashback/payday effects).
  - Dopamine increases from purchased items and bonuses.
  - Regret increases from average cart risk + armed penalties.

### 5) Round advance + endgame
- Checkout or skip advances round.
- Payday injects budget every 3 rounds (default +$180).
- Run ends when round exceeds `maxRounds`.
- Final score = dopamine - regret penalty + archetype bonus.

---

## Key Features

### Discount / pricing systems
- Multiplicative discount stacking (`getCardPricing`) across:
  - random round sales,
  - flash sale,
  - next-item price match,
  - tech markdown effects.
- Savings tracking per cart item and run totals.

### Badges / achievements
- Badge definitions in `lib/achievements.ts`.
- Progress + unlock handling in Zustand store (`store/useGameStore.ts`).
- Includes hidden/secret achievements and dopamine rewards.

### Inventory + activity history
- Persistent inventory and purchase history across runs.
- Activity feed captures system events, draws, cart actions, effects, checkout, payment changes, and subscription changes.
- State persistence uses Zustand `persist` with migration/normalization logic.

### SFX + UX settings
- Web Audio API sound system (`lib/audio-manager.ts`) with presets:
  - silent / balanced / immersive.
- UX animation presets (`lib/ux-settings.ts`):
  - full / balanced / reduced.
- Respects reduced-motion behavior via Framer Motion + reduced settings.

### Endgame + recap tools
- Animated results screen with score breakdown.
- Recap card + clipboard copy actions.
- Share-score utility and badge review flow.

---

## Tech Stack & Architecture Notes

### Framework/UI
- **Next.js 14 App Router**
- **React 18 + TypeScript**
- **Tailwind CSS**
- **Framer Motion**

### State and game logic
- **Zustand** for global game state (`store/useGameStore.ts`).
- Core deterministic gameplay/economy logic in `lib/game-engine.ts`.
- Card weighting and draw utilities in `lib/card-utils.ts`.

### Data and assets
- Card content source: `data/cards.json`.
- Runtime guard enforces card counts in `lib/game-data.ts`:
  - 35 products, 10 events, 5 power, 5 trap.
- Visual card art can resolve from explicit `imageUrl` or fallback placeholders.

### App flow components
- Onboarding: `components/onboarding/*`
- Main game + checkout + results: `components/game/*`
- Shared UI controls: `components/ui/*`

---

## Local Setup

### Prerequisites
- Node.js (project CI uses Node 20)
- npm

### Install
```bash
npm ci
```

### Run locally
```bash
npm run dev
```

### Quality checks
```bash
npm run lint
npm run typecheck
npm run test:engine
```

### Production build
```bash
npm run build
```

### Static export notes
`next.config.mjs` uses:
- `output: 'export'`
- `trailingSlash: true`
- dynamic `basePath` + `assetPrefix` for GitHub Pages project repos.

Build output is generated in `out/`.

---

## Deployment Notes (GitHub + Vercel + Guardrails)

### GitHub behavior
- CI workflow: `.github/workflows/production-guardrail.yml`
- Trigger: push/pull_request to `main`
- Runs: `./scripts/preprod-guardrail.sh`

### Guardrail checks (required)
`./scripts/preprod-guardrail.sh` enforces:
1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test:engine`
5. `npm run build`

Reference: `docs/production-guardrails.md`

### Vercel behavior
- `vercel.json`:
  - install command: `npm ci`
  - build command: `npm run build`

Because the app uses static export config, deployments produce static output-compatible builds.

---

## Project Structure Map

```text
spendthrift/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── game/
│   ├── onboarding/
│   └── ui/
├── data/
│   └── cards.json
├── lib/
│   ├── achievements.ts
│   ├── audio-manager.ts
│   ├── card-utils.ts
│   ├── game-data.ts
│   ├── game-engine.ts
│   └── ux-settings.ts
├── scripts/
│   ├── engine-hardening-check.ts
│   └── preprod-guardrail.sh
├── store/
│   └── useGameStore.ts
├── types/
│   └── game.ts
├── docs/
│   ├── production-guardrails.md
│   ├── qa-notes.md
│   └── image-*.md
├── legacy/
│   └── index.legacy.html
├── next.config.mjs
├── vercel.json
└── package.json
```

---

## Accessibility & Performance Considerations

### Accessibility
- Keyboard shortcuts for major game actions (documented in UI).
- `aria-label` usage in actionable controls (e.g., checkout inputs/buttons, menu controls).
- Reduced motion support through `useReducedMotion` and animation presets.
- Color + icon cues are used together for state in most HUD elements.

### Performance
- Static export deployment model minimizes runtime server overhead.
- Hand logic and score/economy calculations are local and lightweight.
- Activity list, toasts, and log slices are capped to prevent unbounded growth in active state.
- Persisted state is partialized to essential long-lived fields.

---

## Roadmap / Known Limitations

Current limitations reflected in codebase:

- No backend or multiplayer; game state is client-local.
- No formal automated unit/integration test suite beyond `test:engine` hardening script.
- Uses generated/fallback card art when explicit image URLs are unavailable.
- Payment and shipping are simulation-only (no real checkout integration).
- "Analytics" in premium unlocks are feature flags/state unlocks, not external analytics pipelines.

---

## Contributing

Contributions are welcome via pull requests.

Suggested workflow:
1. Create a feature branch.
2. Run guardrail checks locally:
   ```bash
   ./scripts/preprod-guardrail.sh
   ```
3. Open PR to `main`.

Keep gameplay/economy changes in `lib/game-engine.ts` and update docs when behavior changes.

---

## License

No `LICENSE` file is currently present in this repository.

Until a license is added, default copyright applies (all rights reserved).
