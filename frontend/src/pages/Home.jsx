import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── tiny hook: count up a number on mount ─── */
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

/* ─── mini SVG evidence-board preview ─── */
function MiniBoard() {
  const nodes = [
    { x: 160, y: 32, label: "PRIMARY SOURCE", manila: true },
    { x: 60,  y: 110, score: 0.2, label: "mild drift" },
    { x: 160, y: 118, score: 0.65, label: "exaggerated" },
    { x: 265, y: 108, score: 0.95, label: "fabricated" },
  ];

  function stringColor(t) {
    const a = [184, 168, 124];
    const b = [194, 59, 34];
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  return (
    <svg viewBox="0 0 330 155" width="100%" style={{ maxWidth: 380 }} aria-hidden="true">
      {/* strings */}
      {nodes.slice(1).map((n, i) => (
        <path
          key={i}
          d={`M ${nodes[0].x} ${nodes[0].y + 14} Q ${(nodes[0].x + n.x) / 2} ${(nodes[0].y + n.y) / 2 + 10} ${n.x} ${n.y - 10}`}
          stroke={stringColor(n.score)}
          strokeWidth={1.5 + n.score * 3}
          fill="none"
          opacity={0.85}
        />
      ))}

      {/* root */}
      <rect x={nodes[0].x - 58} y={nodes[0].y - 14} width={116} height={28} rx={3}
        fill="#D4C49A" stroke="#8a7c54" strokeWidth={0.8} />
      <text x={nodes[0].x} y={nodes[0].y - 18} textAnchor="middle"
        fontFamily="'Special Elite', monospace" fontSize={7} fill="#4A6B4A">
        DECLASSIFIED
      </text>
      <text x={nodes[0].x} y={nodes[0].y + 3} textAnchor="middle"
        fontFamily="'IBM Plex Mono', monospace" fontSize={9} fill="#1a1812">
        Pentagon PURSUE File
      </text>

      {/* claim nodes */}
      {nodes.slice(1).map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={14} fill="#221F19"
            stroke={stringColor(n.score)} strokeWidth={1.8} />
          <text x={n.x} y={n.y + 26} textAnchor="middle"
            fontFamily="'IBM Plex Mono', monospace" fontSize={7.5} fill="#A89F88">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ─── stat pill ─── */
function Stat({ value, label }) {
  const count = useCountUp(value);
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: "2.4rem",
        color: "#C23B22",
        lineHeight: 1,
        marginBottom: 4,
      }}>
        {count}
      </p>
      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.7rem",
        color: "#A89F88",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}>
        {label}
      </p>
    </div>
  );
}

/* ─── feature card ─── */
function FeatureCard({ op, title, desc, color }) {
  return (
    <div style={{
      background: "#221F19",
      border: `1px solid ${color}33`,
      borderRadius: 4,
      padding: "1.25rem 1.4rem",
      position: "relative",
    }}>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.7rem",
        color,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        marginBottom: 8,
        display: "block",
      }}>
        {op}
      </span>
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: "1rem",
        color: "#E8E2D0",
        marginBottom: 6,
      }}>
        {title}
      </p>
      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.78rem",
        color: "#A89F88",
        lineHeight: 1.6,
      }}>
        {desc}
      </p>
    </div>
  );
}

/* ─── main ─── */
export default function Home({ onEnter }) {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#15140F",
      color: "#E8E2D0",
      display: "flex",
      flexDirection: "column",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.5s ease",
    }}>

      {/* ── top bar ── */}
      <div style={{
        borderBottom: "1px solid rgba(212,196,154,0.15)",
        padding: "0.75rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: "0.75rem",
          color: "#4A6B4A",
          letterSpacing: "0.18em",
        }}>
          CASE FILE — OPEN
        </span>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.68rem",
          color: "#A89F88",
        }}>
          PURSUE DECLASSIFICATION / 2026-05-08
        </span>
      </div>

      {/* ── hero ── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 1.5rem 2rem",
        textAlign: "center",
        gap: "1.5rem",
      }}>

        {/* redaction teaser */}
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.75rem",
          color: "#A89F88",
          letterSpacing: "0.1em",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          ORIGIN:
          <span style={{
            display: "inline-block",
            background: "#0B0B0A",
            width: 90,
            height: "0.85em",
            verticalAlign: "middle",
            borderRadius: 1,
          }} />
          &nbsp;MUTATION:
          <span style={{
            display: "inline-block",
            background: "#0B0B0A",
            width: 60,
            height: "0.85em",
            verticalAlign: "middle",
            borderRadius: 1,
          }} />
        </div>

        {/* title */}
        <div>
          <h1 style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
            color: "#E8E2D0",
            letterSpacing: "0.06em",
            lineHeight: 1,
            marginBottom: "0.6rem",
          }}>
            Patient Zero
          </h1>
          <div style={{
            width: 60,
            height: 2,
            background: "#C23B22",
            margin: "0 auto 1.1rem",
            borderRadius: 1,
          }} />
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "clamp(0.85rem, 2vw, 1.05rem)",
            color: "#A89F88",
            maxWidth: 480,
            lineHeight: 1.7,
            margin: "0 auto",
          }}>
            Every viral claim has an origin. Most of them started as something
            far quieter. We trace the drift — from verified source to what the
            internet actually believes.
          </p>
        </div>

        {/* mini board preview */}
        <div style={{
          width: "100%",
          maxWidth: 380,
          background: "#1A190F",
          border: "1px solid rgba(212,196,154,0.12)",
          borderRadius: 6,
          padding: "1.25rem 1rem 0.5rem",
          position: "relative",
        }}>
          <span style={{
            position: "absolute",
            top: 8, left: 12,
            fontFamily: "'Special Elite', monospace",
            fontSize: "0.62rem",
            color: "#4A6B4A",
            letterSpacing: "0.14em",
          }}>
            THE BOARD
          </span>
          <MiniBoard />
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/app")}
          style={{
            background: "#C23B22",
            color: "#E8E2D0",
            border: "none",
            borderRadius: 3,
            padding: "0.85rem 2.5rem",
            fontFamily: "'Special Elite', monospace",
            fontSize: "1rem",
            letterSpacing: "0.08em",
            cursor: "pointer",
            transition: "background 0.18s",
            marginTop: "0.5rem",
          }}
          onMouseEnter={(e) => e.target.style.background = "#7A3024"}
          onMouseLeave={(e) => e.target.style.background = "#C23B22"}
        >
          Open the Board →
        </button>
      </div>

      {/* ── stats bar ── */}
      <div style={{
        borderTop: "1px solid rgba(212,196,154,0.12)",
        borderBottom: "1px solid rgba(212,196,154,0.12)",
        display: "flex",
        justifyContent: "center",
        gap: "3.5rem",
        padding: "1.5rem 2rem",
        flexWrap: "wrap",
      }}>
        <Stat value={15} label="Primary sources" />
        <Stat value={18} label="Tracked claims" />
        <Stat value={4}  label="Drift types" />
        <Stat value={162} label="Declassified files" />
      </div>

      {/* ── feature cards ── */}
      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "2.5rem 1.5rem 3rem",
        width: "100%",
      }}>
        <p style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: "0.7rem",
          color: "#A89F88",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: "1.5rem",
        }}>
          How the memory works
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "1rem",
        }}>
          <FeatureCard
            op="remember()"
            title="Ground truth is ingested"
            desc="Verified declassified documents become permanent nodes in Cognee's knowledge graph — the baseline every claim is measured against."
            color="#D4C49A"
          />
          <FeatureCard
            op="recall()"
            title="Origins are traced"
            desc="Hybrid graph + vector search connects a viral claim back to its source — even when the words have completely changed."
            color="#7BA7D4"
          />
          <FeatureCard
            op="improve()"
            title="Confidence sharpens"
            desc="Each confirmed match reinforces the graph's edge weights. The more claims that are traced, the more precisely drift is detected."
            color="#4A6B4A"
          />
          <FeatureCard
            op="forget()"
            title="Resolved cases are pruned"
            desc="When a claim lineage is fully resolved, it's surgically removed — keeping the graph focused on active, unresolved drift threads."
            color="#C23B22"
          />
        </div>
      </div>

      {/* ── footer ── */}
      <div style={{
        borderTop: "1px solid rgba(212,196,154,0.1)",
        padding: "1rem 2rem",
        textAlign: "center",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.65rem",
        color: "rgba(168,159,136,0.45)",
      }}>
        Primary sources: curated from the May 2026 PURSUE declassification release.
        Claims shown are illustrative examples based on documented public reaction patterns.
        Built with Cognee Cloud + Claude API for The Hangover Part AI hackathon.
      </div>

    </div>
  );
}