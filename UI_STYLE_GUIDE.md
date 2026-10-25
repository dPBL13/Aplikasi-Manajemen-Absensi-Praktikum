# UI & Colour Palette Rules

This document is the single source of truth for visual consistency in this app. **Every agent or contributor must follow it** when adding or changing UI.

The palette is defined in [`src/constants/theme.ts`](./src/constants/theme.ts). Do not invent colors.

## Palette

| Token | Hex | Use for |
| --- | --- | --- |
| `Palette.background` | `#87A878` | App / screen background |
| `Palette.surface` | `#C7CCB9` | Session cards, detail cards, raised surfaces |
| `Palette.button` | `#B0BC98` | Primary and additional buttons, app header, selected/close buttons |
| `Palette.mint` | `#CAE2BC` | Alternate surface: filter panel, modal sheet, success banner |
| `Palette.lime` | `#DBF9B8` | Alternate accent: search field, active chips, note input, highlight badge |
| `Palette.ink` | `#1F2A1B` | Primary text on light surfaces |
| `Palette.inkSoft` | `#3D4B34` | Secondary text, labels |
| `Palette.border` | `#6F8A5E` | Borders, dividers, handles |
| `Palette.link` | `#235C3A` | Links and interactive text |
| `Palette.danger` | `#8F2D22` | Destructive actions and error text |
| `Palette.dangerSurface` | `#F7DAD3` | Error / absent badge background |

### Light theme mapping

| Theme key | Value | Where it is used |
| --- | --- | --- |
| `background` | `#87A878` | `ThemedView` default |
| `backgroundElement` | `#C7CCB9` | Session cards, cards, secondary buttons |
| `backgroundSelected` | `#B0BC98` | Close buttons, pressed/selected surfaces |
| `surfaceAlt` | `#CAE2BC` | Filter panel, modal sheet |
| `highlight` | `#DBF9B8` | Search input, active filter chip, note input |
| `accent` / `accentText` | `#B0BC98` / `#1F2A1B` | Primary buttons |
| `link` | `#235C3A` | "Lihat detail", "Reset filter" |
| `success` / `successBackground` | `#235C3A` / `#CAE2BC` | Success feedback |
| `danger` / `dangerBackground` | `#8F2D22` / `#F7DAD3` | Destructive feedback |

Dark mode keeps the same green family with deeper tones (`background` `#3C5533`, `backgroundElement` `#557346`). `highlight` becomes `#4A6A3E` so light text keeps enough contrast.

## Hard rules

1. **Never hardcode a hex colour in a component.** Add a semantic key to `Colors.light` and `Colors.dark` in `src/constants/theme.ts`, then read it with `useTheme()` (or `ThemedView` / `ThemedText`).
   - Exception: static `Palette.*` constants are allowed only for badges/chips that must look identical in both themes (see `status-badge.tsx`).
2. **Every new theme key must exist in both `light` and `dark`.** `ThemeColor` is the intersection of the two objects; a missing key breaks types.
3. **Use the provided primitives** instead of raw `View` / `Text` for anything visible:
   - `ThemedView` for backgrounds (`type="background" | "backgroundElement" | "surfaceAlt" | "highlight" | ...`).
   - `ThemedText` for text (`themeColor="text" | "textSecondary" | "link" | ...`).
   - `ActionButton` for buttons (`tone="primary" | "secondary" | "danger"`).
4. **Surface hierarchy** (outer → inner): `background` → `backgroundElement` / `surfaceAlt` → `highlight` for inputs and active states. Never place two identical surfaces directly on top of each other without a border.
5. **Text contrast** must be at least WCAG AA (4.5:1). Use `text` on light surfaces, `accentText` on `accent`, and keep `danger` text on `dangerBackground`. Do not put white text on `#DBF9B8` or `#CAE2BC`.
6. **Alternate colours are intentional.** Rotate `mint` and `lime` across sections (filter panel, chips, badges, inputs) so the screen does not become one flat green. Do not use more than two alternating accents on a single screen.
7. **Buttons:** primary actions use `ActionButton` with the default tone (`#B0BC98`), secondary actions use `tone="secondary"`, destructive actions use `tone="danger"`. Do not create one-off button styles.
8. **Badges:** session status and attendance badges are defined in `src/components/status-badge.tsx`. Reuse them; do not build ad-hoc pills.
9. **Border radius** follows the spacing scale (`Spacing.two` = 8 for inputs/buttons, `Spacing.three` = 16 for cards, `999` for pills).
10. **Spacing** must use the `Spacing` tokens (`half`, `one`, `two`, `three`, `four`, `five`, `six`). No arbitrary pixel values except hairline borders and icon sizes.
11. **Dark mode is supported.** Check every new screen in both schemes before finishing. For light text on dark green surfaces, rely on the theme keys; never force `#fff`.
12. **Splash and OS chrome** must stay on palette: `app.json` splash `backgroundColor`, the header in `src/app/_layout.tsx`, and `src/components/animated-icon.*` all use `#87A878` / `#B0BC98`.

## Before declaring a task done

- [ ] No new hardcoded hex values outside `src/constants/theme.ts`.
- [ ] Light **and** dark mode both readable.
- [ ] Only `ThemedView` / `ThemedText` / `ActionButton` / existing badge components were reused.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npx expo lint` passes.
