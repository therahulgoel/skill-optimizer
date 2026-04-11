# Skill Optimizer — Quick Reference

A short command guide for minimizing existing `SKILL.md` files and replacing them safely.

## Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Trim one skill

```bash
skill-optimizer trim-skill --skill /path/to/SKILL.md --output results/ --mode balanced
```

Outputs:

- `results/<skill-name>.optimized.md`
- `results/skill_trim_report.json`

Modes:

- `strict`
- `balanced`
- `aggressive`

## Trim a whole skills folder

```bash
skill-optimizer trim-folder --skills-dir /path/to/skills --output results/batch --mode balanced
```

Batch output:

- `results/batch/skill_trim_batch_report.json`
- optimized files per skill

## Open the dashboard

```bash
cp results/skill_trim_report.json dashboard/public/skill_trim_report.json
cd dashboard
npm install
npm run dev
```

Open `http://localhost:3000`.

Or skip the CLI and use the dashboard directly:

- upload any `SKILL.md`
- paste a new skill draft
- choose trim mode
- set an optional replacement root path
- optimize and download the minimized skill
- reopen recent reports by skill name from the home screen

## Replace the skill in your agent

```bash
cp results/<skill-name>.optimized.md /path/to/your/agent/skills/<skill-name>/SKILL.md
```

Helper with suggested replacement path:

```bash
skill-optimizer trim-skill --skill /path/to/SKILL.md --output results/ --replacement-root /repo/.github/skills
```

For a new skill, download the optimized file from the dashboard and add that version to your agent instead of the full draft.

## What the dashboard shows

- original rules
- optimized rules
- removed rules
- original tokens
- optimized tokens
- actual tokens saved
- reduction percentage
- reasons for every keep/remove decision
- side-by-side original and optimized files

## Main commands

```bash
skill-optimizer trim-skill --skill /path/to/SKILL.md --output results/
skill-optimizer run --agents AGENTS.md --tasks tasks/ --output results/
skill-optimizer parse AGENTS.md
```

## Recommended team workflow

1. Pick one skill already used by your agent.
2. Run `trim-skill` or upload it directly in the dashboard.
3. Review `skill_trim_report.json` in the dashboard.
4. Replace only that skill.
5. Test real prompts.
6. Roll out to the rest of your shared skills.

## Token savings formula

```text
tokens_saved = original_tokens - optimized_tokens
```

```text
cost_saved = (tokens_saved / 1,000,000) × monthly_requests × model_price_per_1M_tokens
```

## Example

SwiftUI skill example:

- original rules: `30`
- optimized rules: `17`
- tokens: `152 → 82`
- saved: `70`
- reduction: `46.1%`
