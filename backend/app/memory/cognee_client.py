"""
Cognee memory layer wrapper for Patient Zero.

Wraps Cognee's remember/recall/improve/forget lifecycle with conventions
specific to our graph schema:
  - PRIMARY SOURCE nodes  -> verified government documents (ground truth)
  - CLAIM nodes           -> public posts/claims that may reference a source
  - DRIFTED_FROM edges    -> inferred by the drift_detector, not by Cognee itself

Cognee builds the underlying graph automatically via cognify() during remember().
We just control what text goes in, and how we query it back out.
"""

import os
import cognee

# Dataset names (used for scoped forget() calls)
MAIN_DATASET = "patient_zero_main"
LIVE_TEST_DATASET = "live_test"


async def configure():
    await cognee.serve(
        url=os.environ["COGNEE_BASE_URL"],
        api_key=os.environ["COGNEE_API_KEY"],
    )
    """
    One-time setup. Call once at app startup (see main.py lifespan).
    Uses Claude as the reasoning LLM behind Cognee's own graph extraction step,
    so cognify() and Claude-based drift detection use the same model family.
    """
    cognee.config.set_llm_config(
        {
            "llm_provider": "anthropic",
            "llm_model": "claude-sonnet-4-6",
            "llm_api_key": os.environ["ANTHROPIC_API_KEY"],
        }
    )


def _extract_text(recall_result) -> str:
    """
    cognee.recall() returns a list of structured entries (ResponseQAEntry,
    ResponseGraphContextEntry, etc.), not a plain string - verified against
    the installed cognee==1.2.2 package directly. Most entries expose an
    `.answer` field; others expose `.context` or fall back to str().
    This pulls a single readable string out of whatever shape comes back,
    instead of assuming a fixed type.
    """
    if recall_result is None:
        return ""
    if isinstance(recall_result, str):
        return recall_result
    if not isinstance(recall_result, list):
        recall_result = [recall_result]

    parts = []
    for entry in recall_result:
        text = getattr(entry, "answer", None) or getattr(entry, "context", None)
        parts.append(text if text else str(entry))
    return "\n\n".join(p for p in parts if p)


async def remember_primary_source(doc_id: str, title: str, content: str, released: str) -> None:
    """Ingest one verified, real government document as a ground-truth node."""
    text = (
        f"[PRIMARY SOURCE | VERIFIED]\n"
        f"Document ID: {doc_id}\n"
        f"Title: {title}\n"
        f"Released: {released}\n"
        f"Content: {content}\n"
        f"This document is an official primary source. Any claim that contradicts or "
        f"exaggerates beyond what is written here should be treated as drift."
    )
    # dataset_name is the real keyword cognee.remember() expects (confirmed via
    # inspect.signature on the installed package) - passing it explicitly is what
    # actually scopes this write to MAIN_DATASET instead of silently landing in
    # cognee's own default 'main_dataset'.
    await cognee.remember(text, dataset_name=MAIN_DATASET)


async def remember_claim(claim_id: str, platform: str, claim_text: str, posted: str) -> None:
    """Ingest one public claim/post that may be a mutation of a primary source."""
    text = (
        f"[PUBLIC CLAIM]\n"
        f"Claim ID: {claim_id}\n"
        f"Platform: {platform}\n"
        f"Posted: {posted}\n"
        f"Text: {claim_text}"
    )
    await cognee.remember(text, dataset_name=MAIN_DATASET)


async def remember_live_test(label: str, text: str) -> None:
    """
    Ingest a judge-supplied source/claim pair into a SEPARATE sandbox dataset,
    so live demo input never pollutes the curated main graph. This isolation
    only actually works because dataset_name is passed explicitly below - an
    earlier version of this function forgot the kwarg entirely and silently
    wrote everything into cognee's default dataset instead.
    """
    await cognee.remember(f"[LIVE TEST | {label}]\n{text}", dataset_name=LIVE_TEST_DATASET)


async def recall_candidates(claim_text: str) -> str:
    """
    Hybrid recall: ask Cognee to find anything in the graph - by semantic
    similarity OR graph relationship - that could be the origin of this claim.
    """
    result = await cognee.recall(
        f"Find any primary source documents or earlier claims that this statement "
        f"might be derived from, exaggerated from, or related to:\n\n{claim_text}",
        datasets=[MAIN_DATASET],
    )
    return _extract_text(result)


async def recall_lineage(claim_text: str) -> str:
    """
    Full multi-hop trace: walk the graph from a claim back to its primary source,
    through every intermediate mutation, in chronological order.
    """
    result = await cognee.recall(
        f"Trace the full chain of claims connecting this statement back to its "
        f"original primary source document, in chronological order, listing every "
        f"intermediate claim and platform along the way:\n\n{claim_text}",
        datasets=[MAIN_DATASET],
    )
    return _extract_text(result)


async def improve() -> None:
    """Run Cognee's enrichment/consolidation pass after new feedback/corrections."""
    await cognee.improve(dataset=MAIN_DATASET)


async def forget_dataset(dataset: str = MAIN_DATASET) -> None:
    """Surgically remove one dataset. Shared nodes referenced by other datasets persist."""
    await cognee.forget(dataset=dataset)


async def reset_live_test_sandbox() -> None:
    """Clear only the live-test sandbox, leaving the curated demo graph untouched."""
    await cognee.forget(dataset=LIVE_TEST_DATASET)
