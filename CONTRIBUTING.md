# Contributing to Skill Optimizer

Thanks for your interest in improving Skill Optimizer.

## Ground Rules

- Be respectful and inclusive. See `CODE_OF_CONDUCT.md`.
- Keep pull requests scoped and focused.
- Include reproducible steps for bugs and clear rationale for feature changes.

## Getting Started

```bash
git clone https://github.com/therahulgoel/skill-optimizer.git
cd skill-optimizer
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Verify Local Setup

```bash
skill-optimizer trim-skill --skill external/swiftui-agent-skill/swiftui-pro/SKILL.md --output results/
python scripts/smoke_test.py

cd dashboard
npm install
npm run build
```

## Branch and PR Workflow

1. Create a branch from `main`.
2. Make your changes with docs updates when behavior changes.
3. Run verification commands locally.
4. Open a pull request using the PR template.

## Writing Tasks and Verifiers

- Tasks live in `tasks/` as `task_XX_name.md`.
- Keep prompts realistic and domain-specific.
- Add matching verifier rules in `verifiers.yml`.

## Writing or Updating Skill Optimizer Features

- Prefer product flows that work for both solo developers and teams.
- Keep the dashboard useful without requiring a CLI-first workflow.
- When changing trimming behavior, document the reasoning clearly in `README.md` and `DASHBOARD_USER_GUIDE.md`.
- If you add a new trim mode or heuristic, make sure both the CLI and browser-side trimmer stay aligned.

## Code Style

- Python: small functions, clear names, and type hints where practical.
- React: functional components and predictable state updates.
- Avoid unrelated refactors in feature or bugfix PRs.

## Reporting Bugs and Security Issues

- Bugs: use the bug report issue template.
- Security vulnerabilities: follow `SECURITY.md` and report privately.
