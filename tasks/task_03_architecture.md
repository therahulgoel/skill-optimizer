Prompt: Structure an API endpoint using a service layer pattern. The endpoint should accept a user request, validate it, then call a UserService to create the user. Do not access the database directly from the route handler.

Verifier: Should contain 'UserService' class usage and validation before service call

---

Baseline Output:
```typescript
// src/api/users/route.ts
import { validateRequest } from '@/lib/validation';
import { UserService } from '@/services/UserService';

export async function POST(request: Request) {
  const user = await validateRequest(request);
  const service = new UserService();
  return await service.create(user);
}
```
