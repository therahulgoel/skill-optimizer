Prompt: Add a POST /users endpoint that accepts a user object with email, name, and id fields. The endpoint should validate input using Zod and return the created user.

Verifier: Should contain 'z.object' or 'z.string()' in the output

---

Baseline Output:
```typescript
import { z } from 'zod';

const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

export async function POST(req) {
  const payload = userSchema.parse(req.body);
  return { success: true, data: payload };
}
```
