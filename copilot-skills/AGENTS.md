# AGENTS.md — GitHub Copilot Skills & Customization Rules

## Workspace Instructions
- Place copilot-instructions.md in .github/ directory for project-wide agent guidance
- Always include a meaningful description field in YAML frontmatter so the agent can discover the file
- Use applyTo glob patterns to scope instructions to specific file types instead of applying to all files
- Avoid applyTo "**" as it burns context window on every interaction regardless of relevance
- Keep workspace instructions focused on always-on conventions not task-specific workflows

## File Instructions
- Store .instructions.md files under .github/instructions/ directory
- Use applyTo with specific file globs like **/*.py or src/api/** to target relevant files
- Include a description field with trigger phrases using the "Use when..." pattern
- Never apply file instructions globally when they only matter for specific file types
- Reference file instructions by their description not their filename

## Custom Agents
- Define custom agents in .agent.md files under .github/agents/ directory
- Use tool restrictions to limit which tools an agent can access for safety
- Design agents for context isolation where each subagent returns a single focused output
- Always provide an instructions field explaining the agent's purpose and expertise
- Use custom agents when different workflow stages need different tool permissions

## Skills
- Create SKILL.md files in .github/skills/<name>/ or .agents/skills/<name>/ directories
- Always include name and description in YAML frontmatter between --- markers
- Quote descriptions containing colons to prevent YAML parsing silent failures
- Bundle supporting assets like scripts and templates alongside the SKILL.md file
- Use skills for on-demand multi-step workflows not always-on conventions

## Prompts
- Create .prompt.md files for single focused tasks with parameterized inputs
- Store prompts in .github/prompts/ directory for workspace scope
- Use prompts for single focused tasks and skills for multi-step workflows
- Include clear parameter definitions using mustache-style {{variable}} syntax
- Keep prompts concise and action-oriented targeting one specific outcome

## Hooks
- Define hooks in .github/hooks/ as JSON configuration files
- Use PreToolUse and PostToolUse lifecycle events for deterministic enforcement
- Hooks enforce behavior via shell commands unlike instructions which guide behavior
- Use hooks to block dangerous operations require approval or auto-format outputs
- Never use hooks for non-deterministic guidance that should be in instructions

## Foundry Agent Deployment
- Always read the sub-skill document before executing any Foundry workflow
- Use .foundry/agent-metadata.yaml as the single source of truth for configuration
- Resolve environment from user message first then session context then defaultEnvironment
- Support both prompt agents (LLM-backed) and hosted agents (container-based)
- Use Azure MCP tools over direct CLI commands when available

## Foundry Evaluation
- Run batch evaluations to measure agent quality before and after changes
- Use prompt optimizer to improve agent instructions based on evaluation results
- Track evaluation metrics over time to detect regressions in agent performance
- Create evaluation datasets from production traces for realistic test coverage
- Define test cases with dataset evaluator and threshold bundles in agent-metadata

## Screenshot Generation
- Screenshots are advertisements not documentation so every slide sells one idea
- Use a single page.tsx file for the entire screenshot generator
- Include proper phone mockup frames around device screenshots
- Support multiple locales with a LOCALES array and locale-scoped asset paths
- Use theme presets for quickly switching visual styles across screenshot sets

## ASO Optimization
- Lead benefit headlines with action verbs like TRACK SEARCH ADD CREATE BUILD
- Pair each benefit with the strongest matching simulator screenshot
- Rate screenshots as Great Usable or Retake and only use Great or Usable
- Save progress at each phase to memory so users can resume from any point
- Focus on what the user gets not what the app does technically
