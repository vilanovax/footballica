/**
 * Intentionally NOT a barrel re-export.
 *
 * Import deep paths so bundlers do not pull client-only GameCta (framer-motion)
 * into every GamePanel/GameChip consumer:
 *
 *   import { GamePanel } from "@/components/ui/game/GamePanel";
 *   import { GameCta } from "@/components/ui/game/GameCta";
 *
 * See docs/perf-vercel-react-audit.md
 */
export {};
