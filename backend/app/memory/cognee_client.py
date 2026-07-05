"""
Cognee memory layer wrapper for Patient Zero.
"""

import os
import cognee

MAIN_DATASET   = "patient_zero_main"
LIVE_TEST_DATASET = "live_test"


def configure():
    """
    One-time setup called at app startup.
    Uses Haiku for Cognee's internal LLM ops (entity extraction, graph
    building, recall synthesis) — same accuracy for structured tasks,
    ~12x cheaper than Sonnet.
    """
    cognee.config.set_llm_config({
        "llm_provider": "anthropic",
        "llm_model": "claude-haiku-4-5-20251001",
        "llm_api_key": os.environ["ANTHROPIC_API_KEY"],
    })

    cognee.config.set_embedding_config({
        "embedding_provider": "fastembed",
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
        "embedding_dimensions": 384,
    })


def _extract_text(recall_result) -> str:
    """
    cognee.recall() returns a list of structured entries, not a plain string.
    Pull the most useful text field from whatever shape comes back.
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
    text = (
        f"[PRIMARY SOURCE | VERIFIED]\n"
        f"Document ID: {doc_id}\n"
        f"Title: {title}\n"
        f"Released: {released}\n"
        f"Content: {content}\n"
        f"This is an official primary source. Claims that contradict or exaggerate "
        f"what is written here should be treated as drift."
    )
    await cognee.remember(text, dataset_name=MAIN_DATASET)


async def remember_claim(claim_id: str, platform: str, claim_text: str, posted: str) -> None:
    text = (
        f"[PUBLIC CLAIM]\n"
        f"Claim ID: {claim_id}\n"
        f"Platform: {platform}\n"
        f"Posted: {posted}\n"
        f"Text: {claim_text}"
    )
    await cognee.remember(text, dataset_name=MAIN_DATASET)


async def remember_live_test(label: str, text: str) -> None:
    """Sandbox dataset — never pollutes the curated main graph."""
    await cognee.remember(f"[LIVE TEST | {label}]\n{text}", dataset_name=LIVE_TEST_DATASET)


async def recall_candidates(claim_text: str) -> str:
    result = await cognee.recall(
        f"Find primary source documents or earlier claims that this statement "
        f"might be derived from or related to:\n\n{claim_text}",
        datasets=[MAIN_DATASET],
    )
    return _extract_text(result)


async def recall_lineage(claim_text: str) -> str:
    result = await cognee.recall(
        f"Trace the chain connecting this statement back to its original primary "
        f"source, listing intermediate claims and platforms in chronological order:\n\n{claim_text}",
        datasets=[MAIN_DATASET],
    )
    return _extract_text(result)


async def improve() -> None:
    await cognee.improve(dataset=MAIN_DATASET)


async def forget_dataset(dataset: str = MAIN_DATASET) -> None:
    await cognee.forget(dataset=dataset)


async def reset_live_test_sandbox() -> None:
    await cognee.forget(dataset=LIVE_TEST_DATASET)