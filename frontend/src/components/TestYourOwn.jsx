import { useState } from "react";
import { testYourOwn } from "../api.js";

const DRIFT_COLORS = {
  faithful:           "#4A6B4A",
  mild_exaggeration:  "#B8880A",
  false_confirmation: "#C23B22",
  fabrication:        "#8B1A1A",
  unknown:            "#A89F88",
};

export default function TestYourOwn() {
  const [source,  setSource]  = useState("");
  const [claim,   setClaim]   = useState("");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function run(e) {
    e.preventDefault();
    if (!source.trim() || !claim.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await testYourOwn(source.trim(), claim.trim());
      setResult(res);
    } catch (err) {
      setError("Backend error — check that the server is running");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const driftColor = result?.drift_type
    ? (DRIFT_COLORS[result.drift_type] ?? DRIFT_COLORS.unknown)
    : DRIFT_COLORS.unknown;

  return (
    <div style={{
      border: "1px solid rgba(212,196,154,0.2)",
      background: "#221F19",
      borderRadius: 4,
      padding: "1.25rem 1.4rem",
    }}>
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: "0.65rem",
        color: "#A89F88",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        marginBottom: "1rem",
      }}>
        Test your own — paste anything, judge's choice
      </p>

      <form onSubmit={run} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Paste a source document or statement..."
          rows={3}
          style={{
            width: "100%",
            background: "#15140F",
            border: "1px solid rgba(212,196,154,0.25)",
            borderRadius: 3,
            color: "#E8E2D0",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.82rem",
            padding: "0.75rem",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <textarea
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          placeholder="Paste a claim that might be derived from it..."
          rows={3}
          style={{
            width: "100%",
            background: "#15140F",
            border: "1px solid rgba(212,196,154,0.25)",
            borderRadius: 3,
            color: "#E8E2D0",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.82rem",
            padding: "0.75rem",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            alignSelf: "flex-start",
            background: loading ? "#7A3024" : "#C23B22",
            color: "#E8E2D0",
            border: "none",
            borderRadius: 3,
            padding: "0.65rem 1.4rem",
            fontFamily: "'Special Elite', monospace",
            fontSize: "0.9rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            letterSpacing: "0.04em",
          }}
        >
          {loading ? "Comparing…" : "Compare"}
        </button>
      </form>

      {/* error */}
      {error && (
        <div style={{
          marginTop: "1rem",
          padding: "0.75rem 1rem",
          background: "rgba(194,59,34,0.1)",
          border: "1px solid rgba(194,59,34,0.4)",
          borderRadius: 3,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.8rem",
          color: "#C23B22",
        }}>
          ⚠ {error}
        </div>
      )}

      {/* result */}
      {result && (
        <div style={{
          marginTop: "1rem",
          borderTop: "1px solid rgba(212,196,154,0.15)",
          paddingTop: "1rem",
        }}>
          {!result.is_related ? (
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.82rem",
              color: "#A89F88",
            }}>
              No meaningful relationship detected between these two.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: "1.3rem",
                  color: driftColor,
                }}>
                  {Math.round((result.drift_score ?? 0) * 100)}%
                </span>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.72rem",
                  color: driftColor,
                  background: `${driftColor}18`,
                  border: `1px solid ${driftColor}44`,
                  borderRadius: 2,
                  padding: "2px 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>
                  {result.drift_type?.replace("_", " ")}
                </span>
              </div>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.8rem",
                color: "#A89F88",
                lineHeight: 1.65,
              }}>
                {result.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}