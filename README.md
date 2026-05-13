# Skill Optimizer

Trim and minimize `SKILL.md` and `AGENTS.md` files — reduce token costs while keeping rules that actually change behavior.

![Dashboard](docs/images/dashboard-screenshot.png)

## What it does

Skill Optimizer analyzes your AI agent skill files and removes:
- Examples and sample output (reduce context, not behavior)
- Duplicate reference bullets
- Tutorial text and process steps
- Low-signal editorial content

Keeps:
- Actionable directives ("ensure X", "must Y")
- Platform/framework constraints
- Output formatting rules for team consistency
- Unique reference files

**Result**: ~70-90% token reduction while preserving functional rules.

## Quick Start

### One-line demo (clone any repo)

```bash
# Clone a repo and trim all skills
python3 -m cli.main trim-skill --clone user/repo

# Example: trim ASO skills
python3 -m cli.main trim-skill --clone Eronred/aso-skills
```

That's it! It will:
1. Clone the repo
2. Trim all SKILL.md files
3. Save token reduction report
4. Open dashboard to visualize results

## Installation

```bash
# Recommended: user install
python3 -m pip install --user .

# Or development install
python3 -m pip install -e .
```

## Usage

### 1. Clone and trim a repo
```bash
skill-optimizer trim-skill --clone user/repo
skill-optimizer trim-skill --clone user/repo --branch develop  # custom branch
skill-optimizer trim-skill --clone user/repo --no-open  # skip dashboard
```

### 2. From GitHub URL
```bash
# Single skill from raw URL
skill-optimizer trim-skill --url https://raw.githubusercontent.com/user/repo/main/SKILL.md

# From github.com link
skill-optimizer trim-skill --url https://github.com/user/repo/blob/main/skills/my-skill/SKILL.md
```

### 3. From local file
```bash
# Single file
skill-optimizer trim-skill --skill ./skills/my-skill/SKILL.md

# Entire folder
skill-optimizer trim-folder --skills-dir ./skills --output results/
```

### Trim modes

| Mode | What it keeps | Use case |
|------|--------------|---------|
| `strict` | More rules | When unsure, want safety |
| `balanced` | Core rules (default) | Recommended |
| `aggressive` | Only constraints | Maximum token savings |

## Output

```
results/
├── skill_trim_batch_report.json    # Detailed report
├── skill_1.optimized.md        # Trimmed skill
├── skill_2.optimized.md
└── ...
```

### Report includes:
- Original vs kept rule counts
- Token savings per skill
- Reason each rule was kept/removed
- Suggested replacement path

## Dashboard

Visual interface to explore results:

```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:3000
```

Features:
- Drag & drop reports
- Compare original vs optimized
- Export trimmed skills
- Token savings breakdown

## Examples

### Trim a single skill
```bash
python3 -m cli.main trim-skill \
  --url https://raw.githubusercontent.com/Eronred/aso-skills/main/skills/app-launch/SKILL.md \
  --output results/
```

### Trim your own skills folder
```bash
python3 -m cli.main trim-folder \
  --skills-dir ./my-agent-skills \
  --output results/ \
  --mode aggressive
```

## How it works

1. **Parse**: Extract rules from SKILL.md
2. **Classify**: Categorize each rule (directive, constraint, reference, example)
3. **Trim**: Keep only high-signal rules based on mode
4. **Report**: Generate JSON with keep/remove reasons

The trimmer uses heuristics — review the report to override decisions before deploying.

## License

MIT — See [LICENSE](LICENSE)

---

Made with ❤️ by [@therahulgoel](https://github.com/therahulgoel)