/**
 * Wrap a cancellable operation in a hard deadline.
 *
 * `withTimeout` races the operation against a timer. If the timer wins it both
 * (a) rejects with a `TimeoutError` and (b) aborts the `AbortSignal` it handed
 * to the operation, so a well-behaved provider tears down its socket instead of
 * leaking a doomed request. Even a provider that ignores the signal still loses
 * the race, so the caller is never blocked past the deadline.
 */

import { TimeoutError } from './errors.js';

export function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(`request timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([fn(controller.signal), timeout]).finally(() => {
    clearTimeout(timer);
  });
}
