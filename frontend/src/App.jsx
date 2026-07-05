import { useEffect, useState } from "react";
import ClaimSearchBar from "./components/ClaimSearchBar.jsx";
import DriftGraph from "./components/DriftGraph.jsx";
import SourceComparisonCard from "./components/SourceComparisonCard.jsx";
import TimelineChart from "./components/TimelineChart.jsx";
import TestYourOwn from "./components/TestYourOwn.jsx";
import { traceClaim, getTree, getTimeline } from "./api.js";

const API = import.meta.env.VITE_API_URL || "/api";

async function submitFeedback(claim_text, confirmed) {
  const res = await fetch(`${API}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ claim_text, confirmed }),
  });
  return res.json();
}

async function forgetResolved() {
  const res = await fetch(`${API}/forget-resolved`, { method: "POST" });
  return res.json();
}

export default function App() {
  const [tree, setTree]                   = useState(null);
  const [timeline, setTimeline]           = useState(null);
  const [result, setResult]               = useState(null);
  const [loading, setLoading]             = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [toast, setToast]                 = useState(null);
  const [treeStats, setTreeStats]         = useState(null);

  useEffect(() => {
    getTree()
      .then((d) => {
        setTree(d.roots);
        // compute live stats from tree data
        if (d.roots) {
          const totalClaims = d.roots.reduce((acc, r) => acc + (r.children?.length || 0), 0);
          const activeSources = d.roots.filter(r => r.children?.length > 0).length;
          setTreeStats({ sources: activeSources, claims: totalClaims });
        }
      })
      .catch(console.error);

    getTimeline()
      .then((d) => setTimeline(d.series))
      .catch(console.error);
  }, []);

  function showToast(text, color = "#4A6B4A") {
    setToast({ text, color });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleTrace(claimText) {
    setLoading(true);
    setSelectedClaim(null);
    setResult(null);
    try {
      const res = await traceClaim(claimText);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(confirmed) {
    if (!result) return;
    try {
      await submitFeedback(result.claim_text, confirmed);
      showToast(
        confirmed
          ? "✓ Match confirmed — Cognee improve() complete. Graph weights updated."
          : "✗ Mismatch flagged — Cognee improve() complete. Future recalls adjusted.",
        confirmed ? "#4A6B4A" : "#B8880A"
      );
    } catch {
      showToast("improve() failed — check backend", "#C23B22");
    }
  }

  async function handleForget() {
    try {
      await forgetResolved();
      showToast("⊘ forget() executed — sandbox dataset pruned from Cognee graph.", "#C23B22");
      setResult(null);
    } catch {
      showToast("forget() failed — check backend", "#C23B22");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#15140F", color: "#E8E2D0" }}>

      {/* toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 999,
          background: "#221F19",
          border: `1px solid ${toast.color}`,
          borderRadius: 4,
          padding: "0.75rem 1.25rem",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.78rem",
          color: toast.color,
          maxWidth: 420,
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}>
          {toast.text}
        </div>
      )}

      {/* header */}
      <header style={{
        borderBottom: "1px solid rgba(212,196,154,0.15)",
        padding: "2rem",
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: "0.7rem",
          color: "#C23B22",
          letterSpacing: "0.2em",
          marginBottom: 8,
        }}>
          CASE FILE — OPEN
        </p>
        <h1 style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          color: "#E8E2D0",
          marginBottom: 10,
        }}>
          Patient Zero
        </h1>
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.85rem",
          color: "#A89F88",
          maxWidth: 520,
          margin: "0 auto",
          lineHeight: 1.7,
        }}>
          Trace any claim back to its verified source — and see exactly
          where, and how far, it drifted on the way to you.
        </p>

        {/* live tree stats */}
        {treeStats && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            marginTop: "1rem",
          }}>
            {[
              { value: treeStats.sources, label: "Primary sources" },
              { value: treeStats.claims,  label: "Tracked claims" },
              { value: "353",             label: "Cognee nodes" },
              { value: "783",             label: "Graph edges" },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: "1.4rem",
                  color: "#C23B22",
                  lineHeight: 1,
                  marginBottom: 2,
                }}>
                  {value}
                </p>
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.6rem",
                  color: "#A89F88",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1.5rem 4rem" }}>

        {/* search */}
        <section style={{ marginBottom: "2.5rem" }}>
          <ClaimSearchBar onTrace={handleTrace} loading={loading} />
        </section>

        {/* comparison result */}
        {result && (
          <section style={{ marginBottom: "3rem" }}>
            <SourceComparisonCard
              result={result}
              onConfirm={handleConfirm}
              onForget={handleForget}
            />
          </section>
        )}

        {/* board */}
        <section style={{ marginBottom: "3rem" }}>
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: "0.65rem",
            color: "#A89F88",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: "1rem",
          }}>
            The Board
          </p>
          {!tree && (
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.8rem",
              color: "#A89F88",
              textAlign: "center",
            }}>
              Building the board — first load computes all drift scores,
              give it a minute…
            </p>
          )}
          <DriftGraph roots={tree} onSelectClaim={setSelectedClaim} />

          {selectedClaim && (
            <div style={{
              maxWidth: 600,
              margin: "1rem auto 0",
              background: "#221F19",
              border: "1px solid rgba(212,196,154,0.2)",
              borderRadius: 4,
              padding: "1rem 1.25rem",
            }}>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.7rem",
                color: "#A89F88",
                marginBottom: 4,
              }}>
                {selectedClaim.platform} · {selectedClaim.posted}
              </p>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.85rem",
                color: "#E8E2D0",
                lineHeight: 1.6,
                marginBottom: 8,
              }}>
                {selectedClaim.name}
              </p>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
                color: "#C23B22",
              }}>
                Drift {Math.round((selectedClaim.drift_score ?? 0) * 100)}%
                — {selectedClaim.drift_type}
              </p>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                color: "#A89F88",
                marginTop: 4,
              }}>
                {selectedClaim.explanation}
              </p>
            </div>
          )}
        </section>

        {/* timeline */}
        <section style={{ marginBottom: "3rem" }}>
          <TimelineChart series={timeline} />
        </section>

        {/* sandbox */}
        <section>
          <TestYourOwn />
        </section>

      </main>

      <footer style={{
        borderTop: "1px solid rgba(212,196,154,0.1)",
        padding: "1rem 2rem",
        textAlign: "center",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.62rem",
        color: "rgba(168,159,136,0.4)",
      }}>
        Primary sources: curated from the May 2026 PURSUE declassification release.
        Claims shown are illustrative examples based on documented public reaction patterns.
        Built with Cognee Cloud + Claude API for The Hangover Part AI hackathon.
      </footer>
    </div>
  );
}