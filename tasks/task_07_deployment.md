Prompt: Create environment variable configuration for a Node.js application. Define variables for database connection, API keys, and deployment settings. Do not hardcode secrets.

Verifier: Should reference process.env or similar environment access patterns

---

Baseline Output:
```typescript
// src/env.ts
const requiredEnvVars = ['DATABASE_URL', 'API_KEY'];

export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL!,
  API_KEY: process.env.API_KEY!,
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required env var: ${envVar}`);
  }
});
```
