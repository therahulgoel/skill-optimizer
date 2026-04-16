# Skill Optimizer

Trim and minimize `SKILL.md` and `AGENTS.md` files — reduce token costs and simplify agent skills.

![Dashboard preview](docs/images/dashboard-screenshot.png)

Why use Skill Optimizer?
- Save tokens: smaller skills reduce prompt size and model cost.
- Safer edits: reviewable keep/remove decisions with reasons.
- Team-ready: batch mode, replacement helpers, and consistent modes.

Quick start

CLI (fast)

User-level install (recommended)

Install for the current user (adds the `skill-optimizer` console script to your user `bin`):

```bash
# Using `python3` (recommended)
python3 -m pip install --upgrade pip setuptools wheel
python3 -m pip install --user .

# Ensure the user `bin` directory is on your PATH (works on macOS and Linux):
echo 'export PATH="$(python3 -m site --user-base)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Or using `pip`/`pip3`:

```bash
pip install --user .        # or `pip3 install --user .`
```

Optional: install with `pipx` for isolated, per-user CLI installs:

```bash
python3 -m pip install --user pipx
python3 -m pipx ensurepath   # reopen your shell if needed
pipx install .
```

Editable / development install (from repo root)

```bash
python3 -m pip install --upgrade pip setuptools wheel
python3 -m pip install -e .
```

Run the CLI:

```bash
skill-optimizer trim-skill --skill /path/to/SKILL.md --output results/ --mode balanced
```

Run without installing (useful for development):

```bash
python3 -m cli.main trim-skill --skill /path/to/SKILL.md --output results/ --mode balanced
```

Dashboard (visual):
```bash
# optional: copy a sample report for quick preview
cp results/skill_trim_report.json dashboard/public/skill_trim_report.json
cd dashboard
npm install
npm run dev
# open http://localhost:3000
```

Notes
- Modes: `strict`, `balanced` (default), `aggressive`.
- Batch: `trim-folder --skills-dir path --output results/ --mode balanced`.
- See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for examples and advanced usage.

License: MIT — see [LICENSE](LICENSE)

Made with ❤️ by [@therahulgoel](https://github.com/therahulgoel)

