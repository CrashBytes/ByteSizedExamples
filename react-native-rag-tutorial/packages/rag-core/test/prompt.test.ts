import { describe, it, expect } from "vitest";
import { buildGroundedPrompt, filterCitations, type ScoredChunk } from "../src/index.js";

const contexts: ScoredChunk[] = [
  {
    chunk: { id: "billing::0", docId: "billing", index: 0, text: "Refunds take 5 to 10 business days.", metadata: { title: "Refunds" } },
    score: 0.9,
  },
  {
    chunk: { id: "account::0", docId: "account", index: 0, text: "Reset links expire after one hour." },
    score: 0.7,
  },
];

describe("buildGroundedPrompt", () => {
  it("numbers contexts 1..n and embeds the question", () => {
    const { user, citations } = buildGroundedPrompt("how long do refunds take?", contexts);
    expect(user).toContain("[1]");
    expect(user).toContain("[2]");
    expect(user).toContain("how long do refunds take?");
    expect(citations).toHaveLength(2);
    expect(citations[0]!.marker).toBe(1);
  });

  it("uses the metadata title as the source label when present", () => {
    const { user } = buildGroundedPrompt("q", contexts);
    expect(user).toContain("source: Refunds");
    expect(user).toContain("source: account"); // falls back to docId
  });

  it("includes the anti-hallucination instruction in the system prompt", () => {
    const { system } = buildGroundedPrompt("q", contexts);
    expect(system.toLowerCase()).toContain("only");
    expect(system.toLowerCase()).toContain("context");
  });

  it("handles empty context gracefully", () => {
    const { user } = buildGroundedPrompt("q", []);
    expect(user).toContain("(no context retrieved)");
  });
});

describe("filterCitations", () => {
  it("keeps only markers referenced in the answer", () => {
    const { citations } = buildGroundedPrompt("q", contexts);
    const filtered = filterCitations("Refunds take 5 to 10 days [1].", citations);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.marker).toBe(1);
  });

  it("returns all citations when the answer cites nothing", () => {
    const { citations } = buildGroundedPrompt("q", contexts);
    expect(filterCitations("No citation here.", citations)).toHaveLength(2);
  });
});
