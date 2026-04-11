import { useMemo, useState } from 'react'
import './SkillTrimReport.css'

function downloadText(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function RuleList({ title, items, variant }) {
  return (
    <section className={`trim-panel trim-panel-${variant}`}>
      <div className="trim-panel-header">
        <h3>{title}</h3>
        <span>{items.length} rules</span>
      </div>
      <div className="trim-rule-list">
        {items.map((item) => (
          <article key={item.id} className="trim-rule-card">
            <div className="trim-rule-meta">
              <strong>{item.section}</strong>
              <span>{item.tokens} tokens</span>
            </div>
            <p className="trim-rule-text">{item.text}</p>
            <p className="trim-rule-reason">{item.reason}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function SkillTrimReport({ report }) {
  const skill = report.skill
  const originalLines = report.original_content?.split('\n').length || 0
  const optimizedLines = report.optimized_content?.split('\n').length || 0
  const [replacementRoot, setReplacementRoot] = useState('')

  const replacementPath = useMemo(() => {
    if (!replacementRoot.trim()) {
      return report.metadata?.replacement_path || ''
    }
    const root = replacementRoot.replace(/\/$/, '')
    return `${root}/${skill.name}/SKILL.md`
  }, [replacementRoot, report.metadata, skill.name])

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      window.alert('Failed to copy to clipboard.')
    }
  }

  const handleDownloadOptimized = () => {
    downloadText(`${skill.name}.optimized.md`, report.optimized_content, 'text/markdown')
  }

  const handleDownloadReport = () => {
    downloadText('skill_trim_report.json', JSON.stringify(report, null, 2), 'application/json')
  }

  return (
    <div className="skill-trim-report">
      <section className="trim-hero">
        <div>
          <p className="eyebrow">Skill Optimizer</p>
          <h2>Bare minimum rules for an open-source skill</h2>
          <p className="trim-subtitle">
            The trimmer keeps only rules that materially change implementation, review quality, or output usability.
          </p>
          <p className="trim-subtitle">
            Source: <strong>{report.metadata?.source_path}</strong> · Mode: <strong>{report.metadata?.mode || 'balanced'}</strong>
          </p>
        </div>
        <div className="trim-actions">
          <button className="primary-btn" onClick={handleDownloadOptimized}>Download optimized skill</button>
          <button className="secondary-btn" onClick={handleDownloadReport}>Download comparison report</button>
        </div>
      </section>

      <section className="trim-basis">
        <div className="section-heading">
          <h3>Replacement helper</h3>
          <p>Use this if your team wants to drop the optimized file back into an agent repo quickly.</p>
        </div>
        <div className="replacement-helper">
          <input
            className="replacement-input"
            value={replacementRoot}
            onChange={(event) => setReplacementRoot(event.target.value)}
            placeholder="/repo/.github/skills"
          />
          <button className="secondary-btn" onClick={() => copyText(replacementPath || `${skill.name}/SKILL.md`)}>Copy replacement path</button>
          <button
            className="secondary-btn"
            onClick={() => copyText(`cp ${report.metadata?.optimized_skill_path || `${skill.name}.optimized.md`} ${replacementPath || `${skill.name}/SKILL.md`}`)}
          >
            Copy replacement command
          </button>
        </div>
        <p className="trim-subtitle">
          Suggested path: <strong>{replacementPath || `${skill.name}/SKILL.md`}</strong>
        </p>
      </section>

      <section className="trim-summary-grid">
        <article className="trim-stat">
          <span>Original</span>
          <strong>{skill.original_rule_count} rules</strong>
          <small>{skill.original_tokens} estimated tokens</small>
        </article>
        <article className="trim-stat trim-stat-success">
          <span>Optimized</span>
          <strong>{skill.kept_rule_count} rules</strong>
          <small>{skill.optimized_tokens} estimated tokens</small>
        </article>
        <article className="trim-stat trim-stat-warning">
          <span>Removed</span>
          <strong>{skill.removed_rule_count} rules</strong>
          <small>{skill.actual_tokens_saved} tokens saved ({skill.token_reduction_pct}% reduction)</small>
        </article>
        <article className="trim-stat">
          <span>Comparison</span>
          <strong>{originalLines} → {optimizedLines} lines</strong>
          <small>original vs optimized file size</small>
        </article>
      </section>

      <section className="trim-basis">
        <div className="section-heading">
          <h3>Trimming basis</h3>
          <p>This is the decision framework used to keep or remove rules.</p>
        </div>
        <div className="basis-grid">
          {report.basis.map((item) => (
            <article key={item.name} className="basis-card">
              <strong>{item.name}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="trim-comparison">
        <div className="section-heading">
          <h3>Rule-by-rule comparison</h3>
          <p>Every removed rule includes the basis for removal so teams can review the tradeoff.</p>
        </div>
        <div className="trim-panels">
          <RuleList title="Kept" items={report.kept_rules} variant="keep" />
          <RuleList title="Removed" items={report.removed_rules} variant="remove" />
        </div>
      </section>

      <section className="trim-preview-grid">
        <article className="preview-card">
          <div className="preview-header">
            <h3>Original skill</h3>
            <span>{skill.original_rule_count} rules</span>
          </div>
          <pre>{report.original_content}</pre>
        </article>
        <article className="preview-card preview-card-optimized">
          <div className="preview-header">
            <h3>Optimized skill</h3>
            <span>{skill.kept_rule_count} rules</span>
          </div>
          <pre>{report.optimized_content}</pre>
        </article>
      </section>

      <section className="trim-basis">
        <div className="section-heading">
          <h3>How to use the optimized skill</h3>
          <p>Download the optimized file, replace the current skill in your agent, then validate with real prompts before rolling it out wider.</p>
        </div>
      </section>
    </div>
  )
}

export default SkillTrimReport