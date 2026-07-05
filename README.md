# Patient Zero

### _Every claim has an origin. Most people never find it._

> Built for **The Hangover Part AI** hackathon — Best Use of Cognee Cloud track  
> WeMakeDevs × Cognee | June 29 – July 5, 2026

---

## The Problem

In May 2026, the Pentagon released 162 classified files about UAP sightings. Real documents. Real cases. Going back to 1948.

The official statement: _"cases for which the government could not reach a definitive determination based on available evidence."_

Within 48 hours, social media said: _"162 files PROVE aliens are real and have been visiting Earth since 1948."_

Same event. Completely different meaning.

This is not a data problem. **It is a memory problem.**

Fact-checkers work in isolation. A claim gets debunked in January. The same claim returns in March — new words, new format, new platform. Nobody remembers. The investigation starts from zero. Again.

Society has no institutional memory of where rumors start. And that forgetting is exactly what makes misinformation powerful.

**Patient Zero gives society the memory it never had.**

---

## What It Does

Patient Zero is an AI agent that permanently remembers the full mutation history of any claim — and traces it back to its verified primary source in seconds, showing exactly where the drift happened, how many steps it took, and what type of manipulation occurred.

---

## Why Cognee — The Core Technical Insight

Detecting how a claim drifted is **fundamentally a graph problem, not a search problem.**

When a claim mutates, the words change completely:

- Source says: _"unresolved, no determination of cause"_
- Viral claim says: _"scientists confirmed extraterrestrial technology"_

These two strings share almost **zero semantic similarity**. A pure vector search would never connect them.

But in Cognee's knowledge graph, the connection is **structural, not textual.** The primary source is a node. The mutated claim is a node. The relationship between them — `DRIFTED_FROM` — is an explicit edge. Cognee traverses that edge. It doesn't guess.

This is why Patient Zero requires Cognee. Not as a convenience — as a **necessity.**

---

## All Four Cognee Operations — Meaningfully Used

### `remember()`

Every verified primary source document and every tracked claim is ingested into Cognee's knowledge graph via `remember()`. Not stored as flat text — cognified into a structured graph of entities, relationships, and summaries.

**Result: 353 nodes, 783 edges in our live Cognee Cloud instance.**

```python
await cognee.remember(
    "[PRIMARY SOURCE | VERIFIED]\nDocument ID: PURSUE-2004-NIMITZ-FLIR\n...",
    dataset_name="patient_zero_main"
)
```

### `recall()`

When a claim is submitted for tracing, Cognee's hybrid recall fires simultaneously with our parallel Claude-powered drift detector. The graph traversal finds structural connections that pure semantic search would miss entirely.

```python
lineage = await cognee.recall(
    "Trace the chain connecting this claim back to its original primary source...",
    datasets=["patient_zero_main"]
)
```

### `improve()`

When a user confirms or rejects a match, `improve()` is triggered live — Cognee re-weights the graph based on the feedback signal. Shown visually in the UI with a toast notification. The system gets sharper with every interaction.

```python
await cognee.improve(dataset="patient_zero_main")
```

### `forget()`

When a claim lineage is fully resolved, it is surgically pruned from the graph via `forget()`. Shared nodes — facts that appear in multiple claim chains — are preserved automatically. Only exclusive context is removed.

```python
await cognee.forget(dataset="live_test")
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  Evidence Board (SVG) │ Live Trace │ Test Your Own       │
│  Spread Velocity Chart │ improve() │ forget() buttons    │
└────────────────────┬────────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────────┐
│                   FastAPI Backend                        │
│  /trace-claim  — 15 parallel async comparisons          │
│  /graph/tree   — persistent disk cache (free after 1st) │
│  /feedback     — triggers improve() live                │
│  /forget-resolved — surgically prunes resolved cases    │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
┌──────────▼──────────┐  ┌────────▼───────────────────────┐
│   Cognee Cloud      │  │   Claude Haiku (Anthropic)      │
│   353 nodes         │  │   drift_detector.py             │
│   783 edges         │  │   → is_related: bool            │
│   5 node kinds      │  │   → drift_score: 0.0–1.0        │
│   remember/recall/  │  │   → drift_type: fabrication /   │
│   improve/forget    │  │     false_confirmation / etc.   │
└─────────────────────┘  └────────────────────────────────┘
```

---

## The Data

Primary sources are real. Curated from publicly reported records in the **May 2026 PURSUE declassification release** — the Pentagon's first major UAP document tranche:

| Document                               | Year    |
| -------------------------------------- | ------- |
| Chiles-Whitted UAP sighting report     | 1948    |
| Washington D.C. radar UAP incidents    | 1952    |
| Malmstrom Air Force Base incident      | 1967    |
| Apollo 11 post-flight debriefing       | 1969    |
| Apollo 12 mission record               | 1969    |
| Borman bogey sighting transcript       | 1969    |
| USS Nimitz Tic Tac encounter           | 2004    |
| Gimbal and Go Fast FLIR videos         | 2014–15 |
| Obama on-record UAP statement          | 2021    |
| Kuwait theater UAP report              | 2022    |
| AARO Annual Report to Congress         | 2023    |
| David Grusch congressional testimony   | 2023    |
| U.S. Northern Command infrared report  | 2024    |
| Senate Intelligence Committee briefing | 2025    |
| Official PURSUE program summary        | 2026    |

Claims in our corpus are clearly labeled **illustrative examples** — not scraped live posts — representing realistic, documented exaggeration patterns observed in public reaction to the PURSUE release. This was a deliberate engineering choice: live scraping introduces API costs, ToS risk, and demo fragility. Transparent, curated data is more credible and more reliable.

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Anthropic API key
- Cognee Cloud API key (sign up at cognee.ai, use code `COGNEE-35` for free Developer plan)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in:
# ANTHROPIC_API_KEY=sk-ant-...
# COGNEE_API_KEY=...
# COGNEE_SKIP_CONNECTION_TEST=true

uvicorn app.main:app --reload
```

On first startup, the backend seeds all 15 primary sources and 18 claims into Cognee Cloud and writes `data/.seeded` — subsequent restarts skip seeding entirely (zero API cost on restart).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

### Build the Evidence Board (one-time)

The board requires computing drift scores for all source × claim pairs. Run once and it caches to disk permanently:

```bash
curl http://localhost:8000/graph/tree
# Takes ~2 minutes (270 parallel Haiku calls, ~$0.07 total)
# Saves to data/tree_cache.json — never rebuilt unless you run /graph/refresh
```

---

## Deployment

### Backend → Render

1. Push to GitHub
2. Create a new Web Service on Render, connect your repo
3. Render auto-detects the `Dockerfile` in `backend/`
4. Set environment variables in Render dashboard:
   - `ANTHROPIC_API_KEY`
   - `COGNEE_API_KEY`
   - `COGNEE_SKIP_CONNECTION_TEST=true`

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
# Set VITE_API_URL to your Render backend URL in Vercel dashboard
```

---

## Key Engineering Decisions

**Parallel async comparisons** — `asyncio.gather` fires all 15 source comparisons simultaneously. Response time: ~3 seconds instead of ~15 seconds sequential.

**Persistent tree cache** — First board build saves to `data/tree_cache.json`. Every subsequent load is instant, zero API calls. Survives server restarts.

**Sentinel file seeding** — `data/.seeded` prevents re-ingestion on restart. Since Cognee Cloud already holds the graph, re-seeding would waste API spend unnecessarily.

**Claude Haiku for drift detection** — ~12x cheaper than Sonnet, same accuracy for structured JSON classification tasks. At 270 calls for the board build, model choice matters.

**Cognee remember() is optional in sandbox** — The `/test-your-own` endpoint runs `compare()` directly without Cognee's remember step, eliminating the 30-second embedding connection test timeout that would block live judge demos.

**Honest fallback** — If no primary source matches a claim with sufficient confidence, the system says so explicitly rather than hallucinating a connection. Shown as a low-confidence result, not a false match.

---

## Theme Connection

The hackathon asks: _"What if AI never forgot?"_

Most answers: _"My AI will remember my conversations."_

Our answer: **What if society never forgot where a rumor started?**

Society forgetting is not a side effect of misinformation. It is the mechanism. A claim mutates precisely because nobody remembers the original. Patient Zero makes the origin permanent, the drift visible, and the lineage traceable — for any claim, across any number of sessions, forever.

The hangover analogy holds perfectly: society wakes up believing something, with no memory of how it got there. **Patient Zero is the receipt from last night.**

---

## Stack

| Layer        | Technology                                  |
| ------------ | ------------------------------------------- |
| Memory       | Cognee Cloud (hybrid graph + vector)        |
| AI Reasoning | Claude Haiku via Anthropic SDK              |
| Backend      | FastAPI, Python 3.13, AsyncAnthropic        |
| Frontend     | React 18, Vite, Tailwind CSS, Recharts      |
| Deployment   | Vercel (frontend) + Render Docker (backend) |

---

## Live Links

- **Frontend:** `[your-vercel-url]`
- **Backend:** `[your-render-url]`
- **Cognee Mindmap:** 353 nodes, 783 edges — `patient_zero_main` dataset

---

_Primary sources curated from the May 2026 PURSUE declassification release. Claims shown are illustrative examples based on documented public reaction patterns. All four Cognee lifecycle operations — remember, recall, improve, forget — are meaningfully used throughout the system._
