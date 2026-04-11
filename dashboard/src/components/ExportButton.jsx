import React from 'react'
import './ExportButton.css'

function ExportButton({ report }) {
  const generateMarkdown = () => {
    if (!report) return ''

    const summary = report.summary
    const rules = report.rules || []

    // Filter: keep only CRITICAL and HELPFUL
    const keepRules = rules.filter(r => r.verdict === 'CRITICAL' || r.verdict === 'HELPFUL')
    const optimizedTokens = keepRules.reduce((sum, r) => sum + (r.original_tokens || 0), 0)
    const tokenSavings = summary.baseline_tokens - optimizedTokens
    const savingsPct = (tokenSavings / summary.baseline_tokens * 100).toFixed(0)

    // Group by section
    const sections = {}
    keepRules.forEach(rule => {
      if (!sections[rule.section]) sections[rule.section] = []
      sections[rule.section].push(rule)
    })

    // Build markdown
    let md = `# AGENTS.md — Optimized by Skill Optimizer\n\n`
    md += `**Original:** ${summary.total_rules} rules / ${summary.baseline_tokens.toLocaleString()} tokens\n\n`
    md += `**Optimized:** ${keepRules.length} rules / ${optimizedTokens.toLocaleString()} tokens (-${savingsPct}%)\n\n`
    md += `**Pass Rate:** ${summary.baseline_pass_rate.toFixed(1)}%\n\n`
    md += `---\n\n`

    Object.entries(sections).forEach(([section, sectionRules]) => {
      md += `## ${section}\n\n`
      sectionRules.forEach(rule => {
        md += `- ${rule.rule_text}\n`
      })
      md += '\n'
    })

    return md
  }

  const handleExport = () => {
    const md = generateMarkdown()
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'AGENTS.optimized.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button className="export-btn" onClick={handleExport} title="Download optimized AGENTS.md">
      📥 Export
    </button>
  )
}

export default ExportButton
