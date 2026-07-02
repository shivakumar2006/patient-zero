import { useEffect, useState } from "react";
import ClaimSearchBar from "./components/ClaimSearchBar.jsx";
import DriftGraph from "./components/DriftGraph.jsx";
import SourceComparisonCard from "./components/SourceComparisonCard.jsx";
import TimelineChart from "./components/TimelineChart.jsx";
import TestYourOwn from "./components/TestYourOwn.jsx";
import { traceClaim, getTree, getTimeline } from "./api.js";

export default function App() {
  const [tree, setTree] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  useEffect(() => {
    getTree().then((d) => setTree(d.roots)).catch(() => {});
    getTimeline().then((d) => setTimeline(d.series)).catch(() => {});
  }, []);

  async function handleTrace(claimText) {
    setLoading(true);
    setSelectedClaim(null);
    try {
      const res = await traceClaim(claimText);
      setResult({ ...res, claim_text: claimText });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-manilaDark/20 px-6 py-8 text-center">
        <p className="stamp-text text-string text-xs tracking-[0.2em] mb-2">CASE FILE — OPEN</p>
        <h1 className="stamp-text text-3xl md:text-4xl text-ink">Patient Zero</h1>
        <p className="text-inkDim text-sm mt-2 max-w-xl mx-auto">
          Trace any claim back to its verified source — and see exactly where, and how
          far, it drifted on the way to you.
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-10 space-y-12">
        <section>
          <ClaimSearchBar onTrace={handleTrace} loading={loading} />
        </section>

        {result && (
          <section>
            <SourceComparisonCard result={result} />
          </section>
        )}

        <section>
          <p className="stamp-text text-inkDim text-xs mb-4 uppercase tracking-wider text-center">
            The board
          </p>
          <DriftGraph roots={tree} onSelectClaim={setSelectedClaim} />
          {selectedClaim && (
            <div className="mt-4 max-w-xl mx-auto bg-surface border border-manilaDark/30 rounded-sm p-4 font-mono text-sm">
              <p className="text-inkDim text-xs mb-1">{selectedClaim.platform} · {selectedClaim.posted}</p>
              <p className="text-ink mb-2">{selectedClaim.name}</p>
              <p className="text-string text-xs">
                Drift {Math.round((selectedClaim.drift_score ?? 0) * 100)}% — {selectedClaim.drift_type}
              </p>
              <p className="text-inkDim text-xs mt-1">{selectedClaim.explanation}</p>
            </div>
          )}
        </section>

        <section>
          <TimelineChart series={timeline} />
        </section>

        <section>
          <TestYourOwn />
        </section>
      </main>

      <footer className="text-center text-inkDim/50 text-xs font-mono mt-16">
        Primary sources: curated from the May 2026 PURSUE declassification release.
        Claims shown are illustrative examples, not scraped live posts.
      </footer>
    </div>
  );
}
