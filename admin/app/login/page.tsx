'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, setAdminKey } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setAdminKey(key.trim());
    try {
      await adminApi.overview(); // اعتبارِ کلید را با یک درخواست بسنج
      router.push('/');
    } catch {
      setError('کلیدِ ادمین نادرست است یا سرور در دسترس نیست.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container" style={{ maxWidth: 420, marginTop: 80 }}>
      <h1 style={{ marginBottom: 4 }}>فوتبالیکا ⚽</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        پنل ادمین — برای ورود، کلیدِ ادمین را وارد کن.
      </p>
      <form onSubmit={submit} className="card" style={{ marginTop: 16 }}>
        <label className="muted">کلیدِ ادمین</label>
        <input
          className="input"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="x-admin-key"
          style={{ marginTop: 8 }}
          autoFocus
        />
        {error && (
          <p style={{ color: 'var(--wrong)', fontSize: 13 }}>{error}</p>
        )}
        <button
          className="btn btn-amber"
          type="submit"
          disabled={busy || !key.trim()}
          style={{ width: '100%', marginTop: 16 }}
        >
          {busy ? 'در حال بررسی…' : 'ورود'}
        </button>
      </form>
    </main>
  );
}
