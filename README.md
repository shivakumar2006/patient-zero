# Patient Zero

Trace any claim back to its verified source, and see exactly how — and how far —
it drifted on the way to you. Built on Cognee's hybrid graph-vector memory layer
for The Hangover Part AI hackathon (Cognee Cloud track).

## What this is

Most "AI memory" projects remember things *for* a person. This one remembers a
**claim's mutation history** — the chain of exaggeration as information spreads
from a verified primary source through reposts, translations, and rewrites until
it's unrecognizable. Vector similarity alone can't trace this, because a heavily
mutated claim often shares almost no words with its true origin. Cognee's graph
stores the explicit `DRIFTED_FROM` lineage instead, so the trace is a structural
traversal, not a guess.

The seed dataset uses real, publicly reported documents from the May 2026
PURSUE declassification release (war.gov/UFO) as ground truth, and a small set
of clearly-labeled illustrative claims showing realistic exaggeration patterns.

## Architecture

```
[Primary sources: curated, real]  --remember()-->  +-----------------+
[Claims: curated, illustrative]   --remember()-->  |  Cognee Cloud   |
                                                     |  (graph+vector) |
        FastAPI + Claude  <--recall()/improve()-->  +-----------------+
        (drift_detector.py judges each pair)
                |
        React + Tailwind frontend (the "evidence board")
```

## Run it

### Backend

```bash
cd backend
cp .env.example .env   # fill in ANTHROPIC_API_KEY and COGNEE_API_KEY
pip install -r requirements.txt --break-system-packages
uvicorn app.main:app --reload
```

First boot seeds the curated primary sources + claims into Cognee automatically
(see the `lifespan` block in `app/main.py`). Check the console for the seed count.

### Frontend

```bash
cd frontend
cp .env.example .env   # leave as-is for local dev, fill in once backend is deployed
npm install
npm run dev
```

Visit the printed local URL. The dev server proxies `/api` to `localhost:8000`.

## Deploy

- **Backend** → Render, using the included `Dockerfile`. Set `ANTHROPIC_API_KEY`
  and `COGNEE_API_KEY` as environment variables in the Render dashboard.
- **Frontend** → Vercel. Set `VITE_API_URL` to your Render backend URL.

## Cognee lifecycle, mapped to this project

| Operation | Where it's used |
|---|---|
| `remember()` | Seeding primary sources + claims on startup; also writes judge-supplied pairs into an isolated `live_test` dataset |
| `recall()` | Hybrid candidate search (`recall_candidates`) + full multi-hop lineage trace (`recall_lineage`) in `routes_search.py` |
| `improve()` | Exposed via `POST /improve` — call after demoing a correction, to show confidence shift live |
| `forget()` | `forget_dataset()` / `reset_live_test_sandbox()` — clears the sandbox between judges without touching the curated main graph |

## Demo script (3 acts)

1. **Recall** — type a claim into the search bar, show the side-by-side:
   real primary source vs. the claim, with a computed drift score.
2. **The board** — scroll to the evidence board. Point out that drift score
   controls both string color and thickness — the more exaggerated, the
   redder and thicker the connection.
3. **Test your own** — hand the laptop to a judge. Let them paste anything.
   If there's no real relationship, the tool says so honestly instead of
   guessing — call this out explicitly, it's a feature, not a gap.

## Honest data note (say this in the demo, don't hide it)

The claims corpus is illustrative, not scraped from real social media — this
was a deliberate choice to avoid API/ToS risk within the hackathon timeline,
while still representing exaggeration patterns that match what's been publicly
reported about reactions to the PURSUE release. Say this up front; it reads as
careful engineering, not as a shortcut.
