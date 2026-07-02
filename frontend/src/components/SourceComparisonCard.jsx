export default function SourceComparisonCard({ result }) {
  if (!result) return null;

  if (result.confidence === "low") {
    return (
      <div className="border border-stringDim/50 bg-surface rounded-sm p-5 font-mono text-sm text-inkDim">
        <p className="text-string mb-1">⚠ Low confidence</p>
        <p>
          Nothing in the current board plausibly matches this claim closely enough
          to call a source. Rather than guess, this is being shown as unresolved.
        </p>
      </div>
    );
  }

  const driftPct = Math.round((result.drift_score ?? 0) * 100);

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div className="relative pin bg-manila text-redaction rounded-sm p-5 shadow-lg">
        <p className="stamp-text text-stamp text-xs mb-2">DECLASSIFIED — PRIMARY SOURCE</p>
        <p className="font-mono text-sm">{result.best_match_doc_id}</p>
      </div>

      <div className="relative pin bg-surface2 border border-string/40 rounded-sm p-5 shadow-lg">
        <p className="stamp-text text-string text-xs mb-2">
          PUBLIC CLAIM — DRIFT {driftPct}%
        </p>
        <p className="font-mono text-sm text-ink mb-3">"{result.claim_text}"</p>
        <p className="text-inkDim text-xs uppercase tracking-wide mb-1">
          {result.drift_type?.replace("_", " ")}
        </p>
        <p className="text-inkDim text-xs">{result.explanation}</p>
      </div>
    </div>
  );
}
