"""
Verifier system for task output validation.
"""

import re
import yaml
from pathlib import Path
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass


@dataclass
class Verifier:
    """A single verifier rule."""
    task_id: str
    verifier_type: str  # "regex", "python", "ast"
    config: Dict[str, Any]
    description: str = ""

    def verify(self, output: str) -> bool:
        """Run verification against output."""
        if self.verifier_type == "regex":
            return self._verify_regex(output)
        elif self.verifier_type == "python":
            return self._verify_python(output)
        elif self.verifier_type == "ast":
            return self._verify_ast(output)
        else:
            # Default: string matching
            return self._verify_simple(output)

    def _verify_regex(self, output: str) -> bool:
        """Verify using regex patterns."""
        patterns = self.config.get('patterns', [])
        mode = self.config.get('mode', 'any')  # 'any' or 'all'

        if not patterns:
            return True

        matches = [bool(re.search(p, output, re.IGNORECASE)) for p in patterns]

        if mode == 'all':
            return all(matches)
        else:  # 'any'
            return any(matches)

    def _verify_python(self, output: str) -> bool:
        """Verify using Python code execution."""
        code = self.config.get('code', '')
        if not code:
            return True

        try:
            namespace = {'output': output}
            exec(code, namespace)
            return namespace.get('result', False)
        except Exception as e:
            print(f"Warning: Verifier {self.task_id} execution failed: {e}")
            return False

    def _verify_ast(self, output: str) -> bool:
        """Verify using AST checks (simplified)."""
        # Simplified: just check for required patterns
        rules = self.config.get('rules', [])
        for rule in rules:
            if ':' in rule:
                check_type, pattern = rule.split(':', 1)
                if check_type == 'must_have_class_usage':
                    if f"class {pattern}" not in output and f"new {pattern}" not in output:
                        return False
                elif check_type == 'must_not_have_import':
                    if f"import {pattern}" in output or f"from {pattern}" in output:
                        return False
        return True

    def _verify_simple(self, output: str) -> bool:
        """Simple string matching fallback."""
        keywords = self.config.get('keywords', [])
        return any(kw in output for kw in keywords) if keywords else len(output) > 0


class VerifierEngine:
    """Manages all verifiers for a project."""

    def __init__(self, config_path: Optional[Path] = None):
        self.verifiers: Dict[str, Verifier] = {}
        self.default_verifier = None

        if config_path and config_path.exists():
            self.load_from_yaml(config_path)

    def load_from_yaml(self, config_path: Path):
        """Load verifiers from YAML file."""
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f) or {}

            # Load default verifier
            default_config = config.get('default_verifier', {})
            if default_config:
                self.default_verifier = Verifier(
                    task_id='__default__',
                    verifier_type=default_config.get('type', 'regex'),
                    config=default_config,
                    description="Default verifier"
                )

            # Load specific verifiers
            verifiers_config = config.get('verifiers', {})
            for task_id, verifier_config in verifiers_config.items():
                self.verifiers[task_id] = Verifier(
                    task_id=task_id,
                    verifier_type=verifier_config.get('type', 'regex'),
                    config=verifier_config,
                    description=verifier_config.get('description', '')
                )

            print(f"✓ Loaded {len(self.verifiers)} custom verifiers from {config_path}")
        except Exception as e:
            print(f"Warning: Failed to load verifiers from {config_path}: {e}")

    def verify(self, task_id: str, output: str) -> bool:
        """Verify output for a task."""
        if task_id in self.verifiers:
            return self.verifiers[task_id].verify(output)
        elif self.default_verifier:
            return self.default_verifier.verify(output)
        else:
            # No verifier: always pass
            return True

    def get_description(self, task_id: str) -> str:
        """Get verifier description."""
        if task_id in self.verifiers:
            return self.verifiers[task_id].description
        elif self.default_verifier:
            return self.default_verifier.description
        else:
            return "No verifier defined"
