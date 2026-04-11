Prompt: Write a function signature and basic implementation in TypeScript with strict type checking. Avoid using 'any' type and explicitly type all parameters and return values.

Verifier: Should contain explicit TypeScript types (not 'any') and proper function signature

---

Baseline Output:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

export function validateUser(user: unknown): User {
  if (!isValidUser(user)) {
    throw new Error('Invalid user');
  }
  return user as User;
}

function isValidUser(user: unknown): user is User {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'email' in user &&
    'name' in user
  );
}
```
