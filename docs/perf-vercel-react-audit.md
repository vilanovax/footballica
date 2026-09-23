# Perf: Vercel React Best Practices — Applied Fixes

**Date:** 2026-08-09  
**Source audit:** Cursor canvas `vercel-react-best-practices-audit` (vercel-react-best-practices skill)  
**Scope:** ROI items 1–6 from that audit (waterfalls + bundle splits + Suspense)

---

## Summary

Applied the highest-ROI findings from a static audit against Vercel Engineering’s React/Next performance rules. Goal: cut authenticated TTFB on club/duel hot paths and shrink kickoff JS for duel / survival / profile / GotD arenas.

| # | Fix | Rules | Status |
|---|-----|-------|--------|
| 1 | Parallelize club snapshot reads | `async-parallel` | Done |
| 2 | Dynamic-split DuelArena mode boards | `bundle-dynamic-imports` | Done |
| 3 | Deep-import Game* (drop barrel) | `bundle-barrel-imports` | Done |
| 4 | Fix getMyDuels / getDuel waterfalls | `async-api-routes`, `async-parallel` | Done |
| 5 | Suspense on Club / Profile / Duel / LB (+ shop parallel) | `async-suspense-boundaries`, `async-cheap-condition-before-await` | Done |
| 6 | Align Survival + Profile (+ GotD / Newspaper) dynamics | `bundle-dynamic-imports`, `bundle-conditional` | Done |

---

## 1. Club snapshot parallelization

**Files:** `lib/player/current.ts`, `lib/club/businessService.ts`

- `toClubSnapshotWithBooster`: when XP is known, `loadActiveNewsBooster` runs in parallel with `loadBusinessSnapshot`. When XP is missing, news + user XP fetch run in parallel first.
- `loadBusinessSnapshot`: settle/mutation chain stays sequential; after settles, facilities / staff / museum / sponsor deals / `getGameConfig` use `Promise.all`.

**Why:** Nearly every authenticated page calls `getClubSnapshot()`.

---

## 2. DuelArena mode-board code splitting

**File:** `components/duel/DuelArena.tsx`

- `DuelWaiting`, `DraftPicker`, `DuelQuiz`, `DuelResult`, `MemoryBoard`, `DuelSpecialPlay`, `TikiTakaBoard` loaded via `next/dynamic`.
- `MATCHING_MIN_MS` inlined so kickoff does not pull `MatchingSearch`.

**Why:** Only one phase runs at a time; static imports previously shipped all boards (~2k+ LOC) in one chunk.

---

## 3. Game* deep imports (no barrel)

**Files:** ~49 consumers + `components/ui/game/index.ts` + `DESIGN.md`

- Replaced `from "@/components/ui/game"` with deep paths (`…/GamePanel`, `…/GameCta`, etc.).
- Barrel thinned to a documentation stub (`export {}`) so accidental barrel imports do not re-export client `GameCta`.
- `DESIGN.md` §5 updated to show deep-import pattern.

**Why:** Local barrels are not covered by `optimizePackageImports`; re-exporting client `GameCta` (framer-motion) pulled it into panel-only consumers.

---

## 4. Duel lobby / detail action waterfalls

**Files:** `actions/duel/getMyDuels.ts`, `actions/duel/getDuel.ts`

- Both start `requireUserClub()` immediately alongside the job tick (auth overlaps jobs).
- `getMyDuels`: after auth, `findMany` + `listDuelEligibleCategories` + `getGameConfig` in one `Promise.all`.
- `getDuel`: ordered job mutations unchanged; auth no longer waits for the full job chain to finish before starting.

---

## 5. Suspense shells + cheap club gate

**Files:**

- `app/club/page.tsx`
- `app/profile/page.tsx`
- `app/play/duel/page.tsx`
- `app/leaderboard/page.tsx`
- `app/shop/page.tsx`
- `app/play/duel/[id]/page.tsx`

**Pattern:** Auth / onboarding gate on the page; heavy payload in an async loader under `<Suspense fallback={<RouteLoading … />}>` (same idea as GotD on `/play`).

Also:

- Replaced `await hasClub()` with sync `if (!user.club)` on duel lobby, duel detail, leaderboard, profile, shop.
- Shop: `Promise.all([getClubSnapshot(), getGameConfig(), searchParams])` after auth.
- Profile loader: `Promise.all([getProfileSnapshot(), getMyMissions(), listBadgePresentations()])`.

---

## 6. Survival / Profile / GotD / Newspaper dynamics

| Surface | Deferred via `next/dynamic` |
|---------|-----------------------------|
| `SurvivalMatch` | `SurvivalResult`, `ReportModal`, `GoalBurst`, `FormatDevToggle` (dev-only render) |
| `PlayerProfile` | `ProfileEditModal`, `FlagPickerModal`, `MissionDrawer` |
| `ClubHub` | `NewspaperModal` (was static; Confetti/Business/Missions already dynamic) |
| `MysteryArena` / `GridArena` | `GotdResultModal`, `BadgeUnlockPopup` |
| `StarPathArena` / `MemoryGotdArena` | `GotdResultModal` |

---

## Already good (unchanged)

- `/play` shell `Promise.all` + GotD `Suspense`
- `React.cache` on `getCurrentUser` / `getGameConfig`
- `optimizePackageImports: ["lucide-react", "framer-motion"]` in `next.config.ts`
- PenaltyMatch / QuickMatch existing dynamic splits

---

## How to validate

1. Navigate Club → Profile → Duel lobby → Leaderboard: route fallback should appear under AppShell while payload streams.
2. Open a duel: Network/JS — mode boards load as separate chunks when entering that phase.
3. Optional: `ANALYZE=true` / `@next/bundle-analyzer` before/after on duel + survival entry chunks.
4. Smoke: claim newspaper, open profile edit/missions, finish a GotD (result modal still mounts).

---

## Follow-ups (not in this pass)

- ~~`rerender-defer-reads` on BottomNav / match store action subscriptions (`getState()` in handlers)~~ → BottomNav actions via `getState()`; phase-only subscriptions
- ~~Hoist `EMPTY_*` default props (`rerender-memo-with-default-value`)~~ → MatchResult, DuelInboxBanner, MissionDrawer, PlayModes, PlayerProfile, DuelLobby, GotdResultModal, SurvivalCategoryPicker
- ~~`content-visibility` on `LeaderboardList` rows~~ → applied (`auto` + intrinsic ~3.25rem; animate cap 6)
- ~~`after()` for non-blocking post-response work~~ → applied on `getDuelInbox` job tick
- ~~Nested Suspense slots inside ClubHub (inbox / today rail)~~ → `ClubHubSecondary` + hub fast snapshot (`settleBusiness: false`)

### Local baseline (dev, warm, 2026-09-23)

| Route | TTFB | Notes |
|-------|------|-------|
| `/club` | ~20–80ms | HTML ~40KB streamed; framer still in page graph |
| `/leaderboard` | ~20ms (307) | Unauthed redirect — measure standings TTFB while logged in |
| `/play` | ~25ms | |

### Logged-in hard navigate (localhost, Cursor browser, 2026-09-23)

| Route | TTFB | DCL | Load | Transfer |
|-------|------|-----|------|----------|
| `/club` | **109ms** | 404ms | 582ms | ~20 KB |
| `/leaderboard` | **100ms** | 175ms | 624ms | ~13 KB |

Paint/LCP entries were unavailable in this embedded browser (FCP/LCP null). Re-check on Chrome mobile / Vercel preview for real LCP.
StatusBar Framer removed (CSS coin pulse + sheet) — Club above-fold no longer pulls motion for HUD.

Prod / CrUX still needed for field LCP + TBT.