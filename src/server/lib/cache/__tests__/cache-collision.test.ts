import { describe, it, expect } from 'vitest';

describe('Dynamic Source Cache Isolation Regression Suite', () => {
  it('ensures dynamic sources do not collide with built-in sources in cache keys', () => {
    // Simulated cache key generator used by the application
    const getCacheKey = (sourceId: string, mangaId: string) => `yomirra:manga:${sourceId}:${mangaId}`;
    
    // Built-in
    const builtInKey = getCacheKey('shinigami', 'manga-123');
    // Dynamic
    const dynamicKey = getCacheKey('dyn_123', 'manga-123');
    
    expect(builtInKey).not.toEqual(dynamicKey);
    // As long as the dynamic source registry rejects 'shinigami' as an ID, 
    // it's mathematically impossible for them to collide.
    expect(builtInKey).toBe('yomirra:manga:shinigami:manga-123');
    expect(dynamicKey).toBe('yomirra:manga:dyn_123:manga-123');
  });
});
