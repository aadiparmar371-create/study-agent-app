'use client';

import { useState } from 'react';

export default function SetupPage() {
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSetup = async () => {
    if (!serviceRoleKey.trim()) {
      setMessage({ type: 'error', text: 'Please paste your service role key' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceRoleKey }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '✅ Database configured! You can now save progress. Go back to the chat to test it.' });
        setServiceRoleKey('');
      } else {
        setMessage({ type: 'error', text: `Error: ${data.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Setup Study Agent</h1>
          <p className="text-slate-400 mb-8">Configure your database to enable save functionality</p>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-200 mb-3">Step 1: Get your Service Role Key</h2>
              <ol className="text-sm text-slate-300 space-y-2 ml-4">
                <li>1. Go to <a href="https://supabase.com/dashboard/project/cxapnlhptzsfobjmlvlt/settings/api" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">Supabase Settings → API</a></li>
                <li>2. Find <span className="font-mono bg-slate-800 px-2 py-1 rounded">service_role</span> under "Project API keys"</li>
                <li>3. Click the copy icon to copy the secret key</li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-200 mb-3">Step 2: Paste your Service Role Key</h2>
              <textarea
                value={serviceRoleKey}
                onChange={(e) => setServiceRoleKey(e.target.value)}
                placeholder="Paste your service_role secret key here (starts with eyJhbGci...)"
                className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSetup}
              disabled={loading || !serviceRoleKey.trim()}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Configuring...' : 'Configure Database'}
            </button>

            {message && (
              <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300' : 'bg-rose-500/20 border border-rose-500/50 text-rose-300'}`}>
                {message.text}
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-400">
              ℹ️ Your service role key is only used to configure database permissions and is never stored. After setup, you can return to the chat to save your progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
