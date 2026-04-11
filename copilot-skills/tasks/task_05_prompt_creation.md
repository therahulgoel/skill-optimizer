Prompt: Create a .prompt.md file that generates a REST API endpoint. It should accept parameters for the HTTP method, resource name, and fields. Use proper mustache-style variable syntax.

Verifier: Should contain mustache-style {{variable}} parameters and be a focused prompt

---

Baseline Output:
```markdown
---
description: "Generate a REST API endpoint with validation and error handling"
---

# Generate {{method}} /{{resource}} Endpoint

Create a {{method}} endpoint for the {{resource}} resource with these fields:

{{fields}}

Requirements:
- Validate all input fields using Zod schemas
- Return proper HTTP status codes (201 for create, 200 for update)
- Include error handling with try/catch
- Use TypeScript with strict types
- Follow the service layer pattern — do not access DB directly from handler
```
