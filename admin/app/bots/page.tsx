'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, getAdminKey } from '@/lib/api';
import type { Bot, BotDifficulty } from '@/lib/types';
import { BOT_DIFF_FA } from '@/lib/types';
import { toFa } from '@/lib/fa';

export default function BotsPage() {
  const router = useRouter();
  const [bots, setBots] = useState<Bot[]>([]);
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<BotDifficulty>('MEDIUM');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBots(await adminApi.listBots());
      setError(null);
    } catch {
      setError('خطا در بارگذاری. آیا وارد شده‌ای؟');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getAdminKey()) {
      router.replace('/login');
      return;
    }
    void load();
  }, [load, router]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('نامِ ربات خیلی کوتاه است.');
    setBusy(true);
    setError(null);
    try {
      await adminApi.createBot({ name: name.trim(), difficulty });
      setName('');
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ساخت');
    } finally {
      setBusy(false);
    }
  };

  const del = async (b: Bot) => {
    if (!window.confirm(`ربات «${b.name}» حذف شود؟`)) return;
    try {
      await adminApi.removeBot(b.id);
      void load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'حذف ناموفق');
    }
  };

  return (
    <main className="container">
      <div className="row spread">
        <h1>ربات‌ها</h1>
        <Link className="btn" href="/">
          داشبورد
        </Link>
      </div>

      <p className="muted" style={{ marginTop: -8 }}>
        ربات‌ها وقتی حریفِ انسانی نباشد به‌جای او وارد دوئل می‌شوند. بازیکن آن‌ها را
        مثل یک حریفِ عادی می‌بیند و متوجه نمی‌شود ربات است.
      </p>

      {/* فرم ساخت */}
      <form onSubmit={create} className="card" style={{ marginTop: 16 }}>
        <div className="row" style={{ gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 2 }}>
            <label className="muted">نامِ نمایشیِ ربات</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: علی رضایی"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="muted">درجهٔ سختی</label>
            <select
              className="input"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as BotDifficulty)}
            >
              {(Object.keys(BOT_DIFF_FA) as BotDifficulty[]).map((d) => (
                <option key={d} value={d}>
                  {BOT_DIFF_FA[d]}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-amber" type="submit" disabled={busy}>
            {busy ? '...' : '+ ساخت ربات'}
          </button>
        </div>
        {error && (
          <p style={{ color: 'var(--wrong)', margin: '8px 0 0' }}>{error}</p>
        )}
      </form>

      {/* فهرست */}
      <div style={{ marginTop: 16 }}>
        {loading && <p className="muted">در حال بارگذاری…</p>}
        {!loading &&
          bots.map((b) => (
            <div
              key={b.id}
              className="card row spread"
              style={{ marginBottom: 10 }}
            >
              <div className="row" style={{ gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: 'var(--pitch)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {(b.name ?? '?').slice(0, 1)}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{b.name}</div>
                  <div className="muted">
                    {b.difficulty ? BOT_DIFF_FA[b.difficulty] : '—'} · دوئل‌ها:{' '}
                    {toFa(b.duelsPlayed)}
                  </div>
                </div>
              </div>
              <button className="btn btn-danger" onClick={() => del(b)}>
                حذف
              </button>
            </div>
          ))}
        {!loading && bots.length === 0 && (
          <p className="muted">هنوز رباتی ساخته نشده.</p>
        )}
      </div>
    </main>
  );
}
