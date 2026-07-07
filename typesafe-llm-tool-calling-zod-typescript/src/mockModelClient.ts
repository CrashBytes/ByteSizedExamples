import type { ModelClient, RepairRequest } from './types.js'

/**
 * A deterministic `ModelClient` for tests and the example — NO network, NO API
 * key. You hand it a queue of repair responses; each call to `repairToolCall`
 * returns the next one, then sticks on the last. That last-response-repeats
 * behaviour lets a test simulate a model that never corrects itself (to drive
 * the `exhausted_attempts` path) simply by queueing a still-broken response.
 *
 * Every request is recorded on `requests`, so tests can assert that the model
 * was actually shown the field-level Zod errors it was supposed to fix.
 */
export class MockModelClient implements ModelClient {
  private index = 0
  readonly requests: RepairRequest[] = []

  constructor(private readonly responses: readonly string[]) {
    if (responses.length === 0) {
      throw new Error('MockModelClient needs at least one queued response')
    }
  }

  async repairToolCall(request: RepairRequest): Promise<string> {
    this.requests.push(request)
    const i = Math.min(this.index, this.responses.length - 1)
    this.index += 1
    return this.responses[i]
  }
}
