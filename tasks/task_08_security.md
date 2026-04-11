Prompt: Write a module that handles API rate limiting to prevent abuse. Use a simple in-memory store or middleware pattern.

Verifier: Should contain rate limiting logic with thresholds and blocking

---

Baseline Output:
```typescript
// src/middleware/rateLimit.ts
const requestCounts = new Map<string, number[]>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }
    
    const times = requestCounts.get(key)!;
    const recentRequests = times.filter(t => now - t < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      throw new Error('Rate limit exceeded');
    }
    
    recentRequests.push(now);
    requestCounts.set(key, recentRequests);
  };
}
```
