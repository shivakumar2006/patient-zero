"""
Graph data endpoints.

/graph/tree     -> evidence board tree — persisted to data/tree_cache.json after first build
/graph/timeline -> spread-velocity line chart  
/graph/stats    -> corpus stats panel
/graph/refresh  -> delete tree_cache.json and force a full rebuild (270 Claude calls)
                   ONLY call this when you've added new sources/claims
"""

import json
import time
from pathlib import Path
from fastapi import APIRouter

from app.ingestion.primary_sources import load_primary_sources
from app.ingestion.claims_corpus import load_claims
from app.reasoning.drift_detector import compare

router = APIRouter()

# Persistent on-disk cache so the tree survives server restarts.
# First build costs ~270 haiku calls (~$0.07), every subsequent load is free.
TREE_CACHE_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "tree_cache.json"

# In-memory layer on top of the file cache (avoids disk read on every request)
_mem_cache: dict = {"data": None}


def _load_from_disk():
    if TREE_CACHE_PATH.exists():
        with open(TREE_CACHE_PATH, "r") as f:
            return json.load(f)
    return None


def _save_to_disk(data):
    with open(TREE_CACHE_PATH, "w") as f:
        json.dump(data, f)


@router.get("/graph/tree")
async def get_tree():
    """
    Returns the evidence board tree.
    - If data/tree_cache.json exists: instant, zero API calls.
    - If not: builds it (270 haiku calls ~$0.07), then saves to disk.
    Call /graph/refresh to force rebuild after adding new data.
    """
    # 1. in-memory hit
    if _mem_cache["data"]:
        return _mem_cache["data"]

    # 2. disk hit
    cached = _load_from_disk()
    if cached:
        _mem_cache["data"] = cached
        return cached

    # 3. full build
    print("[tree] building from scratch — this will take a minute...")
    sources = load_primary_sources()
    claims  = load_claims()

    tree = []
    for doc in sources:
        children = []
        for c in claims:
            result = await compare(doc["content"], c["text"])
            if result.get("is_related"):
                children.append({
                    "name":        c["text"][:80] + ("..." if len(c["text"]) > 80 else ""),
                    "platform":    c["platform"],
                    "posted":      c["posted"],
                    "drift_score": result.get("drift_score"),
                    "drift_type":  result.get("drift_type"),
                    "explanation": result.get("explanation"),
                    "size":        12 + 18 * (result.get("drift_score") or 0),
                })
        tree.append({
            "name":     doc["title"],
            "doc_id":   doc["doc_id"],
            "released": doc["released"],
            "size":     40,
            "children": children,
        })

    data = {"roots": tree, "built_at": time.time()}
    _save_to_disk(data)
    _mem_cache["data"] = data
    print("[tree] built and cached to data/tree_cache.json")
    return data


@router.post("/graph/refresh")
async def refresh_tree():
    """
    Deletes the tree cache and forces a full rebuild on next /graph/tree call.
    ONLY use this after adding new sources or claims — it costs ~270 API calls.
    """
    _mem_cache["data"] = None
    if TREE_CACHE_PATH.exists():
        TREE_CACHE_PATH.unlink()
    return {"status": "cache cleared — next /graph/tree will rebuild (~270 haiku calls)"}


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
    """Stats for the home page panel — reflects known Cognee Mindmap numbers."""
    sources = load_primary_sources()
    claims  = load_claims()
    return {
        "primary_sources":  len(sources),
        "tracked_claims":   len(claims),
        "drift_types":      4,
        "declassified_files": 162,
        "cognee_nodes":     353,   # from Cognee Cloud Mindmap screenshot
        "cognee_edges":     783,
    }