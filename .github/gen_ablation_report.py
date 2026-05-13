import json
from pathlib import Path

reports = list(Path('results').glob('*_report.json')) + list(Path('results').glob('report.json'))

lines = ['## 🤖 Skill Optimizer', '', 'Real ablation testing - verify behavioral equivalence', '']

for report_path in reports:
    try:
        with open(report_path) as f:
            d = json.load(f)

        name = report_path.stem.replace('_report', '')
        lines.extend(['---', '', f'### 📊 {name}', ''])

        # Summary stats
        baseline = d.get('baseline', {})
        ablated = d.get('ablated', {})
        rules = d.get('rules', [])

        kept = [r for r in rules if r.get('verdict') in ['CRITICAL', 'HELPFUL']]
        pruned = [r for r in rules if r.get('verdict') in ['PRUNE', 'NEUTRAL']]

        lines.extend([
            f'**Rules tested:** {len(rules)}',
            f'**Kept:** {len(kept)} (affect behavior)',
            f'**Pruned:** {len(pruned)}',
            ''
        ])

        if kept:
            lines.append('#### Kept Rules (affect behavior)')
            for r in kept[:10]:
                text = r.get('rule_text', '')[:80]
                verdict = r.get('verdict', '')
                roi = r.get('roi', 0)
                lines.append(f"- {text}")
                lines.append(f"  - **{verdict}** (ROI: {roi:.2f})")
            lines.append('')

        if pruned:
            lines.append('#### Pruned Rules (no test impact)')
            for r in pruned[:10]:
                text = r.get('rule_text', '')[:80]
                lines.append(f"- {text}")
            lines.append('')

        opt_content = d.get('optimized_content', '')
        if opt_content:
            lines.extend(['', '### 📄 Optimized Skill', '', '```markdown', opt_content[:2000], '```'])

    except Exception as e:
        print(f'Error: {e}')

lines.extend(['', '---', '',
    '📦 **How to use:** Verify with test prompts before deploying.',
    '⚡ By [@therahulgoel](https://github.com/therahulgoel)'])

with open('pr_comment.md', 'w') as f:
    f.write('\n'.join(lines))