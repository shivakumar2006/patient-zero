"""
Patient Zero - FastAPI entry point.

IMPORTANT: Seeding only runs ONCE (on first startup) and writes a sentinel
file data/.seeded to skip all seeding on subsequent restarts. This prevents
Cognee from re-running cognify on 33 texts every time the server restarts,
which was costing significant API spend unnecessarily.

Since data is already in Cognee Cloud (353 nodes, 783 edges confirmed), 
just delete data/.seeded manually if you genuinely need to re-seed.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.memory.cognee_client import configure
from app.ingestion.primary_sources import seed_primary_sources
from app.ingestion.claims_corpus import seed_claims
from app.api.routes_search import router as search_router
from app.api.routes_graph import router as graph_router

SENTINEL = Path(__file__).resolve().parent.parent / "data" / ".seeded"


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure()

    if SENTINEL.exists():
        print("[startup] data/.seeded found — skipping re-seed (Cognee Cloud already has the data)")
    else:
        print("[startup] first run — seeding Cognee Cloud...")
        n_sources = await seed_primary_sources()
        n_claims  = await seed_claims()
        SENTINEL.touch()
        print(f"[startup] seeded {n_sources} primary sources, {n_claims} claims → wrote data/.seeded")

    yield


app = FastAPI(title="Patient Zero", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)
app.include_router(graph_router)


@app.get("/health")
async def health():
    return {"status": "ok"}