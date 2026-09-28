# Skincluv Anti-AI-Slop Design Rules

These rules are mandatory for all frontend UI/UX implementation, component authoring, and AI-generated code across Skincluv.

---

## Rule 1 — Content Before Containers
Do not create a card, bordered container, or elevated surface merely to group related information.
- Prefer whitespace (32px–48px), typography hierarchy, section headings, and subtle hairline dividers (`1px solid rgba(29, 41, 40, 0.08)`).
- Use surfaces/cards ONLY when the content represents a distinct primary focal object or elevated modal.
- Strictly FORBIDDEN:
  - Card inside card inside card (card soup).
  - Giving every single metric or paragraph its own bordered box.
  - Adding glowing gradients or neon shadows around ordinary data points.
The default page must feel open, breathable, and calm, not boxed-in.

---

## Rule 2 — Legible & Human Typography Scale
Never use 10px or 11px text for standard UI content.
- Body text: 14px–15px minimum (line-height 1.6).
- Secondary text: 13px–13.5px.
- Micro metadata / timestamp: 12px only when strictly necessary.
- Page & Hero Title: Fraunces serif (30px–36px, regular/medium).
- Major Section Heading: Fraunces serif (22px–26px).
- Functional controls, buttons, forms, and navigation: Inter sans-serif.
- Strictly FORBIDDEN: Using Quicksand or introducing arbitrary playful/bubbly fonts.

---

## Rule 3 — Restrained 3-Tone Palette (No Rainbow Badges)
Use only the canonical Skincluv Botanical Luxury palette defined in `src/index.css`:
- Canvas: Warm Cream/Sand (`#FAF6F0` / `#F7F3EC`).
- Surface: Crisp White (`#FFFFFF`).
- Primary Accent: Deep Spruce Teal (`#0B4F5C`).
- Secondary Accent: Soft Peach (`#E8A87C`).
- Ink Text: Deep Slate/Ink (`#1D2928`) and Muted Ink (`#6B6F6A`).
- Status colors are strictly restricted to 3 desaturated tones:
  - Optimal / Good: Moss Sage (`#5B7A5B`).
  - Attention / Moderate: Clay Amber (`#B8874F`).
  - Alert / High Concern: Rust Terracotta (`#A6503D`).
- Strictly FORBIDDEN: Introducing arbitrary rainbow colors (bright neon emerald, cyan, sky blue, purple, fuchsia) on the same screen.

---

## Rule 4 — Unified Geometry (No Pill-Shape UI)
Do not use `border-radius: 9999px` for ordinary buttons, cards, inputs, tabs, or badges.
- Default control & button radius: 10px (`--radius: 10px`).
- Small tag / badge radius: 6px.
- Large panel / modal radius: 14px.
Pill shapes (9999px) look toy-like and are banned from standard UI components.

---

## Rule 5 — One Visual Focal Point Per Screen
Every screen must have ONE clear primary visual hierarchy.
- Do not give equal visual weight to 6 cards, 8 badges, and 3 buttons at once.
- Ask: "What is the single most important thing the user should see first?"
- Everything else must visually take a step back and support that element calmly.

---

## Rule 6 — No Internal AI / Engineering Jargon
Never expose internal engineering mechanics to make a feature look "smart":
- Do NOT display: model names, token counts, pipeline step numbers, raw AI confidence scores, or database slugs.
- Use quiet, natural, human Indonesian:
  - Use: "Menganalisis kondisi kulit..."
  - NOT: "Gemini Vision Pipeline — Stage 3/4 (Confidence 98.4%)"
The interface must feel like a personal wellness companion, not a tech demo.

---

## Rule 7 — Design From the User's Real Question
Before building or modifying any screen, anchor the hierarchy to the user's primary question:
- Dashboard: "Bagaimana kondisi kulit saya hari ini dan apa yang perlu saya perhatikan?"
- Face Scan: "Apakah foto saya sudah cukup jelas untuk dianalisis dengan baik?"
- Ingredient Scan: "Apa isi produk ini dan apakah cocok dengan jenis kulit saya?"
- Profile: "Bagaimana saya mengelola akun, paket, dan hak privasi saya?"
Do not design around the database schema or component libraries. Answer the human question first.
