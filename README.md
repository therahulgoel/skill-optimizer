# Skill Optimizer

A practical CLI and dashboard for minimizing `SKILL.md` and `AGENTS.md` files.

## Recommended Repo Name

Best public repo name: `skill-optimizer`

Why this is the best choice:

- clear in one read
- easy to search
- accurate to the use case
- works for indie developers and teams
- better long-term than a clever but vague name

Skill Optimizer helps teams answer one question clearly:

**What is the bare minimum instruction set we need to keep quality, while reducing context size and token spend?**

It works especially well when you already have skills configured in your agent and want to trim them without breaking the behavior your team depends on.

It also works before you add a new skill: paste a draft `SKILL.md`, trim it down first, then add only the minimal version to your agent.

## What It Does

- Takes an existing `SKILL.md` or `AGENTS.md`
- Extracts individual rules
- Keeps only rules that materially affect implementation, review quality, or output usability
- Removes duplicated process steps, examples, and low-signal text
- Produces an optimized output file you can use immediately
- Produces a comparison report that explains every keep/remove decision
- Shows token savings so teams can measure the cost impact
- supports `strict`, `balanced`, and `aggressive` trim modes
- supports batch optimization for a whole folder of skills

## Best Use Cases

- You imported open-source skills into your agent and they feel too large
- Your team has accumulated many instructions over time and wants to reduce prompt size
- You want a safer replacement workflow than manual prompt editing
- You want a reviewable artifact before updating shared agent skills

## Core Workflow

You can use Skill Optimizer in two ways:

1. Existing skill already used by your agent
2. New skill draft you want to minimize before adding

### 1. Trim one skill

```bash
skill-optimizer trim-skill --skill /path/to/SKILL.md --output results/ --mode balanced
```

Outputs:

- `results/<skill-name>.optimized.md`
- `results/skill_trim_report.json`

### 1a. Choose a trim mode

- `strict`: keep more review structure and guidance
- `balanced`: recommended default
- `aggressive`: maximize token savings and keep only the smallest viable rule set

Examples:

```bash
skill-optimizer trim-skill --skill /path/to/SKILL.md --mode strict --output results/
skill-optimizer trim-skill --skill /path/to/SKILL.md --mode balanced --output results/
skill-optimizer trim-skill --skill /path/to/SKILL.md --mode aggressive --output results/
```

### 1b. Trim a whole folder of skills

```bash
skill-optimizer trim-folder --skills-dir /path/to/skills --output results/batch --mode balanced
```

This scans recursively for `SKILL.md` files and generates:

- optimized files for each skill
- a batch summary report at `results/batch/skill_trim_batch_report.json`

### 1b. Optimize a skill directly in the dashboard

Start the dashboard and either:

- upload an existing `SKILL.md`
- paste a new skill draft into the textarea
- or load a previously generated `skill_trim_report.json`

The dashboard home screen is intentionally minimal. It does not auto-open any sample skill.

From the home screen you can:

- upload an existing `SKILL.md`
- paste a new skill draft
- choose `strict`, `balanced`, or `aggressive`
- optionally set a replacement root path
- reopen recent skill reports by clicking the skill name

The dashboard will generate the minimized skill in-browser and let you download both files.

### 2. Open the dashboard

```bash
cp results/skill_trim_report.json dashboard/public/skill_trim_report.json
cd dashboard
npm install
npm run dev
```

Then open `http://localhost:3000`.

The dashboard shows:

- original vs optimized rule counts
- original vs optimized token counts
- exact tokens saved
- percentage reduction
- kept rules with reasons
- removed rules with reasons
- side-by-side original and optimized content
- download buttons for the optimized skill and comparison report

### 3. Replace the skill in your agent

After review, replace the current skill file with the optimized one.

Example:

```bash
cp results/swiftui-pro.optimized.md /path/to/your/agent/skills/swiftui-pro/SKILL.md
```

You can also ask the CLI to include a suggested replacement path:

```bash
skill-optimizer trim-skill \
  --skill /path/to/SKILL.md \
  --output results/ \
  --replacement-root /repo/.github/skills
```

The dashboard also includes a replacement helper that can copy a target path or replacement command.

If you started from a new skill draft in the dashboard, download the optimized file first, then place it in your agent's skills directory as the version you want to ship.

### 4. Validate with your real agent

Use a few representative prompts that exercise the skill. If the optimized skill still behaves correctly, keep it. If something important was removed, restore that rule and rerun.

## How The Tool Decides What To Keep

Skill Optimizer uses a deterministic trimming basis.

### Keep

- Rules that change implementation decisions
- Runtime and platform constraints
- Framework restrictions
- Output-format requirements needed by reviewers or teams
- Unique reference files that support deeper checks

### Remove

- Repeated process steps that duplicate the reference list
- Sample outputs and examples
- Line-specific demo text
- Editorial or explanatory text that does not change behavior
- Style advice that does not materially affect correctness or team workflows

## Example: SwiftUI Skill

The included test using the open-source `swiftui-pro` skill produced:

- Original rules: `30`
- Optimized rules: `17`
- Rules removed: `13`
- Original estimated tokens: `152`
- Optimized estimated tokens: `82`
- Actual estimated tokens saved: `70`
- Reduction: `46.1%`

Generated files:

- `results/swiftui-pro.optimized.md`
- `results/skill_trim_report.json`

## Developer-Friendly Workflow For Teams

If your team already has skills added to an agent, use this rollout process.

### Step 1: Copy the current skills out of your agent repo

Put each skill in a stable location so it can be versioned and reviewed.

### Step 2: Run the trimmer on each skill

```bash
skill-optimizer trim-skill --skill skills/code-review/SKILL.md --output results/code-review/
skill-optimizer trim-skill --skill skills/swiftui/SKILL.md --output results/swiftui/
```

For larger repos:

```bash
skill-optimizer trim-folder --skills-dir skills/ --output results/batch --mode balanced --replacement-root /repo/.github/skills
```

If a teammate is writing a brand new skill, they can use the dashboard first, paste the draft, and download a minimized version before committing anything.

### Step 3: Review the comparison report

For each skill, inspect:

- rules kept
- rules removed
- reasons for removal
- tokens saved

### Step 4: Replace only the skills you approve

The tool suggests a minimal version, but you control adoption. Teams can merge the optimized file as-is or selectively restore removed rules.

### Step 5: Test real prompts

Use prompts that represent how the team actually uses the agent.

### Step 6: Track token savings over time

The simplest model is:

```text
Monthly token savings = tokens_saved_per_request × monthly_requests
```

To estimate cost:

```text
Monthly cost savings = (tokens_saved_per_request / 1,000,000) × monthly_requests × model_price_per_1M_tokens
```

## Commands

### Primary command

```bash
skill-optimizer trim-skill --skill /path/to/SKILL.md --output results/ --mode balanced
```

### Batch command

```bash
skill-optimizer trim-folder --skills-dir /path/to/skills --output results/batch --mode balanced
```

### Existing AGENTS.md ablation flow

```bash
skill-optimizer run --agents AGENTS.md --tasks tasks/ --output results/
```

### Parse rules only

```bash
skill-optimizer parse AGENTS.md
```

## Installation

### Local development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

### From Git

```bash
git clone https://github.com/YOUR_USERNAME/skill-optimizer.git
cd skill-optimizer
pip install -e .
```

## Output Files

### Optimized skill

The optimized file is intentionally compact and ready to use.

Example:

```text
results/swiftui-pro.optimized.md
```

### Comparison report

The JSON report is designed for both humans and tooling.

It includes:

- source path
- optimized output path
- original rule count
- optimized rule count
- removed rule count
- original tokens
- optimized tokens
- actual tokens saved
- token reduction percent
- trimming basis
- kept rules with reasons
- removed rules with reasons
- original content
- optimized content

## Dashboard

The dashboard is now focused on skill minimization, not generic mock metrics.

It supports three inputs:

- upload a `SKILL.md`
- paste a new skill draft
- load a `skill_trim_report.json`

It also supports:

- selecting trim mode on the home screen
- saving recent reports locally and reopening them by skill name
- copying a replacement path or replacement command

It is useful when you want to explain changes to:

- teammates
- engineering managers
- prompt owners
- platform teams

Use it to answer:

- What was removed?
- Why was it removed?
- What did we keep?
- How many tokens did we save?
- Can we download the optimized file directly?
- Can we trim a new skill before adding it to the agent?
- Which mode should we use for this skill?
- Where should the optimized file be copied in our repo?

## Repository Structure

```text
cli/
  main.py              # CLI commands
  skill_trimmer.py     # Skill minimization engine
  rule_parser.py       # Rule extraction
  ablation.py          # AGENTS.md ablation engine
  output.py            # Output generation

dashboard/
  src/components/SkillTrimReport.jsx
  src/components/SkillTrimReport.css

results/
  skill_trim_report.json
  <skill-name>.optimized.md
```

## Notes

- Token counts are estimated using the same internal parser heuristic used elsewhere in the project.
- The trimmer is deterministic, so teams can review changes consistently.
- The tool recommends a minimum viable skill, but final approval stays with the team.

## When To Keep A Removed Rule

Restore a removed rule if:

- your team depends on that exact wording
- the rule encodes a project-specific constraint
- the skill becomes too vague after trimming
- validation prompts show a regression

## Recommended Next Step

Run the trimmer on one skill your team actually uses, review the comparison in the dashboard, and replace only that one skill first. That gives you a low-risk baseline before rolling it out across all agent skills.

If you are creating a new skill from scratch, paste the draft into the dashboard first, download the minimized version, and add only that trimmed file to your agent.

Once that works, use `trim-folder` on your whole skills directory and review the batch report before bulk replacement.
