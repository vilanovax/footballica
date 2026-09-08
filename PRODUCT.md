# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Players** are football fans using a phone (PWA). The job is to play trivia as a match, then spend the result on their club. English and Persian are equally first-class; the product is not Iran-only in audience even if some shipping systems still are.

**Operators** use `/admin` to run the live game: questions, modes, missions, challenges, economy config, reports, and player accounts. They are a first-class audience in this record, with a different job (operate content and rules, not play).

## Product Purpose

Footballica (فوتبالیکا) is a mobile-first football trivia game wrapped in club management. Success is that answering feels like a match event (goal / miss), not a quiz form, and that those results visibly grow a ruined club toward a better ground.

The durable hook from the product brief: take a ruined Division 3 club toward the championship using football knowledge.

## Positioning

The mechanism a generic trivia app cannot copy without becoming this product: **trivia outcomes feed a persistent club** (coins, fans, stamina, stadium, facilities, boosters). The hub is the metagame; the match is the core loop. Knowledge is the scarce skill; the club is the reason to return.

## Operating Context

- Land on the Club Hub after auth and FTUE (avatar, club name, tutorial penalty, first stadium upgrade).
- Check stamina, play a mode, resolve as a match, collect coins / fans / XP, spend on upgrades and club business.
- Daily newspaper boosters, mystery player, campaign / missions, shop, weekly ranks, profile.
- Operators unlock admin with `ADMIN_SECRET` and work at `/admin` (not the player shell).
- Local play: `npm run dev` → `http://localhost:3000`. Dev OTP: `123456`.
- Production target: Vercel + PostgreSQL; PWA install / home-screen.

## Capabilities and Constraints

**Player app (shipped surface):** Club Hub (stadium, economy HUD, upgrades, club business); play modes including penalty, quick, mystery, grid, memory, star path, survival, duels; shop; leaderboard; profile / missions; settings; bilingual `fa` / `en` with RTL when Persian.

**Operator app:** CMS for questions, categories, players, modes, missions, challenges, badges, grid, mystery, star path, reports, game config.

**Constraints**

- Mobile-first web / PWA; one-handed use; no horizontal scroll; bottom nav on player chrome; touch targets ≥ 44px.
- Player economy and match results are server-backed (Prisma / PostgreSQL); the client must not be the source of truth for rewards.
- **Open vs shipped:** sign-in today is Iranian mobile OTP. Audience is global; changing auth is an undecided product change, not a current capability.
- Admin stays a separate chrome from the player game; do not treat operator screens as Club Hub.

## Brand Commitments

- Names: **Footballica** / **فوتبالیکا**.
- Voice in the player app: manager / club / match language (stadium, stamina, fans, coins, upgrades), not exam or CMS language.
- Dual-language product: English copy is as important as Persian; neither is a leftover.
- Binding visual system lives in `DESIGN.md` and is **not** restated here.

## Evidence on Hand

- Product brief: `PRD.md`.
- Player and operator copy: `lib/i18n/locales/en.ts`, `lib/i18n/locales/fa.ts`.
- Player icons: `public/icons/*.png`. PWA icons in `public/` (`icon-192x192.png`, `icon-512x512.png`, `apple-icon.png`).
- Runnable app at `/club` after login; admin at `/admin`.

Do not invent testimonials, press, user counts, league standings, or third-party endorsements.

## Product Principles

1. **Match, not exam** — every quiz beat should read as a football action with immediate result.
2. **Club is the save file** — hub state (stadium, stamina, economy) is why a session continues after the whistle.
3. **Phone in the hand** — design and copy for one-handed play; desktop is a convenience, not the scene.
4. **Two languages, one product** — `fa` and `en` must stay complete and equal; RTL is a layout fact, not a theme.
5. **Players play, operators operate** — keep those jobs on separate surfaces; never ship operator patterns into the match.

## Accessibility & Inclusion

Required floor: 44px touch targets, RTL-correct layout for Persian, and complete `fa` + `en` strings. No additional WCAG standard is committed. `prefers-reduced-motion` is already used in parts of the player app and should be preserved where motion is authored.
