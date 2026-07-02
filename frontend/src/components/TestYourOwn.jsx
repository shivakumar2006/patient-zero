import { useState } from "react";
import { testYourOwn } from "../api.js";

export default function TestYourOwn() {
  const [source, setSource] = useState("");
  const [claim, setClaim] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function run(e) {
    e.preventDefault();
    if (!source.trim() || !claim.trim()) return;
    setLoading(true);
    try {
      const res = await testYourOwn(source.trim(), claim.trim());
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-manilaDark/30 bg-surface rounded-sm p-5">
      <p className="stamp-text text-inkDim text-xs mb-3 uppercase tracking-wider">
        Test your own — paste anything, judge's choice
      </p>
      <form onSubmit={run} className="space-y-3">
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Paste a source document or statement..."
          rows={3}
          className="w-full bg-bg border border-manilaDark/30 text-ink font-mono text-sm p-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-string/60 placeholder:text-inkDim/50"
        />
        <textarea
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          placeholder="Paste a claim that might be derived from it..."
          rows={3}
          className="w-full bg-bg border border-manilaDark/30 text-ink font-mono text-sm p-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-string/60 placeholder:text-inkDim/50"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-string hover:bg-stringDim text-ink font-mono text-sm px-5 py-2.5 rounded-sm transition-colors disabled:opacity-50"
        >
          {loading ? "Comparing…" : "Compare"}
        </button>
      </form>

      {result && (
        <div className="mt-4 border-t border-manilaDark/20 pt-4 font-mono text-sm">
          {!result.is_related ? (
            <p className="text-inkDim">No meaningful relationship detected between these two.</p>
          ) : (
            <>
              <p className="text-string mb-1">
                Drift score: {Math.round((result.drift_score ?? 0) * 100)}% — {result.drift_type}
              </p>
              <p className="text-inkDim">{result.explanation}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
