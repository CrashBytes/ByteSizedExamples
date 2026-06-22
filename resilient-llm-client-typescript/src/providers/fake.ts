/**
 * A scriptable in-memory provider for tests and the offline demo.
 *
 * Pass a list of behaviors; each `chat()` call consumes the next one. This lets
 * a test say "fail twice with a 503, then succeed" deterministically, with no
 * network and no real timers.
 */

import { ServerError } from '../errors.js';
import type { ChatRequest, ChatResponse, Provider } from '../types.js';

export type FakeBehavior =
  | { type: 'ok'; text?: string }
  | { type: 'error'; error: unknown }
  /** Never resolves until aborted — used to exercise the timeout layer. */
  | { type: 'hang' };

export class FakeProvider implements Provider {
  readonly name: string;
  private readonly behaviors: FakeBehavior[];
  private cursor = 0;
  /** Number of times chat() was actually invoked — handy for assertions. */
  calls = 0;

  constructor(name: string, behaviors: FakeBehavior[]) {
    this.name = name;
    this.behaviors = behaviors;
  }

  chat(request: ChatRequest, signal: AbortSignal): Promise<ChatResponse> {
    this.calls++;
    // Repeat the final behavior once the script is exhausted.
    const behavior = this.behaviors[Math.min(this.cursor, this.behaviors.length - 1)];
    this.cursor++;

    if (behavior.type === 'error') {
      return Promise.reject(behavior.error);
    }

    if (behavior.type === 'hang') {
      return new Promise<ChatResponse>((_resolve, reject) => {
        if (signal.aborted) return reject(new ServerError('aborted'));
        signal.addEventListener('abort', () => reject(new ServerError('aborted')), { once: true });
      });
    }

    return Promise.resolve({
      text: behavior.text ?? `echo from ${this.name}`,
      model: request.model ?? `${this.name}-default`,
      provider: this.name,
    });
  }
}
