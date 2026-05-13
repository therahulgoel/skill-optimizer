# Skill Optimizer

Automatically optimize AI agent skills using real ablation testing with OpenAI API.

## What This Does

Given a skill file (AGENTS.md) and test prompts, it runs **real ablation testing**:

1. **Baseline**: Run all tests with ALL rules → measure pass rate
2. **Ablate each rule**: Remove one rule → run tests again → measure drop
3. **Calculate ROI**: `(pass_delta × 3) - token_savings`
4. **Output**: Only keep rules with positive ROI

## Requirements

- **OPENAI_API_KEY**: Get one at https://platform.openai.com/api-keys
- **AGENTS.md**: Your skill rules file
- **tasks/**: Directory with test prompt files (.md)

## Quick Start

### 1. Install

```bash
pip install -e .
```

### 2. Create test files

```bash
# AGENTS.md - your rules
echo "- Use foregroundStyle() not foregroundColor()" > AGENTS.md

# tasks/ - test prompts
mkdir -p tasks
echo "Review this SwiftUI code:
```swift
Text("Hello").foregroundColor(.red)
```" > tasks/review_swiftui.md
```

### 3. Run

```bash
skill-optimizer run \
  --agents ./AGENTS.md \
  --tasks ./tasks \
  --api-key $OPENAI_API_KEY \
  --use-api
```

### 4. Output

- `AGENTS.optimized.md` - rules that passed ablation
- `report.json` - per-rule ROI scores

## GitHub Action

Add to your repo:

```yaml
name: Skill Optimizer
on: pull_request

jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install -e .
      - run: |
          skill-optimizer run \
            --agents ./AGENTS.md \
            --tasks ./tasks \
            --api-key ${{ secrets.OPENAI_API_KEY }} \
            --use-api
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

**Required secrets**: `OPENAI_API_KEY`

## Cost

| Rules | Tasks | API Calls | Cost |
|-------|-------|----------|------|
| 10 | 3 | 33 | ~$0.40 |
| 30 | 5 | 155 | ~$1.86 |
| 50 | 10 | 510 | ~$6.12 |

Estimated with GPT-4o: ~$0.012 per call.

## The Math

```
Baseline: prompt + ALL rules → LLM → output → pass_rate

For each rule:
  Ablated: prompt + (ALL - rule) → LLM → output → pass_rate

ROI = (baseline_pass - ablated_pass) × 3 - tokens_saved
```

Rules with **positive ROI** improve output quality enough to justify their token cost.

---

**⚠️ Warning**: Without an API key, results use mock mode and are NOT validated.