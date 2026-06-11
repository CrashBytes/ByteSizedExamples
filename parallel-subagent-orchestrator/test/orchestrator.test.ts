import { describe, expect, it } from 'vitest'
import { parallel, pipeline, runTask } from '../src/orchestrator.js'
import type { Task } from '../src/types.js'

describe('runTask', () => {
  it('returns fulfilled on the first success', async () => {
    const task: Task<number> = { name: 'ok', run: async () => 42 }
    const settled = await runTask(task)
    expect(settled).toMatchObject({ status: 'fulfilled', value: 42, attempts: 1 })
  })

  it('retries then succeeds', async () => {
    let calls = 0
    const task: Task<string> = {
      name: 'flaky',
      run: async () => {
        calls += 1
        if (calls < 3) throw new Error('transient')
        return 'done'
      },
    }
    const settled = await runTask(task, 2)
    expect(settled.status).toBe('fulfilled')
    expect(settled.value).toBe('done')
    expect(settled.attempts).toBe(3)
  })

  it('rejects after exhausting retries', async () => {
    const task: Task<never> = {
      name: 'broken',
      run: async () => {
        throw new Error('always fails')
      },
    }
    const settled = await runTask(task, 1)
    expect(settled.status).toBe('rejected')
    expect(settled.attempts).toBe(2)
    expect(settled.reason?.message).toBe('always fails')
  })

  it('treats a validation failure as a retryable error', async () => {
    let calls = 0
    const validate = {
      parse(value: unknown): number {
        if (typeof value !== 'number') throw new Error('expected a number')
        return value
      },
    }
    const task: Task<number> = {
      name: 'validated',
      validate,
      run: async () => {
        calls += 1
        return (calls < 2 ? 'nope' : 7) as unknown as number
      },
    }
    const settled = await runTask(task, 3)
    expect(settled.status).toBe('fulfilled')
    expect(settled.value).toBe(7)
    expect(settled.attempts).toBe(2)
  })
})

describe('parallel', () => {
  it('runs every task and isolates failures', async () => {
    const tasks: Task<number>[] = [
      { name: 'a', run: async () => 1 },
      {
        name: 'b',
        run: async () => {
          throw new Error('b failed')
        },
      },
      { name: 'c', run: async () => 3 },
    ]
    const settled = await parallel(tasks, { maxRetries: 0 })
    expect(settled.map((s) => s.status)).toEqual([
      'fulfilled',
      'rejected',
      'fulfilled',
    ])
    expect(settled[0].value).toBe(1)
    expect(settled[2].value).toBe(3)
    expect(settled[1].reason?.message).toBe('b failed')
  })
})

describe('pipeline', () => {
  it('threads each item through every stage', async () => {
    const out = await pipeline<number>(
      [1, 2, 3],
      [async (n: number) => n + 1, async (n: number) => n * 10],
      { concurrency: 2 },
    )
    expect(out).toEqual([20, 30, 40])
  })

  it('drops a failing item to null without sinking the batch', async () => {
    const out = await pipeline<number>(
      [1, 2, 3],
      [
        async (n: number) => {
          if (n === 2) throw new Error('stage failed for 2')
          return n
        },
        async (n: number) => n * 2,
      ],
    )
    expect(out).toEqual([2, null, 6])
  })
})
