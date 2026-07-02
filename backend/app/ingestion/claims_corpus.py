"""
Claims corpus ingestion.

These are clearly-labeled illustrative/synthetic examples (data/claims_corpus.json),
not scraped real social media posts - this avoids Twitter/X API costs and ToS risk
within the hackathon timeline, while still representing realistic, documented
exaggeration patterns. Say this explicitly in the demo and README: it is more
credible to be transparent about synthetic-but-realistic data than to imply
live scraping that isn't actually happening.
"""

import json
from pathlib import Path

from app.memory.cognee_client import remember_claim

DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "claims_corpus.json"


def load_claims() -> list[dict]:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


async def seed_claims() -> int:
    """Ingest every curated claim into Cognee. Returns count ingested."""
    claims = load_claims()
    for c in claims:
        await remember_claim(
            claim_id=c["claim_id"],
            platform=c["platform"],
            claim_text=c["text"],
            posted=c["posted"],
        )
    return len(claims)
