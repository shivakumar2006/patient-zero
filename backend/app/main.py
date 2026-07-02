"""
Patient Zero - FastAPI entry point.

On startup: configures Cognee + seeds the curated primary-source and claims
corpus into the main dataset. Safe to restart - re-running remember() on the
same text is idempotent enough for hackathon purposes (Cognee dedupes/merges
overlapping content during cognify()).
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.memory.cognee_client import configure
from app.ingestion.primary_sources import seed_primary_sources
from app.ingestion.claims_corpus import seed_claims
from app.api.routes_search import router as search_router
from app.api.routes_graph import router as graph_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("step1")
    await configure()
    print("step2")
    n_sources = await seed_primary_sources()
    print("step3")
    n_claims = await seed_claims()
    print(f"[startup] seeded {n_sources} primary sources, {n_claims} claims")
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
