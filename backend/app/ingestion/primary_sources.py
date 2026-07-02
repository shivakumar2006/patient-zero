"""
Primary source ingestion.

We intentionally load from a curated local JSON file (data/primary_sources.json)
rather than live-scraping war.gov/UFO. The real site hosts PDFs/videos/images
without a documented public API, so scraping it reliably within a hackathon
timeline is fragile. Curating real, verifiable entries by hand is faster and
more honest than a brittle scraper that might silently break during the demo.

Each entry in primary_sources.json is a real, publicly reported document from
the May 2026 PURSUE declassification release, summarized in our own words.
"""

import json
from pathlib import Path

from app.memory.cognee_client import remember_primary_source

DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "primary_sources.json"


def load_primary_sources() -> list[dict]:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


async def seed_primary_sources() -> int:
    """Ingest every curated primary source into Cognee. Returns count ingested."""
    sources = load_primary_sources()
    for doc in sources:
        await remember_primary_source(
            doc_id=doc["doc_id"],
            title=doc["title"],
            content=doc["content"],
            released=doc["released"],
        )
    return len(sources)
