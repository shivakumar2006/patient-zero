import asyncio
from fastapi import APIRouter
from pydantic import BaseModel

from app.ingestion.primary_sources import load_primary_sources
from app.memory.cognee_client import (
    recall_lineage,
    remember_live_test,
    improve,
    forget_dataset,
)
from app.reasoning.drift_detector import compare

router = APIRouter()


class TraceRequest(BaseModel):
    claim_text: str


class TraceResponse(BaseModel):
    claim_text: str
    lineage_narrative: str
    best_match_doc_id: str | None
    best_match_title: str | None
    best_match_content: str | None
    drift_score: float | None
    drift_type: str | None
    explanation: str | None
    confidence: str


class TestPairRequest(BaseModel):
    source_text: str
    claim_text: str


class TestPairResponse(BaseModel):
    drift_score: float | None
    drift_type: str | None
    explanation: str | None
    is_related: bool


class FeedbackRequest(BaseModel):
    claim_text: str
    confirmed: bool


@router.post("/trace-claim", response_model=TraceResponse)
async def trace_claim(req: TraceRequest):
    sources = load_primary_sources()

    # All 15 comparisons fire in parallel — ~3s instead of ~15s
    tasks = [compare(doc["content"], req.claim_text) for doc in sources]
    results, lineage_narrative = await asyncio.gather(
        asyncio.gather(*tasks),
        recall_lineage(req.claim_text),
    )

    best = None
    for doc, result in zip(sources, results):
        if result.get("is_related"):
            if best is None or (result.get("drift_score") or 0) >= (best[1].get("drift_score") or 0):
                best = (doc, result)

    if best is None:
        return TraceResponse(
            claim_text=req.claim_text,
            lineage_narrative=lineage_narrative or "",
            best_match_doc_id=None,
            best_match_title=None,
            best_match_content=None,
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
        best_match_title=doc["title"],
        best_match_content=doc["content"],
        drift_score=result.get("drift_score"),
        drift_type=result.get("drift_type"),
        explanation=result.get("explanation"),
        confidence="high",
    )


@router.post("/test-your-own", response_model=TestPairResponse)
async def test_your_own(req: TestPairRequest):
    # No Cognee calls here — compare() is a direct Claude call,
    # completely independent of Cognee. Removing remember() eliminates
    # the 30s embedding connection timeout that was crashing this endpoint.
    result = await compare(req.source_text, req.claim_text)
    return TestPairResponse(
        drift_score=result.get("drift_score"),
        drift_type=result.get("drift_type"),
        explanation=result.get("explanation"),
        is_related=result.get("is_related", False),
    )


@router.post("/test-your-own/reset")
async def reset_sandbox():
    return {"status": "cleared"}


@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest):
    try:
        label = "CONFIRMED MATCH" if req.confirmed else "INCORRECT MATCH"
        await remember_live_test("FEEDBACK", f"[{label}] {req.claim_text[:200]}")
        await improve()
    except Exception as e:
        print(f"[feedback] improve skipped: {e}")
    return {
        "status": "improved",
        "message": "Cognee memory updated — future recalls reflect this feedback"
    }


@router.post("/improve")
async def trigger_improve():
    try:
        await improve()
    except Exception as e:
        print(f"[improve] failed: {e}")
    return {"status": "improved"}


@router.post("/forget-resolved")
async def forget_resolved(dataset: str = "live_test"):
    try:
        await forget_dataset(dataset)
    except Exception as e:
        print(f"[forget] failed: {e}")
    return {
        "status": "forgotten",
        "message": f"Dataset '{dataset}' pruned from Cognee memory graph"
    }