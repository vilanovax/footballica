"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bot,
  Users,
  Trash2,
  Wand2,
  Replace,
  Check,
  Pencil,
  X,
  Coins,
  Search,
  Gauge,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import {
  generateBots,
  bulkRenameBots,
  bulkSetBotDifficulty,
  deleteBot,
  renameBot,
  setBotEnabled,
  updateBotDifficulty,
  type AdminBotRow,
  type AdminUserRow,
} from "@/actions/admin/bots";
import { grantCoinsToUser } from "@/actions/admin/economy";
import { updateGameConfig, getGameConfig } from "@/actions/admin/config";
import {
  BOT_DIFFICULTIES,
  BOT_DIFFICULTY_META,
  type BotDifficulty,
} from "@/lib/bots/difficulty";
import { mergeGameConfig, type GameConfig } from "@/lib/game/economy";
import { formatJalaliLabel } from "@/lib/admin/jalali";
import { AdminHelpTip } from "@/components/admin/AdminHelpTip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UsersBotsPanelProps = {
  bots: AdminBotRow[];
  users: AdminUserRow[];
  botsConfig: GameConfig["bots"];
};

function dateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function looksRtl(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function UsersBotsPanel({
  bots,
  users,
  botsConfig,
}: UsersBotsPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState("bots");
  const [botQuery, setBotQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [diffFilter, setDiffFilter] = useState<"ALL" | BotDifficulty>("ALL");
  const [enabledFilter, setEnabledFilter] = useState<"ALL" | "ON" | "OFF">(
    "ALL",
  );

  const enabledBots = useMemo(
    () => bots.filter((b) => b.enabled).length,
    [bots],
  );

  const difficultyCounts = useMemo(() => {
    const counts: Record<BotDifficulty, number> = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
    };
    for (const b of bots) {
      const d = b.difficulty ?? "MEDIUM";
      counts[d] += 1;
    }
    return counts;
  }, [bots]);

  const filteredBots = useMemo(() => {
    const q = botQuery.trim().toLowerCase();
    return bots.filter((b) => {
      if (diffFilter !== "ALL" && (b.difficulty ?? "MEDIUM") !== diffFilter) {
        return false;
      }
      if (enabledFilter === "ON" && !b.enabled) return false;
      if (enabledFilter === "OFF" && b.enabled) return false;
      if (!q) return true;
      return (
        b.clubName.toLowerCase().includes(q) ||
        (b.difficulty ?? "").toLowerCase().includes(q)
      );
    });
  }, [bots, botQuery, diffFilter, enabledFilter]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.phone ?? "").toLowerCase().includes(q) ||
        (u.clubName ?? "").toLowerCase().includes(q),
    );
  }, [users, userQuery]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Real users"
          value={users.length}
          hint="OTP managers"
          tone="sky"
        />
        <StatCard
          label="Bots enabled"
          value={enabledBots}
          hint={`of ${bots.length} total`}
          tone="emerald"
        />
        <StatCard
          label="Bots disabled"
          value={bots.length - enabledBots}
          hint="Skipped in matchmaking"
          tone="slate"
        />
        <StatCard
          label="Easy"
          value={difficultyCounts.EASY}
          hint={`${Math.round(botsConfig.accuracyEasy * 100)}% hit`}
          tone="emerald"
        />
        <StatCard
          label="Medium"
          value={difficultyCounts.MEDIUM}
          hint={`${Math.round(botsConfig.accuracyMedium * 100)}% hit`}
          tone="amber"
        />
        <StatCard
          label="Hard"
          value={difficultyCounts.HARD}
          hint={`${Math.round(botsConfig.accuracyHard * 100)}% hit`}
          tone="rose"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="rounded-xl bg-slate-100/90 p-1 ring-1 ring-slate-200/80">
            <TabsTrigger value="users" className="gap-1.5 rounded-lg">
              <Users className="h-3.5 w-3.5" />
              Users
              <span className="rounded-md bg-white px-1.5 text-[10px] font-bold text-slate-800 ring-1 ring-slate-200">
                {users.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="bots" className="gap-1.5 rounded-lg">
              <Bot className="h-3.5 w-3.5" />
              Bots
              <span className="rounded-md bg-white px-1.5 text-[10px] font-bold text-slate-800 ring-1 ring-slate-200">
                {bots.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {tab === "bots" ? (
            <div className="flex flex-wrap gap-2">
              <GenerateBotsDialog pending={pending} onDone={refresh} />
              <BulkRenameDialog pending={pending} onDone={refresh} />
              <BulkDifficultyDialog pending={pending} onDone={refresh} />
            </div>
          ) : null}
        </div>

        <TabsContent value="users" className="mt-0 space-y-3">
          <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                Search users
              </p>
              <div className="flex items-center gap-1.5">
                <AdminHelpTip text="Grant tops up club coins (logged, not IAP). Answers = correct / total." />
                <p className="text-[11px] font-semibold text-slate-700">
                  {filteredUsers.length} shown
                </p>
              </div>
            </header>
            <div className="p-3">
              <SearchField
                value={userQuery}
                onChange={setUserQuery}
                placeholder="Search phone or club…"
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  {users.length === 0
                    ? "No real users yet"
                    : "No users match"}
                </p>
                <p className="text-xs font-medium text-slate-700">
                  {users.length === 0
                    ? "OTP sign-ups will appear here."
                    : "Clear search to see everyone."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const joinedKey = dateKeyFromIso(u.createdAt);
                  return (
                    <li
                      key={u.id}
                      className="flex flex-wrap items-center gap-2.5 px-3.5 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {u.clubName ?? "No club"}
                        </p>
                        <p className="truncate font-mono text-[11px] text-slate-700">
                          {u.phone ?? "—"}
                          <span className="ms-2 font-sans font-semibold tabular-nums text-amber-800">
                            {(u.clubId ? u.coins : 0).toLocaleString()}c
                          </span>
                          <span className="ms-2 font-sans text-slate-700">
                            <AnswersPill label={u.answersLabel} /> ·{" "}
                            {u.matchesPlayed}m · {u.weeklyXp} XP/wk
                            {joinedKey ? (
                              <>
                                {" "}
                                ·{" "}
                                <span dir="rtl">
                                  {formatJalaliLabel(joinedKey)}
                                </span>
                              </>
                            ) : null}
                          </span>
                        </p>
                      </div>
                      <GrantCoinsDialog
                        user={u}
                        pending={pending}
                        onDone={refresh}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </TabsContent>

        <TabsContent value="bots" className="mt-0 space-y-3">
          <BotSkillSettings initial={botsConfig} pending={pending} onDone={refresh} />

          <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                Search &amp; filter
              </p>
              <div className="flex items-center gap-1.5">
                <AdminHelpTip text="Click a name to rename. Change difficulty per row. Toggle Enabled for matchmaking. Delay timing lives in Game Config → Duel." />
                <p className="text-[11px] font-semibold text-slate-700">
                  {filteredBots.length} shown · {enabledBots} on
                </p>
              </div>
            </header>
            <div className="flex flex-wrap items-end gap-2 p-3">
              <div className="min-w-48 flex-1">
                <SearchField
                  value={botQuery}
                  onChange={setBotQuery}
                  placeholder="Search bot name…"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Difficulty
                </Label>
                <Select
                  value={diffFilter}
                  onValueChange={(v) =>
                    setDiffFilter(v as "ALL" | BotDifficulty)
                  }
                >
                  <SelectTrigger className="h-9 w-34">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {BOT_DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {BOT_DIFFICULTY_META[d].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Status
                </Label>
                <Select
                  value={enabledFilter}
                  onValueChange={(v) =>
                    setEnabledFilter(v as "ALL" | "ON" | "OFF")
                  }
                >
                  <SelectTrigger className="h-9 w-30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="ON">Enabled</SelectItem>
                    <SelectItem value="OFF">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
            {filteredBots.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  {bots.length === 0 ? "No bots yet" : "No bots match"}
                </p>
                <p className="text-xs font-medium text-slate-700">
                  {bots.length === 0
                    ? "Generate a batch to fill the duel pool."
                    : "Clear filters to see the pool."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredBots.map((b) => (
                  <li
                    key={b.id}
                    className={[
                      "flex flex-wrap items-center gap-2.5 px-3.5 py-2.5",
                      b.enabled ? "" : "opacity-60",
                    ].join(" ")}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <InlineBotName
                          botId={b.id}
                          initialName={b.clubName}
                          disabled={pending}
                        />
                        {!b.enabled ? (
                          <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-800 ring-1 ring-slate-200">
                            OFF
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-700">
                        <AnswersPill label={b.answersLabel} />
                        <span>{b.duelsPlayed} duels</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <InlineDifficultySelect
                        botId={b.id}
                        difficulty={b.difficulty}
                        disabled={pending}
                      />
                      <BotEnabledToggle
                        botId={b.id}
                        enabled={b.enabled}
                        disabled={pending}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-800 hover:bg-white hover:text-rose-950"
                        disabled={pending}
                        aria-label={`Delete ${b.clubName}`}
                        onClick={() => {
                          startTransition(async () => {
                            const res = await deleteBot(b.id);
                            if (!res.ok) {
                              toast.error(
                                res.error === "in_use"
                                  ? "Bot is in an active duel."
                                  : "Could not delete bot.",
                              );
                              return;
                            }
                            toast.success("Bot deleted");
                            router.refresh();
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "sky" | "emerald" | "slate" | "amber" | "rose";
}) {
  const ring =
    tone === "sky"
      ? "border-sky-200"
      : tone === "emerald"
        ? "border-emerald-200"
        : tone === "amber"
          ? "border-amber-200"
          : tone === "rose"
            ? "border-rose-200"
            : "border-slate-200/90";
  return (
    <div className={`rounded-xl border bg-white px-3.5 py-3 shadow-sm ${ring}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
        {label}
      </p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-slate-700">{hint}</p>
    </div>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-0 sm:max-w-md">
      <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 border-slate-200 bg-white ps-9 shadow-none"
      />
    </div>
  );
}

function AnswersPill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-slate-800 ring-1 ring-slate-200"
      title="Correct / questions answered"
    >
      {label}
    </span>
  );
}

const GRANT_PRESETS = [100, 500, 1_000, 5_000] as const;

function GrantCoinsDialog({
  user,
  pending,
  onDone,
}: {
  user: AdminUserRow;
  pending?: boolean;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("500");
  const [reason, setReason] = useState("");
  const [busy, startTransition] = useTransition();

  const canGrant = Boolean(user.clubId);
  const amountNum = Math.floor(Number(amount));
  const amountOk =
    Number.isFinite(amountNum) && amountNum >= 1 && amountNum <= 1_000_000;

  function submit() {
    if (!canGrant || !amountOk || busy) return;
    startTransition(async () => {
      const res = await grantCoinsToUser(user.id, amountNum, reason);
      if (!res.ok) {
        const msg =
          res.error === "unauthorized"
            ? "Admin session expired."
            : res.error === "invalid_amount"
              ? "Enter 1–1,000,000 coins."
              : res.error === "no_club"
                ? "Player has no club yet."
                : res.error === "rate_limited"
                  ? "Daily grant limit reached for this club."
                  : "Could not grant coins.";
        toast.error(msg);
        return;
      }
      toast.success(
        `Granted ${res.granted.toLocaleString()} coins → balance ${res.coins.toLocaleString()}`,
      );
      setOpen(false);
      setReason("");
      setAmount("500");
      onDone();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canGrant || pending}
          className="h-8 gap-1.5 border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100"
          title={canGrant ? "Grant coins" : "No club yet"}
        >
          <Coins className="h-3.5 w-3.5" />
          Grant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Grant coins</DialogTitle>
          <DialogDescription>
            Credit{" "}
            <span className="font-medium text-slate-800">
              {user.clubName ?? user.phone ?? "player"}
            </span>
            . Balance{" "}
            <span className="font-semibold tabular-nums text-amber-700">
              {user.coins.toLocaleString()}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor={`grant-amount-${user.id}`}>Amount</Label>
            <Input
              id={`grant-amount-${user.id}`}
              type="number"
              min={1}
              max={1_000_000}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 tabular-nums"
            />
            <div className="flex flex-wrap gap-1.5">
              {GRANT_PRESETS.map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setAmount(String(n))}
                >
                  +{n.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`grant-reason-${user.id}`}>
              Reason <span className="text-slate-400">(optional)</span>
            </Label>
            <Input
              id={`grant-reason-${user.id}`}
              maxLength={200}
              placeholder="e.g. support ticket #42"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || !amountOk}
            onClick={submit}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {busy
              ? "Granting…"
              : `Grant ${amountOk ? amountNum.toLocaleString() : "…"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BotEnabledToggle({
  botId,
  enabled,
  disabled,
}: {
  botId: string;
  enabled: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    setOn(enabled);
  }, [enabled]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? "Enabled" : "Disabled"}
      disabled={disabled || busy}
      onClick={() => {
        const next = !on;
        setOn(next);
        startTransition(async () => {
          const res = await setBotEnabled(botId, next);
          if (!res.ok) {
            setOn(!next);
            toast.error("Could not update bot.");
            return;
          }
          toast.success(next ? "Bot enabled" : "Bot disabled");
          router.refresh();
        });
      }}
      className={[
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-50",
        on ? "bg-emerald-500" : "bg-slate-300",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          on ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

function InlineBotName({
  botId,
  initialName,
  disabled,
}: {
  botId: string;
  initialName: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialName);
  const [name, setName] = useState(initialName);
  const [busy, startTransition] = useTransition();
  const rtl = looksRtl(name);

  function startEdit() {
    if (disabled || busy) return;
    setValue(name);
    setEditing(true);
  }

  function cancel() {
    setValue(name);
    setEditing(false);
  }

  function save() {
    const next = value.trim().replace(/\s+/g, " ");
    if (!next || next === name) {
      setEditing(false);
      setValue(name);
      return;
    }
    startTransition(async () => {
      const res = await renameBot(botId, next);
      if (!res.ok) {
        toast.error(res.message ?? "Could not rename bot.");
        return;
      }
      setName(res.name);
      setValue(res.name);
      setEditing(false);
      toast.success("Name updated");
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEdit}
        disabled={disabled || busy}
        className="group inline-flex max-w-[16rem] items-center gap-1.5 rounded-lg px-1.5 py-1 text-start font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-50"
        title="Click to rename"
        dir={rtl ? "rtl" : "ltr"}
      >
        <span className="truncate">{name}</span>
        <Pencil className="h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div className="flex max-w-[18rem] items-center gap-1">
      <Input
        autoFocus
        value={value}
        maxLength={32}
        disabled={busy}
        dir={looksRtl(value) ? "rtl" : "ltr"}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        onBlur={() => {
          window.setTimeout(() => {
            if (document.activeElement?.closest("[data-inline-name-actions]")) {
              return;
            }
            save();
          }, 120);
        }}
        className="h-9 text-sm"
      />
      <div data-inline-name-actions className="flex shrink-0 gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-emerald-600 hover:bg-emerald-50"
          disabled={busy}
          aria-label="Save name"
          onMouseDown={(e) => e.preventDefault()}
          onClick={save}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-slate-500 hover:bg-slate-100"
          disabled={busy}
          aria-label="Cancel"
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function InlineDifficultySelect({
  botId,
  difficulty,
  disabled,
}: {
  botId: string;
  difficulty: BotDifficulty | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<BotDifficulty>(difficulty ?? "MEDIUM");
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    setValue(difficulty ?? "MEDIUM");
  }, [difficulty]);

  return (
    <Select
      value={value}
      disabled={disabled || busy}
      onValueChange={(v) => {
        const next = v as BotDifficulty;
        const prev = value;
        setValue(next);
        startTransition(async () => {
          const res = await updateBotDifficulty(botId, next);
          if (!res.ok) {
            setValue(prev);
            toast.error("Could not update difficulty.");
            return;
          }
          toast.success(`Difficulty → ${BOT_DIFFICULTY_META[next].label}`);
          router.refresh();
        });
      }}
    >
      <SelectTrigger
        className={[
          "h-8 w-27 text-[11px] font-bold",
          value === "EASY"
            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
            : value === "HARD"
              ? "border-rose-200 bg-rose-50 text-rose-950"
              : "border-amber-200 bg-amber-50 text-amber-950",
        ].join(" ")}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BOT_DIFFICULTIES.map((d) => (
          <SelectItem key={d} value={d}>
            {BOT_DIFFICULTY_META[d].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function BotSkillSettings({
  initial,
  pending,
  onDone,
}: {
  initial: GameConfig["bots"];
  pending: boolean;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const mixTotal =
    Math.max(0, draft.matchmakingWeightEasy) +
    Math.max(0, draft.matchmakingWeightMedium) +
    Math.max(0, draft.matchmakingWeightHard);
  const pct = (n: number) =>
    mixTotal <= 0 ? 0 : Math.round((Math.max(0, n) / mixTotal) * 100);

  function setNum(key: keyof GameConfig["bots"], raw: string) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    setDraft((prev) => ({ ...prev, [key]: n }));
  }

  function save() {
    startTransition(async () => {
      const current = await getGameConfig();
      const next = mergeGameConfig({
        ...current,
        bots: draft,
      });
      const res = await updateGameConfig(next);
      if (!res.ok) {
        toast.error("Could not save bot skill settings.");
        return;
      }
      toast.success("Bot skill settings saved");
      onDone();
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-emerald-200 bg-linear-to-br from-emerald-50/80 to-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 px-3.5 py-2">
        <div className="flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-emerald-700" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-900">
            Bot skill &amp; matchmaking
          </p>
          <AdminHelpTip text="Accuracy = P(correct) per difficulty band. Matchmaking weights control which band is assigned after the queue wait. Bot delay (timing) is in Game Config → Duel." />
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 gap-1.5"
          disabled={pending || busy}
          onClick={save}
        >
          <Save className="h-3.5 w-3.5" />
          {busy ? "Saving…" : "Save"}
        </Button>
      </header>
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Accuracy (0–1)
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                ["accuracyEasy", "Easy"],
                ["accuracyMedium", "Medium"],
                ["accuracyHard", "Hard"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex flex-col gap-0.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5"
              >
                <span className="text-[10px] font-semibold text-slate-600">
                  {label}
                </span>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={draft[key]}
                  onChange={(e) => setNum(key, e.target.value)}
                  className="h-8 font-mono text-sm font-semibold tabular-nums"
                />
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Matchmaking weights · mix {pct(draft.matchmakingWeightEasy)}/
            {pct(draft.matchmakingWeightMedium)}/
            {pct(draft.matchmakingWeightHard)}%
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                ["matchmakingWeightEasy", "Easy"],
                ["matchmakingWeightMedium", "Medium"],
                ["matchmakingWeightHard", "Hard"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex flex-col gap-0.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5"
              >
                <span className="text-[10px] font-semibold text-slate-600">
                  {label}
                </span>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={draft[key]}
                  onChange={(e) => setNum(key, e.target.value)}
                  className="h-8 font-mono text-sm font-semibold tabular-nums"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function GenerateBotsDialog({
  pending,
  onDone,
}: {
  pending: boolean;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("20");
  const [difficulty, setDifficulty] = useState<BotDifficulty>("MEDIUM");
  const [prefix, setPrefix] = useState("Guest_");
  const [busy, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const res = await generateBots(Number(quantity), difficulty, prefix);
      if (!res.ok) {
        toast.error(res.message ?? "Generate failed");
        return;
      }
      toast.success(`Created ${res.created} bots`);
      setOpen(false);
      onDone();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="gap-1.5" disabled={pending}>
          <Wand2 className="h-4 w-4" />
          Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate bots</DialogTitle>
          <DialogDescription>
            Fill the Draft Duel cold-start pool with bot managers + clubs.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="bot-qty">Quantity</Label>
            <Input
              id="bot-qty"
              type="number"
              min={1}
              max={200}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="grid gap-2">
            <Label>Difficulty</Label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as BotDifficulty)}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOT_DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {BOT_DIFFICULTY_META[d].label} —{" "}
                    {BOT_DIFFICULTY_META[d].hint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bot-prefix">Name prefix</Label>
            <Input
              id="bot-prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="Guest_"
              className="h-10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={handleGenerate}>
            {busy ? "Creating…" : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkRenameDialog({
  pending,
  onDone,
}: {
  pending: boolean;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [oldPrefix, setOldPrefix] = useState("Guest_");
  const [newPrefix, setNewPrefix] = useState("Rival_");
  const [busy, startTransition] = useTransition();

  function handleRename() {
    startTransition(async () => {
      const res = await bulkRenameBots(oldPrefix, newPrefix);
      if (!res.ok) {
        toast.error(res.message ?? "Rename failed");
        return;
      }
      toast.success(`Renamed ${res.updated} bots`);
      setOpen(false);
      onDone();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          disabled={pending}
        >
          <Replace className="h-4 w-4" />
          Bulk rename
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk rename</DialogTitle>
          <DialogDescription>
            Replace a name prefix across bot clubs.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="old-prefix">Search prefix</Label>
            <Input
              id="old-prefix"
              value={oldPrefix}
              onChange={(e) => setOldPrefix(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-prefix">Replace with</Label>
            <Input
              id="new-prefix"
              value={newPrefix}
              onChange={(e) => setNewPrefix(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={handleRename}>
            {busy ? "Renaming…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkDifficultyDialog({
  pending,
  onDone,
}: {
  pending: boolean;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<BotDifficulty>("MEDIUM");
  const [scope, setScope] = useState<"all" | "enabled">("all");
  const [busy, startTransition] = useTransition();

  function handleApply() {
    startTransition(async () => {
      const res = await bulkSetBotDifficulty(difficulty, {
        onlyEnabled: scope === "enabled",
      });
      if (!res.ok) {
        toast.error(res.message ?? "Bulk update failed");
        return;
      }
      toast.success(
        `Set ${res.updated} bots → ${BOT_DIFFICULTY_META[difficulty].label}`,
      );
      setOpen(false);
      onDone();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          disabled={pending}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Bulk difficulty
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk set difficulty</DialogTitle>
          <DialogDescription>
            Apply one awareness band to many bots at once.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Difficulty</Label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as BotDifficulty)}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOT_DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {BOT_DIFFICULTY_META[d].label} —{" "}
                    {BOT_DIFFICULTY_META[d].hint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Scope</Label>
            <Select
              value={scope}
              onValueChange={(v) => setScope(v as "all" | "enabled")}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All bots</SelectItem>
                <SelectItem value="enabled">Enabled only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={handleApply}>
            {busy ? "Updating…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
