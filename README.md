# Skill Optimizer

Trim AI agent skill files — reduce tokens by 70-90% without losing what actually works.

![Dashboard](docs/images/dashboard-screenshot.png)

## Why This Exists

Most skill makers keep adding rules "just in case" — never measuring the impact.

**The truth**: Most rules in your SKILL.md are noise. Examples. Duplicates. Tutorials. They bulk up your context but change nothing in the output.

Skill Optimizer removes the fluff, keeps the logic.

## Results (Tested on 40 Skills)

| Repo | Original | Trimmed | Saved | Reduction |
|------|----------|---------|-------|----------|
| ASO Skills | 2,486 | 298 | 2,188 | **88%** |
| app-launch | 958 | 58 | 900 | **94%** |
| competitor-analysis | 512 | 89 | 423 | **83%** |
| android-aso | 421 | 114 | 307 | **73%** |

> That's ~2,200 tokens saved per repo. Every interaction is cheaper.

## Quick Start

```bash
# One command to clone, trim, and visualize
python3 -m cli.main trim-skill --clone user/repo

# Example
python3 -m cli.main trim-skill --clone Eronred/aso-skills
```

Done. Dashboard opens auto.

## Installation

```bash
# User install
python3 -m pip install --user .

# Or dev mode
python3 -m pip install -e .
```

## Usage

```bash
# Clone repo + trim all skills
skill-optimizer trim-skill --clone user/repo

# From GitHub URL
skill-optimizer trim-skill --url https://github.com/user/repo

# From local file
skill-optimizer trim-skill --skill ./my-skill/SKILL.md
```

### Trim Modes

| Mode | Reduction | Safety |
|------|-----------|--------|
| `aggressive` | ~90% | Remove almost everything |
| `balanced` | ~80% | Recommended |
| `strict` | ~60% | Keep most rules |

## How It Works

1. **Classify** each rule as: directive, constraint, reference, example, or duplicate
2. **Remove** low-signal content (examples, tutorials, dupes)
3. **Keep** what changes behavior (must, ensure, limits)

The report shows exactly why each rule was kept or removed — you're in control.

## Dashboard

```bash
cd dashboard
npm install
npm run dev
```

- Drag & drop reports
- See keep/remove decisions
- Export trimmed skills

## Why Skill Makers Don't Test

- No tooling = manual work
- "More rules = better" myth
- Fear of breaking anything
- No way to measure impact

You have better things to do than read SKILL.md files line-by-line. Let the tool do it.

## License

MIT — See [LICENSE](LICENSE)

---

Made with ❤️ by [@therahulgoel](https://x.com/therahulgoel)