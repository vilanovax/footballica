'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, getAdminKey } from '@/lib/api';
import type { Category, Difficulty } from '@/lib/types';
import { DIFF_FA } from '@/lib/types';

interface OptionDraft {
  text: string;
  isCorrect: boolean;
}

const EMPTY: OptionDraft[] = [
  { text: '', isCorrect: true },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
];

export default function NewQuestionPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [categorySlug, setCategorySlug] = useState('');
  const [options, setOptions] = useState<OptionDraft[]>(EMPTY);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getAdminKey()) {
      router.replace('/login');
      return;
    }
    adminApi.categories().then(setCategories).catch(() => undefined);
  }, [router]);

  const setOptionText = (i: number, value: string) => {
    setOptions((prev) =>
      prev.map((o, idx) => (idx === i ? { ...o, text: value } : o)),
    );
  };

  const setCorrect = (i: number) => {
    setOptions((prev) => prev.map((o, idx) => ({ ...o, isCorrect: idx === i })));
  };

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, { text: '', isCorrect: false }]);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      // اگر گزینهٔ درست حذف شد، اولی را درست کن
      if (!next.some((o) => o.isCorrect) && next[0]) next[0].isCorrect = true;
      return [...next];
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const filled = options.filter((o) => o.text.trim() !== '');
    if (text.trim().length < 3) return setError('متنِ سؤال خیلی کوتاه است.');
    if (filled.length < 2) return setError('حداقل ۲ گزینه لازم است.');
    if (filled.filter((o) => o.isCorrect).length !== 1)
      return setError('دقیقاً یک گزینهٔ درست انتخاب کن.');

    setBusy(true);
    try {
      await adminApi.createQuestion({
        text: text.trim(),
        difficulty,
        categorySlug: categorySlug || undefined,
        options: filled.map((o) => ({
          text: o.text.trim(),
          isCorrect: o.isCorrect,
        })),
      });
      router.push('/questions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره');
      setBusy(false);
    }
  };

  return (
    <main className="container" style={{ maxWidth: 640 }}>
      <div className="row spread">
        <h1>سؤال جدید</h1>
        <Link className="btn" href="/questions">
          بازگشت
        </Link>
      </div>

      <form onSubmit={submit} className="card" style={{ display: 'grid', gap: 16 }}>
        <div>
          <label className="muted">متنِ سؤال</label>
          <textarea
            className="input"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="مثلاً: قهرمان جام جهانی ۲۰۱۸ کدام تیم بود؟"
          />
        </div>

        <div className="row" style={{ gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="muted">سختی</label>
            <select
              className="input"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              {(Object.keys(DIFF_FA) as Difficulty[]).map((d) => (
                <option key={d} value={d}>
                  {DIFF_FA[d]}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="muted">دسته‌بندی</label>
            <select
              className="input"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
            >
              <option value="">— بدون دسته —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="muted">
            گزینه‌ها (دایرهٔ کنارِ گزینهٔ درست را انتخاب کن)
          </label>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {options.map((o, i) => (
              <div key={i} className="row" style={{ gap: 8 }}>
                <input
                  type="radio"
                  name="correct"
                  checked={o.isCorrect}
                  onChange={() => setCorrect(i)}
                  aria-label="گزینهٔ درست"
                />
                <input
                  className="input"
                  value={o.text}
                  onChange={(e) => setOptionText(i, e.target.value)}
                  placeholder={`گزینهٔ ${i + 1}`}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => removeOption(i)}
                  disabled={options.length <= 2}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <button
              type="button"
              className="btn"
              onClick={addOption}
              style={{ marginTop: 8 }}
            >
              + گزینه
            </button>
          )}
        </div>

        {error && <p style={{ color: 'var(--wrong)', margin: 0 }}>{error}</p>}

        <button className="btn btn-amber" type="submit" disabled={busy}>
          {busy ? 'در حال ذخیره…' : 'ذخیرهٔ سؤال'}
        </button>
      </form>
    </main>
  );
}
