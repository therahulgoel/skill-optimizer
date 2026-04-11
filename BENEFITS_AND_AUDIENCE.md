# Skill Optimizer: Benefits and Audience

A concise guide to who this tool is for and why it is useful.

## Who benefits most

- developers who imported open-source skills into their agent
- teams maintaining shared agent skills across repositories
- platform teams reducing prompt size and token cost
- indie developers who want simpler, cheaper agent context

## Main benefits

- removes duplicated and low-signal skill rules
- keeps only the rules that change behavior or team output quality
- gives a reviewable basis for every keep/remove decision
- produces an optimized file ready to replace the current skill
- shows actual estimated token savings

## Why this matters for teams

Most teams do not write skills once. They accumulate them.

Over time, skills often contain:

- repeated process steps
- long examples
- style advice that does not affect output
- references duplicated in multiple sections
- extra wording that increases context but not usefulness

Skill Optimizer reduces that overhead while keeping the parts that still matter.

## Why this matters for indie developers

- less prompt bloat
- easier skill review
- smaller context windows
- lower token cost
- faster iteration on a small number of skills

## Practical rollout

1. choose one skill already used by your agent
2. run `skill-optimizer trim-skill` or upload the skill in the dashboard
3. inspect the dashboard comparison
4. replace the skill only if the optimized version still fits your workflow
5. test with real prompts
6. repeat for the next skill

## For new skills before adding them

- draft the skill
- upload or paste it into the dashboard
- download the minimized version
- add only the optimized file to your agent
- keep removed rules only if real prompts prove they are needed

## Example value statement

"We reduced a SwiftUI review skill from 30 rules to 17, saved 70 estimated tokens per use, and kept only the parts that materially affect review quality."

## What the tool keeps

- platform constraints
- framework restrictions
- required output structure
- unique reference files
- actionable implementation or review directives

## What the tool removes

- duplicated review steps
- examples and demo text
- summary samples
- low-signal editorial wording
- instructions that do not materially change behavior
