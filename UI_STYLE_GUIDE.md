# UI & Colour Palette Rules — Eclipse & Moss

This document is the single source of truth for visual consistency in this app. **Every agent or contributor must follow it** when adding or changing UI.

The design source is [`stitch_praktikum_absensi_ui_redesign/`](./stitch_praktikum_absensi_ui_redesign) (15 screens, one shared token block). The tokens live in [`src/constants/theme.ts`](./src/constants/theme.ts). Do not invent colors.

**The app is dark-only.** There is no light theme. `useTheme()` always returns `Colors.dark`, and `app.json` pins `userInterfaceStyle: "dark"`.

## Primitive palette

| Token | Hex | Use for |
| --- | --- | --- |
| `Palette.eclipseCanvas` | `#272757` | App / screen background |
| `Palette.eclipseDeep` | `#0F0E47` | Header, tab bar, pressed canvas |
| `Palette.eclipseMid` | `#505081` | Chips and selected controls on the dark canvas |
| `Palette.eclipseMuted` | `#8686AC` | Subtle borders |
| `Palette.mossSurface` | `#FFFFE3` | Cream cards, modal sheets |
| `Palette.mossSurfaceElevated` | `#CBCBCB` | Inputs and elevated rows inside a cream card |
| `Palette.mossCanvas` | `#CBCBCB` | Neutral badge / progress track |
| `Palette.mossPrimary` | `#586B7E` | Primary buttons, active chips, accents |
| `Palette.mossDeep` | `#4A4A4A` | Secondary button text/border, links on cream |
| `Palette.textOnDark` | `#FFFFE3` | Text on the eclipse canvas |
| `Palette.textOnDarkMuted` | `#CBCBCB` | Muted text on the eclipse canvas |
| `Palette.textPrimary` | `#4A4A4A` | Text on cream surfaces |
| `Palette.statusAlert` | `#E8C5BE` | Error / rejected / alert background |
| `Palette.onStatusAlert` | `#7A2E22` | Error / rejected / alert text |
| `Palette.alertBorder` | `#A84A3B` | Error / rejected / alert border |

## Semantic tokens (`useTheme()`)

| Theme key | Value | Where it is used |
| --- | --- | --- |
| `text` | `#FFFFE3` | Default text on the eclipse canvas |
| `textSecondary` | `#CBCBCB` | Muted text on the eclipse canvas |
| `background` | `#272757` | `ThemedView` default, screen background |
| `backgroundElement` | `#FFFFE3` | Cream cards (`Card`, `SessionCard`) |
| `backgroundSelected` | `#0F0E47` | Headers, tab bars, pressed canvas |
| `surfaceAlt` | `#CBCBCB` | Inputs, elevated rows on a cream card |
| `highlight` | `#505081` | Chips and selected controls on the dark canvas |
| `border` | `#8686AC` | Borders and dividers |
| `link` | `#FFFFE3` | Interactive text on the eclipse canvas |
| `accent` / `accentText` | `#586B7E` / `#FFFFE3` | Primary buttons |
| `accentPressed` | `#4A4A4A` | Primary button pressed state |
| `onSurface` | `#4A4A4A` | Default text on a cream card |
| `onSurfaceSecondary` | `#4A4A4A` | Muted text on a cream card |
| `onSurfaceAlt` | `#4A4A4A` | Text on `surfaceAlt` |
| `secondarySurface` / `secondaryBorder` / `secondaryText` | `#CBCBCB` / `#4A4A4A` / `#4A4A4A` | Secondary buttons |
| `success` / `successBackground` | `#2F5D46` / `#DDEBDD` | Success feedback |
| `danger` / `dangerBackground` / `dangerBorder` | `#7A2E22` / `#E8C5BE` / `#A84A3B` | Destructive actions and errors |
| `disabled` / `onDisabled` | `#CBCBCB` / `#4A4A4A` | Disabled controls |
| `overlay` | `rgba(15, 14, 71, 0.48)` | Modal scrim |

## Typography

Loaded in `src/app/_layout.tsx` with `expo-font`.

| Family token | Font | Use |
| --- | --- | --- |
| `Fonts.display` | Red Hat Display 700 | Display / headline text |
| `Fonts.displaySemiBold` | Red Hat Display 600 | Large headings where 700 is too heavy |
| `Fonts.body` | Commissioner 400 | Body copy |
| `Fonts.bodyMedium` | Commissioner 500 | Emphasis |
| `Fonts.bodySemiBold` | Commissioner 600 | Labels, titles, buttons |
| `Fonts.bodyBold` | Commissioner 700 | Strong labels |
| `Fonts.mono` | Spline Sans Mono 500 | NIM, codes, times |

Type scale (`Typography`): `displayMd` 36/42, `displayMdMobile` 28/34, `headlineLg` 24/30, `headlineMd` 20/26, `titleMd` 16/22, `bodyMd` 14/20, `bodySm` 12/17, `labelLg` 14/18, `labelSm` 11/14, `monoSm` 12/16.

## Hard rules

1. **Never hardcode a hex colour in a component.** Add a semantic key to `src/constants/theme.ts`, then read it with `useTheme()` (or `ThemedView` / `ThemedText` / `Card`).
2. **Pick the foreground that matches the surface.** `text` is for the eclipse canvas; `onSurface` is for cream cards; `onSurfaceAlt` is for `surfaceAlt` rows; `accentText` is for `accent` buttons. A cream-on-cream mistake is a bug.
3. **Use the provided primitives** instead of raw `View` / `Text` for anything visible:
   - `ThemedView` for backgrounds (`type="background" | "backgroundElement" | "surfaceAlt" | "highlight" | ...`).
   - `Card` for cream cards (padding + radius + border baked in).
   - `ThemedText` for text (`type="headlineMd" | "titleMd" | "bodyMd" | "bodySm" | "labelLg" | "labelSm" | "monoSm"`; `themeColor="text" | "onSurface" | "onSurfaceSecondary" | ...`).
   - `ActionButton` for buttons (`tone="primary" | "secondary" | "danger"`).
4. **Surface hierarchy** (outer → inner): `background` → `backgroundElement` (cream card) → `surfaceAlt` (input/elevated row). Never place two identical surfaces directly on top of each other without a border.
5. **Text contrast** must be at least WCAG AA (4.5:1). Use `text` on the canvas, `onSurface` on cream, `accentText` on `accent`, and keep `danger` text on `dangerBackground`.
6. **Buttons:** primary actions use `ActionButton` default tone (moss primary), secondary actions use `tone="secondary"`, destructive actions use `tone="danger"`. Do not create one-off button styles.
7. **Badges:** session status and attendance badges are defined in `src/components/status-badge.tsx`. Reuse them; do not build ad-hoc pills.
8. **Border radius** uses `Radius` (`sm` 8, `md` 12, `lg` 16, `xl` 20, `full` 9999).
9. **Spacing** uses the `Spacing` tokens (`one` 4, `two` 8, `md` 12, `three` 16, `section` 20, `four` 24, `five` 32). No arbitrary pixel values except hairline borders and icon sizes.
10. **No emoji.** Use words or a real icon set.
11. **Splash and OS chrome** stay on palette: `app.json` splash `backgroundColor`, the header in `src/app/_layout.tsx`, and `src/components/animated-icon.*` all use the eclipse tokens.

## Before declaring a task done

- [ ] No hardcoded hex values outside `src/constants/theme.ts`.
- [ ] Every text/background pair uses the matching `on*` token.
- [ ] Only `ThemedView` / `ThemedText` / `Card` / `ActionButton` / existing badge components were reused.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npx expo lint` passes.
