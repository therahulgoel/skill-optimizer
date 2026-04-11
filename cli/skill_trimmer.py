"""Skill trimmer - reduce open source SKILL.md files to a practical minimum.

This module implements a deterministic heuristic trimmer for SKILL.md files.
It keeps high-value, decision-impacting rules and removes examples, repeated
reference lines, and low-signal editorial content.
"""

from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path
from .rule_parser import RuleParser


class SkillTrimmer:
    """Trim a SKILL.md file to a compact subset with reasons."""

    MODE_CONFIG = {
        "strict": {
            "name": "Strict",
            "description": "Keeps more rules to reduce the chance of trimming something your team still relies on.",
            "keep_project_structure": True,
            "keep_review_process_steps": True,
            "keep_examples": False,
            "keep_reference_bullets": True,
            "keep_generic_directives": True,
        },
        "balanced": {
            "name": "Balanced",
            "description": "Recommended default. Keeps constraints, output requirements, and references while removing duplicated process steps and examples.",
            "keep_project_structure": True,
            "keep_review_process_steps": False,
            "keep_examples": False,
            "keep_reference_bullets": True,
            "keep_generic_directives": True,
        },
        "aggressive": {
            "name": "Aggressive",
            "description": "Keeps only the minimum constraints and output rules, dropping most generic guidance to maximize token savings.",
            "keep_project_structure": False,
            "keep_review_process_steps": False,
            "keep_examples": False,
            "keep_reference_bullets": True,
            "keep_generic_directives": False,
        },
    }

    BASIS = [
        {
            "name": "Actionable directives",
            "description": "Keep explicit instructions that change implementation or review behavior.",
        },
        {
            "name": "Runtime and platform constraints",
            "description": "Keep deployment target, language version, framework restrictions, and compatibility assumptions.",
        },
        {
            "name": "Output requirements",
            "description": "Keep only the formatting rules needed to make the output usable by teams.",
        },
        {
            "name": "Reference preservation",
            "description": "Keep unique reference files because they are reusable, but drop duplicate or explanatory reference bullets.",
        },
        {
            "name": "Remove examples and editorial text",
            "description": "Drop sample findings, before/after demonstrations, and narrative text because they add context size but not operational value.",
        },
    ]

    DIRECTIVE_KEYWORDS = (
        "ensure",
        "validate",
        "must",
        "avoid",
        "prefer",
        "should",
        "target",
        "use",
        "never",
        "always",
        "focus",
        "require",
        "organize",
        "state the file",
        "show a brief",
        "do not",
    )

    def __init__(self, mode: str = "balanced"):
        if mode not in self.MODE_CONFIG:
            raise ValueError(f"Unsupported trim mode: {mode}")
        self.mode = mode
        self.mode_config = self.MODE_CONFIG[mode]

    def trim(self, skill_path: Path, output_dir: Path, replacement_root: str | None = None) -> dict:
        content = skill_path.read_text(encoding="utf-8")
        frontmatter, body = self._split_frontmatter(content)
        skill_name = self._derive_skill_name(skill_path, frontmatter)

        parser = RuleParser()
        rules = parser.parse(body, skill_path)

        kept_rules = []
        removed_rules = []
        references = []
        seen_references = set()

        for rule in rules:
            decision, reason = self._classify_rule(rule.section, rule.text)
            record = {
                "id": rule.id,
                "text": rule.text,
                "section": rule.section,
                "tokens": rule.tokens,
                "reason": reason,
            }

            if decision == "keep-reference":
                if rule.text not in seen_references:
                    seen_references.add(rule.text)
                    references.append(record)
                    kept_rules.append(record)
                else:
                    record["reason"] = "Duplicate reference entry removed."
                    removed_rules.append(record)
            elif decision == "keep":
                kept_rules.append(record)
            else:
                removed_rules.append(record)

        optimized_content = self._build_optimized_skill(frontmatter, kept_rules, references)
        output_dir.mkdir(parents=True, exist_ok=True)

        optimized_path = output_dir / f"{skill_name}.optimized.md"
        optimized_path.write_text(optimized_content, encoding="utf-8")

        original_tokens = sum(rule.tokens for rule in rules)
        optimized_tokens = sum(item["tokens"] for item in kept_rules)
        actual_tokens_saved = original_tokens - optimized_tokens
        token_reduction_pct = 0.0
        if original_tokens > 0:
            token_reduction_pct = (actual_tokens_saved / original_tokens) * 100

        replacement_path = self._build_replacement_path(skill_name, replacement_root)
        report = {
            "type": "skill_trim_report",
            "metadata": {
                "timestamp": dt.datetime.utcnow().isoformat() + "Z",
                "source_path": str(skill_path),
                "optimized_skill_path": str(optimized_path),
                "mode": self.mode,
                "replacement_path": replacement_path,
            },
            "skill": {
                "name": skill_name,
                "original_rule_count": len(rules),
                "kept_rule_count": len(kept_rules),
                "removed_rule_count": len(removed_rules),
                "original_tokens": original_tokens,
                "optimized_tokens": optimized_tokens,
                "actual_tokens_saved": actual_tokens_saved,
                "token_reduction_pct": round(token_reduction_pct, 1),
            },
            "basis": self._basis_for_mode(),
            "kept_rules": kept_rules,
            "removed_rules": removed_rules,
            "original_content": content,
            "optimized_content": optimized_content,
        }

        report_path = output_dir / "skill_trim_report.json"
        report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        return report

    def _classify_rule(self, section: str, text: str) -> tuple[str, str]:
        lowered = text.strip().lower()
        lowered_section = section.strip().lower()

        if self._is_example_or_demo(lowered):
            return "remove", "Example or sample output removed to reduce context size."

        if "references/" in lowered and lowered_section == "references":
            return "keep-reference", "Unique reference file retained for targeted deep review."

        if "references/" in lowered:
            if self.mode_config["keep_review_process_steps"]:
                return "keep", "Review-process step retained in strict mode for extra guidance."
            return "remove", "Review-process step removed because the same source is already covered by the compact references list."

        if self._is_output_rule(lowered):
            return "keep", "Output-format rule retained because teams need consistent, usable review output."

        if self._is_constraint_rule(lowered):
            if "project structure" in lowered and not self.mode_config["keep_project_structure"]:
                return "remove", "Project-structure guidance removed in aggressive mode to keep only hard constraints."
            return "keep", "Platform or framework constraint retained because it changes implementation decisions."

        if self._is_actionable_directive(lowered):
            if not self.mode_config["keep_generic_directives"] and self._is_generic_directive(lowered):
                return "remove", "Generic directive removed in aggressive mode to maximize token savings."
            return "keep", "Actionable directive retained because it changes what the reviewer should check."

        return "remove", "Low-signal editorial content removed because it does not materially change behavior."

    def _build_optimized_skill(self, frontmatter: str, kept_rules: list[dict], references: list[dict]) -> str:
        lines = []
        if frontmatter:
            lines.append("---")
            lines.extend(frontmatter.splitlines())
            lines.append("---")
            lines.append("")

        lines.append("Review code using the minimum rules needed for correctness, constraints, output quality, and focused references.")
        lines.append("")
        lines.append("## Core Instructions")
        lines.append("")

        for item in kept_rules:
            if "references/" in item["text"].lower():
                continue
            lines.append(f"- {item['text']}")

        if references:
            lines.append("")
            lines.append("## References")
            lines.append("")
            for item in references:
                lines.append(f"- {item['text']}")

        return "\n".join(lines).strip() + "\n"

    @staticmethod
    def _split_frontmatter(content: str) -> tuple[str, str]:
        if not content.startswith("---"):
            return "", content
        parts = content.split("---", 2)
        if len(parts) < 3:
            return "", content
        return parts[1].strip(), parts[2].lstrip("\n")

    @staticmethod
    def _derive_skill_name(skill_path: Path, frontmatter: str) -> str:
        name_match = re.search(r'^name:\s*([^\n]+)$', frontmatter, re.MULTILINE)
        if name_match:
            return name_match.group(1).strip().strip('"\'')

        if skill_path.stem.upper() == 'SKILL':
            return skill_path.parent.name

        return skill_path.stem

    @staticmethod
    def _is_output_rule(lowered: str) -> bool:
        return (
            "output format" in lowered
            or "organize findings by file" in lowered
            or "state the file" in lowered
            or "show a brief before/after" in lowered
            or "prioritized summary" in lowered
            or "skip files with no issues" in lowered
        )

    @staticmethod
    def _is_constraint_rule(lowered: str) -> bool:
        return (
            lowered.startswith("ios ")
            or "target swift" in lowered
            or "avoid uikit" in lowered
            or "third-party frameworks" in lowered
            or "project structure" in lowered
            or "swift concurrency" in lowered
        )

    def _is_actionable_directive(self, lowered: str) -> bool:
        return any(keyword in lowered for keyword in self.DIRECTIVE_KEYWORDS)

    @staticmethod
    def _is_generic_directive(lowered: str) -> bool:
        return (
            lowered.startswith("name the rule")
            or lowered.startswith("state the file")
            or lowered.startswith("show a brief before/after")
            or "project structure" in lowered
        )

    @staticmethod
    def _is_example_or_demo(lowered: str) -> bool:
        return (
            lowered.startswith("**accessibility")
            or lowered.startswith("**deprecated api")
            or lowered.startswith("**data flow")
            or "line 12" in lowered
            or "line 24" in lowered
            or "line 31" in lowered
            or lowered == "end of example."
            or lowered.startswith("line ")
        )

    def _basis_for_mode(self) -> list[dict]:
        mode_note = {
            "strict": "Strict mode keeps more safety and review-structure rules.",
            "balanced": "Balanced mode removes duplication while preserving practical team guidance.",
            "aggressive": "Aggressive mode keeps only the smallest viable rule set for maximum token savings.",
        }[self.mode]

        return self.BASIS + [{"name": f"Mode: {self.mode_config['name']}", "description": mode_note}]

    @staticmethod
    def _build_replacement_path(skill_name: str, replacement_root: str | None) -> str | None:
        if not replacement_root:
            return None
        return str(Path(replacement_root) / skill_name / "SKILL.md")


def trim_skill_file(skill_path: str, output_dir: str, mode: str = "balanced", replacement_root: str | None = None) -> dict:
    return SkillTrimmer(mode=mode).trim(Path(skill_path), Path(output_dir), replacement_root=replacement_root)


def trim_skill_folder(folder_path: str, output_dir: str, mode: str = "balanced", replacement_root: str | None = None) -> dict:
    source_dir = Path(folder_path)
    output_base = Path(output_dir)
    output_base.mkdir(parents=True, exist_ok=True)

    skill_files = sorted(source_dir.rglob("SKILL.md"))
    trimmer = SkillTrimmer(mode=mode)
    reports = []

    for skill_file in skill_files:
        relative_parent = skill_file.parent.relative_to(source_dir)
        target_dir = output_base / relative_parent
        report = trimmer.trim(skill_file, target_dir, replacement_root=replacement_root)
        reports.append({
            "skill_name": report["skill"]["name"],
            "source_path": report["metadata"]["source_path"],
            "optimized_skill_path": report["metadata"]["optimized_skill_path"],
            "replacement_path": report["metadata"].get("replacement_path"),
            "original_rules": report["skill"]["original_rule_count"],
            "optimized_rules": report["skill"]["kept_rule_count"],
            "tokens_saved": report["skill"]["actual_tokens_saved"],
            "token_reduction_pct": report["skill"]["token_reduction_pct"],
            "mode": mode,
        })

    batch_report = {
        "type": "skill_trim_batch_report",
        "metadata": {
            "timestamp": dt.datetime.utcnow().isoformat() + "Z",
            "source_folder": str(source_dir),
            "output_folder": str(output_base),
            "mode": mode,
            "replacement_root": replacement_root,
        },
        "summary": {
            "total_skills": len(reports),
            "total_tokens_saved": sum(item["tokens_saved"] for item in reports),
        },
        "skills": reports,
    }
    (output_base / "skill_trim_batch_report.json").write_text(json.dumps(batch_report, indent=2), encoding="utf-8")
    return batch_report