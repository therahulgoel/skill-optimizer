Prompt: Write a config file or module that exports constants and configuration. Use proper formatting and consistent code style (2-space indents, const declarations).

Verifier: Should use const declarations and proper formatting

---

Baseline Output:
```typescript
// src/config.ts
export const CONFIG = {
  API_TIMEOUT: 5000,
  MAX_RETRIES: 3,
  LOG_LEVEL: 'info',
  DB_POOL_SIZE: 10,
};

export const FEATURES = {
  AUTH_ENABLED: true,
  RATE_LIMITING: true,
  CACHING: false,
};

export const getConfig = () => CONFIG;
```
