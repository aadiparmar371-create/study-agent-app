import { createClient } from '@supabase/supabase-js';

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="text-rose-300 text-center p-8">
            Error: Database not configured
          </div>
        </div>
      </div>
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase.from('concepts').select('*');

  const rows: ConceptRow[] = Array.isArray(data) ? data : [];

  const total = rows.length;
  const uniqueSubjects = new Set(rows.map((r) => (r.subject ?? '').trim())).size;
  const scores = rows.map((r) => masteryScore(r.mastery_level));
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const avgPercent = Math.round((avgScore / 4) * 100);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-slate-50">Your Learning Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Track your progress across all studied concepts</p>
        </div>

        {total === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-12 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-300 mb-2">No concepts saved yet</h2>
            <p className="text-slate-400 mb-4">Start by asking a question in the chat to save your first concept.</p>
            <a href="/" className="inline-block rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-500 transition">
              Go to Chat
            </a>
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/10">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Concepts</div>
                <div className="mt-3 text-3xl font-bold text-sky-400">{total}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/10">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Unique Subjects</div>
                <div className="mt-3 text-3xl font-bold text-emerald-400">{uniqueSubjects}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/10">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Average Mastery</div>
                <div className="mt-3 text-3xl font-bold text-violet-400">{avgPercent}%</div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-50 mb-4">Your Concepts</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {rows.map((row, idx) => {
                  const subj = row.subject ?? 'Unknown';
                  const color = subjectColor[subj] ?? 'bg-slate-700';
                  const score = masteryScore(row.mastery_level);
                  const pct = Math.round((score / 4) * 100);
                  const strong = asArray(row.strong_areas);
                  const weak = asArray(row.weak_areas);
                  const nextSteps = asArray(row.next_steps);
                  const overview = row.overview_gist ? String(row.overview_gist).slice(0, 150) : '';

                  return (
                    <details key={row.id ?? idx} className="group rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden hover:border-slate-700 transition">
                      <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 hover:bg-slate-800/50 transition">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-slate-900 flex-shrink-0 ${color}`}>
                            {subj}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-50 truncate">{row.concept}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {row.last_updated ? new Date(row.last_updated).toLocaleDateString() : '—'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">
                              {row.mastery_level ?? 'In Progress'}
                            </span>
                            <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full bg-sky-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                      </summary>

                      <div className="border-t border-slate-800 bg-slate-950/40 p-4 space-y-4">
                        {overview && (
                          <div>
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Overview</div>
                            <p className="text-sm text-slate-300 leading-relaxed">{overview}...</p>
                          </div>
                        )}

                        {strong.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Strong Areas</div>
                            <div className="flex flex-wrap gap-2">
                              {strong.map((s, i) => (
                                <span key={i} className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/30">
                                  ✓ {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {weak.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Areas to Improve</div>
                            <div className="flex flex-wrap gap-2">
                              {weak.map((s, i) => (
                                <span key={i} className="inline-flex items-center rounded-full bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-300 border border-rose-500/30">
                                  ⚠ {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {nextSteps.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Next Steps</div>
                            <ul className="space-y-1">
                              {nextSteps.map((s, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                  <span className="text-sky-400 flex-shrink-0 mt-0.5">→</span>
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
