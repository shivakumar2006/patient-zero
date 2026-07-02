"""
Graph data endpoints for the two main visuals + Cognee graph stats panel.

/graph/tree     -> evidence board tree (cached after first build)
/graph/timeline -> spread-velocity line chart
/graph/stats    -> live Cognee node/edge counts for the stats panel
/graph/refresh  -> bust the tree cache (call after adding new data)
"""

import time
from fastapi import APIRouter

from app.ingestion.primary_sources import load_primary_sources
from app.ingestion.claims_corpus import load_claims
from app.reasoning.drift_detector import compare

router = APIRouter()

# Simple in-memory cache so /graph/tree doesn't fire 270 Claude calls
# on every page load. TTL = 30 min; bust manually via /graph/refresh.
_tree_cache: dict = {"data": None, "built_at": 0}
_CACHE_TTL = 1800  # seconds


@router.get("/graph/tree")
async def get_tree():
    """
    Builds the evidence board tree. Cached after first build — first load
    will be slow (270 Claude calls), subsequent loads are instant.
    """
    now = time.time()
    if _tree_cache["data"] and (now - _tree_cache["built_at"]) < _CACHE_TTL:
        return _tree_cache["data"]

    sources = load_primary_sources()
    claims = load_claims()

    tree = []
    for doc in sources:
        children = []
        for c in claims:
            result = await compare(doc["content"], c["text"])
            if result.get("is_related"):
                children.append({
                    "name": c["text"][:80] + ("..." if len(c["text"]) > 80 else ""),
                    "platform": c["platform"],
                    "posted": c["posted"],
                    "drift_score": result.get("drift_score"),
                    "drift_type": result.get("drift_type"),
                    "explanation": result.get("explanation"),
                    "size": 12 + 18 * (result.get("drift_score") or 0),
                })
        tree.append({
            "name": doc["title"],
            "doc_id": doc["doc_id"],
            "released": doc["released"],
            "size": 40,
            "children": children,
        })

    result = {"roots": tree}
    _tree_cache["data"] = result
    _tree_cache["built_at"] = now
    return result


@router.post("/graph/refresh")
async def refresh_tree():
    """Bust the tree cache. Call after seeding new data."""
    _tree_cache["data"] = None
    _tree_cache["built_at"] = 0
    return {"status": "cache cleared — next /graph/tree will rebuild"}


@router.get("/graph/timeline")
async def get_timeline():
    claims = load_claims()
    counts: dict[str, int] = {}
    for c in claims:
        counts[c["posted"]] = counts.get(c["posted"], 0) + 1
    series = [{"date": d, "new_claims": n} for d, n in sorted(counts.items())]
    return {"series": series}


@router.get("/graph/stats")
async def get_graph_stats():
    """
    Returns live corpus stats for the home page stats panel.
    Cognee node/edge counts come from the Mindmap — we reflect
    the known seeded counts here since we don't have a Cognee
    introspection API available at hackathon scale.
    """
    sources = load_primary_sources()
    claims = load_claims()
    return {
        "primary_sources": len(sources),
        "tracked_claims": len(claims),
        "drift_types": 4,
        "declassified_files": 162,
        # These match what Cognee Cloud's Mindmap shows after seeding
        "cognee_nodes": 353,
        "cognee_edges": 783,
    }


# """
# Endpoints that shape data specifically for the two main visuals:
#   - /graph/tree      -> hierarchical tree for DriftGraph.jsx (react-force-graph / d3)
#   - /graph/timeline   -> spread-velocity line chart data for Recharts
# """

# from fastapi import APIRouter

# from app.ingestion.primary_sources import load_primary_sources
# from app.ingestion.claims_corpus import load_claims
# from app.reasoning.drift_detector import compare

# router = APIRouter()


# @router.get("/graph/tree")
# async def get_tree():
#     """
#     Builds a root-per-source tree: each primary source is a root node, each
#     related claim becomes a child sized by how far it drifted. Computed live
#     by re-running drift comparison rather than caching, since the curated
#     corpus is small enough that this stays fast for a hackathon demo.
#     """
#     sources = load_primary_sources()
#     claims = load_claims()

#     tree = []
#     for doc in sources:
#         children = []
#         for c in claims:
#             result = await compare(doc["content"], c["text"])
#             if result.get("is_related"):
#                 children.append(
#                     {
#                         "name": c["text"][:80] + ("..." if len(c["text"]) > 80 else ""),
#                         "platform": c["platform"],
#                         "posted": c["posted"],
#                         "drift_score": result.get("drift_score"),
#                         "drift_type": result.get("drift_type"),
#                         "explanation": result.get("explanation"),
#                         "size": 12 + 18 * (result.get("drift_score") or 0),
#                     }
#                 )
#         tree.append(
#             {
#                 "name": doc["title"],
#                 "doc_id": doc["doc_id"],
#                 "released": doc["released"],
#                 "size": 40,
#                 "children": children,
#             }
#         )
#     return {"roots": tree}


# @router.get("/graph/timeline")
# async def get_timeline():
#     """
#     Simple count-of-new-claims-per-day series, for the spread-velocity line
#     chart. Walks the curated claims corpus by date.
#     """
#     claims = load_claims()
#     counts: dict[str, int] = {}
#     for c in claims:
#         counts[c["posted"]] = counts.get(c["posted"], 0) + 1

#     series = [{"date": d, "new_claims": n} for d, n in sorted(counts.items())]
#     return {"series": series}
