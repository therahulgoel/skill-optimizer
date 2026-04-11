Prompt: Create a SKILL.md file for a "database-migration" skill that helps developers run and manage database migrations. Include proper YAML frontmatter with name and description fields, and provide multi-step workflow instructions.

Verifier: Should have YAML frontmatter with name and description between --- markers

---

Baseline Output:
```markdown
---
name: database-migration
description: "Use when: running database migrations, creating migration files, or troubleshooting migration conflicts. Handles schema changes for PostgreSQL and MySQL."
---

# Database Migration Skill

## Step 1: Check Current State
Run `alembic current` to see the current migration head.

## Step 2: Create Migration
Generate a new migration file:
```bash
alembic revision --autogenerate -m "description of change"
```

## Step 3: Review Migration
Always review the generated migration file before applying.

## Step 4: Apply Migration
```bash
alembic upgrade head
```

## Step 5: Verify
Check the database schema matches expected state.
```
