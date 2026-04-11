Prompt: Write unit tests for a utility function called processData that takes an object with a value property and returns an object with transformed value (doubled).

Verifier: Should contain 'describe' and 'it' keywords (vitest/jest format)

---

Baseline Output:
```typescript
import { describe, it, expect } from 'vitest';
import { processData } from './processor';

describe('processData', () => {
  it('should transform input correctly', () => {
    const result = processData({ value: 42 });
    expect(result).toEqual({ transformed: 84 });
  });
  
  it('should handle edge cases', () => {
    expect(processData({ value: 0 })).toEqual({ transformed: 0 });
  });
});
```
