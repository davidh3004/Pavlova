# Pavlova Love Tampa — Design System (MASTER)

Premium editorial bakery/café. Source of truth for the visual layer. Generated with ui-ux-pro-max, adjusted to brief.

## Concept
Editorial-magazine + Swiss minimal. Ivory canvas, extreme whitespace, asymmetric grids,
large display serif, thin gold/rose hairline dividers, soft shadows, restrained motion.
Feminine, refined, warm, upscale — **not** loud, red, childish, or Valentine-themed.

## Color tokens (defined in `src/styles/global.css`)
| Role | Token | Approx hex | Use |
|------|-------|-----------|-----|
| Canvas | `--color-base-100` | `#FDFBF7` ivory | dominant background |
| Mist | `--color-base-200` | warm off-white | alternating sections |
| Surface | `#fff` | white | cards |
| Primary / berry | `--color-primary` | `#831843` | main buttons, links, headings accent |
| Dusty rose | `--color-secondary` / `--rose` | `#C08497` | eyebrows, secondary accents |
| Gold | `--color-accent` / `--gold` | `#B08D57` | hairline dividers (sparingly) |
| Blush | `--blush` / `--blush-soft` | `#F4C9D7` | pills, soft fills |
| CTA red | `--cta` | `#C0485C` | **`.btn-cta` only** — Order Now. Never elsewhere |
| Ink | `--color-base-content` | `#2A1A22` | body text |
| Border | `--hairline` | `#EFE3E8` | dividers, card borders |

Red discipline: soft red lives ONLY in `.btn-cta`. Everything else berry/rose/gold.

## Typography
- Display/headings: **Cormorant** (serif). Hero via `.display-hero`, large via `.display-lg`.
- Body/UI: **Montserrat**. Loaded in `MainLayout.astro`.
- Eyebrow label: `.eyebrow` (uppercase, tracked, rose).

## Components / utility classes
- `.btn-cta` soft-red conversion CTA · `.btn-quiet` light outline · `.btn-on-dark` on photos
- `.card-lux` premium card (soft shadow, hover lift, image zoom)
- `.pill` blush badge · `.eyebrow` kicker · `.hairline` / `.hairline-short` gold dividers
- `.section` / `.container-lux` rhythm · `.link-underline` animated underline
- `.photo-veil` hero gradient · `.reveal` + `.reveal-1..4` entrance stagger
- Shadows: `--shadow-soft`, `--shadow-lift`. Radius: `--radius-box` 1rem.

## Motion
200–400ms, `cubic-bezier(0.16,1,0.3,1)`. Animate transform/opacity only.
`prefers-reduced-motion` disables all. One primary CTA per screen.

## Icons
Lucide (via `lucide-react` islands, or inline SVG in `.astro`). **No emoji as icons.**

## Anti-patterns (avoid)
Dark heavy backgrounds, overuse of red, emoji icons, cluttered menu grids,
cheap template cards, generic stock bakery icons, cheesy Latin visuals.

## Scope
Public pages + shared shell only. Admin panel untouched. Backend (Firebase/Square/i18n) untouched.
