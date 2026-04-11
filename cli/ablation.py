"""
Ablation Engine - Core A/B testing for rule impact measurement.
"""

import json
from dataclasses import dataclass, asdict
from typing import List, Dict, Tuple
from enum import Enum

from .rule_parser import Rule, RuleParser, ablate_rules
from .runner import TaskHarness


class Verdict(str, Enum):
    """Classification of rule impact."""
    CRITICAL = "CRITICAL"
    HELPFUL = "HELPFUL"
    PRUNE = "PRUNE"
    HARMFUL = "HARMFUL"
    NEUTRAL = "NEUTRAL"


@dataclass
class AblationResult:
    """Result of testing a single rule's impact."""
    rule_id: str
    rule_text: str
    section: str
    original_tokens: int
    
    baseline_pass_rate: float
    baseline_tokens: int
    
    ablated_pass_rate: float
    ablated_tokens: int
    
    pass_delta: float  # ablated - baseline
    token_delta: int   # ablated - baseline
    
    verdict: Verdict
    roi: float  # Return on investment score

    def to_dict(self):
        """Convert to JSON-serializable dict."""
        d = asdict(self)
        d['verdict'] = self.verdict.value
        return d


class AblationEngine:
    """Statistical engine for measuring rule impact via ablation testing."""
    
    def __init__(self, harness: TaskHarness):
        self.harness = harness
        self.baseline_results = None
        self.ablation_results: List[AblationResult] = []

    def run_baseline(self, agents_md_content: str) -> dict:
        """Establish baseline metrics with all rules present."""
        print("[1/4] Running BASELINE with all rules...")
        self.baseline_results = self.harness.run_all_tasks(agents_md_content)
        return self.baseline_results

    def run_ablations(self, parser: RuleParser, agents_md_content: str) -> List[AblationResult]:
        """
        For each rule, remove it and measure impact.
        This is the core of Skill Optimizer.
        """
        self.ablation_results.clear()
        
        print(f"\n[2/4] Running ABLATIONS ({len(parser.rules)} rules)...")
        
        baseline_pass = self.baseline_results['pass_rate']
        baseline_tokens = self.baseline_results['total_tokens']
        baseline_section = agents_md_content
        
        for idx, rule in enumerate(parser.rules, 1):
            print(f"  Ablating {rule.id}: {rule.text[:50]}...")
            
            # Remove this rule from AGENTS.md
            ablated_rules = ablate_rules(parser.rules, [rule.id])
            ablated_md = self._rebuild_agents_md(ablated_rules, parser)
            
            # Run tasks without this rule
            ablated_result = self.harness.run_all_tasks(ablated_md)
            ablated_pass = ablated_result['pass_rate']
            ablated_tokens = ablated_result['total_tokens']
            
            # Compute deltas
            pass_delta = ablated_pass - baseline_pass
            token_delta = ablated_tokens - baseline_tokens
            
            # Classify verdict
            verdict = self._classify_verdict(pass_delta, token_delta)
            
            # ROI: pass contribution is worth 3x token savings
            roi = (pass_delta * 3) - token_delta
            
            ablation = AblationResult(
                rule_id=rule.id,
                rule_text=rule.text,
                section=rule.section,
                original_tokens=rule.tokens,
                baseline_pass_rate=baseline_pass,
                baseline_tokens=baseline_tokens,
                ablated_pass_rate=ablated_pass,
                ablated_tokens=ablated_tokens,
                pass_delta=pass_delta,
                token_delta=token_delta,
                verdict=verdict,
                roi=roi
            )
            
            self.ablation_results.append(ablation)
        
        print(f"\nCompleted {len(self.ablation_results)} ablations.\n")
        return self.ablation_results

    def rank_by_roi(self) -> List[AblationResult]:
        """Sort rules by ROI (highest first)."""
        return sorted(self.ablation_results, key=lambda r: r.roi, reverse=True)

    @staticmethod
    def _classify_verdict(pass_delta: float, token_delta: int) -> Verdict:
        """Classify rule impact based on deltas."""
        # pass_delta < -10%: removing hurts significantly → CRITICAL
        if pass_delta < -10:
            return Verdict.CRITICAL
        
        # pass_delta < 0% but > -10%: removing hurts → HELPFUL
        if pass_delta < 0:
            return Verdict.HELPFUL
        
        # Harmful: removing helps (pass_delta > +5%)
        if pass_delta > 5:
            return Verdict.HARMFUL
        
        # Neutral: no impact on pass, no impact on tokens
        if abs(pass_delta) <= 1 and abs(token_delta) <= 5:
            return Verdict.NEUTRAL
        
        # Prune: no impact on pass, but saves tokens
        if abs(pass_delta) <= 1 and token_delta < 0:
            return Verdict.PRUNE
        
        return Verdict.HELPFUL

    def _rebuild_agents_md(self, rules: List[Rule], parser: RuleParser) -> str:
        """Reconstruct AGENTS.md from a subset of rules."""
        if not rules:
            return "# AGENTS.md (empty)\n"
        
        # Group by section
        sections = {}
        for rule in rules:
            if rule.section not in sections:
                sections[rule.section] = []
            sections[rule.section].append(rule)
        
        # Build markdown
        lines = ["# AGENTS.md\n"]
        for section, section_rules in sections.items():
            lines.append(f"\n## {section}\n")
            for rule in section_rules:
                lines.append(f"- {rule.text}")
        
        return "\n".join(lines)

    def generate_report(self) -> dict:
        """Generate machine-readable report."""
        ranked = self.rank_by_roi()
        
        return {
            'summary': {
                'total_rules': len(self.ablation_results),
                'baseline_pass_rate': self.baseline_results['pass_rate'],
                'baseline_tokens': self.baseline_results['total_tokens'],
                'critical_count': sum(1 for r in self.ablation_results if r.verdict == Verdict.CRITICAL),
                'helpful_count': sum(1 for r in self.ablation_results if r.verdict == Verdict.HELPFUL),
                'prune_count': sum(1 for r in self.ablation_results if r.verdict == Verdict.PRUNE),
                'harmful_count': sum(1 for r in self.ablation_results if r.verdict == Verdict.HARMFUL),
            },
            'rules': [r.to_dict() for r in ranked]
        }
