# AI_CONTEXT.md — Start Here

> **For AI agents and new contributors:** read this file before touching any code.
> Order: **`AGENTS.md` → `AI_CONTEXT.md` → `UI_STYLE_GUIDE.md` → the specific files you will edit.**
> If this file and the code disagree, the code is the truth — then **update this file in the same commit**.

Project: **Aplikasi Manajemen Absensi Praktikum** (Expo SDK 58 + Expo Router + React Native + TypeScript).
State: Sprint 2 — all data is **mock/in-memory**; Firebase is not installed yet.

---

## 1. What exists, in one paragraph

The app is split into two role modules behind a role picker (`/`):

- **`/asprak`** — Asisten Praktikum: class CRUD, participant management, schedule CRUD, open/close session, live attendance monitoring, recap, permit (izin) review with AI classification display.
- **`/praktikan`** — Praktikan: own session list, check-in with validation, personal attendance history.

Both modules read **one shared store** (`src/services`). A praktikan check-in is immediately visible in the Asprak screens without reload (FR-15).

---

## 2. Hard rules (violating these breaks the app)

1. **Never call mock storage directly.** UI → `dataService` (`src/services/index.ts`) or `useAppData()`. Only the adapter (`src/services/mock`) touches state.
2. **Never create new domain types.** Everything comes from `src/types/domain.ts`. There is no other type source (the old `src/types/session.ts` shim was deleted).
3. **Business rules live in the data layer**, not screens: session status transitions, double check-in prevention, delete cascades, duplicate NIM. See §7.
4. **All mutations are `async` and return `MutationResult`** (`{ ok: true } | { ok: false, reason }`). `reason` is Indonesian text ready for `FeedbackBanner`.
5. **Never hardcode hex colours.** Use `useTheme()` / `ThemedView` / `ThemedText` / `Card` / `Palette`. The app is dark-only (Eclipse & Moss); see `UI_STYLE_GUIDE.md`.
6. **Routes are file-based.** A new screen = a new file under `src/app/`. Do not add manual route registries, and never create `ios/` or `android/` folders.
7. **Current user identity is mocked** in `src/data/current-user.ts`. When auth lands, that file is replaced — not the screens.
8. **Typed routes are intentionally disabled** (`app.json` → `experiments.typedRoutes: false`; `tsconfig.json` does not include `.expo/types`). The Windows dev-server watcher used to regenerate a polluted `router.d.ts` (non-route files added as routes, `/asprak` dropped), randomly breaking `tsc`. Use the route table in §8; navigate with plain strings or object form:
   ```ts
   router.push('/asprak/kelas/baru');
   router.push({ pathname: '/asprak/session/[id]', params: { id } });
   ```
   `npx tsc --noEmit` + `npx expo lint` must pass before you say "done".

---

## 3. Architecture map

```
src/
  app/                     Expo Router routes ONLY (thin files)
    _layout.tsx            Root Stack + theme provider + splash
    index.tsx              Role picker (temporary; later = redirect by auth role)
    asprak/
      _layout.tsx          Stack for the Asprak module
      (tabs)/_layout.tsx   Tabs: Jadwal · Kelas · Rekap · Izin  (sidebar on wide screens)
      (tabs)/index.tsx     Jadwal          FR-07/FR-09
      (tabs)/kelas.tsx     Daftar kelas    FR-05
      (tabs)/rekap.tsx     Rekap kehadiran FR-13
      (tabs)/izin.tsx      Daftar izin     FR-19
      kelas/baru.tsx       Form kelas baru FR-05
      kelas/[id].tsx       Detail/edit kelas + peserta FR-05/FR-06
      session/baru.tsx     Form jadwal    FR-07
      session/[id].tsx     Detail sesi, buka/tutup/ubah/hapus FR-08/FR-12/FR-13
      izin/[id].tsx        Detail izin + terima/tolak FR-19/FR-20
    praktikan/
      _layout.tsx          Stack for the Praktikan module
      (tabs)/_layout.tsx   Tabs: Sesi · Riwayat
      (tabs)/index.tsx     Daftar sesi     FR-07/FR-09
      (tabs)/riwayat.tsx   Riwayat hadir   FR-14
      session/[id].tsx     Detail + presensi FR-10/FR-11
  components/              Reusable UI primitives (themed, no business logic)
  constants/theme.ts       Palette + Colors.light/Colors.dark + Spacing
  constants/labels.ts      All enum → Indonesian label maps
  data/current-user.ts     Mocked logged-in identities (swap point for auth)
  data/seed.ts             Demo data for the mock adapter ONLY
  features/asprak/         Shared forms: ClassForm, SessionForm
  features/praktikan/      Screen bodies for the Praktikan module
  services/
    index.ts               dataService singleton + useAppData()  ← swap point
    types.ts               DataService contract + input types
    validation.ts          Pure form validation (FR-23)
    selectors.ts           Derived data (attendance summary, overview)
    mock/                  In-memory adapter (state + subscribe)
  types/domain.ts          CANONICAL domain model
  utils/                   formatClock (HH:MM), formatDate/formatDateTime, date-label (day/date label ↔ Date)
```

Repo-root files:

- `types/css.d.ts` — type declarations for CSS imports (project-owned, because `expo-env.d.ts` is generated/deleted by Expo).
- `AI_CONTEXT.md`, `AGENTS.md`, `UI_STYLE_GUIDE.md` — documentation.

Layering (never skip a layer):

```
Route file (thin) → feature screen → useAppData()/dataService → services/mock → data/seed
```

---

## 4. Canonical data model

File: `src/types/domain.ts`. Read it — field comments are the spec. Summary:

| Type | Key fields | Notes |
|---|---|---|
| `PracticumClass` | `id, courseName, code, classGroup, room, asprakName, description?, createdAt, participants[]` | Class owns its roster. |
| `Participant` | `id, classId, name, nim` | `id` is the stable person id across sessions. |
| `SessionParticipant` | Participant + `checkInAt?` | `checkInAt` **is** the attendance record (`"08:12"`). |
| `PracticumSession` | `id, classId, courseName, classGroup, room, dayLabel, dateLabel, startTime, endTime, asprakName, status, openedAt?, closedAt?, closingNote?, participants[]` | Denormalized class info for cheap rendering. |
| `Permit` | `id, sessionId, classId, participantId, participantName, nim, courseName, reason, submittedAt, aiCategory, aiConfidence, aiModel?, status, decidedAt?, decidedBy?, decisionNote?` | AI fields are filled by the Backend module (FR-17/18). |
| `AppData` | `{ classes, sessions, permits }` | Whole app state snapshot. |
| `Laboratory` | `id, name, code, building, latitude, longitude, radius, capacity?, description?, updatedAt, updatedBy` | Sprint 3. Radius 15–200 m (default 50). Collection `laboratories`; **not** part of `AppData` — read via `useLaboratories()`. |
| `GeofenceCoordinate` / `GeofenceValidationResult` | `{latitude, longitude}` / `{distanceMeters, isWithinRadius, accuracy, isMocked}` | Sprint 3 contract (SRS §10.2). |
| `PracticumSession.laboratoryId?` | optional | Links a session to a lab (FR-31). Falls back to matching `room` text when absent. |

Enums (values are Indonesian; **never invent new ones** without updating `constants/labels.ts`, badges, and this file):

```ts
SessionStatus = 'belum-dibuka' | 'berlangsung' | 'selesai'
PermitStatus  = 'menunggu' | 'diterima' | 'ditolak'
PermitCategory= 'sakit' | 'acara-kampus' | 'keluarga' | 'lainnya' | 'belum-diklasifikasi'
```

**Denormalization contract** (the mock enforces it; a Firestore adapter must too):

- Creating a session copies the class roster into `session.participants`.
- Adding/removing a participant updates the class **and every session of that class**.
- Renaming a class updates `courseName` / `classGroup` on its sessions; changing `room` updates sessions that still use the old room.
- Deleting a class cascades to its sessions, attendance, and permits.
- Deleting a session cascades to its permits.
- Removing a participant cascades to their permits.

---

## 5. Data flow

```
data/seed.ts ──► services/mock/store.ts ──► services/mock/index.ts ──► services/index.ts
                 (state + subscribe)        (business rules)          dataService / useAppData
                                                                              │
                                                        ┌─────────────────────┴─────────────────────┐
                                                        ▼                                           ▼
                                              asprak screens / tabs                     praktikan screens
```

`useAppData()` uses `useSyncExternalStore`. Any mutation calls `commit(next)` → every subscriber re-renders. That is what makes cross-role updates appear "live".

---

## 6. The service contract (how to plug in Firestore)

`src/services/types.ts` defines:

```ts
interface DataService {
  getData(): AppData;                    // must be referentially stable between mutations
  subscribeData(listener: () => void): () => void;

  createClass(input): Promise<MutationResult & { id?: string }>;
  updateClass(id, input): Promise<MutationResult>;
  deleteClass(id): Promise<MutationResult>;

  addParticipant(classId, input): Promise<MutationResult>;
  removeParticipant(classId, participantId): Promise<MutationResult>;

  createSession(input): Promise<MutationResult & { id?: string }>;
  updateSession(id, input): Promise<MutationResult>;
  deleteSession(id): Promise<MutationResult>;
  openSession(id): Promise<MutationResult>;
  closeSession(id, note?): Promise<MutationResult>;

  checkIn(sessionId, participantId): Promise<MutationResult>;
  decidePermit(id, decision): Promise<MutationResult>;
}
```

**Swap procedure (no screen changes required):**

1. `npx expo install firebase` (or the Expo-recommended SDK for SDK 58 — check `https://docs.expo.dev/versions/v58.0.0/` first).
2. Create `src/services/firestore/client.ts` + `src/services/firestore/index.ts` implementing `DataService`.
3. In `src/services/index.ts` change exactly one line:
   ```ts
   export const dataService: DataService = firestoreDataService;
   ```
4. Delete/keep the mock for offline demos — but never import mock modules outside `src/services`.

Skeleton:

```ts
// src/services/firestore/index.ts
import { onSnapshot, collection, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { AppData } from '@/types/domain';
import type { DataService } from '../types';
import { db } from './client';

let cache: AppData = { classes: [], sessions: [], permits: [] };
const listeners = new Set<() => void>();

export const firestoreDataService: DataService = {
  getData: () => cache,
  subscribeData(listener) {
    listeners.add(listener);
    const unsubs = (['classes', 'sessions', 'permits'] as const).map((name) =>
      onSnapshot(collection(db, name), (snap) => {
        cache = { ...cache, [name]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) } as AppData;
        listeners.forEach((l) => l());
      }),
    );
    return () => { listeners.delete(listener); unsubs.forEach((u) => u()); };
  },
  async createClass(input) { /* validate → addDoc → { ok: true, id } */ },
  // ...remaining methods, mirroring the rules in §7
};
```

Recommended Firestore layout (keep names identical to the domain types):

| Collection | Document |
|---|---|
| `classes` | `PracticumClass` with `participants: Participant[]` (array keeps the demo simple; a `classes/{id}/participants` subcollection is fine if every read is batched consistently) |
| `sessions` | `PracticumSession` with `participants: SessionParticipant[]` |
| `permits` | `Permit` |

Rules for the adapter author:

- Keep `getData()` returning the **same object reference** until a change arrives (React requirement).
- Cascade operations are multi-document writes → use `writeBatch`/transactions.
- Map errors to `{ ok: false, reason: '<pesan Indonesia>' }`; never throw raw Firebase errors into screens.
- Realtime requirement FR-15 is satisfied by `onSnapshot` in `subscribeData`.
- Security rules are owned by the Backend module (FR-04/FR-22).

**Identity hook:** `src/data/current-user.ts` still exports `CURRENT_ASPRAK_NAME` and `CURRENT_PRACTIKAN_ID` for legacy/mock code. Live identity comes from Firebase Auth via `useCurrentPraktikan()` (`userProfile.uid/name/nim`). **Auth `uid` is not a roster key:** `Participant.id` is a per-class roster id (`p1`, `par-…`), so praktikan lookups must match the roster by **NIM** (`sessionsForParticipant(..., nim)`, `findSessionParticipant(..., nim)`, `findParticipantByNim`). Never match roster rows by `uid`.

---

## 7. Business rules that must be preserved

Implemented in `src/services/mock/index.ts`; replicate them in any new adapter.

| Rule | Where | Message/behaviour |
|---|---|---|
| Only `belum-dibuka → berlangsung` | `openSession` | else "Hanya sesi yang belum dibuka yang dapat dibuka." |
| Only `berlangsung → selesai` | `closeSession` | closing note optional, max 160 chars in UI |
| Check-in blocked when `belum-dibuka` / `selesai` | `checkIn` | FR-11 / FR-22 |
| Check-in blocked when already checked in | `checkIn` | "Presensi untuk sesi ini sudah tercatat." |
| Only enrolled participants can check in | `checkIn` | "Anda tidak terdaftar pada sesi ini." |
| Permit decision only while `menunggu` | `decidePermit` | prevents double decision |
| Duplicate NIM rejected per class | `addParticipant` | "NIM tersebut sudah terdaftar di kelas ini." |
| Class delete cascades sessions + permits | `deleteClass` | UI warns before calling |
| Session delete cascades permits | `deleteSession` | UI warns before calling |
| Form validation | `services/validation.ts` | `ClassInput`, `ParticipantInput`, `SessionInput` |

---

## 8. Routes

| URL | Screen | Module |
|---|---|---|
| `/` | Role picker | shared |
| `/asprak` | Jadwal (tabs root) | Asprak |
| `/asprak/kelas` | Daftar kelas | Asprak |
| `/asprak/kelas/baru` | Kelas baru | Asprak |
| `/asprak/kelas/:id` | Detail/edit kelas + peserta | Asprak |
| `/asprak/session/baru` | Jadwal baru | Asprak |
| `/asprak/session/:id` | Detail sesi (buka/tutup/ubah/hapus, kehadiran, rekap) | Asprak |
| `/asprak/rekap` | Rekap kehadiran | Asprak |
| `/asprak/izin` | Daftar pengajuan izin | Asprak |
| `/asprak/izin/:id` | Detail izin + keputusan | Asprak |
| `/asprak/lab` | Daftar laboratorium & radius (tab "Lab") — FR-29 | Asprak |
| `/asprak/lab/baru` | Lab baru | Asprak |
| `/asprak/lab/:id` | Edit koordinat/radius, hapus lab | Asprak |
| `/maps` | Peta lab interaktif — FR-30/31 (`(shared)` group, web = placeholder) | shared |
| `/praktikan` | Daftar sesi | Praktikan |
| `/praktikan/riwayat` | Riwayat kehadiran | Praktikan |
| `/praktikan/session/:id` | Detail sesi + presensi | Praktikan |
| `/praktikan/maps-tab` | Tab "Peta Lab" (layar peta yang sama dengan `/maps`) | Praktikan |

Navigation notes:

- Each module is `Stack → (tabs)`, so detail screens push **over** the tab bar and get a back button.
- On screens ≥ 900 px wide the tab bar becomes a left sidebar (`tabBarPosition: 'left'`).
- `(tabs)` is a route group: it does not appear in the URL.
- Typed routes are off (§2 rule 8). Prefer object form for dynamic routes: `router.push({ pathname: '/asprak/session/[id]', params: { id } })` — it survives even if typed routes are re-enabled later.

---

## 9. UI conventions

Source of truth: `UI_STYLE_GUIDE.md`. The visual language is **Eclipse & Moss** (dark-only), sourced from `stitch_praktikum_absensi_ui_redesign/`. Short version:

- Canvas: `#272757` (`background`), text `#FFFFE3` (`text`). Cream cards `#FFFFE3` (`backgroundElement`) with text `onSurface` `#4A4A4A`.
- Backgrounds: `ThemedView type="background | backgroundElement | surfaceAlt | highlight"`. Use `Card` for the cream card pattern.
- Text: `ThemedText` with the design scale (`display`, `displayMobile`, `headlineLg`, `headlineMd`, `titleMd`, `bodyMd`, `bodySm`, `labelLg`, `labelSm`, `monoSm`; legacy `default/small/smallBold/subtitle/code` aliases still work). Match the `themeColor` to the surface: `text` on the canvas, `onSurface` on cream.
- Fonts: Red Hat Display (display), Commissioner (body/label), Spline Sans Mono (NIM/time), loaded in `src/app/_layout.tsx`.
- Buttons: `ActionButton` with `tone="primary | secondary | danger"` — no custom buttons.
- Forms: `FormField` (label + error + themed text input), `SelectField` (dropdown bottom sheet for single choice), `DateTimeField` (native calendar/clock picker via `@expo/ui`; text-input fallback on web).
- Page wrapper: `ScreenScroll` (responsive padding + max width).
- Empty lists: `EmptyState` (title, hint, optional action).
- Status/permit/category pills: `SessionStatusBadge`, `PermitStatusBadge`, `PermitCategoryBadge`, `AttendanceBadge` from `components/status-badge.tsx`.
- Feedback after an action: `FeedbackBanner` with `{ tone: 'success' | 'error', message }`.
- Confirmations/destructive flows: `BottomSheetModal` (cream sheet).
- Text is Indonesian; code identifiers are English.

---

## 10. Recipes

**Add a screen**
1. Create the route file under the correct module folder (e.g. `src/app/asprak/foo.tsx`).
2. If it is a pushed detail screen, export it from the module Stack (`src/app/asprak/_layout.tsx`) — or just let file-based routing pick it up, then add a `Stack.Screen` entry for the title.
3. Build the body with `ScreenScroll` + primitives. Read data via `useAppData()`; mutate via `dataService`.
4. Add the route to §8 of this file, then run `npx tsc --noEmit` and `npx expo lint`.

**Add a field to a domain type**
1. `src/types/domain.ts` (with a comment).
2. `src/data/seed.ts` (demo value).
3. The relevant mutation in `src/services/mock/index.ts` (input type in `src/services/types.ts` if user-provided).
4. The form (`features/*`) and the display screen.
5. This file (§4).

**Add a mutation**
1. Extend `DataService` in `src/services/types.ts`.
2. Implement in `src/services/mock/index.ts` — validate first, return `MutationResult` with Indonesian reasons.
3. Call it from a screen with `await`; show `FeedbackBanner` for both outcomes.
4. Document in §7 if it encodes a rule.

**Add a permit decision category/status**
Update `src/types/domain.ts` → `src/constants/labels.ts` → `src/components/status-badge.tsx` → screens that filter by status.

---

## 11. Verification (required before "done")

```bash
npx tsc --noEmit     # types (deterministic; typed routes are off)
npx expo lint        # eslint
npx expo export --platform web   # optional: catches bundling/SSR errors
```

Manual smoke test (web is fastest):

```bash
npx expo start --web
# /, /asprak, /asprak/kelas, /asprak/rekap, /asprak/izin,
# /asprak/session/ses-mobile-2, /praktikan, /praktikan/riwayat
```

Check: light **and** dark mode, phone width (< 600) and desktop width (≥ 900), and that a praktikan check-in appears in the Asprak recap without reload.

---

## 12. Requirement coverage (scram2.md ownership)

| Owner | FRs | Status in this repo |
|---|---|---|
| **Laurensius Brian Prayoga** | FR-01–04, FR-15, FR-17–18, FR-23–24 | ❌ not started: no Firebase, no auth, no AI API. Contract placeholders exist. |
| **Johan Reinhart Calvin** | FR-05–09, FR-12–13, FR-19–20 | ✅ implemented on mock data (see §2 of this file). FR-15 realtime is simulated. |
| **Aswalila Adha Putri Telaumbanua** | FR-07, FR-09–11, FR-14, FR-16, FR-21–22, FR-25–26 | ✅/⚠️ FR-07/09–11/14/22/25/26 implemented; ❌ FR-16 (form izin praktikan) and FR-21 (praktikan sees permit status) still missing — the `Permit` data model is ready. |

Coverage details:

| FR | Where |
|---|---|
| FR-05 | `/asprak/kelas*`, `dataService.createClass/updateClass/deleteClass` |
| FR-06 | `/asprak/kelas/:id` participant section, `addParticipant/removeParticipant` |
| FR-07 | `/asprak/session/baru`, `/asprak/session/:id` edit; praktikan list reads the same sessions |
| FR-08 | `/asprak/session/:id` (open/close/edit/delete) |
| FR-09 | class/session info blocks + role-based routes |
| FR-10/11 | `/praktikan/session/:id`, `checkIn` |
| FR-12/13 | `/asprak/session/:id` + `/asprak/rekap` |
| FR-14 | `/praktikan/riwayat` |
| FR-19/20 | `/asprak/izin`, `/asprak/izin/:id`, `decidePermit` |
| FR-22 | guards inside `services/mock/index.ts` |
| FR-23 | `services/validation.ts` + `FormField` |
| FR-26 | `FeedbackBanner` on every mutation |

---

## 13. Known gaps / next steps

1. **Firebase** (Brian): auth screens, role-based redirect at `/`, Firestore adapter, security rules, AI classification call writing `aiCategory/aiConfidence/aiModel`.
2. **FR-16 / FR-21** (Aswa): praktikan permit form + status list. Model and services already exist; only UI + one mutation (`createPermit`) is missing.
3. **Persistence of permissions/decisions for praktikan**: after `decidePermit`, the praktikan side has no screen yet (FR-21).
4. **Identity**: `/` role picker is demo-only; replace with an auth-based redirect.
5. **Seed data** is intentional demo content; do not treat it as production data.
6. **No tests yet.** If you add tests, cover `services/validation.ts`, `services/selectors.ts`, and `services/mock` rules first.

---

## 14. Gotchas

- **Typed routes** → deliberately disabled. Do **not** re-enable `experiments.typedRoutes` without testing on Windows: the dev-server watcher writes non-route files into `.expo/types/router.d.ts` and drops real routes, making `tsc` fail for reasons unrelated to your change. The route table in §8 is the contract. If you must re-enable, add `.expo/types/**/*.ts` back to `tsconfig.json` only after confirming the generated file is clean.
- **`expo-env.d.ts` is generated and gitignored.** Expo deletes it when typed routes are off. CSS type declarations therefore live in the tracked `types/css.d.ts`; do not move them into a generated file.
- **Expo may rewrite `tsconfig.json#include`.** Keep project-owned declarations under `types/` so they are picked up by `**/*.ts`.
- **Web dev SSR, first request only** → with `web.output: "server"`, the *first* request to a freshly compiled route (`/asprak`, `/asprak/kelas`) can log `SSR streaming render error: … Stack overflow` and fall back to client rendering. Reload the page once; subsequent requests render normally. This is a Metro dev-server artifact, not app logic — do not chase it.
- **`useSyncExternalStore` infinite loop** → `getData()` must not return a new object each call. Mutations replace the state object; reads return the cached one.
- **Two sources of truth** — do not reintroduce a second store (the old `features/praktikan/store.ts` was deleted for this reason).
- **Denormalized fields** — if you change `class.courseName`, sessions must be updated too (see §4).
- **Do not import `src/data/seed.ts` outside `src/services/mock`.**
- **`session.participants[].checkInAt` is the attendance truth**; there is no separate attendance collection.
- **Screens must not compute rules** (e.g. "can check in?"). They may compute presentation only.
- **`@expo/ui` is Android/iOS only.** `@expo/ui/community/datetime-picker` renders nothing on web, so `DateTimeField` falls back to a text input there. Do not import `@expo/ui/swift-ui` or `@expo/ui/jetpack-compose` in shared code.
- **Windows dev**: commands are run in PowerShell; the repo is `LF`-based (git may warn about CRLF). Do not commit lockfile-only churn.

---

## 15. Sprint 3 — Laboratorium, Peta & Geofencing (owner: JH)

Files (all JH-owned): `utils/haversine.ts`, `services/geofence-calculator.ts`, `services/laboratory.ts` (+ `laboratory-contract.ts`, `mock/laboratory-mock.ts`, `data/seed-labs.ts`), `services/lab-activity.ts` (+ `lab-activity-selectors.ts`), `hooks/use-user-location.ts`, `components/maps/*`, `features/maps/lab-map-screen(.web).tsx`, `features/asprak/lab-form.tsx`, routes in §8.

Rules:

- Laboratories are **a separate service**, not part of `DataService`/`AppData`. Screens use `useLaboratories()` / `useLaboratory(id)` to read and `laboratoryService` to write. Never import `./mock/laboratory-mock` or `@/data/seed-labs` from a screen.
- Geofence math lives only in `utils/haversine.ts`; consumers (HF) import `geofenceCalculator` / `calculateDistanceHaversine` from `@/services/geofence-calculator`. Do not re-implement distance elsewhere.
- Maps code imports `react-native-maps`, which is **native only**. Anything that imports it must be reachable only from a file that has a `.web.tsx` sibling (see `features/maps/lab-map-screen.web.tsx`).
- Live tracking is foreground-only and stops on blur/unmount (`useUserLocation`). Until `DevicePermissionService` (YG-02) lands, permissions go through the single `permissionGateway` object inside `hooks/use-user-location.ts` — swap that block, nothing else.
- `LabActivitySheet` reads sessions only; it must never write to sessions or attendance.
- Tests: `npm test` (jest-expo). Test files import globals from `@jest/globals` because TypeScript 6 no longer auto-loads `@types/*`.
