import { describe, it, expect } from "vitest";
import { CachingClient, type MessagesCreator } from "../src/client.js";
import { computeSavings } from "../src/savings.js";
import type { UsageLike } from "../src/types.js";

/**
 * A fake `MessagesCreator` that records the request body it received and
 * returns a canned usage — no network, no API key.
 */
function makeFake(usage: UsageLike) {
  const calls: Array<Record<string, unknown>> = [];
  const anthropic: MessagesCreator = {
    messages: {
      create: async (body: Record<string, unknown>) => {
        calls.push(body);
        return { usage, content: [{ type: "text", text: "ok" }] };
      },
    },
  };
  return { anthropic, calls };
}

const BIG = "y".repeat(40_000); // clears the cacheable minimum

const CANNED: UsageLike = {
  input_tokens: 40,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 10_000,
  output_tokens: 120,
};

describe("CachingClient.ask", () => {
  it("puts cache_control on the last system block of the request body", async () => {
    const { anthropic, calls } = makeFake(CANNED);
    const client = new CachingClient({ anthropic });
    await client.ask({ system: "sys", context: BIG, question: "q" });

    const body = calls[0];
    const system = body.system as Array<{
      cache_control?: unknown;
    }>;
    expect(system).toHaveLength(2);
    expect(system[0].cache_control).toBeUndefined();
    expect(system[1].cache_control).toEqual({ type: "ephemeral" });
  });

  it("leaves the question block with no cache_control", async () => {
    const { anthropic, calls } = makeFake(CANNED);
    const client = new CachingClient({ anthropic });
    await client.ask({ system: BIG, question: "the volatile question" });

    const body = calls[0];
    const messages = body.messages as Array<{
      content: Array<{ text: string; cache_control?: unknown }>;
    }>;
    const questionBlock = messages[0].content[0];
    expect(questionBlock.text).toBe("the volatile question");
    expect(questionBlock.cache_control).toBeUndefined();
  });

  it("returns a savings report matching computeSavings on the canned usage", async () => {
    const { anthropic } = makeFake(CANNED);
    const client = new CachingClient({ anthropic, model: "claude-opus-4-8" });
    const { savings, response, plan } = await client.ask({
      system: BIG,
      question: "q",
      ttl: "5m",
    });

    expect(response.usage).toEqual(CANNED);
    expect(savings).toEqual(
      computeSavings("claude-opus-4-8", CANNED, "5m"),
    );
    // Sanity: the plan surfaced through the return value.
    expect(plan.model).toBe("claude-opus-4-8");
  });

  it("forwards model and max_tokens onto the request body", async () => {
    const { anthropic, calls } = makeFake(CANNED);
    const client = new CachingClient({
      anthropic,
      model: "claude-haiku-4-5",
      maxTokens: 256,
    });
    await client.ask({ system: BIG, question: "q" });

    const body = calls[0];
    expect(body.model).toBe("claude-haiku-4-5");
    expect(body.max_tokens).toBe(256);
  });

  it("lets a per-call model override the client default", async () => {
    const { anthropic, calls } = makeFake(CANNED);
    const client = new CachingClient({ anthropic, model: "claude-opus-4-8" });
    const { savings } = await client.ask({
      system: BIG,
      question: "q",
      model: "claude-sonnet-5",
    });
    expect(calls[0].model).toBe("claude-sonnet-5");
    expect(savings.model).toBe("claude-sonnet-5");
  });
});
