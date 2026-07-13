# Snip Design System
> Source-of-truth tokens derived from the Lovable.dev visual language.
> Paste this file into any future styling prompt.

---

## 1. Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0F0F13` | Page background (near-black, slight blue cast) |
| `--bg-surface` | `#1C1C24` | Cards, input container |
| `--bg-elevated` | `#262632` | Hovered/active surface states |
| `--text` | `#F0F0F2` | Primary text, headlines |
| `--text-muted` | `#8E8EA0` | Subtitles, labels, table headers |
| `--text-placeholder` | `#4A4A5E` | Input placeholder |
| `--border` | `rgba(255,255,255,0.07)` | Subtle dividers and card borders |
| `--border-focus` | `rgba(249,112,102,0.45)` | Coral ring on focused input |
| `--accent` | `#F97066` | Coral — primary CTA, links |
| `--accent-pink` | `#E879A0` | Pink — gradient stop |
| `--accent-orange` | `#FB923C` | Orange — gradient stop |
| `--accent-purple` | `#6366F1` | Indigo — hero gradient midpoint |
| `--success` | `#4ADE80` | Success text / glow |
| `--error` | `#F87171` | Error text / glow |

---

## 2. Hero Glow Gradient

A radial aurora painted behind the hero via a `::before` pseudo-element,
anchored to the **bottom centre** of the hero section.

```css
background: radial-gradient(
  ellipse 90% 55% at 50% 100%,
  rgba(232, 121, 174, 0.50) 0%,   /* --accent-pink */
  rgba(99,  102, 241, 0.25) 42%,  /* --accent-purple */
  rgba(249, 112, 102, 0.10) 65%,  /* --accent */
  transparent 80%
);
```

Blend over the page background with `mix-blend-mode: screen` at `opacity: 0.9`.

---

## 3. Typography

```
font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

| Role | Size | Weight | Color |
|---|---|---|---|
| Hero headline | `clamp(2.6rem, 5.5vw, 3.8rem)` | 800 | `--text` |
| Hero subline | `1.075rem` | 400 | `--text-muted` |
| Body | `0.9375rem` | 400 | `--text` |
| Label / caption | `0.8125rem` | 500 | `--text-muted` |

Letter-spacing: `-0.02em` on hero headline; normal elsewhere.

---

## 4. Spacing Scale

| Token | Value |
|---|---|
| `--space-xs` | `0.375rem` |
| `--space-sm` | `0.75rem` |
| `--space-md` | `1.25rem` |
| `--space-lg` | `2.5rem` |
| `--space-xl` | `4.5rem` |

---

## 5. Border Radii

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `8px` | Tags, badges |
| `--radius-md` | `14px` | Buttons |
| `--radius-lg` | `20px` | Cards, input container |
| `--radius-pill` | `999px` | Circle icon buttons |

---

## 6. Shadows & Glow

```css
/* Card lift */
--shadow-card: 0 1px 0 0 rgba(255,255,255,0.05) inset,
               0 8px 40px rgba(0,0,0,0.45);

/* Input container ambient */
--shadow-input: 0 2px 0 0 rgba(255,255,255,0.04) inset,
                0 12px 48px rgba(0,0,0,0.55);

/* Success notice glow */
--glow-success: 0 0 24px rgba(74,222,128,0.18);

/* Error notice glow */
--glow-error: 0 0 24px rgba(248,113,113,0.18);

/* Accent button glow (on hover) */
--glow-accent: 0 4px 20px rgba(249,112,102,0.40);
```

---

## 7. Snip Element → Design Token Mapping

| Snip element | Design role | Key tokens |
|---|---|---|
| `<h1>Snip</h1>` | Hero headline | hero font size, weight 800, `--text` |
| `<p class="tagline">` | Hero subline | `1.075rem`, `--text-muted` |
| Hero section | Aurora background | hero glow gradient pseudo-element, `--space-xl` padding |
| `.shorten-form` container | Chat-style input card | `--bg-surface`, `--radius-lg`, `--shadow-input`, horizontal flex |
| `input[type=text]` | Chat text field | transparent bg, `--text`, `--text-placeholder`, no border |
| Shorten button | Arrow-circle CTA | `--accent` fill, `--radius-pill`, `--glow-accent` on hover |
| `.success` notice | Inline result card | `--bg-surface` + `--success` left-border, `--glow-success` |
| `.error` notice | Inline error card | `--bg-surface` + `--error` left-border, `--glow-error` |
| Links table | Surface card | `--bg-surface`, `--radius-lg`, `--shadow-card`, `--border` rows |
| Table header row | Muted labels | `--text-muted`, `font-size` label, `--border` bottom |
| Short-code link | Accent link | `--accent` color, no underline, underline on hover |
