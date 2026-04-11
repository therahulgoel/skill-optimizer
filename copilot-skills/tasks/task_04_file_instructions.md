Prompt: Create a file-level .instructions.md that applies only to React component files. It should enforce component patterns like using functional components, proper prop typing, and hook rules. Use applyTo to scope it to the right files.

Verifier: Should have applyTo glob pattern scoped to specific file types with description

---

Baseline Output:
```markdown
---
description: "Use when: writing or editing React components. Enforces component patterns."
applyTo: "src/components/**/*.{tsx,jsx}"
---

# React Component Standards

- Use functional components with arrow function syntax
- Define prop types using TypeScript interfaces, not inline types
- Extract custom hooks to src/hooks/ when logic is reused
- Use React.memo() for components receiving stable props
- Keep components under 150 lines — extract sub-components if larger
- Always handle loading and error states in data-fetching components
```
