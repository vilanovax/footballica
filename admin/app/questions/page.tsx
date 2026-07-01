'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, getAdminKey } from '@/lib/api';
import type { AdminQuestion } from '@/lib/types';
import { DIFF_FA } from '@/lib/types';
import { toFa } from '@/lib/fa';

type Filter = 'all' | 'approved' | 'pending';

export default function QuestionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminQuestion[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const approved =
        filter === 'all' ? undefined : filter === 'approved';
      setItems(await adminApi.listQuestions({ approved }));
    } catch {
      setError('خطا در بارگذاری. آیا وارد شده‌ای؟');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!getAdminKey()) {
      router.replace('/login');
      return;
    }
    void load();
  }, [load, router]);

  const toggle = async (q: AdminQuestion) => {
    if (q.isApproved) await adminApi.unapprove(q.id);
    else await adminApi.approve(q.id);
    void load();
  };

  const del = async (q: AdminQuestion) => {
    if (!window.confirm('این سؤال حذف شود؟')) return;
    await adminApi.remove(q.id);
    void load();
  };

  return (
    <main className="container">
      <div className="row spread">
        <h1>سؤال‌ها</h1>
        <div className="row">
          <Link className="btn btn-amber" href="/questions/new">
            + سؤال جدید
          </Link>
          <Link className="btn" href="/">
            داشبورد
          </Link>
        </div>
      </div>

      <div className="row" style={{ gap: 8, marginBottom: 16 }}>
        {(['all', 'pending', 'approved'] as Filter[]).map((f) => (
          <button
            key={f}
            className="btn"
            onClick={() => setFilter(f)}
            style={
              filter === f
                ? { borderColor: 'var(--amber)', color: 'var(--amber)' }
                : undefined
            }
          >
            {f === 'all' ? 'همه' : f === 'pending' ? 'در انتظار' : 'تأییدشده'}
          </button>
        ))}
      </div>

      {loading && <p className="muted">در حال بارگذاری…</p>}
      {error && <p style={{ color: 'var(--wrong)' }}>{error}</p>}

      {!loading &&
        items.map((q) => (
          <div key={q.id} className="card" style={{ marginBottom: 12 }}>
            <div className="row spread">
              <span
                className={`badge ${q.isApproved ? 'badge-ok' : 'badge-pending'}`}
              >
                {q.isApproved ? 'تأییدشده' : 'در انتظار'}
              </span>
              <span className="muted">
                {q.category?.name ?? 'بدون دسته'} · {DIFF_FA[q.difficulty]}
              </span>
            </div>

            <p style={{ fontWeight: 700, fontSize: 16, margin: '10px 0' }}>
              {q.text}
            </p>

            <div style={{ display: 'grid', gap: 6 }}>
              {q.options.map((o) => (
                <div
                  key={o.id}
                  className="muted"
                  style={{
                    color: o.isCorrect ? 'var(--correct)' : undefined,
                  }}
                >
                  {o.isCorrect ? '✓ ' : '• '}
                  {o.text}
                </div>
              ))}
            </div>

            {q.stats && q.stats.answered > 0 && (
              <p className="muted" style={{ marginTop: 8 }}>
                پاسخ‌ها: {toFa(q.stats.answered)} · نرخِ درست:{' '}
                {q.stats.correctRate == null
                  ? '—'
                  : `${toFa(q.stats.correctRate)}٪`}
              </p>
            )}

            <div className="row" style={{ marginTop: 12, gap: 8 }}>
              <button className="btn" onClick={() => toggle(q)}>
                {q.isApproved ? 'لغو تأیید' : 'تأیید'}
              </button>
              <button className="btn btn-danger" onClick={() => del(q)}>
                حذف
              </button>
            </div>
          </div>
        ))}

      {!loading && items.length === 0 && !error && (
        <p className="muted">سؤالی نیست.</p>
      )}
    </main>
  );
}
