import { describe, it, expect } from 'vitest';

describe('Service Worker Matcher Regression Suite', () => {
  it('allows safe source GET routes', () => {
    const matcherRegex = /^\/api\/sources\/[^/]+\/(manga|chapters|popular|latest)$/;
    
    expect('/api/sources/shinigami/manga').toMatch(matcherRegex);
    expect('/api/sources/shinigami/chapters').toMatch(matcherRegex);
    expect('/api/sources/dyn_123/popular').toMatch(matcherRegex);
    expect('/api/sources/dyn_123/latest').toMatch(matcherRegex);
  });

  it('rejects dynamic/private/auth/search routes', () => {
    const matcherRegex = /^\/api\/sources\/[^/]+\/(manga|chapters|popular|latest)$/;
    
    expect('/api/sources/shinigami/search').not.toMatch(matcherRegex);
    expect('/api/sources/health').not.toMatch(matcherRegex);
    expect('/api/sources/nsfw-ids').not.toMatch(matcherRegex);
    expect('/api/auth/session').not.toMatch(matcherRegex);
    expect('/api/users/me').not.toMatch(matcherRegex);
    expect('/api/manga').not.toMatch(matcherRegex); // Old route
  });
});
