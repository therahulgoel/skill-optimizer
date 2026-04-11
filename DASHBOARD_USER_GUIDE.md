# Skill Optimizer Dashboard Guide

## What the dashboard is for

The dashboard helps teams review a generated `skill_trim_report.json` before replacing a skill already used by an agent.

It can also optimize a raw `SKILL.md` directly in the browser, so you can trim a new skill draft before adding it to your agent.

It answers five questions clearly:

1. How many rules did we keep?
2. How many rules did we remove?
3. Why was each rule removed?
4. How many tokens did we save?
5. What does the optimized skill look like side-by-side with the original?

## Start the dashboard

```bash
cp results/skill_trim_report.json dashboard/public/skill_trim_report.json
cd dashboard
npm install
npm run dev
```

Open `http://localhost:3000`.

The home screen is intentionally minimal. It does not auto-open any bundled report.

## Ways to use it

### Option 1: Upload an existing skill

Upload a `SKILL.md` file already used by your agent. The dashboard will generate a trim report instantly and let you download the optimized file.

### Option 2: Paste a new skill draft

Paste a `SKILL.md` draft into the textarea, click `Optimize pasted skill`, then review and download the minimized output before you add it to your agent.

### Option 3: Load an existing report

If you already ran the CLI, load `skill_trim_report.json` to inspect it in the dashboard.

### Option 4: Reopen a recent skill report

The dashboard stores recent skill reports in local browser storage. Click a saved skill name on the home screen to reopen it.

## Trim modes

- `strict`: keep more guidance
- `balanced`: recommended default
- `aggressive`: keep only the smallest viable rule set

Choose the mode on the home screen before uploading or optimizing.

## What you will see

### Top summary

- original rule count
- optimized rule count
- removed rule count
- original vs optimized token count
- actual tokens saved
- percentage reduction

### Trimming basis

The dashboard shows the basis used by the trimmer:

- actionable directives
- runtime and platform constraints
- output requirements
- unique references
- removal of examples and low-value editorial text

### Rule-by-rule comparison

There are two lists:

- kept rules
- removed rules

Every item includes:

- section
- estimated tokens
- rule text
- reason for the decision

### Side-by-side file preview

You can compare:

- original skill
- optimized skill

This is the easiest way for a team to review whether the optimized version is safe to adopt.

## Download actions

The dashboard lets you download:

- the optimized `SKILL.md`
- the `skill_trim_report.json`

The report view also includes a replacement helper where you can:

- enter a target skills root path
- copy the suggested replacement path
- copy a replacement `cp` command

For a new skill draft, the downloaded optimized file is the one you should add to your agent.

## Recommended review process

1. Upload an existing skill or paste a new skill draft.
2. Open the dashboard.
3. Review removed rules first.
4. Confirm the token savings are meaningful.
5. Compare original vs optimized content.
6. Replace the current skill, or add the minimized new skill, only after validating with real prompts.

For larger repos, use the CLI batch mode and then inspect the generated reports skill by skill.

## When to reject the optimized file

Do not adopt the optimized file as-is if:

- a removed rule encodes a project-specific requirement
- your team needs the extra structure for consistency
- validation prompts show behavior regressions
- the optimized file becomes too generic for the skill's purpose

## Example outcome

For the SwiftUI skill test case:

- `30` original rules
- `17` kept rules
- `13` removed rules
- `70` estimated tokens saved
- `46.1%` reduction

## CLI command used

```bash
skill-optimizer trim-skill --skill external/swiftui-agent-skill/swiftui-pro/SKILL.md --output results/ --mode balanced
```

## Batch command

```bash
skill-optimizer trim-folder --skills-dir /path/to/skills --output results/batch --mode balanced
```

## Use with existing agents

If your agent already references a skill, the normal replacement flow is:

```bash
skill-optimizer trim-skill --skill /path/to/current/SKILL.md --output results/
cp results/<skill-name>.optimized.md /path/to/current/SKILL.md
```

Then run your agent against real prompts and confirm quality.

## Use for new skills before adding them

1. Draft the skill.
2. Paste it into the dashboard.
3. Download the optimized file.
4. Add only the optimized file to your agent.
5. Test with real prompts and restore any removed rule only if it proves necessary.
