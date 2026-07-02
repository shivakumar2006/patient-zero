import { useMemo, useState } from "react";

/**
 * Renders root (primary source) nodes across the top, each with its drifted
 * claims fanned out below, connected by a "string" whose color/thickness
 * encodes drift_score. This is the project's signature visual: a literal
 * evidence board, because the whole product is about tracing connections
 * between a verified document and what people now claim about it.
 */
export default function DriftGraph({ roots, onSelectClaim }) {
  const [hovered, setHovered] = useState(null);

  const layout = useMemo(() => buildLayout(roots || []), [roots]);

  if (!roots || roots.length === 0) {
    return (
      <div className="text-inkDim font-mono text-sm p-8 text-center">
        No board data yet. Run the seed step on the backend first.
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        width={layout.width}
        height={layout.height}
        className="block mx-auto"
        role="img"
        aria-label="Evidence board showing primary sources and their drifted claims"
      >
        {/* strings, drawn first so nodes sit on top */}
        {layout.edges.map((e, i) => {
          const t = e.drift_score ?? 0;
          const color = lerpColor(t);
          const width = 1.5 + t * 3.5;
          const dash = e.drift_type === "fabrication" ? "2 3" : "none";
          return (
            <path
              key={i}
              d={`M ${e.x1} ${e.y1} Q ${(e.x1 + e.x2) / 2} ${(e.y1 + e.y2) / 2 + 18} ${e.x2} ${e.y2}`}
              stroke={color}
              strokeWidth={width}
              strokeDasharray={dash}
              fill="none"
              opacity={hovered && hovered !== e.id ? 0.25 : 0.85}
            />
          );
        })}

        {/* root nodes - primary sources */}
        {layout.rootNodes.map((n) => (
          <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
            <rect
              x={-70}
              y={-22}
              width={140}
              height={44}
              rx={3}
              fill="#D4C49A"
              stroke="#8a7c54"
              strokeWidth={1}
            />
            <text
              x={0}
              y={-26}
              textAnchor="middle"
              className="stamp-text"
              fontSize="9"
              fill="#4A6B4A"
            >
              DECLASSIFIED
            </text>
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fontSize="10"
              fill="#1a1812"
              fontFamily="IBM Plex Mono"
            >
              {truncate(n.name, 22)}
            </text>
          </g>
        ))}

        {/* claim nodes */}
        {layout.claimNodes.map((n) => {
          const color = lerpColor(n.drift_score ?? 0);
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              onMouseEnter={() => setHovered(n.edgeId)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectClaim && onSelectClaim(n.raw)}
              style={{ cursor: "pointer" }}
            >
              <circle r={n.size} fill="#221F19" stroke={color} strokeWidth={2} />
              <text
                x={0}
                y={n.size + 13}
                textAnchor="middle"
                fontSize="8.5"
                fill="#A89F88"
                fontFamily="IBM Plex Mono"
              >
                {truncate(n.platform, 16)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// drift 0 -> manila/tan, drift 1 -> string red
function lerpColor(t) {
  const a = [184, 168, 124]; // manilaDark
  const b = [194, 59, 34]; // string
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(Math.max(t, 0), 1)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function buildLayout(roots = []) {
  const rootSpacing = 260;
  const rootY = 50;
  const claimY = 170;
  const width = Math.max(700, roots.length * rootSpacing + 100);

  const rootNodes = [];
  const claimNodes = [];
  const edges = [];

  roots.forEach((root, ri) => {
    const rx = 130 + ri * rootSpacing;
    rootNodes.push({ id: root.doc_id, name: root.name, x: rx, y: rootY });

    const children = root.children || [];
    const span = Math.min(rootSpacing - 40, Math.max(120, children.length * 70));
    children.forEach((child, ci) => {
      const cx =
        children.length === 1
          ? rx
          : rx - span / 2 + (span / (children.length - 1)) * ci;
      const id = `${root.doc_id}-${ci}`;
      claimNodes.push({
        id,
        edgeId: id,
        x: cx,
        y: claimY,
        size: child.size ? Math.max(8, Math.min(26, child.size)) : 14,
        platform: child.platform,
        drift_score: child.drift_score,
        raw: child,
      });
      edges.push({
        id,
        x1: rx,
        y1: rootY + 22,
        x2: cx,
        y2: claimY - 14,
        drift_score: child.drift_score,
        drift_type: child.drift_type,
      });
    });
  });

  const height = claimY + 60;
  return { rootNodes, claimNodes, edges, width, height };
}
