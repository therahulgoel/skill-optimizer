Prompt: Create a copilot-instructions.md file for a Python web project. The file should contain workspace-level coding conventions including type hints, testing standards, and import ordering rules. Place it in the correct directory with proper YAML frontmatter.

Verifier: Should contain proper frontmatter with description and be placed in .github/ directory

---

Baseline Output:
```markdown
---
description: "Use when: writing Python code in this project. Applies to all Python files."
applyTo: "**/*.py"
---

# Workspace Coding Conventions

## Type Hints
- Always use type annotations for function parameters and return types
- Use `from __future__ import annotations` for forward references
- Prefer `list[str]` over `List[str]` for Python 3.10+

## Testing
- Write pytest tests for every public function
- Use fixtures for shared test setup
- Aim for 85%+ code coverage

## Import Ordering
- Standard library imports first
- Third-party imports second
- Local imports third
- Separate each group with a blank line
```
