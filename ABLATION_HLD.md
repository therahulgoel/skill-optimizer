# Ablation Testing HLD

## Problem
Current skill optimization uses mock/heuristic mode - no real verification that optimized skill behaves same as original.

## Solution
Real ablation testing that measures actual rule impact by calling LLM with and without each rule.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Action                           │
├─────────────────────────────────────────────────────────────────┤
│  1. Find AGENTS.md files                                   │
│  2. Load OPENAI_API_KEY (required)                         │
│  3. For each AGENTS.md:                                   │
│     ├── Run BASELINE: prompt + ALL rules → LLM → output    │
│     ├── For each RULE:                                      │
│     │   └── Run ABLATED: prompt + (rules - rule) → LLM      │
│     │   └── Compare output quality                         │
│     ├── Calculate: pass_delta, token_delta, ROI             │
│     └── Generate: AGENTS.optimized.md + report.json       │
│  4. Post PR comment with results                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Input
```
AGENTS.md (your rules)
tasks/ (test prompts)
verifiers.yml (output checkers)
```

### Processing
```
Baseline (all rules)     → baseline_output + pass_rate
Ablation n (rule removed) → ablated_output + pass_rate
Delta                   → pass_delta = ablated_pass - baseline_pass
ROI                    → (pass_delta * 3) - saved_tokens
```

### Output
```
AGENTS.optimized.md  (only rules with ROI > 0)
report.json        (full ablation results)
PR Comment        (summary + optimized skill)
```

---

## API Calls

For N rules and T test tasks:
- Baseline: T calls
- Ablations: N × T calls
- **Total: T × (N + 1) calls**

Example: 30 rules × 5 tasks = 155 API calls

---

## Cost (GPT-4)

- ~$0.03 per 1K tokens
- ~100 tokens input + ~300 output per call
- ~$0.012 per call
- **30 rules × 5 tasks ≈ $1.86**

---

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| OPENAI_API_KEY | YES | From platform.openai.com |
| model | No | gpt-4 (default), gpt-4o |
| tasks_dir | YES | ./tasks/ directory |

---

## Dependencies Removed

- Mock mode code
- trim-skill fallback (heuristic-only)
- Optional API key logic

---

## Deliverables

1. GitHub Action that REQUIRES API key
2. Real ablation testing with GPT-4
3. PR comment with verified optimized skill
4. report.json with per-rule ROI scores