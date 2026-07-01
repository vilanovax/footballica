'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, clearAdminKey, getAdminKey } from '@/lib/api';
import type { Overview } from '@/lib/types';
import { toFa } from '@/lib/fa';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAdminKey()) {
      router.replace('/login');
      return;
    }
    adminApi
      .overview()
      .then(setData)
      .catch(() => setError('دسترسی رد شد؛ دوباره وارد شو.'));
  }, [router]);

  const logout = () => {
    clearAdminKey();
    router.replace('/login');
  };

  return (
    <main className="container">
      <div className="row spread">
        <h1>داشبورد</h1>
        <button className="btn" onClick={logout}>
          خروج
        </button>
      </div>

      {error && <p style={{ color: 'var(--wrong)' }}>{error}</p>}

      {data && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginTop: 16,
            }}
          >
            <Stat label="کل سؤال‌ها" value={data.questions.total} />
            <Stat label="تأییدشده" value={data.questions.approved} />
            <Stat label="در انتظار" value={data.questions.pending} />
            <Stat label="دسته‌بندی‌ها" value={data.categories} />
            <Stat label="کل پاسخ‌ها" value={data.answers} />
          </div>

          <div className="row" style={{ marginTop: 24, gap: 12 }}>
            <Link className="btn btn-amber" href="/questions">
              مدیریت سؤال‌ها
            </Link>
            <Link className="btn" href="/questions/new">
              + سؤال جدید
            </Link>
            <Link className="btn" href="/bots">
              🤖 ربات‌ها
            </Link>
          </div>
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--amber)' }}>
        {toFa(value)}
      </div>
      <div className="muted">{label}</div>
    </div>
  );
}
