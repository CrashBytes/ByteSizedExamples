import { describe, it, expect } from "vitest";
import {
  auditForInvalidators,
  auditTools,
  stableStringify,
} from "../src/invalidator-audit.js";
import type { ToolDef } from "../src/types.js";

describe("auditForInvalidators", () => {
  it("detects Date.now(", () => {
    const findings = auditForInvalidators("const t = Date.now();");
    expect(findings.some((f) => f.rule === "Date.now(")).toBe(true);
  });

  it("detects an ISO-8601 timestamp", () => {
    const findings = auditForInvalidators("as of 2026-07-13T09:00:00Z we say");
    const iso = findings.find((f) => f.rule === "ISO-8601 datetime");
    expect(iso).toBeDefined();
    expect(iso!.match).toBe("2026-07-13T09:00:00Z");
  });

  it("detects a UUID", () => {
    const findings = auditForInvalidators(
      "user 3f2504e0-4f89-41d3-9a0c-0305e82c3301 logged in",
    );
    expect(findings.some((f) => f.rule === "UUID")).toBe(true);
  });

  it("detects Math.random(", () => {
    const findings = auditForInvalidators("nonce = Math.random()");
    expect(findings.some((f) => f.rule === "Math.random(")).toBe(true);
  });

  it("returns [] on a clean prompt", () => {
    expect(
      auditForInvalidators("You are a helpful, deterministic assistant."),
    ).toEqual([]);
  });

  it("reports findings in document order with hints", () => {
    const findings = auditForInvalidators(
      "id crypto.randomUUID() then time Date.now()",
    );
    expect(findings.length).toBeGreaterThanOrEqual(2);
    // Sorted by index -> crypto.randomUUID appears before Date.now.
    expect(findings[0].index).toBeLessThan(findings[1].index);
    for (const f of findings) expect(f.hint.length).toBeGreaterThan(0);
  });
});

describe("stableStringify", () => {
  it("serializes objects with keys in different orders identically", () => {
    const a = { b: 1, a: 2, c: { z: 1, y: 2 } };
    const b = { c: { y: 2, z: 1 }, a: 2, b: 1 };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it("sorts nested keys deterministically", () => {
    expect(stableStringify({ b: { d: 1, c: 2 }, a: 3 })).toBe(
      '{"a":3,"b":{"c":2,"d":1}}',
    );
  });

  it("preserves array order", () => {
    expect(stableStringify([3, 1, 2])).toBe("[3,1,2]");
  });
});

describe("auditTools", () => {
  it("returns the canonical form and audits it", () => {
    const clean: ToolDef[] = [
      {
        name: "search",
        description: "Search docs.",
        input_schema: { type: "object" },
      },
    ];
    const { canonical, findings } = auditTools(clean);
    expect(canonical).toBe(stableStringify(clean));
    expect(findings).toEqual([]);
  });

  it("flags an invalidator embedded in a tool description", () => {
    const dirty: ToolDef[] = [
      {
        name: "search",
        description: "Search docs as of 2026-07-13T09:00:00Z.",
        input_schema: { type: "object" },
      },
    ];
    const { findings } = auditTools(dirty);
    expect(findings.some((f) => f.rule === "ISO-8601 datetime")).toBe(true);
  });
});
