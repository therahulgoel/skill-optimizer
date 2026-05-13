"""
Task Runner - Execute tasks with Codex API or mock.
"""

import json
import time
from dataclasses import dataclass
from typing import List, Optional
from pathlib import Path

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


@dataclass
class TaskResult:
    """Result of running a single task."""
    task_id: str
    prompt: str
    output: str
    passed: bool
    tokens_used: int
    error: Optional[str] = None
    was_cached: bool = False


@dataclass
class TaskDefinition:
    """A single coding task."""
    task_id: str
    prompt: str
    verifier_fn: callable  # Function that verifies correctness
    baseline_output: Optional[str] = None


class CodexAPI:
    """Codex API wrapper - supports real API or mock mode."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4", use_api: bool = False):
        self.api_key = api_key
        self.model = model
        self.use_api = use_api and bool(api_key) and OPENAI_AVAILABLE
        self.call_count = 0
        self.cached_count = 0
        self.total_tokens = 0
        self.total_cost = 0.0
        self.cache = {}

        if self.use_api and OPENAI_AVAILABLE:
            self.client = openai.OpenAI(api_key=api_key)
            print("🔑 Using real OpenAI API (gpt-4)")
        elif not use_api and not api_key:
            self.client = None
            print("⚠️  WARNING: Using MOCK mode (no real inference)")
            print("⚠️  Results are NOT validated - use --api-key for real testing")
        else:
            self.client = None
            print("⚠️  WARNING: No API key - falling back to MOCK mode")
            print("⚠️  Results are NOT validated - pass --api-key for real testing")

    def send_prompt(self, task_id: str, prompt: str, agents_md_content: str) -> TaskResult:
        """
        Send prompt to Codex (real API or mock).
        """
        self.call_count += 1
        
        # Create cache key
        cache_key = (task_id, hash(agents_md_content) % 999999)
        if cache_key in self.cache:
            self.cached_count += 1
            return self.cache[cache_key]
        
        if self.use_api:
            result = self._send_to_openai(task_id, prompt, agents_md_content)
        else:
            result = self._send_mock(task_id, prompt, agents_md_content)
        
        # Track stats
        self.total_tokens += result.tokens_used
        # Estimate cost: gpt-4 is ~$0.03 per 1K tokens
        self.total_cost += (result.tokens_used / 1000) * 0.03
        
        self.cache[cache_key] = result
        return result

    def _send_to_openai(self, task_id: str, prompt: str, agents_md: str) -> TaskResult:
        """Call real OpenAI API."""
        try:
            full_prompt = f"""You are an expert code generator following this style guide:

{agents_md}

{prompt}

Generate ONLY the code, no explanations."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert code generator."},
                    {"role": "user", "content": full_prompt}
                ],
                temperature=0.3,
                max_tokens=500,
                timeout=30
            )
            
            output = response.choices[0].message.content
            tokens = response.usage.total_tokens
            
            return TaskResult(
                task_id=task_id,
                prompt=prompt,
                output=output,
                passed=True,
                tokens_used=tokens
            )
        except Exception as e:
            return TaskResult(
                task_id=task_id,
                prompt=prompt,
                output="",
                passed=False,
                tokens_used=0,
                error=str(e)
            )

    def _send_mock(self, task_id: str, prompt: str, agents_md: str) -> TaskResult:
        """Return rule-sensitive mock response.
        
        Each task has a full response and rule-dependent fragments.
        When a rule keyword is missing from agents_md (because it was ablated),
        the corresponding fragment is degraded/removed from the output.
        This creates real signal for the ablation engine.
        """
        output = self._build_rule_sensitive_output(task_id, agents_md)
        tokens = 150 + len(output) // 10
        
        return TaskResult(
            task_id=task_id,
            prompt=prompt,
            output=output,
            passed=True,
            tokens_used=tokens
        )

    def _build_rule_sensitive_output(self, task_id: str, agents_md: str) -> str:
        """Build mock output that degrades when specific rules are ablated."""
        md = agents_md.lower()

        # ── Legacy tasks (backward compatible) ──────────────────────────
        if task_id == 'task_01_validation':
            base = "import { z } from 'zod';\n\nconst userSchema = z.object({\n  id: z.string().uuid(),\n  email: z.string().email(),\n  name: z.string().min(1),\n});\n\nexport async function POST(req) {\n  const payload = userSchema.parse(req.body);\n  return { success: true, data: payload };\n}"
            return base
        if task_id == 'task_02_testing':
            base = "import { describe, it, expect } from 'vitest';\nimport { processData } from './processor';\n\ndescribe('processData', () => {\n  it('should transform input correctly', () => {\n    const result = processData({ value: 42 });\n    expect(result).toEqual({ transformed: 84 });\n  });\n  \n  it('should handle edge cases', () => {\n    expect(processData({ value: 0 })).toEqual({ transformed: 0 });\n  });\n});"
            return base
        if task_id == 'task_03_architecture':
            base = "import { validateRequest } from '@/lib/validation';\nimport { UserService } from '@/services/UserService';\n\nexport async function POST(request: Request) {\n  const user = await validateRequest(request);\n  const service = new UserService();\n  return await service.create(user);\n}"
            return base

        # ── Copilot Skills tasks (rule-sensitive) ───────────────────────

        if task_id == 'task_01_workspace_instructions':
            parts = []
            # Rule: "Place copilot-instructions.md in .github/ directory"
            if 'copilot-instructions.md in .github/' in md:
                parts.append('# File: .github/copilot-instructions.md')
            else:
                parts.append('# File: copilot-instructions.md')  # wrong location
            # Rule: "Always include a meaningful description field in YAML frontmatter"
            if 'description field in yaml frontmatter' in md:
                parts.append('---')
                parts.append('description: "Use when: writing Python code in this project."')
            else:
                parts.append('---')
                parts.append('# no description provided')
            # Rule: "Use applyTo glob patterns to scope instructions"
            if 'applyto glob patterns' in md or 'applyto' in md:
                parts.append('applyTo: "**/*.py"')
            parts.append('---')
            parts.append('')
            parts.append('## Type Hints')
            parts.append('- Always use type annotations for function parameters')
            parts.append('- Prefer `list[str]` over `List[str]`')
            return '\n'.join(parts)

        if task_id == 'task_02_skill_creation':
            parts = []
            parts.append('---')
            # Rule: "Always include name and description in YAML frontmatter"
            if 'name and description in yaml frontmatter' in md:
                parts.append('name: database-migration')
            else:
                parts.append('# missing name field')
            # Rule: "Quote descriptions containing colons"
            if 'quote descriptions containing colons' in md:
                parts.append('description: "Use when: running database migrations or managing schema changes."')
            else:
                parts.append('description: Use when running database migrations')  # unquoted colon!
            parts.append('---')
            parts.append('')
            # Rule: "Use skills for on-demand multi-step workflows"
            if 'multi-step workflows' in md or 'on-demand' in md:
                parts.append('## Step 1: Check Current State')
                parts.append('Run `alembic current` to see the migration head.')
                parts.append('')
                parts.append('## Step 2: Create Migration')
                parts.append('```bash')
                parts.append('alembic revision --autogenerate -m "description"')
                parts.append('```')
            else:
                parts.append('Run alembic to manage migrations.')
            return '\n'.join(parts)

        if task_id == 'task_03_custom_agent':
            parts = []
            parts.append('---')
            parts.append('name: security-reviewer')
            # Rule: "Use tool restrictions to limit which tools an agent can access"
            if 'tool restrictions' in md:
                parts.append('tools:')
                parts.append('  - read_file')
                parts.append('  - grep_search')
                parts.append('  - semantic_search')
            parts.append('---')
            parts.append('')
            # Rule: "Always provide an instructions field"
            if 'instructions field' in md or 'purpose and expertise' in md:
                parts.append('# Security Reviewer Agent')
                parts.append('')
                parts.append('## Instructions')
                parts.append('You are a security-focused code reviewer. Your purpose is to find vulnerabilities.')
                parts.append('- Scan for hardcoded credentials')
                parts.append('- Check for SQL injection and XSS')
            else:
                parts.append('# Security Agent')
                parts.append('Review code for issues.')
            return '\n'.join(parts)

        if task_id == 'task_04_file_instructions':
            parts = []
            parts.append('---')
            # Rule: "Include a description field with trigger phrases"
            if 'trigger phrases' in md or '"use when..."' in md or 'use when' in md:
                parts.append('description: "Use when: writing or editing React components."')
            else:
                parts.append('description: React component rules')
            # Rule: "Use applyTo with specific file globs"
            if 'applyto' in md and ('specific file' in md or 'glob' in md):
                parts.append('applyTo: "src/components/**/*.{tsx,jsx}"')
            elif 'applyto' in md:
                parts.append('applyTo: "**"')  # bad: too broad
            parts.append('---')
            parts.append('')
            parts.append('# React Component Standards')
            parts.append('- Use functional components with arrow functions')
            parts.append('- Define prop types using TypeScript interfaces')
            return '\n'.join(parts)

        if task_id == 'task_05_prompt_creation':
            parts = []
            parts.append('---')
            # Rule: "Include clear parameter definitions using mustache-style {{variable}}"
            if '{{variable}}' in md or 'mustache' in md:
                parts.append('description: "Generate a REST API endpoint with validation"')
                parts.append('---')
                parts.append('')
                parts.append('# Generate {{method}} /{{resource}} Endpoint')
                parts.append('')
                parts.append('Create a {{method}} endpoint for {{resource}} with:')
                parts.append('{{fields}}')
            else:
                parts.append('description: "Generate a REST API endpoint"')
                parts.append('---')
                parts.append('')
                parts.append('# Generate Endpoint')
                parts.append('')
                parts.append('Create an API endpoint for the resource.')
            return '\n'.join(parts)

        if task_id == 'task_06_hooks':
            parts = []
            parts.append('{')
            # Rule: "Use PreToolUse and PostToolUse lifecycle events"
            if 'pretooluse' in md or 'posttooluse' in md:
                parts.append('  "hooks": [{')
                parts.append('    "event": "PreToolUse",')
                parts.append('    "tools": ["run_in_terminal"],')
            else:
                parts.append('  "hooks": [{')
                parts.append('    "event": "onSave",')
                parts.append('    "tools": ["run_in_terminal"],')
            # Rule: "Hooks enforce behavior via shell commands"
            if 'shell commands' in md or 'deterministic enforcement' in md:
                parts.append('    "command": "echo \\"$TOOL_INPUT\\" | grep -q \'rm -rf\' && echo \'BLOCKED: rm -rf not allowed\' && exit 1 || exit 0",')
                parts.append('    "blocking": true')
            else:
                parts.append('    "description": "check for dangerous commands"')
            parts.append('  }]')
            parts.append('}')
            return '\n'.join(parts)

        if task_id == 'task_07_foundry_deploy':
            parts = []
            # Rule: "Use .foundry/agent-metadata.yaml as single source of truth"
            if 'agent-metadata.yaml' in md:
                parts.append('# .foundry/agent-metadata.yaml')
            parts.append('defaultEnvironment: dev')
            parts.append('')
            # Rule: "Resolve environment from user message first"
            if 'resolve environment' in md or 'environments' in md:
                parts.append('environments:')
                parts.append('  dev:')
                parts.append('    projectEndpoint: "https://myproject.cognitiveservices.azure.com"')
                parts.append('    agentName: "customer-support-agent"')
            else:
                parts.append('endpoint: "https://myproject.cognitiveservices.azure.com"')
                parts.append('agent: "customer-support-agent"')
            # Rule: "Define test cases with dataset evaluator and threshold"
            if 'test cases' in md or 'testcases' in md or 'evaluator' in md:
                parts.append('    testCases:')
                parts.append('      - dataset: "eval-dataset-v1"')
                parts.append('        evaluator: "quality-scorer"')
                parts.append('        threshold: 0.85')
            return '\n'.join(parts)

        if task_id == 'task_08_screenshots':
            parts = []
            # Rule: "Use theme presets for quickly switching visual styles"
            if 'theme presets' in md:
                parts.append('const THEMES = {')
                parts.append('  "clean-light": { bg: "#F6F1EA", fg: "#171717", accent: "#5B7CFA" },')
                parts.append('  "dark-bold": { bg: "#0B1020", fg: "#F8FAFC", accent: "#8B5CF6" },')
                parts.append('};')
                parts.append('')
            # Rule: "Support multiple locales with a LOCALES array"
            if 'locales array' in md or 'locale-scoped' in md:
                parts.append('const LOCALES = ["en", "de", "es"] as const;')
                parts.append('')
            # Rule: "Include proper phone mockup frames"
            if 'phone mockup' in md or 'mockup frames' in md:
                parts.append('function PhoneMockup({ src, alt }) {')
                parts.append('  return (')
                parts.append('    <div className="phone-mockup">')
                parts.append('      <img src={src} alt={alt} />')
                parts.append('    </div>')
                parts.append('  );')
                parts.append('}')
                parts.append('')
            # Rule: "Screenshots are advertisements not documentation"
            if 'advertisements not documentation' in md:
                parts.append('// Each slide sells ONE idea — headline + device screenshot')
                parts.append('function ScreenshotSlide({ headline, screenshotSrc }) {')
            else:
                parts.append('function ScreenshotSlide({ screenshotSrc }) {')
            parts.append('  return (')
            parts.append('    <div style={{ textAlign: "center" }}>')
            if 'advertisements' in md:
                parts.append('      <h2>{headline}</h2>')
            parts.append('      <img src={`/screenshots/${screenshotSrc}`} />')
            parts.append('    </div>')
            parts.append('  );')
            parts.append('}')
            return '\n'.join(parts)

        return f"// Generated code for {task_id}"

    def get_usage_summary(self) -> dict:
        """Get API usage statistics."""
        return {
            'calls_made': self.call_count,
            'cache_hits': self.cached_count,
            'total_tokens': self.total_tokens,
            'estimated_cost_usd': round(self.total_cost, 4),
            'mode': 'real_api' if self.use_api else 'mock'
        }


class TaskHarness:
    """Manages a corpus of tasks that stress-test AGENTS.md rules."""
    
    def __init__(self, api_key: str = None, use_api: bool = False, model: str = "gpt-4", verifier_engine=None):
        self.api = CodexAPI(api_key=api_key, use_api=use_api, model=model)
        self.tasks: List[TaskDefinition] = []
        self.results: List[TaskResult] = []
        self.verifier_engine = verifier_engine

    def load_tasks_from_directory(self, task_dir: Path) -> List[TaskDefinition]:
        """Load tasks from markdown files in a directory."""
        self.tasks.clear()
        
        for task_file in sorted(task_dir.glob('task_*.md')):
            task_id = task_file.stem
            content = task_file.read_text()
            
            # Simple parser: assume format is "Prompt: ... \n\nVerifier: ..."
            parts = content.split('\n\n')
            prompt = parts[0].replace('Prompt: ', '').strip() if parts else ""
            
            # Use verifier engine if available, else simple length check
            if self.verifier_engine:
                ve = self.verifier_engine
                tid = task_id
                def make_verifier(engine, t_id):
                    return lambda output: engine.verify(t_id, output)
                verifier_fn = make_verifier(ve, tid)
            else:
                def default_verifier(output):
                    return len(output) > 0
                verifier_fn = default_verifier
            
            task = TaskDefinition(
                task_id=task_id,
                prompt=prompt,
                verifier_fn=verifier_fn
            )
            self.tasks.append(task)
        
        return self.tasks

    def run_all_tasks(self, agents_md_content: str) -> dict:
        """Run all tasks with given AGENTS.md content."""
        self.results.clear()
        
        pass_count = 0
        total_tokens = 0
        task_results = []
        
        for task in self.tasks:
            result = self.api.send_prompt(
                task.task_id,
                task.prompt,
                agents_md_content
            )
            
            # Verify result
            try:
                passed = task.verifier_fn(result.output)
            except Exception:
                passed = False
            
            result.passed = passed
            self.results.append(result)
            task_results.append({
                'task_id': task.task_id,
                'passed': passed,
                'tokens': result.tokens_used
            })
            
            if passed:
                pass_count += 1
            total_tokens += result.tokens_used
        
        pass_rate = (pass_count / len(self.tasks) * 100) if self.tasks else 0
        
        return {
            'pass_rate': pass_rate,
            'pass_count': pass_count,
            'total_tasks': len(self.tasks),
            'total_tokens': total_tokens,
            'tasks': task_results,
            'api_calls': self.api.call_count,
            'usage': self.api.get_usage_summary()
        }
