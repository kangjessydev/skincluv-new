---
name: Skincluv
colors:
  surface: "#f6faff"
  surface-dim: "#d6dae0"
  surface-bright: "#f6faff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f0f4fa"
  surface-container: "#eaeef4"
  surface-container-high: "#e4e8ee"
  surface-container-highest: "#dee3e9"
  on-surface: "#171c20"
  on-surface-variant: "#3e4850"
  inverse-surface: "#2c3135"
  inverse-on-surface: "#edf1f7"
  outline: "#6e7881"
  outline-variant: "#bec8d2"
  surface-tint: "#006591"
  primary: "#006591"
  on-primary: "#ffffff"
  primary-container: "#0ea5e9"
  on-primary-container: "#003751"
  inverse-primary: "#89ceff"
  secondary: "#50616b"
  on-secondary: "#ffffff"
  secondary-container: "#d3e5f1"
  on-secondary-container: "#566771"
  tertiary: "#8a5100"
  on-tertiary: "#ffffff"
  tertiary-container: "#de8712"
  on-tertiary-container: "#4d2b00"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#c9e6ff"
  primary-fixed-dim: "#89ceff"
  on-primary-fixed: "#001e2f"
  on-primary-fixed-variant: "#004c6e"
  secondary-fixed: "#d3e5f1"
  secondary-fixed-dim: "#b7c9d5"
  on-secondary-fixed: "#0c1e26"
  on-secondary-fixed-variant: "#384953"
  tertiary-fixed: "#ffdcbd"
  tertiary-fixed-dim: "#ffb86e"
  on-tertiary-fixed: "#2c1600"
  on-tertiary-fixed-variant: "#693c00"
  background: "#f6faff"
  on-background: "#171c20"
  surface-variant: "#dee3e9"
  surface-bg: "#F8FAFC"
  text-main: "#0F172A"
  text-muted: "#64748B"
  success-soft: "#F0FDF4"
  accent-rose: "#FFF1F2"
typography:
  display:
    fontFamily: Quicksand
    fontSize: 44px
    fontWeight: "700"
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: "600"
    lineHeight: 36px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  label-md:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Quicksand
    fontSize: 12px
    fontWeight: "700"
    lineHeight: 16px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter-mobile: 16px
  gutter-desktop: 24px
  margin-mobile: 20px
  margin-desktop: auto
  section-gap: 64px
---

## Brand & Style

The design system is built around the "Airy Professional" aesthetic, specifically tailored for a modern skincare assistant. It evokes a sense of purity, clarity, and gentle guidance. The brand personality is optimistic, clean, and trustworthy, avoiding the clinical coldness of traditional medical apps in favor of a soft, welcoming digital environment.

The target audience is women seeking a structured yet effortless way to manage their skincare routines. The UI leverages **Minimalism** with a focus on "high-oxygen" layouts—significant whitespace, a restricted but vibrant sky-blue palette, and soft geometry. The goal is to make the user feel as though they are interacting with a fresh, clean surface, mirroring the desired results of a skincare regimen.

## Colors

The color strategy uses a light, atmospheric palette to reinforce the "Skincluv" identity.

- **Primary (Sky Blue):** The functional engine of the UI. Used for primary actions, active states, and focus indicators. It provides a crisp, professional contrast against the light background.
- **Secondary (Pale Azure):** Used for large surface areas, subtle highlights, and container backgrounds to create a soft, layered feel without moving into gray.
- **Neutral (Slate & White):** Backgrounds utilize a near-white slate (#F8FAFC) to reduce glare. Typography uses a deep Slate (#0F172A) for maximum readability and a professional, grounded feel.

Accessibility is paramount; the primary sky blue is paired with white text only in large components or with a darkened variant to ensure WCAG AA compliance for interactive elements.

## Typography

The typography is powered exclusively by **Quicksand** to maintain a friendly, modern, and cohesive feel. Its rounded terminals echo the "softness" of skin and beauty products.

To ensure a "professional" rather than "childish" look, the system relies on a strict weight hierarchy. Headlines utilize Semi-Bold (600) and Bold (700) weights with tighter tracking, while body copy stays in the Regular (400) weight with generous line height to maintain the airy aesthetic. Labels use the Bold weight at smaller sizes to ensure they remain legible and functional as UI signposts.

## Layout & Spacing

This design system employs a **Fixed-Fluid Hybrid** grid model.

- **Mobile (up to 599px):** A 4-column fluid grid with 20px outer margins and 16px gutters. Elements favor vertical stacking with full-width cards.
- **Desktop (1024px+):** A 12-column fixed grid with a max-width of 1120px.

The spacing rhythm is based on a **base-8 scale**. To maintain the "Airy" feel, section gaps are intentionally large (64px+). Internal card padding should never drop below 24px (3 units) to ensure content never feels cramped.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines**.

1.  **Base:** The surface-bg (#F8FAFC) acts as the canvas.
2.  **Surface:** Main content cards use pure white (#FFFFFF). Instead of heavy shadows, they use a subtle 1px border in the secondary color (#E0F2FE).
3.  **Elevation:** For floating elements (modals, dropdowns), use a very soft, "Sky-Tinted" shadow: `0 10px 15px -3px rgba(14, 165, 233, 0.05)`. This keeps the depth feeling light and atmospheric rather than heavy or muddy.
4.  **Blur:** Use backdrop blurs (10px–20px) behind navigation bars to maintain the "Glassmorphism" hint, suggesting transparency and cleanliness.

## Shapes

The shape language is **Rounded (Level 2)**.

- **Standard Components:** Buttons, input fields, and small chips use 0.5rem (8px) corners.
- **Containers:** Content cards and feature blocks use 1rem (16px) or 1.5rem (24px) for a softer, organic appearance that mimics modern product packaging.
- **Interactive Elements:** Checkboxes use a soft 4px radius, while radio buttons and avatar frames are always circular (full pill).

## Components

### Buttons

- **Primary:** Solid Sky Blue (#0EA5E9) with white text. Rounded-lg.
- **Secondary:** Sky Blue text on a Pale Azure (#E0F2FE) background. No border.
- **Ghost:** Sky Blue text with no background, used for tertiary actions.

### Input Fields

- **Default:** White background with a 1px Pale Azure border.
- **Active:** Border transitions to Primary Sky Blue with a soft 2px outer glow in the same hue at 10% opacity.
- **Labels:** Always use `label-md` in Slate for clear visibility.

### Cards

- Pure white surfaces with a `rounded-xl` radius.
- Use a 1px border (#E0F2FE) instead of a shadow for standard cards.
- Use internal "gutter" spacing of 24px for all content.

### Chips & Tags

- Pill-shaped (full-round).
- For status (e.g., "Daily Routine"), use Secondary Pale Azure background with Primary Sky Blue text.

### Skincare Assistant Specifics

- **Product Tiles:** Use high-quality imagery against the Secondary color background to create a clean, "e-commerce" editorial feel.
- **Progress Trackers:** Soft, thick circular strokes using the Primary color for the progress and the Secondary color for the track.
