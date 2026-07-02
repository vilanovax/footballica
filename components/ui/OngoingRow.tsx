import { Avatar } from "@/components/ui/Avatar";

export interface OngoingGame {
  name: string;
  short: string;
  meta: string;
  color: string;
  status: string;
  statusGold?: boolean;
}

export function OngoingRow({
  name,
  short,
  meta,
  color,
  status,
  statusGold,
}: OngoingGame) {
  return (
    <div className="glass rounded-2xl p-3 flex items-center gap-3">
      <Avatar label={short} color={color} size={48} />
      <div className="flex-1 text-right">
        <p className="font-bold">{name}</p>
        <p className="text-sm text-white/55">{meta}</p>
      </div>
      <span
        className={`rounded-xl px-3 py-1.5 text-sm font-bold ${
          statusGold ? "bg-gold-400 text-[#3a2600]" : "bg-white/10 text-white/70"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

export const ONGOING_GAMES: OngoingGame[] = [
  {
    name: "سینا کریمی",
    short: "س.ک",
    meta: "راند ۲ · تو ۳۲۰ — او ۲۸۰",
    color: "foe",
    status: "نوبت تو",
    statusGold: true,
  },
  {
    name: "مهدی احمدی",
    short: "م.ا",
    meta: "تورنمنت · مرحلهٔ یک‌هشتم",
    color: "#8b3fe0",
    status: "منتظر او",
  },
  {
    name: "زهرا رضایی",
    short: "ز.ر",
    meta: "راند ۱ · تازه شروع شد",
    color: "you",
    status: "نوبت تو",
    statusGold: true,
  },
  {
    name: "علی نوری",
    short: "ع.ن",
    meta: "دوئل · تو ۱۸۰ — او ۲۴۰",
    color: "foe",
    status: "منتظر او",
  },
];
