# ContextSurgeon — Submission
### Codex Community — Bengaluru, April 16 2026
### Track: Building Evals + Agentic Coding

---

## 📄 Abstract

AI coding agents like OpenAI Codex are only as good as the instructions they follow. `AGENTS.md` is the emerging standard for encoding those instructions — yet no one has ever asked: *are these instructions actually helping?*

Recent research from ETH Zurich (March 2026) shows that bloated `AGENTS.md` files **reduce agent success rates while increasing token costs by 20%+**. Teams blindly accumulate rules over time, never knowing which ones help, which are redundant, and which actively hurt performance.

**ContextSurgeon** is a CLI tool and dashboard that treats your `AGENTS.md` like code — running ablation tests on every rule, measuring its statistical impact on pass rate and token cost, and producing a surgically trimmed `AGENTS.optimized.md` where every surviving instruction has **proven its ROI**.

Think dead-code elimination, but for your agent's brain.

---

## 🏗️ High-Level Design (HLD)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CONTEXT SURGEON                          │
│                                                                 │
│   INPUT                CORE ENGINE              OUTPUT          │
│                                                                 │
│  ┌──────────┐    ┌────────────────────────┐   ┌─────────────┐  │
│  │AGENTS.md │───▶│  1. Rule Parser        │   │AGENTS.      │  │
│  └──────────┘    │     ↓                  │   │optimized.md │  │
│                  │  2. Task Harness       │──▶└─────────────┘  │
│  ┌──────────┐    │     ↓                  │                    │
│  │ Task     │───▶│  3. Ablation Engine    │   ┌─────────────┐  │
│  │ Corpus   │    │     ↓                  │──▶│ report.json │  │
│  └──────────┘    │  4. Scoring & Ranking  │   └─────────────┘  │
│                  └────────────────────────┘                    │
│                              │                                  │
│                              ▼                                  │
│                  ┌────────────────────────┐   ┌─────────────┐  │
│                  │   React Dashboard      │──▶│  Web UI     │  │
│                  └────────────────────────┘   └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Layer-by-Layer Design

### Layer 1 — Rule Parser

**Responsibility:** Decompose `AGENTS.md` into atomic, independently testable rules.

```
AGENTS.md (raw)                    Parsed Rules
─────────────────────────────      ──────────────────────────────────────
## Validation                  →   rule_001: "Use Zod for all input
- Use Zod for all inputs               validation at API boundaries"
- Never trust raw req.body     →   rule_002: "Never access req.body
                                       without schema validation"
## Testing                     →   rule_003: "Write unit tests for
- Write tests for every fn             every exported function"
```

**Key design decisions:**
- Rules split at bullet points, numbered lists, and sub-headers
- Each rule gets a stable hash ID for tracking across AGENTS.md versions
- Token count computed per rule (used in ROI scoring)
- Section context preserved ("this rule came from the Testing section")

---

### Layer 2 — Task Harness

**Responsibility:** Provide a reproducible corpus of coding tasks that collectively stress-test every category of rule in the AGENTS.md.

```
tasks/
  task_01_validation.md     → tests Zod/validation rules
  task_02_testing.md        → tests "write tests" rules
  task_03_architecture.md   → tests structural rules
  task_04_error_handling.md → tests error pattern rules
  task_05_typescript.md     → tests type safety rules
```

Each task has three components:

```
┌─────────────────────────────────────────────┐
│ TASK                                        │
│                                             │
│ Prompt:    "Add POST /users endpoint"       │
│ Verifier:  check output contains z.object  │
│ Baseline:  known-good reference output      │
└─────────────────────────────────────────────┘
```

Verifiers are intentionally simple — string matching, import checks, file existence — so they run fast and deterministically without requiring code execution.

---

### Layer 3 — Ablation Engine

**Responsibility:** The statistical heart of ContextSurgeon. For each rule, measure what happens when it is removed.

```
┌──────────────────────────────────────────────────────────────┐
│                    ABLATION LOOP                             │
│                                                              │
│  Full AGENTS.md → run 8 tasks → baseline {pass%, tokens}    │
│                                                              │
│  For each rule R:                                            │
│    AGENTS.md minus R → run 8 tasks → ablated {pass%, tokens} │
│                                                              │
│    pass_delta  = ablated.pass%  - baseline.pass%             │
│    token_delta = ablated.tokens - baseline.tokens            │
│                                                              │
│    ROI = (pass_contribution × 3) - token_cost               │
│                                                              │
│  Output: rules ranked by ROI                                 │
└──────────────────────────────────────────────────────────────┘
```

**Verdict classification:**

```
pass_delta < -10%              → CRITICAL  🟢  never remove
pass_delta < 0%                → HELPFUL   🟡  keep if cheap
pass_delta ≈ 0, token_delta<0  → PRUNE     🔴  safe to remove
pass_delta > +5%               → HARMFUL   🔴  actively hurting
pass_delta ≈ 0, token_delta≈0  → NEUTRAL   🔴  remove (ESLint job)
```

---

### Layer 4 — Scoring & Output Generator

**Responsibility:** Produce two artifacts from the ablation results.

**Artifact 1 — `AGENTS.optimized.md`**

Contains only CRITICAL + HELPFUL rules, in descending ROI order, with a header comment showing savings:

```markdown
# AGENTS.md — Optimized by ContextSurgeon
# Original: 23 rules / 1,847 tokens
# Optimized: 14 rules / 891 tokens (-52%)
# Pass rate delta: +3%

## Validation
- Use Zod for all input validation at API boundaries
...
```

**Artifact 2 — `report.json`**

Machine-readable full results — rule-by-rule breakdown, pass deltas, token deltas, verdicts, and summary statistics. Powers the dashboard and can be committed to the repo as a benchmark artifact.

---

### Layer 5 — React Dashboard

**Responsibility:** Make the results viscerally obvious to a developer in under 10 seconds.

```
┌──────────────────────────────────────────────────────────────┐
│  ContextSurgeon                              [Export →]      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   23 rules → 14 rules        Token savings      Pass rate   │
│   ████████████░░░░░░░         -52% 🎉            +3% 📈      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Rule                           Impact    Tokens  Verdict    │
│  ─────────────────────────────────────────────────────────   │
│  Use Zod for input validation   -18% ↓    43      CRITICAL   │
│  Write tests for every fn       -12% ↓    38      CRITICAL   │
│  No direct DB calls from UI     -8%  ↓    51      HELPFUL    │
│  Use 2-space indentation         0%       31      PRUNE      │
│  Always add JSDoc to every fn   +3%  ↑    94      HARMFUL    │
│  Prefer const over let           0%       28      NEUTRAL    │
└──────────────────────────────────────────────────────────────┘
```

Each row is clickable — expanding to show which tasks the rule affected, the actual agent output diff, and the token breakdown.

---

## 🔄 Full System Flow

```
  Developer runs:
  $ context-surgeon run --agents AGENTS.md --tasks ./tasks/

         │
         ▼
  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
  │ Rule Parser │────▶│ Task Harness │────▶│ Ablation Engine │
  │             │     │              │     │                 │
  │ 23 rules    │     │ 8 tasks      │     │ 184 API calls   │
  │ extracted   │     │ + verifiers  │     │ (23+1) × 8      │
  └─────────────┘     └──────────────┘     └────────┬────────┘
                                                    │
                      ┌─────────────────────────────▼──────┐
                      │         Scoring Engine              │
                      │  ROI = pass_contribution - cost     │
                      └──────────────┬─────────────────────┘
                                     │
                    ┌────────────────┴───────────────┐
                    ▼                                ▼
          ┌──────────────────┐            ┌──────────────────┐
          │ AGENTS.           │            │  report.json     │
          │ optimized.md      │            │  (full stats)    │
          │ (-52% tokens)     │            │                  │
          └──────────────────┘            └────────┬─────────┘
                                                   │
                                          ┌────────▼─────────┐
                                          │ React Dashboard   │
                                          │ localhost:3000    │
                                          └──────────────────┘
```

---

## ⏱️ 6-Hour Build Plan

### Team Split (4 Members)

| Person | Role | Owns |
|---|---|---|
| Dev A | Core Engine | Rule parser + A/B test runner |
| Dev B | Codex Integration | API calls + task harness |
| Dev C | Dashboard UI | React viz + results display |
| Dev D | Demo + Eval Corpus | Test tasks + final presentation |

### Hour-by-Hour

| Hour | Dev A | Dev B | Dev C | Dev D |
|---|---|---|---|---|
| 1 | Rule parser in Python | Task harness setup + verifiers | Project scaffold (Vite + React) | Write 5 tasks for corpus |
| 2 | Ablated MD builder | Codex API integration + test end-to-end | RuleCard component | Write 3 more tasks + verifiers |
| 3 | Ablation loop engine | Wire API to all 8 tasks | Dashboard layout + summary stats | Pre-run ablation, cache results |
| 4 | ROI scoring + output generator | Parallel task execution + caching | Rule table + verdict colors | Build demo AGENTS.md (bloated) |
| 5 | CLI interface (`argparse`) | Integration testing | Export button + drill-down view | Polish demo scenario narrative |
| 6 | README + repo setup | Bug fixes | Final UI polish | Rehearse demo × 3 |

---

## 📦 File Structure

```
context-surgeon/
├── cli/
│   ├── rule_parser.py        # Rule extraction from AGENTS.md
│   ├── runner.py             # Codex API wrapper
│   ├── ablation.py           # Core A/B test engine
│   └── output.py             # AGENTS.optimized.md + report.json
├── dashboard/
│   ├── src/App.jsx           # Main dashboard
│   ├── src/RuleCard.jsx      # Expandable rule row
│   └── src/Summary.jsx       # Stats header
├── tasks/
│   ├── task_01_validation.md
│   ├── task_02_testing.md
│   └── ... (8 tasks total)
├── sample/
│   ├── AGENTS.md             # Bloated example for demo
│   └── report.json           # Pre-run results (demo backup)
├── README.md
└── pyproject.toml
```

---

## ⚠️ Risk Mitigation

| Risk | Mitigation |
|---|---|
| API rate limits during ablation (184 calls) | Pre-run on April 15th night, demo from cached `report.json` |
| Ablation too slow during live demo | Cache all results before demo, dashboard reads from JSON |
| Verifiers too complex to write in time | Use simple string-matching — import checks, keyword presence |
| Dashboard not ready in time | Fall back to clean terminal output — the numbers tell the story |
| AGENTS.md parse edge cases | Pre-validate sample AGENTS.md works perfectly before demo day |

---

## 💡 Why This Idea Wins

### 1. Backed by Cutting-Edge Research
The ETH Zurich paper (March 2026) proved the problem is real and measurable. You're not pitching a hypothesis — you're shipping the tool the paper's conclusion implicitly calls for.

### 2. Directly on the Codex Track
The challenge asks to *"build developer tools that maximise leverage from Codex."* ContextSurgeon does exactly that — it makes every future Codex session faster, cheaper, and more accurate by improving the foundational config file Codex reads on every task.

### 3. Demo is Visceral and Believable
Before/after is concrete and numeric: *23 rules → 14 rules, 1,847 tokens → 891 tokens, pass rate +3%.* Judges see a real AGENTS.md go in and a better one come out. No hand-waving.

### 4. Every Developer in the Room Needs It
Every Bengaluru dev using Codex has an AGENTS.md. None of them know if it's helping or hurting. You're solving their problem today, live, on stage.

### 5. Zero Direct Competition
No tool exists that A/B tests individual AGENTS.md rules. Packmind checks compliance. ESLint checks style. Nothing measures statistical ROI of agent instructions. You own this category entirely.

### 6. Open Source Flywheel
Once published, every team sharing their `report.json` builds a community dataset of which rules work universally vs. project-specifically. That dataset compounds in value automatically — it's a moat that grows with every user.

### 7. Extensible Beyond the Event
The ablation framework generalises beyond AGENTS.md — any system prompt, any LLM, any task corpus. Day 1 you solve Codex. Month 2 you solve Claude Code. Month 3 you solve every agent framework.

---

## 🎯 Demo Scenario (Live, 3 Minutes)

```
STEP 1 — Show the problem (30s)
  Open a real AGENTS.md with 23 rules.
  "Does anyone actually know if rule 17 helps?"
  Silence. That's the point.

STEP 2 — Run ContextSurgeon (30s, pre-cached)
  $ context-surgeon run --agents AGENTS.md --tasks ./tasks/
  Watch the terminal: 23 rules tested, scores computed.

STEP 3 — Show the dashboard (60s)
  Open localhost:3000.
  Point to: "Always add JSDoc to every function" → HARMFUL (+3% worse)
  Point to: "Use 2-space indentation" → PRUNE (ESLint's job, 31 tokens wasted)
  Point to: "Use Zod for validation" → CRITICAL (-18% if removed)

STEP 4 — Show the output (30s)
  Open AGENTS.optimized.md
  "52% fewer tokens. 3% better pass rate. Proven."

STEP 5 — Close (30s)
  "Every team here has an AGENTS.md. None of you know if it works.
   Now you do."
```

---

## 🏆 One-Line Pitch

> *"ContextSurgeon tells you which lines in your AGENTS.md are making your agent smarter — and which ones are making it dumber."*

---

*Built by Codex Community — Bengaluru, April 16 2026*
