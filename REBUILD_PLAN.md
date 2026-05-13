# Skill Optimizer - Rebuild Plan

## Problem
Current implementation is fake - uses mock/heuristics/keyword matching with no real LLM calls.

## Solution
Real ablation testing with actual LLM inference to verify rule impact.

---

## What We're Building

### User Provides
```
my-agent/
├── AGENTS.md           # Their skill rules
└── tasks/
    ├── code_review.md # Test: "Review this SwiftUI code"
    ├── api_design.md  # Test: "Design a REST API"
    └── ...            # More test prompts
```

### System Does
```
1. BASELINE: Run all tasks with ALL rules → collect outputs
2. For each RULE:
   ABLATED: Run all tasks WITH rule REMOVED → collect outputs
   COMPARE: Did output quality drop?
3. Calculate ROI per rule
4. Keep only rules that improve output
```

### Output
```
results/
├── AGENTS.optimized.md  # Only rules that pass
├── report.json          # Per-rule ROI scores
```

---

## Changes Required

### 1. runner.py
- REMOVE: `_send_mock()` - no more fake outputs
- REMOVE: `--no-api` flag
- REQUIRE: `--api-key` always
- Use real OpenAI API calls

### 2. ablation.py
- REMOVE: mock-based verdicts
- Calculate ROI from real pass rate deltas
- Only rules with positive ROI → kept

### 3. main.py CLI
- REMOVE: `trim-skill` command (heuristic-only)
- UPDATE: `run` requires --api-key
- ADD: Fail early if no tasks directory

### 4. GitHub Action
- REQUIRE: OPENAI_API_KEY secret
- REMOVE: fallback to trim-skill
- FAIL: If no key or no tasks

---

## New CLI Usage

```bash
# Local (requires API key)
skill-optimizer run \
  --agents ./AGENTS.md \
  --tasks ./tasks \
  --api-key $OPENAI_KEY

# GitHub Action
# Requires: OPENAI_API_KEY secret + AGENTS.md + tasks/
```

---

## Edge Cases

| Case | Behavior |
|------|----------|
| No OPENAI_API_KEY | FAIL with clear error |
| No tasks/ directory | FAIL - "Add test tasks" |
| Rate limited | Retry 3x, then fail |
| Invalid API key | FAIL - "Check your key" |

---

## Cost

| Rules | Tasks | API Calls | Est. Cost |
|-------|-------|----------|-----------|
| 10 | 3 | 33 | $0.40 |
| 30 | 5 | 155 | $1.86 |
| 50 | 10 | 510 | $6.12 |

---

## Deliverables

1. CLI with real API-only mode
2. GitHub Action requiring API key
3. Clear error messages
4. report.json with verified ROI