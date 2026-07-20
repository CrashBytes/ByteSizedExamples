import { describe, it, expect } from "vitest";
import { parsePartialJson, StreamingJsonAccumulator } from "./partial-json.js";

describe("parsePartialJson — complete JSON passes through unchanged", () => {
  it("parses a complete object identically to JSON.parse", () => {
    const src = '{"name":"Ada","age":36,"admin":true,"nickname":null}';
    expect(parsePartialJson(src)).toEqual(JSON.parse(src));
  });

  it("parses a complete array", () => {
    const src = "[1, 2, 3, 4]";
    expect(parsePartialJson(src)).toEqual([1, 2, 3, 4]);
  });

  it("parses a deeply nested complete structure", () => {
    const src = '{"a":[1,{"b":[true,null,"x"]}],"c":{"d":{"e":42}}}';
    expect(parsePartialJson(src)).toEqual(JSON.parse(src));
  });

  it("parses strings with escapes unchanged", () => {
    const src = '{"msg":"line1\\nline2 \\"quoted\\" \\\\ slash \\u0041"}';
    expect(parsePartialJson(src)).toEqual(JSON.parse(src));
  });

  it("parses numbers (int, float, exponent, negative) unchanged", () => {
    const src = '{"a":0,"b":-12,"c":3.14,"d":6.02e23,"e":-1.5E-3}';
    expect(parsePartialJson(src)).toEqual(JSON.parse(src));
  });

  it("parses top-level scalars", () => {
    expect(parsePartialJson("true")).toBe(true);
    expect(parsePartialJson("false")).toBe(false);
    expect(parsePartialJson("null")).toBe(null);
    expect(parsePartialJson("42")).toBe(42);
    expect(parsePartialJson('"hello"')).toBe("hello");
  });
});

describe("parsePartialJson — incomplete objects", () => {
  it("keeps a trailing complete key/value in an unclosed object", () => {
    expect(parsePartialJson('{"name":"Ada","age":3')).toEqual({ name: "Ada", age: 3 });
  });

  it("drops a dangling incomplete key with no value", () => {
    expect(parsePartialJson('{"name":"Ada","ag')).toEqual({ name: "Ada" });
  });

  it("drops a key that has a colon but no value yet", () => {
    expect(parsePartialJson('{"a":1,"b":')).toEqual({ a: 1 });
  });

  it("returns an empty object for a bare open brace", () => {
    expect(parsePartialJson("{")).toEqual({});
  });

  it("ignores a trailing comma in an object", () => {
    expect(parsePartialJson('{"a":1,')).toEqual({ a: 1 });
  });
});

describe("parsePartialJson — incomplete arrays", () => {
  it("closes an unclosed array keeping the trailing complete number", () => {
    expect(parsePartialJson("[1,2,3")).toEqual([1, 2, 3]);
  });

  it("ignores a trailing comma in an array", () => {
    expect(parsePartialJson("[1,2,")).toEqual([1, 2]);
  });

  it("returns an empty array for a bare open bracket", () => {
    expect(parsePartialJson("[")).toEqual([]);
  });

  it("keeps an incomplete trailing string element", () => {
    expect(parsePartialJson('["a","hel')).toEqual(["a", "hel"]);
  });
});

describe("parsePartialJson — incomplete string values", () => {
  it("closes an open string value", () => {
    expect(parsePartialJson('{"msg":"hel')).toEqual({ msg: "hel" });
  });

  it("closes an open top-level string", () => {
    expect(parsePartialJson('"partial')).toBe("partial");
  });

  it("returns an empty string for a bare open quote", () => {
    expect(parsePartialJson('"')).toBe("");
  });
});

describe("parsePartialJson — incomplete literals (documented: resolve prefixes)", () => {
  it("resolves an incomplete `true`", () => {
    expect(parsePartialJson('{"done":tr')).toEqual({ done: true });
  });

  it("resolves an incomplete `false`", () => {
    expect(parsePartialJson('{"done":fal')).toEqual({ done: false });
  });

  it("resolves an incomplete `null`", () => {
    expect(parsePartialJson('{"x":nu')).toEqual({ x: null });
  });

  it("resolves single-character literal prefixes", () => {
    expect(parsePartialJson('{"a":t')).toEqual({ a: true });
    expect(parsePartialJson('{"a":f')).toEqual({ a: false });
    expect(parsePartialJson('{"a":n')).toEqual({ a: null });
  });

  it("drops a garbage (non-literal) trailing token", () => {
    expect(parsePartialJson('{"a":xyz')).toEqual({});
  });
});

describe("parsePartialJson — incomplete numbers are dropped (documented)", () => {
  it("drops a trailing lone minus", () => {
    expect(parsePartialJson('{"a":1,"b":-')).toEqual({ a: 1 });
  });

  it("drops a trailing decimal point", () => {
    expect(parsePartialJson('{"a":1.')).toEqual({});
  });

  it("drops a trailing exponent marker", () => {
    expect(parsePartialJson('{"a":1e')).toEqual({});
    expect(parsePartialJson('{"a":1e+')).toEqual({});
  });

  it("drops an incomplete number element in an array", () => {
    expect(parsePartialJson("[1,2,3.")).toEqual([1, 2]);
  });

  it("returns undefined for a bare incomplete number at root", () => {
    expect(parsePartialJson("-")).toBeUndefined();
    expect(parsePartialJson("1.")).toBeUndefined();
  });
});

describe("parsePartialJson — escape-sequence edge cases", () => {
  it("does not close a string on an escaped quote", () => {
    // `"a\"` — the \" is an escaped quote, string still open, then closed.
    expect(parsePartialJson('{"k":"a\\"')).toEqual({ k: 'a"' });
  });

  it("drops a lone trailing backslash inside a string", () => {
    expect(parsePartialJson('{"k":"ab\\')).toEqual({ k: "ab" });
  });

  it("drops an incomplete \\u unicode escape at buffer end", () => {
    expect(parsePartialJson('{"k":"ab\\u00')).toEqual({ k: "ab" });
    expect(parsePartialJson('{"k":"ab\\u')).toEqual({ k: "ab" });
  });

  it("keeps a completed simple escape in an unterminated string", () => {
    expect(parsePartialJson('{"k":"line\\n')).toEqual({ k: "line\n" });
  });

  it("keeps a completed \\u escape in an unterminated string", () => {
    expect(parsePartialJson('{"k":"\\u0041')).toEqual({ k: "A" });
  });
});

describe("parsePartialJson — deeply nested partial structures", () => {
  it("auto-closes multiple open containers", () => {
    expect(parsePartialJson('{"a":{"b":{"c":[1,2')).toEqual({ a: { b: { c: [1, 2] } } });
  });

  it("handles a partial object inside a partial array", () => {
    expect(parsePartialJson('[{"id":1},{"id":2')).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("handles a partial nested value with a dropped incomplete key", () => {
    expect(parsePartialJson('{"outer":{"a":1,"b')).toEqual({ outer: { a: 1 } });
  });
});

describe("parsePartialJson — whitespace and empty", () => {
  it("returns undefined for an empty buffer", () => {
    expect(parsePartialJson("")).toBeUndefined();
  });

  it("returns undefined for a whitespace-only buffer", () => {
    expect(parsePartialJson("   \n\t ")).toBeUndefined();
  });

  it("tolerates whitespace between tokens", () => {
    expect(parsePartialJson('{ "a" : 1 , "b" : [ 2 , 3 ')).toEqual({ a: 1, b: [2, 3] });
  });
});

describe("parsePartialJson — never throws for any prefix of valid JSON", () => {
  const docs = [
    '{"category":"billing","priority":"high","tags":["urgent","vip"],"confidence":0.92,"escalate":true,"note":null}',
    '[{"id":1,"name":"Ada \\"the\\" Lovelace"},{"id":2,"vals":[1.5,-2,3e2],"ok":false}]',
    '{"unicode":"caf\\u00e9","nested":{"deep":{"deeper":[true,false,null]}}}',
  ];

  for (const doc of docs) {
    it(`does not throw for any prefix of: ${doc.slice(0, 32)}...`, () => {
      for (let n = 0; n <= doc.length; n++) {
        const prefix = doc.slice(0, n);
        expect(() => parsePartialJson(prefix)).not.toThrow();
      }
    });

    it(`the full document parses equal to JSON.parse: ${doc.slice(0, 32)}...`, () => {
      expect(parsePartialJson(doc)).toEqual(JSON.parse(doc));
    });
  }
});

describe("StreamingJsonAccumulator", () => {
  it("emits progressively-growing partial objects and matches the full parse", () => {
    const full = '{"category":"billing","priority":"high","tags":["urgent"],"confidence":0.9}';
    const acc = new StreamingJsonAccumulator();

    // Feed one character at a time.
    let last: unknown;
    for (const ch of full) {
      last = acc.push(ch);
    }

    expect(acc.buffer).toBe(full);
    expect(last).toEqual(JSON.parse(full));
    expect(acc.value).toEqual(JSON.parse(full));
  });

  it("never throws while streaming and the key count is monotonic", () => {
    const full = '{"a":1,"b":2,"c":3,"d":4}';
    const acc = new StreamingJsonAccumulator();
    let prevKeys = 0;

    for (const ch of full) {
      const v = acc.push(ch);
      const keys = v && typeof v === "object" ? Object.keys(v).length : 0;
      expect(keys).toBeGreaterThanOrEqual(prevKeys);
      prevKeys = keys;
    }

    expect(acc.value).toEqual({ a: 1, b: 2, c: 3, d: 4 });
  });

  it("reset clears buffer and value", () => {
    const acc = new StreamingJsonAccumulator();
    acc.push('{"a":1}');
    acc.reset();
    expect(acc.buffer).toBe("");
    expect(acc.value).toBeUndefined();
  });

  it("consumes multi-character chunks", () => {
    const acc = new StreamingJsonAccumulator();
    acc.push('{"na');
    acc.push('me":"Ada","ag');
    expect(acc.value).toEqual({ name: "Ada" });
    acc.push('e":3}');
    expect(acc.value).toEqual({ name: "Ada", age: 3 });
  });
});
