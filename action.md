# Skill Optimizer GitHub Action

Trim SKILL.md files to reduce token costs by 70-90%.

## Usage

```yaml
name: Optimize Skills

on:
  push:
    branches: [main]
    paths: ['skills/**']
  pull_request:
    paths: ['skills/**']
  workflow_dispatch:

jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: therahulgoel/skill-optimizer@v1
        with:
          mode: balanced  # strict | balanced | aggressive
          skills-dir: skills
          output-dir: results
```

## Inputs

| Input | Description | Default |
|-------|-----------|--------|
| `mode` | Trim mode | `balanced` |
| `skills-dir` | Directory with SKILL.md files | `skills` |
| `output-dir` | Output directory | `results` |

## Outputs

| Output | Description |
|--------|-----------|
| `skills-count` | Number of skills processed |
| `tokens-saved` | Total tokens saved |
| `tokens-per-skill` | Average tokens saved per skill |

## Example with PR Comment

```yaml
jobs:
  optimize:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: therahulgoel/skill-optimizer@v1
        id: optimize

      - uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const { skills, tokens, avg } = ${{ steps.optimize.outputs }};
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              body: `Skill Optimizer: ${skills} skills, ${tokens} tokens saved`
            });
```

## Token Savings

Typical results:
- **70-90%** token reduction
- **100-150** tokens saved per skill
- Original behavior preserved