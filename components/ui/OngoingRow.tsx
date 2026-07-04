import { Avatar } from "@/components/ui/Avatar";
import { GameCard } from "@/components/ui/GameCard";

export interface OngoingGame {
  name: string;
  short: string;
  mode: string;
  meta: string;
  color: string;
  status: string;
  statusGold?: boolean;
}

export function OngoingRow({
  name,
  short,
  mode,
  meta,
  color,
  status,
  statusGold,
}: OngoingGame) {
  return (
    <GameCard
      variant="asset"
      highlight={Boolean(statusGold)}
      className={`ongoing-row ${statusGold ? "ongoing-row--ready" : ""}`}
    >
      <div className="ongoing-row__layout">
        <Avatar label={short} color={color} size={48} className="shrink-0" />
        <div className="ongoing-row__copy">
          <div className="ongoing-row__top">
            <p className="ongoing-row__name">{name}</p>
            <span className="ongoing-row__mode">{mode}</span>
          </div>
          <p className="ongoing-row__meta">{meta}</p>
        </div>
        <span
          className={`ongoing-row__status ${
            statusGold ? "ongoing-row__status--ready" : "ongoing-row__status--waiting"
          }`}
        >
          {status}
        </span>
      </div>
    </GameCard>
  );
}

export const ONGOING_GAMES: OngoingGame[] = [
  {
    name: "سینا کریمی",
    short: "س.ک",
    mode: "راند ۲",
    meta: "تو ۳۲۰ — او ۲۸۰",
    color: "foe",
    status: "نوبت تو",
    statusGold: true,
  },
  {
    name: "مهدی احمدی",
    short: "م.ا",
    mode: "تورنمنت",
    meta: "مرحلهٔ یک‌هشتم",
    color: "#8b3fe0",
    status: "منتظر او",
  },
  {
    name: "زهرا رضایی",
    short: "ز.ر",
    mode: "راند ۱",
    meta: "تازه شروع شد",
    color: "you",
    status: "نوبت تو",
    statusGold: true,
  },
  {
    name: "علی نوری",
    short: "ع.ن",
    mode: "دوئل",
    meta: "تو ۱۸۰ — او ۲۴۰",
    color: "foe",
    status: "منتظر او",
  },
];
