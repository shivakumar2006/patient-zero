"""
Drift detection.

This is the "judgment" step that sits between Cognee's vector recall (breadth)
and graph storage (structure): given a candidate (source, claim) pair, ask
Claude whether the claim is a faithful restatement, an exaggeration, a false
confirmation, or a fabrication relative to the source - and how confident we
are. The resulting score becomes a DRIFTED_FROM edge weight when we write it
back into Cognee via remember().
"""

import json
import os
from anthropic import Anthropic

_client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

_DRIFT_PROMPT = """You are comparing a public claim against a verified primary source \
document, to detect how much the claim has drifted (exaggerated, distorted, or \
fabricated) from what the source actually says.

PRIMARY SOURCE:
\"\"\"{source}\"\"\"

PUBLIC CLAIM:
\"\"\"{claim}\"\"\"

Judge strictly based on what the source actually states - do not use outside \
knowledge about whether the claim is "true" in some broader sense, only whether \
it accurately reflects this specific source.

Respond with ONLY a JSON object, no other text, no markdown fences:
{{
  "is_related": true or false,
  "drift_score": a number from 0.0 to 1.0 (0.0 = faithful restatement, 1.0 = contradicts or wildly exaggerates the source),
  "drift_type": one of "faithful", "mild_exaggeration", "false_confirmation", "fabrication", "unrelated",
  "explanation": "one short sentence describing exactly what changed"
}}
"""


async def compare(source_text: str, claim_text: str) -> dict:
    """Return a structured drift assessment for one (source, claim) pair."""
    message = _client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        messages=[
            {
                "role": "user",
                "content": _DRIFT_PROMPT.format(source=source_text, claim=claim_text),
            }
        ],
    )

    raw = message.content[0].text.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        # Fail safe rather than fail loud - the API contract always returns a dict,
        # callers don't need to handle a parsing exception separately.
        result = {
            "is_related": False,
            "drift_score": None,
            "drift_type": "unknown",
            "explanation": "Could not parse the model's comparison output.",
        }

    return result
