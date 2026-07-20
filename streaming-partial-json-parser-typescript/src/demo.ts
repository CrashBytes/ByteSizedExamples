/**
 * Demo: simulate an LLM streaming a structured-output object token by token and
 * show the parsed value growing at every step. No network calls — the "stream"
 * is a hardcoded object serialized and sliced into small chunks.
 *
 *   npm run demo
 */
import { StreamingJsonAccumulator } from "./partial-json.js";

// A realistic support-ticket triage result an LLM might emit as JSON.
const triage = {
  category: "billing",
  priority: "high",
  summary: 'Customer double-charged for the "Pro" plan and wants a refund.',
  tags: ["refund", "duplicate-charge", "vip"],
  confidence: 0.93,
  escalate: true,
  assignee: null,
};

const wire = JSON.stringify(triage);

/** Chop the serialized JSON into small, uneven chunks like streamed tokens. */
function chunk(s: string, size = 7): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out;
}

function main(): void {
  const acc = new StreamingJsonAccumulator();
  const chunks = chunk(wire);

  console.log("Streaming LLM structured output, one chunk at a time:\n");

  chunks.forEach((c, idx) => {
    const value = acc.push(c);
    const step = String(idx + 1).padStart(2, " ");
    // Show the chunk that just arrived and the best-effort object so far.
    console.log(`step ${step}  +${JSON.stringify(c)}`);
    console.log(`         => ${JSON.stringify(value)}`);
  });

  console.log("\nFinal value equals the original object:", JSON.stringify(acc.value) === wire);
}

main();
