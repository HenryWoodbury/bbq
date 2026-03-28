# Theming Guide

## Where Theme Files Live

| File | Role |
|---|---|
| `src/app/globals.css` | **Single source of truth** — all tokens, dark mode, component classes |
| `src/app/layout.tsx` | Font loading only (`next/font/google` → CSS vars) |
| `postcss.config.mjs` | Wires up `@tailwindcss/postcss`. Never needs editing for theming. |

There is no `tailwind.config.ts`. Tailwind v4 reads everything from `globals.css`.

---

## How globals.css Is Structured

```
@import "tailwindcss";          ← Tailwind v4 framework
@import "tw-animate-css";       ← Animation utilities
@import "shadcn/tailwind.css";  ← shadcn data-state variants + animations

@custom-variant dark (&:is(.dark *));   ← class-based dark mode

@theme inline { ... }     ← Maps CSS vars → Tailwind utility names (bg-primary, etc.)
:root { ... }             ← Light mode token values (OKLCH)
.dark { ... }             ← Dark mode token overrides (same names, different values)

/* Clerk overrides */     ← Leave alone unless changing auth UI

@layer base { ... }       ← Global element defaults (body, a, focus ring)
@layer components { ... } ← Reusable component classes (.card, .page-layout, etc.)
```

---

## How to Create a New Theme

### Step 1 — Define your color palette

All colors use the **OKLCH color space**: `oklch(lightness chroma hue)`.

- Lightness: 0 (black) → 1 (white)
- Chroma: 0 (gray) → ~0.37 (full saturation)
- Hue: 0–360° (red ≈ 25°, green ≈ 145°, blue ≈ 260°)

Use [oklch.com](https://oklch.com) to pick values visually.

Each semantic token needs **two values** — one for `:root` (light) and one for `.dark`.

### Step 2 — Edit `:root` in globals.css

Replace OKLCH values for each semantic token:

```css
:root {
  --radius: 0.625rem;

  /* Surfaces */
  --background: oklch(0.985 0 0);        /* page bg */
  --foreground: oklch(0.145 0 0);        /* body text */
  --card: oklch(1 0 0);                  /* card surface */
  --card-foreground: oklch(0.145 0 0);
  --muted: oklch(0.97 0 0);              /* subtle fills */
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);

  /* Brand / interactive */
  --primary: oklch(0.205 0 0);           /* button bg, strong accents */
  --primary-foreground: oklch(0.985 0 0);
  --ring: oklch(62.3% 0.214 259.815);  /* focus ring — Tailwind blue-500 */

  /* Destructive */
  --destructive: oklch(0.577 0.245 27.325);

  /* Status (usually stays consistent across themes) */
  --success: oklch(0.979 0.021 166.113);
  --success-foreground: oklch(0.432 0.095 166.913);
  --success-border: oklch(0.905 0.093 164.15);
  /* ... error, warning, positive ... */
}
```

### Step 3 — Edit `.dark` in globals.css

Mirror the same token names with dark-adapted values:

```css
.dark {
  --background: oklch(0.145 0 0);        /* inverted from light foreground */
  --foreground: oklch(0.985 0 0);        /* inverted from light background */
  --card: oklch(0.205 0 0);
  --border: oklch(1 0 0 / 10%);          /* white at 10% opacity */
  --primary: oklch(0.922 0 0);           /* near-white for dark mode buttons */
  --primary-foreground: oklch(0.205 0 0);
}
```

Tip: For a neutral/grayscale theme only lightness changes. For a colored theme, shift the hue/chroma of `--primary` and `--ring`.

### Step 4 — (Optional) Add new tokens

If the theme needs tokens not already present, add in both `:root` and `.dark`, then expose in `@theme inline`:

```css
@theme inline {
  --color-brand-accent: var(--brand-accent);
}
```

This makes `bg-brand-accent`, `text-brand-accent`, `border-brand-accent` available as Tailwind utilities.

### Step 5 — Update fonts (optional)

Swap the `next/font/google` import in `src/app/layout.tsx`:

```tsx
const myFont = Inter({ variable: "--font-lato", subsets: ["latin"] })
```

The `--font-sans` mapping in `@theme inline` picks it up automatically.

### Step 6 — Component classes are theme-agnostic

`@layer components` classes (`.card`, `.page-layout`, `.stat-value`, etc.) reference semantic tokens — they automatically adapt to any new `:root`/`.dark` values without changes.

---

## Token Reference

### Core surface tokens (must define for any theme)

| Token | Light mode | Dark mode |
|---|---|---|
| `--background` | Page background | Inverted |
| `--foreground` | Body text | Inverted |
| `--card` | Card/panel surface | Slightly lighter than bg |
| `--muted` | Table headers, subtle fills | Darker gray |
| `--muted-foreground` | Placeholder, secondary text | Lighter gray |
| `--border` | Dividers, input outlines | White/10% opacity |
| `--primary` | Button bg, strong accents | Near-white in dark |
| `--primary-foreground` | Text on primary | Inverted |
| `--destructive` | Delete/danger | Lighter red in dark |
| `--ring` | Focus outline | Same in both |

### Status tokens (can stay unchanged across themes)

| Group | Tokens |
|---|---|
| Success | `--success`, `--success-foreground`, `--success-border` |
| Error | `--error`, `--error-foreground`, `--error-border` |
| Warning | `--warning`, `--warning-foreground`, `--warning-border` |
| Active indicator | `--positive` |

---

## Automation Approaches

### Option A — shadcn theme generator *(easiest)*

1. Go to [ui.shadcn.com/themes](https://ui.shadcn.com/themes)
2. Pick a palette and copy the generated CSS block
3. The output uses the same `--*` variable names
4. Paste into `:root` and `.dark` in `globals.css`
5. If it outputs HSL: either leave as-is (Tailwind v4 supports HSL) or convert at [oklch.com](https://oklch.com)

### Option B — Figma Tokens Plugin → CSS *(for design system teams)*

1. Define all color tokens in Figma using the same semantic names (`--primary`, `--background`, etc.)
2. Export via [Tokens Studio](https://tokens.studio/) as `tokens.json`
3. Run [Style Dictionary](https://amzn.github.io/style-dictionary/) to transform → CSS custom properties
4. Paste into `:root` and `.dark` blocks

### Option C — Single-hue script *(fast brand color swap)*

Write a small script that takes a brand hue and outputs all tokens:

```ts
// scripts/generate-theme.ts
const brandHue = 220  // blue

console.log(`
:root {
  --primary: oklch(0.2 0.01 ${brandHue});
  --ring: oklch(0.55 0.22 ${brandHue});
  --chart-1: oklch(0.65 0.18 ${brandHue});
}
`)
```

This gives you a one-variable approach to full theme shifts.

### Option D — Multiple named themes via data attributes

```css
:root, [data-theme="default"] { --primary: oklch(0.2 0 0); }
[data-theme="ocean"]          { --primary: oklch(0.35 0.15 220); }
.dark[data-theme="ocean"]     { --primary: oklch(0.75 0.12 220); }
```

Apply via `<html data-theme="ocean">`. No Tailwind config changes needed.

---

## Key Constraint

In Tailwind v4, `@apply` in `@layer components` **cannot reference other component classes**:

```css
/* ❌ CssSyntaxError */
.card-interactive { @apply card shadow-sm; }

/* ✅ Inline the utilities instead */
.card-interactive { @apply rounded-lg border border-border bg-card shadow-sm; }
```
