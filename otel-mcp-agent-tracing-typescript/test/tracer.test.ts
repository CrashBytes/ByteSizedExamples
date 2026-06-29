/**
 * Verifies the GenAI semantic-convention attributes land on the `chat <model>`
 * span with the exact keys and values the spec (and tutorial) expect.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FakeLLM, tracedChat } from '../src/llm.js';
import { setupTelemetry, type TelemetryHandle } from '../src/telemetry.js';
import { GEN_AI } from '../src/tracer.js';
import type { ChatMessage } from '../src/types.js';

let telemetry: TelemetryHandle;

beforeEach(() => {
  telemetry = setupTelemetry({ exporter: 'memory', serviceName: 'tracer-test' });
});

afterEach(async () => {
  await telemetry.shutdown();
});

describe('GenAI span attributes', () => {
  it('sets gen_ai.* attributes with the expected keys and values on the chat span', async () => {
    const llm = new FakeLLM('fake-router-v1');
    const messages: ChatMessage[] = [{ role: 'user', content: 'just answer me directly' }];

    const response = await tracedChat(llm, messages);

    const spans = telemetry.getFinishedSpans();
    const chatSpan = spans.find((s) => s.name === 'chat fake-router-v1');
    expect(chatSpan).toBeDefined();

    const attrs = chatSpan!.attributes;
    // Exact key strings the tutorial quotes:
    expect(attrs['gen_ai.operation.name']).toBe('chat');
    expect(attrs['gen_ai.system']).toBe('fake');
    expect(attrs['gen_ai.request.model']).toBe('fake-router-v1');
    expect(attrs['gen_ai.usage.input_tokens']).toBe(response.usage.inputTokens);
    expect(attrs['gen_ai.usage.output_tokens']).toBe(response.usage.outputTokens);

    // The exported constants resolve to those same key strings.
    expect(attrs[GEN_AI.OPERATION_NAME]).toBe('chat');
    expect(attrs[GEN_AI.REQUEST_MODEL]).toBe('fake-router-v1');
  });

  it('names the chat span after the model', async () => {
    const llm = new FakeLLM('custom-model-9000');
    await tracedChat(llm, [{ role: 'user', content: 'hi' }]);
    const spans = telemetry.getFinishedSpans();
    expect(spans.some((s) => s.name === 'chat custom-model-9000')).toBe(true);
  });
});
