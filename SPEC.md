# Skill Optimizer — Complete Feature Specification

**Version:** 0.1.0 (Initial Build)  
**Date:** March 20, 2026  
**Status:** Full implementation underway

---

## 📋 Executive Summary

Skill Optimizer is a complete ablation testing system for `AGENTS.md` rules. It comprises:
1. **Python CLI** — Parses rules, runs A/B tests with Codex, computes ROI, generates optimized AGENTS.md
2. **React Dashboard** — Visualizes results, allows filtering/searching, exports optimizations
3. **Caching & Versioning** — Stores results for trend analysis across iterations
4. **Customizable Verifiers** — Teams can define their own rule validation logic

This spec documents the **final, production-ready implementation**.

---

## 🏗️ Architecture

### High-Level Flow

```
Developer Input                Core Pipeline              Outputs
────────────────────           ─────────────────          ───────
AGENTS.md ────────────────┐
                          ├──→ Rule Parser → Extract 34 atomic rules
Task Corpus ──────────────┤
(8 .md files)             ├──→ Task Harness → Load & execute tasks
                          │
Verifiers.yml ────────────┤
(custom tests)            ├──→ Codex API (with caching)
                          │
                          └──→ Ablation Engine → A/B test & ROI score
                                    │
                          ┌─────────┼─────────┐
                          ▼         ▼         ▼
                    AGENTS.    report.json  Trends.json
                    optimized  (cached)     (multi-run)
                       .md
                          │
                          └──→ React Dashboard
                               (visualize, export)
```

### Component Layers

| Layer | Responsibility | Tech Stack |
|-------|---|---|
| **CLI** | Rules, tasks, ablation, scoring | Python 3.10+, Click, Pydantic |
| **API Integration** | Codex calls + caching | OpenAI SDK, SQLite |
| **Task Engine** | Verifiers, result validation | Custom DSL |
| **Dashboard** | Visualization, export | React 18, Vite, CSS |

---

## 📦 CLI Features (Python)

### 1. **Real Codex API Integration**

#### Behavior
- Uses OpenAI API if `OPENAI_API_KEY` is set
- Falls back to deterministic mock if key is missing (for demo)
- Logs all API calls to `debug.log`

#### Configuration
```bash
# API Mode
export OPENAI_API_KEY="sk-..."
context-surgeon run --agents AGENTS.md --tasks ./tasks/ --use-api

# Mock Mode (no API key needed)
context-surgeon run --agents AGENTS.md --tasks ./tasks/
```

#### File Changes
- `cli/runner.py` — Enhanced `CodexAPI` class with real OpenAI calls
- `cli/main.py` — Added `--use-api` flag
- New `cli/config.py` — Environment & API configuration

#### Key Methods
```python
class CodexAPI:
    def send_prompt(self, task_id: str, prompt: str, agents_md: str) -> TaskResult
    def get_usage_summary(self) -> dict  # Returns total cost, calls made
    def enable_cache(self, cache_dir: Path)  # SQLite-based result caching
```

---

### 2. **Caching Layer**

#### Purpose
- Avoid re-running expensive API calls for the same AGENTS.md
- Cache key: `hash(agents_md_content) + task_id`
- Persistent storage: SQLite database in `.context-surgeon/cache.db`

#### Files
- New `cli/cache.py` — Cache manager
- Automatic cache initialization on first run
- Cache invalidation on AGENTS.md changes

#### Usage
```python
cache = ResultCache(cache_dir=Path('.context-surgeon'))
result = cache.get_or_fetch(
    task_id='task_01',
    agents_hash='abc123',
    fetch_fn=lambda: api.send_prompt(...)
)
```

#### Behavior
- **First run:** No cache → 280 API calls (23 rules × 8 tasks × (1 baseline + 1 test per rule))
- **Second run (same file):** Instant results from cache
- **After editing AGENTS.md:** Selective re-runs (only changed rules)

---

### 3. **Verifier Customization System**

#### Overview
Instead of simple string matching, teams can write custom verifiers for their rules.

#### Verifier Format (YAML)

**File:** `verifiers.yml`

```yaml
verifiers:
  task_01_validation:
    type: "regex"
    pattern: "z\\.object|z\\.string"
    description: "Must contain at least one Zod type"

  task_02_testing:
    type: "python"
    code: |
      import re
      has_describe = 'describe(' in output
      has_it = 'it(' in output
      return has_describe and has_it
    description: "Must have describe and it blocks"

  task_03_architecture:
    type: "ast"  # Parse TypeScript AST
    rules:
      - "must_have_class_usage:UserService"
      - "must_not_have_import:Database"
    description: "Service layer pattern"
```

#### Implementation
- New `cli/verifiers.py` — Verifier engine
- Supports: regex, Python code execution, simple AST checks
- Fallback to string matching if unspecified

#### Usage in Code
```python
verifier = VerifierEngine('verifiers.yml')
is_valid = verifier.check('task_01_validation', output)
```

---

### 4. **Trend Tracking & Versioning**

#### Files Generated
```
.context-surgeon/
├── cache.db                    # SQLite cache
├── trends/
│   ├── 2026-03-20_v1.json     # Run 1 report
│   ├── 2026-03-20_v2.json     # Run 2 report
│   └── LATEST.json            # Symlink to latest
└── .run_history.json          # Metadata, timestamps
```

#### Metadata Stored
```json
{
  "timestamp": "2026-03-20T16:42:00Z",
  "agents_md_hash": "abc123def456",
  "api_call_count": 280,
  "total_cost_usd": 2.48,
  "baseline_pass_rate": 100.0,
  "optimized_pass_rate": 103.0,
  "token_savings_pct": 52.0,
  "rules_analyzed": 34,
  "critical_count": 4,
  "duration_seconds": 45
}
```

#### New CLI Command
```bash
context-surgeon trends                    # Show all runs
context-surgeon trends --compare v1 v2   # Compare two runs
```

---

## 🎨 Dashboard Features (React)

### 5. **Export Button**

#### Feature
Download optimized `AGENTS.md` from dashboard (no CLI needed).

#### Implementation (Dashboard)
- New `ExportButton` component
- Reads from `report.json`
- Generates markdown on the fly
- Downloads as `AGENTS.optimized.md`

#### File Changes
- `dashboard/src/components/ExportButton.jsx` (new)
- `dashboard/src/components/ExportButton.css` (new)
- Update `App.jsx` to include export button in header

#### Code Example (React)
```jsx
function ExportButton({ report }) {
  const handleExport = () => {
    const md = generateMarkdown(report)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'AGENTS.optimized.md'
    a.click()
  }
  
  return <button onClick={handleExport}>📥 Export Optimized AGENTS.md</button>
}
```

---

### 6. **Trend Visualization**

#### Feature
Show how agent performance improved across multiple runs.

#### Components
- `TrendChart.jsx` — Line chart (pass rate, token savings over time)
- `TrendComparison.jsx` — Side-by-side rule comparison
- `ComparisonView.jsx` — Before/after metrics

#### Data Source
- Reads from `trends/` directory (multiple report.json files)
- Computes deltas: `Δ pass_rate`, `Δ tokens`, `Δ rules_kept`

#### UI
```
Multiple Reports Loaded
v1 (2026-03-20 16:00)  ┬─ Pass Rate: 89.5% | Tokens: 2,847
                       │
v2 (2026-03-20 16:30) ─┼─ Pass Rate: 91.2% | Tokens: 2,251  ↑+1.7% ↓-15%
                       │
v3 (2026-03-20 17:00) ─┴─ Pass Rate: 92.8% | Tokens: 1,954  ↑+3.3% ↓-31%

📈 Trend: Steady improvement with each iteration
```

#### File Changes
- `dashboard/src/components/TrendChart.jsx` (new)
- `dashboard/src/components/TrendComparison.jsx` (new)
- `dashboard/src/App.jsx` — Add tabs: Results / Trends
- `dashboard/src/utils/trendAnalysis.js` (new) — Compute deltas

---

### 7. **Dark Mode Toggle**

#### Feature
System respects `prefers-color-scheme` media query. Toggle switch in header.

#### Implementation
- CSS custom properties (variables) for theme colors
- `useTheme()` React hook
- LocalStorage persistence of user preference

#### File Changes
- `dashboard/src/hooks/useTheme.jsx` (new)
- `dashboard/src/theme.css` (new) — Light/dark color scheme
- Update all component CSS files to use CSS variables

#### Theme Variables
```css
/* Light theme (default) */
--bg-primary: #ffffff;
--bg-secondary: #f5f7fa;
--text-primary: #1a1a1a;
--text-secondary: #718096;
--accent: #667eea;

/* Dark theme */
--bg-primary: #1a202c;
--bg-secondary: #2d3748;
--text-primary: #f7fafc;
--text-secondary: #cbd5e0;
--accent: #9f7aea;
```

---

## 🔧 Configuration Files

### `pyproject.toml` — Python Metadata
Already exists. No changes.

### `verifiers.yml` — Custom Verifiers
**New file** at project root.

```yaml
# Skill Optimizer Verifier Configuration
# Define how to validate each task's output

default_verifier:
  type: "regex"
  mode: "any"  # 'any' = match if ANY pattern matches, 'all' = match all

verifiers:
  task_01_validation:
    type: "regex"
    patterns:
      - "z\\.object|z\\.string|zod"
    sensitive: false

  task_02_testing:
    type: "python"
    code: |
      import re
      return bool(
        re.search(r'describe\s*\(', output) and
        re.search(r'it\s*\(', output)
      )

  # ... more verifiers ...
```

### `.env.example` — Environment Template
**New file** at project root.

```bash
# OpenAI API Configuration
OPENAI_API_KEY=sk-...          # Leave blank for mock mode
OPENAI_MODEL=gpt-4             # Model to use for Codex API calls
OPENAI_TEMPERATURE=0.3         # Lower = more deterministic

# Caching
CACHE_ENABLED=true
CACHE_DIR=.context-surgeon

# Dashboard
DASHBOARD_PORT=3000
DASHBOARD_AUTO_OPEN=true
```

---

## 📊 Output File Formats

### `report.json` — Ablation Results
```json
{
  "metadata": {
    "timestamp": "2026-03-20T16:42:00Z",
    "agents_md_hash": "abc123",
    "api_calls_made": 280,
    "cache_hits": 0,
    "total_duration_seconds": 45
  },
  "summary": {
    "total_rules": 34,
    "baseline_pass_rate": 100.0,
    "baseline_tokens": 2847,
    "critical_count": 4,
    "helpful_count": 6,
    "prune_count": 8,
    "harmful_count": 2,
    "neutral_count": 14
  },
  "rules": [
    {
      "rule_id": "rule_001",
      "rule_text": "Use Zod for all input validation",
      "section": "Validation",
      "verdict": "CRITICAL",
      "roi": 54.6,
      "pass_delta": -18.2,
      "token_delta": -8,
      "original_tokens": 4,
      "baseline_pass_rate": 100.0,
      "ablated_pass_rate": 81.8
    },
    // ... 33 more rules ...
  ]
}
```

### `AGENTS.optimized.md` — Generated Output
```markdown
# AGENTS.md — Optimized by Skill Optimizer

**Run:** 2026-03-20 16:42  
**Original:** 34 rules / 2,847 tokens  
**Optimized:** 10 rules / 1,370 tokens (-52%)  
**Pass Rate Delta:** +3.2%

---

## Validation

- Use Zod for all input validation at API boundaries
- Never trust raw req.body from HTTP requests
- Validate all UUID inputs with proper regex

## Testing

- Write unit tests for every exported function
- Always test edge cases and error paths

## Architecture

- Never call database directly from API handlers
- Use service layer pattern for all data operations
- Keep routes in separate files from business logic

(... more sections sorted by ROI descending ...)
```

---

## 📋 Database Schema (SQLite Cache)

```sql
CREATE TABLE cache_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agents_hash TEXT NOT NULL,
  task_id TEXT NOT NULL,
  result_hash TEXT NOT NULL,
  api_response TEXT NOT NULL,      -- JSON blob
  tokens_used INTEGER,
  cost_usd REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  UNIQUE(agents_hash, task_id)
);

CREATE TABLE run_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT UNIQUE NOT NULL,     -- timestamp-based
  agents_md_hash TEXT NOT NULL,
  baseline_pass_rate REAL,
  total_api_calls INTEGER,
  total_cost_usd REAL,
  duration_seconds REAL,
  report_json_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agents_hash ON cache_entries(agents_hash);
CREATE INDEX idx_created_at ON cache_entries(created_at);
```

---

## 🎯 CLI Changes Summary

### New Commands

```bash
# Run ablation (existing, enhanced)
context-surgeon run --agents AGENTS.md --tasks ./tasks/ [--use-api] [--cache-dir .context-surgeon]

# Parse rules (existing, no change)
context-surgeon parse AGENTS.md

# NEW: Show trend analysis
context-surgeon trends [--compare v1 v2] [--json]

# NEW: Clear cache
context-surgeon cache --clear

# NEW: Show cache stats
context-surgeon cache --stats
```

### New Flags on `run` Command

```bash
--use-api                 # Use real Codex API (requires OPENAI_API_KEY)
--cache-dir PATH         # Cache directory (default: .context-surgeon)
--no-cache               # Disable caching for this run
--save-trends            # Save results to trends/ directory
--verifiers PATH         # Custom verifiers.yml file
--output PATH            # Output directory (default: .)
```

---

## 🎨 Dashboard Changes Summary

### New Components

| Component | Purpose | File |
|-----------|---------|------|
| `ExportButton` | Download optimized AGENTS.md | `components/ExportButton.jsx` |
| `TrendChart` | Line chart of improvements | `components/TrendChart.jsx` |
| `TrendComparison` | Before/after metrics | `components/TrendComparison.jsx` |
| `ThemeToggle` | Dark mode switch | `components/ThemeToggle.jsx` |
| `TabNav` | Results / Trends tabs | `components/TabNav.jsx` |

### Updated Components

- `App.jsx` — Add header export button, tab navigation, theme provider
- `Summary.jsx` — Add trend delta badges (e.g., "+3% vs last run")
- `RuleCard.jsx` — Add rule improvement history mini-chart

### New Hooks

- `useTheme()` — Dark mode state + LocalStorage sync
- `useTrends()` — Load all reports, compute comparisons
- `useExport()` — Generate & download markdown

---

## 🔐 Error Handling & Edge Cases

### CLI

| Scenario | Behavior |
|----------|----------|
| API key invalid | Fallback to mock, warn user |
| Network timeout | Retry 3 times, then fail with message |
| Task verifier fails | Skip rule, log warning, continue |
| AGENTS.md parsing error | Show parse tree, highlight problematic lines |
| Cache corrupted | Auto-rebuild from scratch |

### Dashboard

| Scenario | Behavior |
|----------|----------|
| report.json missing | Show upload dialog with hints |
| report.json invalid | Show parse error, offer sample |
| Multiple reports loaded | Auto-detect, show comparison view |
| Dark mode unsupported | Gracefully degrade to light mode |

---

## 📈 Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Parse AGENTS.md (34 rules) | <100ms | In-memory regex parsing |
| API call per task | 2-5s | Includes network latency |
| Full ablation run | 180-240s | 34 rules × 8 tasks × 0.6s avg |
| Dashboard load (cached) | <50ms | JSON parsing + React render |
| Export markdown | <10ms | String concatenation |

---

## 🚀 Deployment Checklist

- [ ] CLI: Python package installable via `pip install -e .`
- [ ] CLI: All flags tested locally (API + mock modes)
- [ ] CLI: Cache database auto-initializes
- [ ] CLI: Logs written to `.context-surgeon/debug.log`
- [ ] Dashboard: Builds without errors (`npm run build`)
- [ ] Dashboard: Production bundle <150KB gzipped
- [ ] Dashboard: Works offline with cached data
- [ ] README.md: Updated with all new features
- [ ] .env.example: Created and documented
- [ ] verifiers.yml: Sample provided in repo

---

## 📝 Development Notes

### Why These Design Decisions?

1. **SQLite for Caching** — Zero dependencies, no server needed, fast enough for dev
2. **Verifier YAML** — Familiar config format, easy to extend without code
3. **DarkMode via CSS Variables** — Minimal JS, works for all components automatically
4. **Trend Tracking via Report Folders** — Simple file-based versioning, git-friendly
5. **Export from Dashboard** — No CLI needed for final artifact, better UX

### Known Limitations

- Batch export (multiple AGENTS files) — Not implemented (future feature)
- Real-time collaboration — No database sync (single-user tool)
- Rule history (which run improved rule X) — TODO in next sprint
- Model comparison (gpt-3.5 vs gpt-4) — Can be added via CLI flag

---

## 🎓 Testing Strategy

### Unit Tests
```python
# test_rule_parser.py
def test_parse_agents_md()
def test_rule_token_estimation()
def test_duplicate_rules()

# test_verifiers.py
def test_regex_verifier()
def test_python_verifier()
def test_invalid_verifier_config()

# test_cache.py
def test_cache_hit()
def test_cache_invalidation()
def test_cache_persistence()
```

### Integration Tests
```bash
# E2E test: Parse → Cache → Ablate → Export
context-surgeon run --agents sample/AGENTS.md --tasks tasks/ --output /tmp/test

# Verify outputs exist
[ -f /tmp/test/AGENTS.optimized.md ]
[ -f /tmp/test/report.json ]
[ -f .context-surgeon/cache.db ]
```

### UI Tests
- Export button downloads file
- Dark mode persists on reload
- Trend comparison shows correct deltas
- File upload accepts valid JSON

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | User guide, quick start |
| `SPEC.md` | This file — complete architecture |
| `DEVELOP.md` | Contributor guide, setup, debugging |
| `.env.example` | Environment variables template |
| `verifiers.yml` | Custom verifier examples |
| API comments | Inline JSDoc + docstrings |

---

## 🎉 Success Metrics

- **Judges see:** Working CLI + polished dashboard
- **Demo script time:** 10 minutes (parse → ablate → visualize)
- **Without API key:** Still fully functional with mock
- **Code quality:** Clear, well-commented, modular
- **Presentation:** "Before the build was 34 rules, after 10. Tokens -52%. Pass rate +3%."

---

*Built by Codex Community — Bengaluru, April 16 2026*
