"""
Rule Parser - Decompose AGENTS.md into atomic, independently testable rules.
"""

import hashlib
import re
from dataclasses import dataclass
from typing import List
from pathlib import Path


@dataclass
class Rule:
    """Represents a single extracted rule from AGENTS.md."""
    id: str
    text: str
    section: str
    tokens: int
    line_no: int

    def __hash__(self):
        return hash(self.id)
    
    def __eq__(self, other):
        if not isinstance(other, Rule):
            return False
        return self.id == other.id


class RuleParser:
    """Extracts and indexes rules from AGENTS.md."""

    def __init__(self):
        self.rules: List[Rule] = []

    def parse_file(self, filepath: Path) -> List[Rule]:
        """Parse AGENTS.md and extract rules."""
        self.rules.clear()
        
        with open(filepath, 'r') as f:
            content = f.read()
        
        return self.parse(content, filepath)

    def parse(self, content: str, filepath: Path = None) -> List[Rule]:
        """Parse markdown content and extract rules."""
        lines = content.split('\n')
        current_section = "General"
        rule_id_counter = 1
        
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Track section headers (##)
            if line.startswith('##'):
                current_section = line.replace('##', '').strip()
            
            # Extract bullet points as rules
            elif line.strip().startswith('- '):
                rule_text = line.strip()[2:].strip()
                tokens = self._estimate_tokens(rule_text)
                rule_id = f"rule_{rule_id_counter:03d}"
                rule_id_counter += 1
                
                rule = Rule(
                    id=rule_id,
                    text=rule_text,
                    section=current_section,
                    tokens=tokens,
                    line_no=i + 1
                )
                self.rules.append(rule)
            
            # Extract numbered lists as rules
            elif re.match(r'^\d+\.\s+', line.strip()):
                rule_text = re.sub(r'^\d+\.\s+', '', line.strip())
                tokens = self._estimate_tokens(rule_text)
                rule_id = f"rule_{rule_id_counter:03d}"
                rule_id_counter += 1
                
                rule = Rule(
                    id=rule_id,
                    text=rule_text,
                    section=current_section,
                    tokens=tokens,
                    line_no=i + 1
                )
                self.rules.append(rule)
            
            i += 1
        
        return self.rules

    @staticmethod
    def _estimate_tokens(text: str) -> int:
        """Rough token estimation (1 token ≈ 4 chars for English)."""
        # Simple heuristic: split on whitespace and count words
        word_count = len(text.split())
        return max(1, word_count // 2)  # Conservative estimate

    def get_rule_by_id(self, rule_id: str) -> Rule:
        """Retrieve a rule by its ID."""
        for rule in self.rules:
            if rule.id == rule_id:
                return rule
        return None

    def get_rules_by_section(self, section: str) -> List[Rule]:
        """Get all rules from a specific section."""
        return [r for r in self.rules if r.section == section]

    def total_tokens(self) -> int:
        """Sum total tokens across all rules."""
        return sum(r.tokens for r in self.rules)

    def to_dict_list(self) -> List[dict]:
        """Export rules as list of dicts for JSON serialization."""
        return [
            {
                'id': r.id,
                'text': r.text,
                'section': r.section,
                'tokens': r.tokens,
                'line_no': r.line_no
            }
            for r in self.rules
        ]


def ablate_rules(original_rules: List[Rule], rules_to_remove: List[str]) -> List[Rule]:
    """Return a list of rules with specified rules removed."""
    ids_to_remove = set(rules_to_remove)
    return [r for r in original_rules if r.id not in ids_to_remove]
