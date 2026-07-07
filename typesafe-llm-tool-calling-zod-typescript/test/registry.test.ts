import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { defineTool, ToolRegistry } from '../src/toolRegistry.js'

describe('ToolRegistry', () => {
  const tool = defineTool({
    name: 'echo',
    description: 'Echo a message.',
    schema: z.object({ message: z.string() }),
    handler: args => args.message,
  })

  it('registers and retrieves a tool by name', () => {
    const registry = new ToolRegistry().register(tool)
    expect(registry.has('echo')).toBe(true)
    expect(registry.get('echo')?.name).toBe('echo')
    expect(registry.names()).toEqual(['echo'])
  })

  it('throws when the same name is registered twice', () => {
    const registry = new ToolRegistry().register(tool)
    expect(() => registry.register(tool)).toThrow(/already registered/)
  })

  it('returns undefined for a tool that was never registered', () => {
    expect(new ToolRegistry().get('missing')).toBeUndefined()
  })
})
