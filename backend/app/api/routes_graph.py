"""
Endpoints that shape data specifically for the two main visuals:
  - /graph/tree      -> hierarchical tree for DriftGraph.jsx (react-force-graph / d3)
  - /graph/timeline   -> spread-velocity line chart data for Recharts
"""

from fastapi import APIRouter

from app.ingestion.primary_sources import load_primary_sources
from app.ingestion.claims_corpus import load_claims
from app.reasoning.drift_detector import compare

router = APIRouter()


@router.get("/graph/tree")
async def get_tree():
    """
    Builds a root-per-source tree: each primary source is a root node, each
    related claim becomes a child sized by how far it drifted. Computed live
    by re-running drift comparison rather than caching, since the curated
    corpus is small enough that this stays fast for a hackathon demo.
    """
    sources = load_primary_sources()
    claims = load_claims()

    tree = []
    for doc in sources:
        children = []
        for c in claims:
            result = await compare(doc["content"], c["text"])
            if result.get("is_related"):
                children.append(
                    {
                        "name": c["text"][:80] + ("..." if len(c["text"]) > 80 else ""),
                        "platform": c["platform"],
                        "posted": c["posted"],
                        "drift_score": result.get("drift_score"),
                        "drift_type": result.get("drift_type"),
                        "explanation": result.get("explanation"),
                        "size": 12 + 18 * (result.get("drift_score") or 0),
                    }
                )
        tree.append(
            {
                "name": doc["title"],
                "doc_id": doc["doc_id"],
                "released": doc["released"],
                "size": 40,
                "children": children,
            }
        )
    return {"roots": tree}


@router.get("/graph/timeline")
async def get_timeline():
    """
    Simple count-of-new-claims-per-day series, for the spread-velocity line
    chart. Walks the curated claims corpus by date.
    """
    claims = load_claims()
    counts: dict[str, int] = {}
    for c in claims:
        counts[c["posted"]] = counts.get(c["posted"], 0) + 1

    series = [{"date": d, "new_claims": n} for d, n in sorted(counts.items())]
    return {"series": series}
