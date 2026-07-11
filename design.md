# Design System — Daiven Reyes Portfolio

A single-page, premium portfolio for a senior WordPress developer / web systems engineer.
Direction: minimalist, futuristic, clean engineering aesthetic — Apple-simplicity ×
Linear × Vercel, with subtle 3D and motion used only where it improves the experience.

---

## 1. Principles

- **Whitespace first.** Large breathing room; sections do one thing each.
- **Motion with intent.** Animation should feel *expensive, smooth, professional* — never decorative or distracting.
- **Systems thinking, visualized.** Every section reinforces the message: *"I build advanced web systems and digital experiences."*
- **Graceful degradation.** Everything renders without WebGL, without the CDN, and with `prefers-reduced-motion`.

---

## 2. Color

Near-black canvas, white type, a dominant **emerald** accent with a **violet** secondary and silver/blue support. Defined as CSS custom properties in `:root` (`css/styles.css`).

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0c0e13` | Page background |
| `--bg-2` | `#14161d` | Raised surfaces |
| `--surface` | `rgba(255,255,255,.06)` | Glass panel fill |
| `--surface-2` | `rgba(255,255,255,.10)` | Hover / stronger fill |
| `--border` | `rgba(255,255,255,.14)` | Hairline borders |
| `--border-2` | `rgba(255,255,255,.24)` | Emphasis borders |
| `--text` | `#f6f7f9` | Primary type |
| `--text-dim` | `#b6b9c4` | Secondary type |
| `--text-faint` | `#797d8b` | Captions / meta |
| `--accent` | `#34e2a8` | **Primary — emerald** |
| `--accent-2` | `#8b7bff` | **Secondary — violet** |
| `--accent-soft` | `rgba(52,226,168,.12)` | Accent tints / icon wells |
| `--silver` | `#c9cdd6` | Neutral chips |

Category colors (architecture / stack legend): emerald `#34e2a8`, violet `#8b7bff`,
amber `#f0b35b`, blue `#58b9ff`, pink `#ff7b9c`.

**Ambient light:** three fixed blurred radial glows (emerald, violet, blue) plus a faint grid and a noise layer keep the dark canvas from reading as flat black.

---

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Display / headlines | **Space Grotesk** (500–700) | Geometric, tight `-0.02em`–`-0.03em` tracking |
| Body / UI | **Inter** (300–600) | Line-height 1.6 |

- Headlines: `clamp(32px, 5vw–6.2vw, 58–84px)`, line-height ~1.02.
- Eyebrows: 13px, uppercase, `0.18em` tracking, emerald.
- Gradient text (`.accent-text`): emerald → violet linear gradient clipped to text.

---

## 4. Layout & Spacing

- Max content width: `--maxw: 1240px`, centered with `--gutter: clamp(20px, 5vw, 64px)`.
- Section rhythm: `clamp(90px, 12vh, 160px)` vertical padding.
- Radii: `--radius: 18px`, `--radius-lg: 26px`, pills `100px`.
- Grids: 6-col bento (capabilities), 6-col flow (architecture), 7-col (process), 2-col (hero, cases).
- Easing: `--ease: cubic-bezier(.22,.61,.36,1)`, `--ease-out: cubic-bezier(.16,1,.3,1)`.

---

## 5. Components

- **Glass panel (`.glass`)** — translucent fill, hairline border, backdrop blur, inset highlight, and a gradient edge via masked `::before`.
- **Buttons** — `.btn--primary` (emerald gradient, glow, lift on hover), `.btn--ghost` (glass, accent border on hover); arrow icon nudges on hover. `.btn--lg` variant.
- **Navbar** — fixed, transparent → frosted pill on scroll (`.nav--scrolled`); animated underline links; active-section highlight; mobile burger drawer.
- **Cards** — capability bento, timeline cards, case panels; all use `.glass` + `[data-tilt]` 3D hover.
- **Project mockups** — `.browser` frame (URL bar, traffic dots) rotated in 3D, straightens on hover; holds a swappable `<img>`.
- **Chips** — pill tags for technologies.

---

## 6. Sections

1. **Hero** — two columns: left = label, animated headline, CTAs, stats; right = 3D floating workstation.
2. **Capabilities** — bento glass grid: Frontend, Backend, CMS, Automation, Infrastructure.
3. **System Architecture** — horizontal flow Website → CMS → API → Automation → Analytics → Intelligence, with a light pulse on the line.
4. **Selected Work** — three case studies as 3D browser mockups + floating Role / Stack / Features / Impact panels.
5. **Experience Timeline** — vertical line that draws on scroll; alternating cards.
6. **Technology Stack** — draggable 3D orbiting tag cloud (no skill bars).
7. **Process** — 7-step path: Idea → Planning → Design → Development → Testing → Deployment → Optimization.
8. **Contact** — centered statement over an ambient particle field; email, résumé, socials.

---

## 7. Motion System

- **Page load** — hero headline reveals line-by-line; 3D scene scales/eases in.
- **Scroll** — `IntersectionObserver` reveals (`[data-reveal]`, staggered via `data-reveal-delay`); top progress bar; timeline line fill; architecture pulse.
- **Hover** — 3D card tilt (`[data-tilt]`, pointer-fine only), glow, lift, mockup de-rotate.
- **3D** — floating drift, mouse-parallax camera, traveling data pulses, orbiting stack, particle drift.

Off-screen canvases pause via `IntersectionObserver` for performance.

---

## 8. 3D Scenes (Three.js)

`js/scene.js` (ES module, Three.js `0.160.0` from unpkg CDN):

- **Hero** — glass browser panel with code lines, two floating glass cards (one with a mini chart), connected nodes, animated data pulses, ambient particles, mouse-driven camera.
- **Stack orbit** — Fibonacci-distributed text sprites on a sphere; drag/touch to spin, inertia, depth fade, category colors.
- **Contact** — ~1,400-point emerald/violet particle field with gentle rotation + mouse parallax.

**Fallbacks:** WebGL feature-detected and CDN import wrapped in `try/catch`; on failure `body.no-webgl` shows a CSS workstation (hero) and a text tech-cloud (stack), and ambient gradient backgrounds keep every 3D area looking intentional.

---

## 9. Responsive

| Breakpoint | Behavior |
|---|---|
| Desktop (>1024px) | Full immersive experience |
| Tablet (≤1024px) | Burger nav, single-column hero/cases, simplified grids |
| Mobile (≤760px) | Stacked sections, single-column bento, left-aligned timeline, smaller orbit |

`prefers-reduced-motion`: animations/transitions reduced to ~0, reveals shown immediately.

---

## 10. File Structure

```
Portfolio/
├─ index.html          # Markup — all 8 sections, nav, footer
├─ design.md           # This document
├─ css/
│  └─ styles.css       # Design tokens + all section styles + responsive
├─ js/
│  ├─ main.js          # Reveals, nav, tilt, timeline draw, progress (no deps)
│  └─ scene.js         # Three.js hero / stack orbit / contact field
└─ assets/
   ├─ project-1.svg    # Internal invoice and rider system mockup
   ├─ project-2.svg    # Nexus SEO intelligence mockup
   └─ project-3.svg    # AI-powered landing page builder mockup
```

---

## 11. Customizing

- **Theme brightness / accents** — edit tokens in `:root` (`css/styles.css`). Lower `--bg` lightness or glow opacity to darken; raise to brighten.
- **Project images** — replace `assets/project-*.svg` (any image format works; keep ~8:5 ratio).
- **Content** — name, copy, projects, timeline, and social links live in `index.html`.
- **Stack items** — edit the `groups` object in `js/scene.js`.
- **Going offline-proof** — download Three.js `0.160.0` locally and point the import in `js/scene.js` at the local path instead of the unpkg CDN.
