/**
 * The {@link Agent}: a minimal MCP-style tool-using loop, fully instrumented.
 *
 * `run()` opens one root span `agent.invoke` and, inside it, loops:
 *   1. ask the LLM (a child `chat <model>` span via {@link tracedChat}),
 *   2. if the LLM asks for a tool, run it through the registry (a child
 *      `mcp.tool/<name>` span) and feed the result back,
 *   3. repeat until the LLM returns a final answer or `maxSteps` is hit.
 *
 * Because both the chat span and the tool span are created inside the active
 * `agent.invoke` span, they nest under it and share one trace id.
 */

import { SpanKind } from '@opentelemetry/api';
import type { LLM } from './llm.js';
import { tracedChat } from './llm.js';
import type { ToolRegistry } from './mcp-tools.js';
import { AGENT, getTracer, recordError } from './tracer.js';
import type { AgentResult, ChatMessage } from './types.js';

/** Constructor options for {@link Agent}. */
export interface AgentOptions {
  /** The model to drive the loop. */
  llm: LLM;
  /** The tools the model may call. */
  tools: ToolRegistry;
  /** Hard cap on loop iterations (defends against a model that never finalizes). */
  maxSteps?: number;
}

const DEFAULT_MAX_STEPS = 6;

/** A tool-using agent that traces its whole run as one nested span tree. */
export class Agent {
  private readonly llm: LLM;
  private readonly tools: ToolRegistry;
  private readonly maxSteps: number;

  constructor(opts: AgentOptions) {
    this.llm = opts.llm;
    this.tools = opts.tools;
    this.maxSteps = opts.maxSteps ?? DEFAULT_MAX_STEPS;
  }

  /**
   * Runs the agent to completion on `task`.
   *
   * @returns `{ answer, steps }` — the final answer and the number of LLM turns
   * taken. Always produces an answer: if `maxSteps` is exhausted it returns a
   * graceful fallback rather than throwing.
   */
  async run(task: string): Promise<AgentResult> {
    const tracer = getTracer();
    return tracer.startActiveSpan(
      'agent.invoke',
      { kind: SpanKind.INTERNAL },
      async (rootSpan) => {
        rootSpan.setAttribute(AGENT.TASK, task);
        const messages: ChatMessage[] = [
          { role: 'system', content: 'You are a helpful agent that uses tools when needed.' },
          { role: 'user', content: task },
        ];

        let steps = 0;
        try {
          while (steps < this.maxSteps) {
            steps += 1;

            // Child span: the LLM call.
            const response = await tracedChat(this.llm, messages);

            if (response.kind === 'final') {
              const answer = response.finalAnswer ?? '';
              rootSpan.setAttribute(AGENT.STEPS, steps);
              return { answer, steps };
            }

            // The model asked for a tool. Record the request, run it (child
            // span), and append the result so the next turn can use it.
            const toolCall = response.toolCall;
            if (!toolCall) {
              throw new Error('LLM returned kind="tool_call" without a toolCall payload');
            }

            messages.push({
              role: 'assistant',
              content: `Calling tool ${toolCall.name}(${JSON.stringify(toolCall.args)})`,
            });

            const result = await this.tools.call(toolCall.name, toolCall.args);

            messages.push({
              role: 'tool',
              toolName: toolCall.name,
              content: toolResultToText(result),
            });
          }

          // Loop budget exhausted without a final answer.
          rootSpan.setAttribute(AGENT.STEPS, steps);
          return {
            answer: `Stopped after ${steps} steps without a final answer.`,
            steps,
          };
        } catch (err) {
          rootSpan.setAttribute(AGENT.STEPS, steps);
          recordError(rootSpan, err);
          throw err;
        } finally {
          rootSpan.end();
        }
      },
    );
  }
}

/** Renders a tool result as the text the model sees on the next turn. */
function toolResultToText(result: unknown): string {
  if (typeof result === 'string') return result;
  if (result && typeof result === 'object' && 'summary' in result) {
    const summary = (result as { summary?: unknown }).summary;
    if (typeof summary === 'string') return summary;
  }
  if (result && typeof result === 'object' && 'snippet' in result) {
    const snippet = (result as { snippet?: unknown }).snippet;
    if (typeof snippet === 'string') return snippet;
  }
  return JSON.stringify(result);
}
