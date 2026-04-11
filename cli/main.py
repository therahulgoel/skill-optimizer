"""Main CLI entry point for Skill Optimizer."""

import click
import json
import time
from pathlib import Path

from .rule_parser import RuleParser
from .runner import TaskHarness
from .ablation import AblationEngine
from .output import OutputGenerator
from .config import AppConfig
from .cache import ResultCache
from .verifiers import VerifierEngine
from .skill_trimmer import trim_skill_file, trim_skill_folder

# Handle version safely
try:
    from importlib.metadata import version
    try:
        __version__ = version("skill-optimizer")
    except Exception:
        __version__ = version("context-surgeon")
except Exception:
    __version__ = "0.1.0"


@click.group()
@click.version_option(version=__version__)
def cli():
    """Skill Optimizer - minimize SKILL.md and AGENTS.md context."""
    pass


@cli.command()
@click.option(
    '--agents',
    type=click.Path(exists=True),
    required=True,
    help='Path to AGENTS.md file'
)
@click.option(
    '--tasks',
    type=click.Path(exists=True),
    required=True,
    help='Path to tasks directory'
)
@click.option(
    '--output',
    type=click.Path(),
    default='.',
    help='Output directory for results'
)
@click.option(
    '--api-key',
    default=None,
    help='OpenAI API key (leave blank for mock mode)'
)
@click.option(
    '--use-api',
    is_flag=True,
    default=False,
    help='Use real Codex API instead of mock'
)
@click.option(
    '--cache-dir',
    type=click.Path(),
    default='.skill-optimizer',
    help='Cache directory'
)
@click.option(
    '--no-cache',
    is_flag=True,
    default=False,
    help='Disable caching'
)
@click.option(
    '--verifiers',
    type=click.Path(exists=True),
    default=None,
    help='Path to custom verifiers.yml file'
)
@click.option(
    '--save-trends',
    is_flag=True,
    default=False,
    help='Save results to trends directory'
)
def run(agents, tasks, output, api_key, use_api, cache_dir, no_cache, verifiers, save_trends):
    """
    Run ablation test on AGENTS.md rules.
    
    This will:
    1. Parse AGENTS.md into individual rules
    2. Run baseline and ablated test suites
    3. Rank rules by ROI
    4. Generate AGENTS.optimized.md and report.json
    """
    # Load configuration
    config = AppConfig.from_env()
    config.setup()
    if api_key:
        config.api.api_key = api_key
    
    agents_path = Path(agents)
    tasks_path = Path(tasks)
    output_path = Path(output)
    cache_path = Path(cache_dir)
    output_path.mkdir(exist_ok=True)
    
    start_time = time.time()
    
    click.echo(f"\n📋 Skill Optimizer — Ablation Testing for AGENTS.md")
    click.echo("=" * 70)
    config.log_config()
    
    # Step 1: Parse AGENTS.md
    click.echo(f"[1/5] Parsing AGENTS.md...")
    parser = RuleParser()
    parser.parse_file(agents_path)
    click.echo(f"  ✓ Found {len(parser.rules)} rules")
    click.echo(f"  ✓ Total tokens: {parser.total_tokens():,}")
    
    # Step 2: Load task corpus
    click.echo(f"\n[2/5] Loading task corpus...")
    harness = TaskHarness(
        api_key=config.api.api_key,
        use_api=use_api,
        model=config.api.model
    )
    tasks_loaded = harness.load_tasks_from_directory(tasks_path)
    click.echo(f"  ✓ Loaded {len(tasks_loaded)} tasks")
    
    # Step 3: Load custom verifiers if provided
    verifier_engine = None
    if verifiers:
        click.echo(f"\n[3/5] Loading custom verifiers...")
        verifier_engine = VerifierEngine(Path(verifiers))
    
    # Wire verifiers into harness
    harness.verifier_engine = verifier_engine
    # Reload tasks so verifiers are bound
    harness.load_tasks_from_directory(tasks_path)
    
    # Step 4: Run ablation engine
    click.echo(f"\n[4/5] Running ablation tests...")
    agents_content = agents_path.read_text()
    
    engine = AblationEngine(harness)
    engine.run_baseline(agents_content)
    click.echo(f"  ✓ Baseline: {engine.baseline_results['pass_rate']:.1f}% pass")
    click.echo(f"  ✓ API calls: {harness.api.call_count}")
    
    ablations = engine.run_ablations(parser, agents_content)
    click.echo(f"  ✓ Completed {len(ablations)} ablations")
    
    # Show API usage stats
    usage = harness.api.get_usage_summary()
    click.echo(f"  ✓ Tokens used: {usage['total_tokens']:,}")
    if usage['estimated_cost_usd'] > 0:
        click.echo(f"  ✓ Estimated cost: ${usage['estimated_cost_usd']:.4f}")
    
    # Step 5: Generate outputs
    click.echo(f"\n[5/5] Generating outputs...")
    
    optimized_path = output_path / "AGENTS.optimized.md"
    report_path = output_path / "report.json"
    
    OutputGenerator.generate_optimized_agents(
        ablations,
        engine.baseline_results['pass_rate'],
        engine.baseline_results['total_tokens'],
        optimized_path
    )
    click.echo(f"  ✓ Wrote {optimized_path}")
    
    report = OutputGenerator.generate_report_json(engine, report_path)
    click.echo(f"  ✓ Wrote {report_path}")
    
    # Save to trends if requested
    if save_trends:
        trends_dir = Path(cache_dir) / 'trends'
        trends_dir.mkdir(exist_ok=True, parents=True)
        trends_file = trends_dir / f"{report['metadata']['timestamp']}.json"
        trends_file.write_text(json.dumps(report, indent=2), encoding='utf-8')
        click.echo(f"  ✓ Saved trend: {trends_file}")
    
    # Print summary
    OutputGenerator.print_summary(report)
    
    # Print timing
    duration = time.time() - start_time
    click.echo(f"⏱️  Duration: {duration:.1f}s")
    click.echo(f"\n✅ Done! Results in {output_path}/")


@cli.command()
@click.argument('agents_file', type=click.Path(exists=True))
def parse(agents_file: str):
    """
    Parse AGENTS.md and show extracted rules.
    """
    parser = RuleParser()
    rules = parser.parse_file(Path(agents_file))
    
    click.echo(f"\n📋 Parsed {len(rules)} rules from {agents_file}\n")
    
    for rule in rules:
        click.echo(f"{rule.id} [{rule.section}] ({rule.tokens} tokens)")
        click.echo(f"   {rule.text[:70]}...")
        click.echo()


@cli.group()
def cache():
    """Manage caching layer."""
    pass


@cache.command()
@click.option('--cache-dir', type=click.Path(), default='.skill-optimizer')
def clear(cache_dir):
    """Clear cache."""
    cache_mgr = ResultCache(Path(cache_dir))
    cache_mgr.clear()


@cache.command()
@click.option('--cache-dir', type=click.Path(), default='.skill-optimizer')
def stats(cache_dir):
    """Show cache statistics."""
    cache_mgr = ResultCache(Path(cache_dir))
    stats_dict = cache_mgr.stats()
    
    click.echo("\n📊 Cache Statistics")
    click.echo("=" * 50)
    for key, value in stats_dict.items():
        click.echo(f"  {key}: {value}")


@cli.command()
@click.option('--trends-dir', type=click.Path(), default='.skill-optimizer/trends')
@click.option('--compare', nargs=2, help='Compare two specific runs')
@click.option('--json', is_flag=True, help='Output as JSON')
def trends(trends_dir, compare, json):
    """
    Show trend analysis across multiple runs.
    """
    trends_path = Path(trends_dir)
    
    if not trends_path.exists():
        click.echo(f"No trends found in {trends_path}")
        return
    
    # TODO: Implement trend analysis
    click.echo("📈 Trends (Coming soon)")
    click.echo(f"Trends directory: {trends_path}")


@cli.command('trim-skill')
@click.option(
    '--skill',
    type=click.Path(exists=True),
    required=True,
    help='Path to SKILL.md file'
)
@click.option(
    '--output',
    type=click.Path(),
    default='results',
    help='Output directory for optimized skill and report'
)
@click.option(
    '--mode',
    type=click.Choice(['strict', 'balanced', 'aggressive']),
    default='balanced',
    show_default=True,
    help='Trim mode'
)
@click.option(
    '--replacement-root',
    type=click.Path(),
    default=None,
    help='Optional root folder used to suggest where the optimized skill should replace an existing skill'
)
def trim_skill(skill, output, mode, replacement_root):
    """Trim an open-source SKILL.md file to a practical minimum.

    Generates two artifacts:
    1. <name>.optimized.md
    2. skill_trim_report.json
    """
    output_path = Path(output)
    report = trim_skill_file(skill, output, mode=mode, replacement_root=replacement_root)

    click.echo("\n✂️ Skill Trim Complete")
    click.echo("=" * 60)
    click.echo(f"Source: {skill}")
    click.echo(f"Mode: {mode}")
    click.echo(f"Original rules: {report['skill']['original_rule_count']}")
    click.echo(f"Kept rules: {report['skill']['kept_rule_count']}")
    click.echo(f"Removed rules: {report['skill']['removed_rule_count']}")
    click.echo(f"Tokens saved: {report['skill']['actual_tokens_saved']}")
    click.echo(f"Token reduction: {report['skill']['token_reduction_pct']:.1f}%")
    click.echo(f"Optimized file: {report['metadata']['optimized_skill_path']}")
    if report['metadata'].get('replacement_path'):
        click.echo(f"Suggested replacement path: {report['metadata']['replacement_path']}")
    click.echo(f"Report: {output_path / 'skill_trim_report.json'}")


@cli.command('trim-folder')
@click.option(
    '--skills-dir',
    type=click.Path(exists=True),
    required=True,
    help='Folder to scan recursively for SKILL.md files'
)
@click.option(
    '--output',
    type=click.Path(),
    default='results/batch',
    help='Output directory for optimized skills and batch report'
)
@click.option(
    '--mode',
    type=click.Choice(['strict', 'balanced', 'aggressive']),
    default='balanced',
    show_default=True,
    help='Trim mode'
)
@click.option(
    '--replacement-root',
    type=click.Path(),
    default=None,
    help='Optional root folder used to suggest where optimized skills should replace existing skills'
)
def trim_folder(skills_dir, output, mode, replacement_root):
    """Trim all SKILL.md files in a folder recursively."""
    batch_report = trim_skill_folder(skills_dir, output, mode=mode, replacement_root=replacement_root)
    click.echo("\n📦 Batch Skill Trim Complete")
    click.echo("=" * 60)
    click.echo(f"Source folder: {skills_dir}")
    click.echo(f"Mode: {mode}")
    click.echo(f"Skills optimized: {batch_report['summary']['total_skills']}")
    click.echo(f"Total tokens saved: {batch_report['summary']['total_tokens_saved']}")
    click.echo(f"Batch report: {Path(output) / 'skill_trim_batch_report.json'}")


if __name__ == '__main__':
    cli()
