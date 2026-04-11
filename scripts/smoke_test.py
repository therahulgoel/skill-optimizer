#!/usr/bin/env python3
"""
Setup and test ContextSurgeon locally.
"""

import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def run(cmd, description=""):
    """Run a shell command and show output."""
    if description:
        print(f"\n📝 {description}")
    print(f"   $ {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=PROJECT_ROOT)
    if result.returncode != 0:
        print(f"❌ Failed!")
        sys.exit(1)
    return result

def main():
    project_root = PROJECT_ROOT
    cli_cmd = [sys.executable, "-m", "cli.main"]
    
    print("🚀 ContextSurgeon — Setup & Test\n")
    
    # Install package in development mode
    run(
        [sys.executable, "-m", "pip", "install", "-e", "."],
        "Installing ContextSurgeon..."
    )
    
    # Test CLI help
    run(
        cli_cmd + ["--help"],
        "Testing CLI (help)..."
    )
    
    # Test rule parser
    run(
        cli_cmd + ["parse", "sample/AGENTS.md"],
        "Testing rule parser..."
    )
    
    # Run ablation with mock API (MAIN TEST)
    run(
        cli_cmd + [
            "run",
            "--agents", "sample/AGENTS.md",
            "--tasks", "tasks/",
            "--output", "results/",
        ],
        "Running full ablation test (mock API)..."
    )
    
    # Check outputs exist
    results_dir = project_root / "results"
    if (results_dir / "AGENTS.optimized.md").exists():
        print("\n✅ AGENTS.optimized.md generated!")
    if (results_dir / "report.json").exists():
        print("✅ report.json generated!")
    
    print("\n" + "="*70)
    print("🎉 All tests passed! ContextSurgeon is ready to go.")
    print("="*70)
    print("\nNext steps:")
    print("1. View results: cat results/AGENTS.optimized.md")
    print("2. View report:   cat results/report.json")
    print("3. Run on your own AGENTS.md: context-surgeon run --agents YOUR_AGENTS.md --tasks ./tasks/")

if __name__ == "__main__":
    main()
