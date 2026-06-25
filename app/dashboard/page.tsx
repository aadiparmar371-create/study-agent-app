import { createClient } from '@/lib/supabase';

type ConceptRow = {
  id?: string;
  subject?: string | null;
  concept?: string | null;
  mastery_level?: string | null;
  overview_gist?: string | null;
  deep_dive_gist?: string[] | string | null;
  strong_areas?: string[] | string | null;
  weak_areas?: string[] | string | null;
  next_steps?: string[] | string | null;
  notes?: string | null;
  last_updated?: string | null;
};

const subjectColor: Record<string, string> = {
  Physics: 'bg-blue-600',
  Biology: 'bg-green-600',
  Mathematics: 'bg-purple-600',
  'Computer Science': 'bg-orange-500',
  Chemistry: 'bg-red-600',
};

function asArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return value.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  }
  return [String(value)];
}

function masteryScore(level?: string | null) {
  if (!level) return 0;
  const map: Record<string, number> = {
    Strong: 4,
    Proficient: 3,
    Developing: 2,
    Introduced: 1,
    'In Progress': 0,
  };
  return map[level] ?? 0;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data, error } = await supabase.from('concepts').select('*');

  const rows: ConceptRow[] = Array.isArray(data) ? data : [];

  const total = rows.length;
  const uniqueSubjects = new Set(rows.map((r) => (r.subject ?? '').trim())).size;
  const scores = rows.map((r) => masteryScore(r.mastery_level));
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const avgPercent = Math.round((avgScore / 4) * 100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-50">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Overview of studied concepts</p>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-sm text-slate-400">Total concepts</div>
          <div className="mt-2 text-2xl font-bold text-slate-50">{total}</div>
        </div>
        <div className="w-56 rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-sm text-slate-400">Unique subjects</div>
          <div className="mt-2 text-2xl font-bold text-slate-50">{uniqueSubjects}</div>
        </div>
        <div className="w-56 rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-sm text-slate-400">Average mastery</div>
          <div className="mt-2 text-2xl font-bold text-slate-50">{avgPercent}%</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((row, idx) => {
          const subj = row.subject ?? 'Unknown';
          const color = subjectColor[subj] ?? 'bg-slate-700';
          const score = masteryScore(row.mastery_level);
          const pct = Math.round((score / 4) * 100);
          const strong = asArray(row.strong_areas);
          const weak = asArray(row.weak_areas);
          const nextSteps = asArray(row.next_steps);

          return (
            <details key={row.id ?? idx} className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-slate-900 ${color}`}>{subj}</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-50">{row.concept}</div>
                    <div className="mt-1 text-xs text-slate-400">Last updated: {row.last_updated ? new Date(row.last_updated).toLocaleString() : '—'}</div>
                  </div>
                </div>

                <div className="flex w-80 max-w-[40%] flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">{row.mastery_level ?? 'In Progress'}</span>
                  </div>
                  <div className="w-full">
                    <div className="h-2 w-full rounded-full bg-slate-800">
                      <div className="h-2 rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </summary>

              <div className="mt-4 border-t border-slate-800 pt-4">
                <div className="mb-3 text-sm text-slate-300">Strong areas:</div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {strong.length ? strong.map((s, i) => (
                    <span key={i} className="rounded-full bg-green-700 px-3 py-1 text-xs font-medium text-slate-900">{s}</span>
                  )) : <span className="text-xs text-slate-500">None</span>}
                </div>

                <div className="mb-3 text-sm text-slate-300">Weak areas:</div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {weak.length ? weak.map((s, i) => (
                    <span key={i} className="rounded-full bg-rose-600 px-3 py-1 text-xs font-medium text-slate-900">{s}</span>
                  )) : <span className="text-xs text-slate-500">None</span>}
                </div>

                <div className="mb-3 text-sm text-slate-300">Next steps:</div>
                <div className="flex flex-wrap gap-2">
                  {nextSteps.length ? nextSteps.map((s, i) => (
                    <span key={i} className="rounded-full bg-sky-600 px-3 py-1 text-xs font-medium text-slate-900">{s}</span>
                  )) : <span className="text-xs text-slate-500">None</span>}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
