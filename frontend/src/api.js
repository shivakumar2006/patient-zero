const BASE = import.meta.env.VITE_API_URL || "/api";

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export const traceClaim    = (claim_text) => post("/trace-claim", { claim_text });
export const testYourOwn   = (source_text, claim_text) => post("/test-your-own", { source_text, claim_text });
export const getTree       = () => get("/graph/tree");
export const getTimeline   = () => get("/graph/timeline");
export const getGraphStats = () => get("/graph/stats");