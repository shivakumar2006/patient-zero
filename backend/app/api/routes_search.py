"""
Core API routes for tracing claim lineage and running the live "test your own"
sandbox that judges can use during the demo.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.ingestion.primary_sources import load_primary_sources
from app.memory.cognee_client import (
    recall_candidates,
    recall_lineage,
    remember_live_test,
    reset_live_test_sandbox,
    improve,
)
from app.reasoning.drift_detector import compare

router = APIRouter()


class TraceRequest(BaseModel):
    claim_text: str


class TraceResponse(BaseModel):
    claim_text: str
    lineage_narrative: str
    best_match_doc_id: str | None
    drift_score: float | None
    drift_type: str | None
    explanation: str | None
    confidence: str  # "high" | "low" - drives the honest-fallback UI state


class TestPairRequest(BaseModel):
    source_text: str
    claim_text: str


class TestPairResponse(BaseModel):
    drift_score: float | None
    drift_type: str | None
    explanation: str | None
    is_related: bool


@router.post("/trace-claim", response_model=TraceResponse)
async def trace_claim(req: TraceRequest):
    """
    Given any claim (judge-typed or pre-loaded), find its most likely primary
    source and compute drift. If nothing in the graph plausibly matches, return
    an honest low-confidence response instead of guessing.
    """
    candidates_text = await recall_candidates(req.claim_text)
    lineage_narrative = await recall_lineage(req.claim_text)

    # Score the claim against every curated primary source directly.
    # (For a hackathon-scale corpus this direct comparison is more reliable
    # than trusting Cognee's recall alone to have surfaced the right doc id -
    # recall finds candidates, but we still need an explicit, scoreable
    # claim-vs-source judgment to drive the UI confidently.)
    sources = load_primary_sources()
    best = None
    for doc in sources:
        result = await compare(doc["content"], req.claim_text)
        if result.get("is_related"):
            if best is None or (result.get("drift_score") or 0) >= (best[1].get("drift_score") or 0):
                best = (doc, result)

    if best is None:
        return TraceResponse(
            claim_text=req.claim_text,
            lineage_narrative=lineage_narrative or candidates_text,
            best_match_doc_id=None,
            drift_score=None,
            drift_type=None,
            explanation=None,
            confidence="low",
        )

    doc, result = best
    return TraceResponse(
        claim_text=req.claim_text,
        lineage_narrative=lineage_narrative,
        best_match_doc_id=doc["doc_id"],
        drift_score=result.get("drift_score"),
        drift_type=result.get("drift_type"),
        explanation=result.get("explanation"),
        confidence="high",
    )


@router.post("/test-your-own", response_model=TestPairResponse)
async def test_your_own(req: TestPairRequest):
    """
    Sandbox endpoint for the live demo: judge pastes ANY source + claim pair.
    Writes into the isolated 'live_test' dataset so the curated main graph
    is never polluted by demo input.
    """
    await remember_live_test("SOURCE", req.source_text)
    await remember_live_test("CLAIM", req.claim_text)

    result = await compare(req.source_text, req.claim_text)

    return TestPairResponse(
        drift_score=result.get("drift_score"),
        drift_type=result.get("drift_type"),
        explanation=result.get("explanation"),
        is_related=result.get("is_related", False),
    )


@router.post("/test-your-own/reset")
async def reset_sandbox():
    """Clear the live-test sandbox between judges/demo runs."""
    await reset_live_test_sandbox()
    return {"status": "cleared"}


@router.post("/improve")
async def trigger_improve():
    """Manually trigger memify - lets the demo show a visible before/after confidence change."""
    await improve()
    return {"status": "improved"}
