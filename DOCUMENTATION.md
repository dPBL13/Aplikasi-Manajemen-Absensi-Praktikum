# Codebase Guide — Aplikasi Manajemen Absensi Praktikum

This document explains how the app is put together and where to go when you want to change something.

> Scope of the current implementation: **Sprint 1, Asprak module (FR-01 – FR-06)** plus the
> shared interaction layer (FR-11 – FR-15), using dummy, in-memory data.
> Fitur Praktikan (FR-07 – FR-09) dan pergantian perspektif/identitas (FR-10) belum diimplementasikan
> karena merupakan bagian programmer lain.

---

## 1. Tech stack

| Layer | Technology |
|---|---|
| App framework | Expo SDK 58 (`expo ~58.0.16`) |
| UI runtime | React Native 0.88, React 19.3 |
| Routing | Expo Router (file-based routing) |
| Language | TypeScript (strict mode) |
| State | React Context + `useState` (no backend, no persistence) |
| Web | React Native Web (`app.json → web.output: "server"`) |

---

## 2. Quick start

```bash
# from the repo root
npm install

# start the dev server (press "w" for web, "a" for Android, "i" for iOS)
npx expo start

# checks before committing
npx tsc --noEmit     # typecheck
npx expo lint        # lint (or `npx eslint .` if expo lint acts up)
```

---

## 3. Project map

```
Aplikasi-Manajemen-Absensi-Praktikum/
├── app.json                  Expo config (app name, icons, splash, plugins)
├── eas.json                  EAS build profiles
├── package.json              Dependencies and scripts
├── tsconfig.json             TypeScript config, "@/*" path alias → "./src/*"
├── AGENTS.md                 Instructions for AI agents working on this repo
├── README.md                 Project overview + SRS (FR/NFR/BF tables)
├── DOCUMENTATION.md          ← this file
└── src/
    ├── app/                  ROUTES — every file here is a screen
    │   ├── _layout.tsx       Root Stack + ThemeProvider + SessionProvider
    │   ├── index.tsx         Jadwal Asprak                (FR-01)
    │   └── session/
    │       └── [id].tsx      Detail sesi + aksi + rekap    (FR-02 – FR-06)
    │
    ├── components/           Reusable UI (non-route code)
    │   ├── session-card.tsx  Card in the schedule list
    │   ├── status-badge.tsx  Session & attendance status pills
    │   ├── action-button.tsx Primary / danger / secondary button
    │   ├── bottom-sheet-modal.tsx  Responsive Modal / bottom sheet
    │   ├── feedback-banner.tsx     Success & error feedback
    │   ├── info-row.tsx            Label–value row
    │   ├── participant-detail-modal.tsx  Attendance detail sheet
    │   ├── themed-text.tsx   Text that follows light/dark theme
    │   ├── themed-view.tsx   View that follows light/dark theme
    │   ├── animated-icon.*   Splash animation (used by _layout)
    │   ├── external-link.tsx ─┐
    │   ├── hint-row.tsx       ├─ leftovers from the Expo starter template,
    │   ├── web-badge.tsx      │  currently unused but harmless
    │   └── ui/collapsible.tsx ┘
    │
    ├── constants/
    │   └── theme.ts          Colors, spacing, fonts, max content width
    │
    ├── context/
    │   └── session-context.tsx   Session state + openSession/closeSession
    │
    ├── data/
    │   └── sessions.ts       Dummy sessions and participants
    │
    ├── hooks/
    │   ├── use-theme.ts          Returns colors for current color scheme
    │   ├── use-color-scheme.ts   Native color scheme
    │   └── use-color-scheme.web.ts  Web hydration-safe color scheme
    │
    ├── types/
    │   └── session.ts        SessionStatus, Participant, PracticumSession
    │
    ├── utils/
    │   └── format-clock.ts   Local "HH:MM" formatter
    │
    └── global.css            Web font variables
```

### Architecture at a glance

```
_layout.tsx
 └── ThemeProvider (light/dark)
      └── SessionProvider (holds all sessions in memory)
           └── Stack
                ├── index.tsx            ← list of sessions
                └── session/[id].tsx     ← detail of one session
                        ▲
                        └── router.push("/session/<id>")
```

Data flow:

```
src/data/sessions.ts  ──►  SessionProvider  ──►  screens
   (initial dummy data)      (state + actions)     (read & mutate via useSessions())
```

---

## 4. "I want to change…" — change map

| I want to… | Go to |
|---|---|
| Change / add dummy practicum sessions | `src/data/sessions.ts` |
| Change a field stored on a session (e.g. add lecturer) | `src/types/session.ts` → `src/data/sessions.ts` → the screen that renders it |
| Change status labels or badge colors | `src/components/status-badge.tsx` (`SESSION_STATUS_META`) |
| Change the rules for opening/closing a session | `src/context/session-context.tsx` (`openSession`, `closeSession`) |
| Change the search / status filter form | `src/app/index.tsx` (`query`, `statusFilter`, `STATUS_OPTIONS`) |
| Change how the schedule list looks | `src/app/index.tsx` and `src/components/session-card.tsx` |
| Change the detail page layout/sections | `src/app/session/[id].tsx` |
| Change the open/close confirmation sheet | `src/app/session/[id].tsx` (`BottomSheetModal`) + `src/components/bottom-sheet-modal.tsx` |
| Change the participant detail sheet | `src/components/participant-detail-modal.tsx` |
| Change what the attendance recap shows | `src/app/session/[id].tsx` (search for `Rekap Presensi`) |
| Change feedback styling / duration | `src/components/feedback-banner.tsx` and the `useEffect` in `src/app/session/[id].tsx` |
| Change the header title | `src/app/_layout.tsx` (`Stack.Screen options`) and `src/app/session/[id].tsx` (`Stack.Screen`) |
| Change app name, icon, splash, scheme | `app.json` + `assets/images/` |
| Change colors / spacing / fonts | `src/constants/theme.ts` |
| Add a new screen | Create `src/app/<name>.tsx`, register it in `src/app/_layout.tsx` (`<Stack.Screen name="<name>" />`), then navigate with `router.push('/<name>')` |
| Implement real Praktikan presensi (FR-08) | Add an action to `src/context/session-context.tsx`, then call it from the Praktikan screen — the Asprak screens update automatically |
| Add Asprak/Praktikan perspective switching (FR-10) | Extend `src/context/session-context.tsx` with a `role` state and branch in `_layout.tsx` / screens |
| Replace the in-memory state with an API/database | `src/context/session-context.tsx` is the single seam — swap `useState` for data fetching there |
| Change success/failure feedback (FR-12) | `src/app/session/[id].tsx` (`feedback` state + `handleOpenSession` / `handleCloseSession`) |

---

## 5. Data model

Defined in `src/types/session.ts`:

```ts
export type SessionStatus = 'belum-dibuka' | 'berlangsung' | 'selesai';

export interface Participant {
  id: string;
  name: string;
  nim: string;
  checkInAt?: string; // "08:12" — only present if the participant attended
}

export interface PracticumSession {
  id: string;
  courseName: string;
  classGroup: string;
  room: string;
  dayLabel: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  asprakName: string;
  status: SessionStatus;
  openedAt?: string; // "08:00" — diisi otomatis saat sesi dibuka
  closedAt?: string; // "10:02" — diisi otomatis saat sesi ditutup
  closingNote?: string; // catatan opsional dari form penutupan sesi
  participants: Participant[];
}
```

`src/data/sessions.ts` exports:

- `CURRENT_ASPRAK_NAME` — the Asprak shown on the schedule header.
- `dummySessions: PracticumSession[]` — 3 sessions:
  - `sesi-mobile-a` — **berlangsung**, `openedAt: "08:00"`, some participants already checked in
  - `sesi-basisdata-b` — **belum-dibuka**, nobody checked in
  - `sesi-strukturdata-c` — **selesai**, `openedAt`/`closedAt`/`closingNote` terisi, almost everyone checked in

To add a session, append an object to `dummySessions`; the list screen picks it up automatically.

---

## 6. State management

`src/context/session-context.tsx` owns all runtime state.

```ts
const { sessions, getSession, openSession, closeSession } = useSessions();
```

| Value | Purpose |
|---|---|
| `sessions` | All sessions (initialized from `dummySessions`) |
| `getSession(id)` | Find one session by id |
| `openSession(id)` | `belum-dibuka` → `berlangsung`, mencatat `openedAt`; returns `false` if the transition is invalid |
| `closeSession(id, note?)` | `berlangsung` → `selesai`, mencatat `closedAt` + `closingNote`; returns `false` if the transition is invalid |

`SessionProvider` is mounted in `src/app/_layout.tsx`, above the `Stack`, so every screen shares the same state.

> **Sprint 1 limitation:** state lives in memory only. Reloading the app resets everything back to `dummySessions`.

---

## 7. Routing

Expo Router uses the file system:

| File | URL / route | Screen |
|---|---|---|
| `src/app/index.tsx` | `/` | Jadwal Asprak |
| `src/app/session/[id].tsx` | `/session/<id>` | Detail sesi |

`src/app/_layout.tsx` defines the navigator:

```tsx
<Stack>
  <Stack.Screen name="index" options={{ title: 'Jadwal Praktikum' }} />
  <Stack.Screen name="session/[id]" options={{ title: 'Detail Sesi' }} />
</Stack>
```

Navigation from the list:

```tsx
router.push(`/session/${item.id}`);
```

> `app.json` enables `experiments.typedRoutes`. Expo generates route types in `.expo/types/` (gitignored) when you run the dev server/export.

---

## 8. Screen walkthrough

### 8.1 `src/app/_layout.tsx` — app shell

1. Prevents the splash screen from hiding immediately (`SplashScreen.preventAutoHideAsync()`).
2. Wraps everything in `ThemeProvider` (light/dark).
3. Mounts `SessionProvider`.
4. Renders the root `Stack` with two routes.

### 8.2 `src/app/index.tsx` — Jadwal Asprak (FR-01)

- Reads `sessions` from `useSessions()`.
- Header shows `Asprak · <name>` plus a **form** for searching and filtering by status.
- Renders a `FlatList` of `SessionCard`; on wide screens the list becomes two columns.
- Empty states: no assigned sessions, or no sessions matching the current filters (with a reset button).
- Tapping a card navigates to `/session/<id>`.

### 8.3 `src/app/session/[id].tsx` — Detail Sesi (FR-02 – FR-06)

Reads the `id` route param, then renders, top to bottom:

1. **Info card (FR-02)** — course, status badge, class, room, day, date, time, asprak, plus `Dibuka`/`Ditutup`/`Catatan penutupan` when available.
2. **Feedback banner (FR-12)** — success/error message with dismiss button and 5-second auto-hide.
3. **Aksi Sesi (FR-03 / FR-06)** — conditional on status:
   - `belum-dibuka` → **Buka Sesi** opens a confirmation sheet
   - `berlangsung` → **Tutup Sesi** opens a confirmation sheet with an optional closing-note form
   - `selesai` → explanatory text, no action
4. **Pemantauan Kehadiran (FR-04)** — every participant with a Hadir / Belum Hadir badge, check-in time, and an `X/Y hadir` counter. Tapping a participant opens the attendance detail sheet.
5. **Rekap Presensi (FR-05)** — only attended participants, each with their `checkInAt` time, plus a summary and absent count.
6. **Participant detail sheet** — name, NIM, attendance status, check-in time, and session context.

On wide screens, the monitoring and recap cards sit side by side; on mobile they stack.

Useful locals in this file:

```ts
const attendedParticipants = session.participants.filter((p) => p.checkInAt);
const absentCount = session.participants.length - attendedParticipants.length;
```

---

## 9. Requirement coverage

| Code | Requirement | Where |
|---|---|---|
| FR-01 | Jadwal Asprak | `src/app/index.tsx` + `src/data/sessions.ts` |
| FR-02 | Detail Sesi | `src/app/session/[id].tsx` (info card) |
| FR-03 | Membuka Sesi | `src/app/session/[id].tsx` + `openSession` in `session-context.tsx` |
| FR-04 | Pemantauan Kehadiran | `src/app/session/[id].tsx` (monitoring section + participant sheet) |
| FR-05 | Rekap Presensi | `src/app/session/[id].tsx` (recap section) |
| FR-06 | Menutup Sesi | `src/app/session/[id].tsx` + `closeSession` in `session-context.tsx` |
| FR-11 | Validasi Tindakan | Status guards di `session-context.tsx`; tombol hanya muncul pada status yang valid |
| FR-12 | Umpan Balik | `src/components/feedback-banner.tsx` + `feedback` state di detail |
| FR-13 | Navigasi | Expo Router Stack; kartu jadwal → detail → back |
| FR-14 | Tampilan Responsif | `useWindowDimensions` di `index.tsx`, `[id].tsx`, `bottom-sheet-modal.tsx` |
| FR-15 | Data Dummy & Kondisi Kosong | `src/data/sessions.ts`; empty state daftar, filter, rekap, dan peserta |
| — | FR-07 – FR-10 | Belum diimplementasikan (modul Praktikan & pergantian perspektif) |

---

## 10. UI conventions

- **Light/dark theme:** use `ThemedText` and `ThemedView` instead of raw `Text`/`View` when a surface or text color should follow the theme. Raw `View` is fine for layout-only wrappers.
- **Spacing:** use `Spacing` from `src/constants/theme.ts` (`Spacing.one` = 4, `two` = 8, `three` = 16, `four` = 24, …).
- **Max width:** `MaxContentWidth` (800) keeps content readable on web.
- **Responsive:** `useWindowDimensions` controls padding, two-column layouts, and whether `BottomSheetModal` renders as a bottom sheet or a centered dialog.
- **Buttons:** use `ActionButton` (`primary` / `danger` / `secondary`) instead of ad-hoc `Pressable` styling.
- **Dialogs:** use `BottomSheetModal` for confirmations and supporting information; it works on native and web.
- **Routes vs components:** anything inside `src/app/` becomes a route. Put shared code in `src/components`, `src/context`, `src/data`, `src/hooks`, `src/types`, or `src/utils`.
- **Language:** UI copy is Indonesian; code identifiers are English.
- **Path alias:** `@/foo` means `src/foo`, `@/assets/foo` means `assets/foo`.

---

## 11. Known limitations / next steps

| Area | Current state | Next step |
|---|---|---|
| Persistence | In-memory only | Add a store/API behind `session-context.tsx` |
| Praktikan presensi | Not implemented (FR-08) | Add `checkIn(sessionId, participantId)` and a Praktikan screen |
| Perspective/identity switching | Not implemented (FR-10) | Add a `role` state and switch navigation/screens |
| Attendance data | Still seeded as dummy `checkInAt` | Wire the shared `checkIn` action to the Praktikan screen so Asprak recap updates live |
| Tests | None | Add unit tests for the context transitions |

---

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| `tsc` complains about `*.module.css` / `global.css` | `expo-env.d.ts` (gitignored, auto-generated) is missing. Run `npx expo start` once, or recreate it with `/// <reference types="expo/types" />` |
| `npx expo lint` exits with an ESLint version error | Run `npx eslint .` directly — it uses the same config |
| Route not found after adding a screen | Make sure the file is under `src/app/`, restart the dev server, and register it in `_layout.tsx` if it needs custom options |
| State resets after reload | Expected in Sprint 1 — data is in memory only |
