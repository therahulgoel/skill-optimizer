import json
from pathlib import Path

reports = list(Path('results').glob('skill_trim_report.json'))
lines = ['## 🤖 Skill Optimizer', '', 'Minimize existing agent skills to the smallest usable rule set.']

for report_path in reports:
    try:
        with open(report_path) as f:
            d = json.load(f)
        skill = d.get('skill', {})
        name = skill.get('name', report_path.stem)
        desc = skill.get('description', '')[:60]
        orig = skill.get('original_rule_count', 0)
        orig_t = skill.get('original_tokens', 0)
        kept = skill.get('kept_rule_count', 0)
        kept_t = skill.get('optimized_tokens', 0)
        saved = skill.get('actual_tokens_saved', 0)
        pct = skill.get('token_reduction_pct', 0)
        mode = d.get('metadata', {}).get('mode', 'balanced')

        lines.extend(['---', '', f'### 📊 {name}'])
        if desc:
            lines.append(f'_{desc}_')
        lines.extend([f'**Mode:** {mode}  ·  **Savings:** {pct:.1f}%', '',
            '| Original | Optimized | Removed | Savings |',
            '|--------|--------|--------|--------|',
            f'| {orig} rules, {orig_t} tokens | {kept} rules, {kept_t} tokens | {orig - kept} rules | {saved} tokens |',
            '', '### 📄 Optimized Skill', ''])

        opt = d.get('optimized_content', '')
        if opt:
            lines.extend(['```markdown', opt, '```'])
    except Exception as e:
        print(f'Error: {e}')

lines.extend(['', '---', '',
    '📦 **How to use:** Replace skill in your agent, test, then deploy.',
    '⚡ By [@therahulgoel](https://github.com/therahulgoel)'])

with open('pr_comment.md', 'w') as f:
    f.write('\n'.join(lines))