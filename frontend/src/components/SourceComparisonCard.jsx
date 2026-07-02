/**
 * Side-by-side view: verified primary source (manila card, left) vs
 * public claim (dark card, right). Now receives full doc content from
 * the backend so it can render real source text, not just a doc ID.
 */

const DRIFT_COLORS = {
  faithful:          "#4A6B4A",
  mild_exaggeration: "#B8880A",
  false_confirmation:"#C23B22",
  fabrication:       "#8B1A1A",
  unknown:           "#A89F88",
};

const DRIFT_LABELS = {
  faithful:           "Faithful restatement",
  mild_exaggeration:  "Mild exaggeration",
  false_confirmation: "False confirmation",
  fabrication:        "Fabrication",
  unknown:            "Unknown drift",
};

export default function SourceComparisonCard({ result, onConfirm, onForget }) {
  if (!result) return null;

  /* ── low confidence fallback ── */
  if (result.confidence === "low") {
    return (
      <div style={{
        border: "1px solid rgba(194,59,34,0.4)",
        background: "#221F19",
        borderRadius: 4,
        padding: "1.25rem 1.4rem",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.82rem",
        color: "#A89F88",
      }}>
        <p style={{ color: "#C23B22", marginBottom: 6 }}>⚠ No confident match found</p>
        <p>Nothing in the current board plausibly connects to this claim closely enough
        to assert a source. Shown as unresolved rather than guessing.</p>
        {result.lineage_narrative && (
          <p style={{ marginTop: 12, color: "#E8E2D0", lineHeight: 1.6 }}>
            {result.lineage_narrative}
          </p>
        )}
      </div>
    );
  }

  const driftPct   = Math.round((result.drift_score ?? 0) * 100);
  const driftColor = DRIFT_COLORS[result.drift_type] ?? DRIFT_COLORS.unknown;
  const driftLabel = DRIFT_LABELS[result.drift_type] ?? "Unknown";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── side-by-side cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem",
      }}>

        {/* Primary source — manila */}
        <div style={{
          background: "#D4C49A",
          borderRadius: 4,
          padding: "1.25rem",
          position: "relative",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}>
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: "0.62rem",
            color: "#4A6B4A",
            letterSpacing: "0.16em",
            marginBottom: 8,
          }}>
            DECLASSIFIED — VERIFIED PRIMARY SOURCE
          </p>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.7rem",
            color: "#8a7c54",
            marginBottom: 10,
          }}>
            {result.best_match_title}
          </p>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.8rem",
            color: "#1a1812",
            lineHeight: 1.65,
          }}>
            {result.best_match_content}
          </p>
        </div>

        {/* Public claim — dark */}
        <div style={{
          background: "#221F19",
          border: `1px solid ${driftColor}66`,
          borderRadius: 4,
          padding: "1.25rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: "0.62rem",
              color: driftColor,
              letterSpacing: "0.14em",
            }}>
              PUBLIC CLAIM
            </span>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.68rem",
              background: `${driftColor}22`,
              color: driftColor,
              padding: "2px 8px",
              borderRadius: 2,
              border: `1px solid ${driftColor}55`,
            }}>
              {driftPct}% — {driftLabel}
            </span>
          </div>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.82rem",
            color: "#E8E2D0",
            lineHeight: 1.65,
            marginBottom: 12,
          }}>
            "{result.claim_text}"
          </p>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            color: "#A89F88",
            lineHeight: 1.6,
          }}>
            {result.explanation}
          </p>
        </div>
      </div>

      {/* ── Cognee lineage narrative ── */}
      {result.lineage_narrative && (
        <div style={{
          background: "#1A190F",
          border: "1px solid rgba(212,196,154,0.15)",
          borderRadius: 4,
          padding: "1rem 1.25rem",
        }}>
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: "0.62rem",
            color: "#4A6B4A",
            letterSpacing: "0.14em",
            marginBottom: 8,
          }}>
            COGNEE GRAPH TRAVERSAL — LINEAGE NARRATIVE
          </p>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.8rem",
            color: "#A89F88",
            lineHeight: 1.7,
          }}>
            {result.lineage_narrative}
          </p>
        </div>
      )}

      {/* ── improve() + forget() action buttons ── */}
      <div style={{
        display: "flex",
        gap: "0.75rem",
        flexWrap: "wrap",
      }}>
        <button
          onClick={() => onConfirm && onConfirm(true)}
          style={{
            background: "#4A6B4A",
            color: "#E8E2D0",
            border: "none",
            borderRadius: 3,
            padding: "0.6rem 1.2rem",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            cursor: "pointer",
            letterSpacing: "0.06em",
          }}
        >
          ✓ Confirm match → improve() memory
        </button>
        <button
          onClick={() => onConfirm && onConfirm(false)}
          style={{
            background: "#2A2620",
            color: "#A89F88",
            border: "1px solid rgba(168,159,136,0.3)",
            borderRadius: 3,
            padding: "0.6rem 1.2rem",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          ✗ Wrong match → improve() anyway
        </button>
        <button
          onClick={() => onForget && onForget()}
          style={{
            background: "#2A2620",
            color: "#C23B22",
            border: "1px solid rgba(194,59,34,0.3)",
            borderRadius: 3,
            padding: "0.6rem 1.2rem",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          ⊘ Archive resolved → forget()
        </button>
      </div>
    </div>
  );
}