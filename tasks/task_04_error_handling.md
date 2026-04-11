Prompt: Write error handling code that catches database errors and returns a proper HTTP response without exposing internal details to the client.

Verifier: Should contain error handling, proper HTTP status codes, and client-safe error messages

---

Baseline Output:
```typescript
export async function POST(req: Request) {
  try {
    const user = userSchema.parse(req.body);
    return await db.users.create(user);
  } catch (error) {
    if (error instanceof ValidationError) {
      return { status: 400, error: 'Invalid input' };
    }
    if (error instanceof DatabaseError) {
      console.error('DB Error:', error);
      return { status: 500, error: 'Internal server error' };
    }
    throw error;
  }
}
```
