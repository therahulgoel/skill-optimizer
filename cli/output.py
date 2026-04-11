"""
Output Generator - Produce AGENTS.optimized.md and report.json
"""

import json
from pathlib import Path
from typing import List

from .ablation import AblationResult, Verdict, AblationEngine


class OutputGenerator:
    """Generates output artifacts from ablation results."""
    
    @staticmethod
    def generate_optimized_agents(
        ablation_results: List[AblationResult],
        baseline_pass_rate: float,
        baseline_tokens: int,
        output_path: Path
    ) -> str:
        """
        Generate AGENTS.optimized.md containing only CRITICAL + HELPFUL rules,
        sorted by ROI descending.
        """
        # Filter: keep only CRITICAL and HELPFUL
        keep_rules = [
            r for r in ablation_results
            if r.verdict in (Verdict.CRITICAL, Verdict.HELPFUL)
        ]
        
        # Sort by ROI
        keep_rules = sorted(keep_rules, key=lambda r: r.roi, reverse=True)
        
        # Calculate savings
        optimized_tokens = sum(r.original_tokens for r in keep_rules)
        token_savings = baseline_tokens - optimized_tokens
        token_savings_pct = (token_savings / baseline_tokens * 100) if baseline_tokens > 0 else 0
        
        # Estimate optimal pass rate (conservative: no change)
        optimal_pass_rate = baseline_pass_rate
        pass_delta = 0
        for r in ablation_results:
            if r.verdict == Verdict.HARMFUL:
                pass_delta += abs(r.pass_delta)
        
        # Build markdown
        lines = [
            "# AGENTS.md — Optimized by Skill Optimizer",
            "",
            f"# Original: {len(ablation_results)} rules / {baseline_tokens:,} tokens",
            f"# Optimized: {len(keep_rules)} rules / {optimized_tokens:,} tokens ({-token_savings_pct:.0f}%)",
            f"# Pass rate delta: {pass_delta:+.1f}%",
            "",
            "---",
            ""
        ]
        
        # Group by section
        sections = {}
        for rule in keep_rules:
            if rule.section not in sections:
                sections[rule.section] = []
            sections[rule.section].append(rule)
        
        for section, rules in sections.items():
            lines.append(f"## {section}")
            lines.append("")
            for rule in rules:
                lines.append(f"- {rule.rule_text}")
            lines.append("")
        
        content = "\n".join(lines)
        
        with open(output_path, 'w') as f:
            f.write(content)
        
        return content

    @staticmethod
    def generate_report_json(
        engine: AblationEngine,
        output_path: Path
    ) -> dict:
        """Generate report.json with full ablation results."""
        report = engine.generate_report()
        
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        return report

    @staticmethod
    def print_summary(report: dict):
        """Print human-readable summary to terminal."""
        summary = report['summary']
        
        print("\n" + "="*70)
        print("Skill Optimizer — Analysis Complete")
        print("="*70)
        print(f"\nTotal Rules Analyzed: {summary['total_rules']}")
        print(f"Baseline Pass Rate: {summary['baseline_pass_rate']:.1f}%")
        print(f"Baseline Tokens: {summary['baseline_tokens']:,}")
        print()
        print("Verdict Breakdown:")
        print(f"  🟢 CRITICAL  (never remove): {summary['critical_count']}")
        print(f"  🟡 HELPFUL   (keep if cheap): {summary['helpful_count']}")
        print(f"  🔴 PRUNE     (safe to remove): {summary['prune_count']}")
        print(f"  🔴 HARMFUL   (actively hurting): {summary['harmful_count']}")
        print()
        print("Top 5 Rules by ROI:")
        print("-" * 70)
        
        ranked = sorted(report['rules'], key=lambda r: r['roi'], reverse=True)
        for i, rule in enumerate(ranked[:5], 1):
            print(f"{i}. [{rule['verdict']}] {rule['rule_text'][:50]}...")
            print(f"   ROI: {rule['roi']:+.1f} | Pass Δ: {rule['pass_delta']:+.1f}% | Tokens Δ: {rule['token_delta']:+d}")
            print()
        
        print("="*70)
