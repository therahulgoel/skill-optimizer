# Skill Optimizer — Demo Guide

A short demo flow for showing the finished product to developers, indie builders, or teams.

## What to demo

Show the real product flow, not internal implementation details:

1. upload or paste a skill
2. choose trim mode
3. review kept vs removed rules
4. show tokens saved
5. download optimized skill
6. copy replacement path or replacement command

## 3-Minute Demo

### Step 1: Start the dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open `http://localhost:3000`.

What to say:

"The home screen is intentionally minimal. You start by choosing your own skill instead of looking at fake sample data."

### Step 2: Upload an existing skill

Use a real `SKILL.md` file from a repo or the bundled SwiftUI example.

What to show:

- upload button
- trim mode selector
- optional replacement root field

### Step 3: Run optimization

What to show:

- original vs optimized rule counts
- tokens saved
- reasons for every removed rule
- original vs optimized file preview

What to say:

"This is not just summarization. The tool makes explicit keep/remove decisions and shows the basis for each one."

### Step 4: Show team workflow

What to show:

- replacement helper
- copy replacement path
- copy replacement command
- download optimized skill

What to say:

"Teams can review the optimized file, copy the replacement path, and drop it back into an agent repo with minimal friction."

### Step 5: Show CLI for automation

```bash
skill-optimizer trim-skill --skill /path/to/SKILL.md --output results/ --mode balanced
skill-optimizer trim-folder --skills-dir /path/to/skills --output results/batch --mode balanced
```

What to say:

"Indie developers can use the dashboard directly. Teams can automate this in the terminal or CI."

## Best talking points

- it works for existing skills already used by an agent
- it works before adding a new skill to an agent
- it shows actual estimated token savings
- it supports strict, balanced, and aggressive modes
- it supports single-skill and batch workflows

## Best demo outcome

The demo should leave a developer with one simple understanding:

"I can take a bloated skill, trim it safely, review the reasons, and replace it with a smaller file immediately."
