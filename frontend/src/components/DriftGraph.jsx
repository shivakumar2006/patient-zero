import { useMemo, useState } from "react";

function stringColor(t) {
  const a = [184, 168, 124];
  const b = [194, 59, 34];
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(Math.max(t, 0), 1)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const CLAIM_R   = 17;   // circle radius
const MIN_GAP   = 10;   // min px between adjacent circle edges
const MIN_SPACE = CLAIM_R * 2 + MIN_GAP; // 44px per claim slot
const SOURCE_Y  = 58;
const CLAIM_Y   = SOURCE_Y + 150;

function buildLayout(roots = []) {
  if (!roots.length) return { rootNodes:[], claimNodes:[], edges:[], width:700, height:300 };

  // Dynamic column width — each source gets exactly as much space as its children need
  const colWidths = roots.map(r => {
    const n = (r.children || []).length;
    if (n === 0) return 100;
    return Math.max(160, n * MIN_SPACE + 40);
  });

  const totalWidth = Math.max(800, colWidths.reduce((a, b) => a + b, 0) + 60);
  const height     = CLAIM_Y + CLAIM_R + 50;

  const rootNodes = [], claimNodes = [], edges = [];
  let xOff = 30;

  roots.forEach((root, ri) => {
    const colW = colWidths[ri];
    const rx   = xOff + colW / 2;
    xOff      += colW;

    rootNodes.push({ id: root.doc_id, name: root.name, x: rx, y: SOURCE_Y });

    const children = root.children || [];
    children.forEach((child, ci) => {
      let cx;
      if (children.length === 1) {
        cx = rx;
      } else {
        const span = colW - 40;
        cx = rx - span / 2 + (span / (children.length - 1)) * ci;
      }

      const id = `${root.doc_id}-${ci}`;
      claimNodes.push({
        id, edgeId: id,
        x: cx, y: CLAIM_Y, r: CLAIM_R,
        drift_score: child.drift_score,
        drift_type:  child.drift_type,
        raw: child,
      });
      edges.push({
        id,
        x1: rx, y1: SOURCE_Y + 18,
        x2: cx, y2: CLAIM_Y - CLAIM_R,
        drift_score: child.drift_score,
        drift_type:  child.drift_type,
      });
    });
  });

  return { rootNodes, claimNodes, edges, width: totalWidth, height };
}

export default function DriftGraph({ roots, onSelectClaim }) {
  const [tooltip,  setTooltip]  = useState(null);
  const [selected, setSelected] = useState(null);

  const layout = useMemo(() => buildLayout(roots || []), [roots]);

  if (!roots) {
    return (
      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.8rem", color: "#A89F88",
        textAlign: "center", padding: "2rem 0",
      }}>
        Building the board — first load takes ~2 min, subsequent loads are instant…
      </p>
    );
  }

  if (roots.length === 0) {
    return (
      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.8rem", color: "#A89F88",
        textAlign: "center", padding: "2rem 0",
      }}>
        No board data yet.
      </p>
    );
  }

  return (
    <div style={{ position: "relative" }}>

      {/* legend */}
      <div style={{
        display: "flex", gap: "1.2rem",
        justifyContent: "center", flexWrap: "wrap",
        marginBottom: "0.9rem",
      }}>
        {[
          { label: "Faithful",           color: "#4A6B4A" },
          { label: "Mild exaggeration",  color: "#B8880A" },
          { label: "False confirmation", color: "#C23B22" },
          { label: "Fabrication",        color: "#8B1A1A", dashed: true },
        ].map(({ label, color, dashed }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width={22} height={8}>
              <line x1={0} y1={4} x2={22} y2={4}
                stroke={color} strokeWidth={2}
                strokeDasharray={dashed ? "3 3" : "none"} />
            </svg>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.6rem", color: "#A89F88",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* board */}
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg width={layout.width} height={layout.height}
          style={{ display: "block", margin: "0 auto" }}>

          {/* strings */}
          {layout.edges.map((e) => {
            const t     = e.drift_score ?? 0;
            const color = stringColor(t);
            const dim   = selected && selected !== e.id;
            return (
              <path key={e.id}
                d={`M ${e.x1} ${e.y1} Q ${(e.x1+e.x2)/2} ${(e.y1+e.y2)/2+22} ${e.x2} ${e.y2}`}
                stroke={color}
                strokeWidth={1.5 + t * 3.5}
                strokeDasharray={e.drift_type === "fabrication" ? "3 5" : "none"}
                fill="none"
                opacity={dim ? 0.12 : 0.85}
              />
            );
          })}

          {/* source cards */}
          {layout.rootNodes.map((n) => (
            <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
              <text y={-22} textAnchor="middle"
                fontFamily="'Special Elite', monospace"
                fontSize={7} fill="#4A6B4A" letterSpacing={3}>
                DECLASSIFIED
              </text>
              <rect x={-72} y={-18} width={144} height={36} rx={3}
                fill="#D4C49A" stroke="#8a7c54" strokeWidth={0.8} />
              <text y={4} textAnchor="middle"
                fontFamily="'IBM Plex Mono', monospace"
                fontSize={8.5} fill="#1a1812">
                {n.name.length > 24 ? n.name.slice(0,24)+"…" : n.name}
              </text>
            </g>
          ))}

          {/* claim circles */}
          {layout.claimNodes.map((n) => {
            const color = stringColor(n.drift_score ?? 0);
            const isSel = selected === n.edgeId;
            return (
              <g key={n.id} transform={`translate(${n.x}, ${n.y})`}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, data: n.raw })}
                onMouseMove={(e)  => setTooltip(p => p ? { ...p, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={()  => setTooltip(null)}
                onClick={() => {
                  setSelected(isSel ? null : n.edgeId);
                  if (!isSel) onSelectClaim && onSelectClaim(n.raw);
                }}
              >
                {isSel && <circle r={n.r + 5} fill="none" stroke={color} strokeWidth={1} opacity={0.4} />}
                <circle r={n.r} fill="#1A190F" stroke={color} strokeWidth={isSel ? 2.5 : 1.8} />
                <text textAnchor="middle" dominantBaseline="central"
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize={7.5} fontWeight="600" fill={color}>
                  {Math.round((n.drift_score ?? 0) * 100)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* hover tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x + 16, top: tooltip.y - 10,
          background: "#221F19",
          border: "1px solid rgba(212,196,154,0.25)",
          borderRadius: 4, padding: "0.65rem 0.9rem",
          maxWidth: 300, zIndex: 9999,
          pointerEvents: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.65rem", color: "#A89F88", marginBottom: 4,
          }}>
            {tooltip.data.platform} · {tooltip.data.posted}
          </p>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.78rem", color: "#E8E2D0",
            lineHeight: 1.55, marginBottom: 6,
          }}>
            "{tooltip.data.name}"
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.85rem", fontWeight: "600",
              color: stringColor(tooltip.data.drift_score ?? 0),
            }}>
              {Math.round((tooltip.data.drift_score ?? 0) * 100)}%
            </span>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.65rem",
              color: stringColor(tooltip.data.drift_score ?? 0),
              background: `${stringColor(tooltip.data.drift_score ?? 0)}18`,
              border: `1px solid ${stringColor(tooltip.data.drift_score ?? 0)}44`,
              borderRadius: 2, padding: "1px 6px",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {tooltip.data.drift_type?.replace(/_/g, " ")}
            </span>
          </div>
          {tooltip.data.explanation && (
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.68rem", color: "#A89F88",
              lineHeight: 1.5, marginTop: 6,
            }}>
              {tooltip.data.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}