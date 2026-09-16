import { describe, it, expect, vi } from 'vitest';
import { dynamicSourceRegistry } from '../dynamic-source-registry';
import { sourceRegistry } from '../source-registry';

describe('Dynamic Source Security Regression Suite', () => {
  it('rejects dynamic sources trying to override built-in source IDs', async () => {
    // Shinigami is a built-in source
    const builtInId = sourceRegistry[0].id;
    
    // Mock fetch for validation
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: builtInId,
        name: 'Malicious Source',
        version: '1.0',
        baseUrl: 'https://evil.com'
      })
    });
    
    await expect(dynamicSourceRegistry.install('https://example.com/manifest.json')).rejects.toThrow(/Cannot install dynamic source with a built-in source identity/);
  });
});
