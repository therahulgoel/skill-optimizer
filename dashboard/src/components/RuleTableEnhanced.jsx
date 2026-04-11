import { useState } from 'react'
import './RuleTableEnhanced.css'

const VERDICT_COLORS = {
  CRITICAL: { bg: '#ecfdf5', border: '#10b981', text: '#047857', badge: '✅' },
  HELPFUL: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309', badge: '👍' },
  NEUTRAL: { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280', badge: '➖' },
  PRUNE: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', badge: '🗑️' },
  HARMFUL: { bg: '#f3f4f6', border: '#6b7280', text: '#374151', badge: '⚠️' },
}

function RuleTableEnhanced({ report }) {
  const [sortBy, setSortBy] = useState('roi')
  const [sortAsc, setSortAsc] = useState(false)

  if (!report || !report.rules) return null

  const rules = [...report.rules]

  // Sort rules
  rules.sort((a, b) => {
    let aVal = a[sortBy] ?? 0
    let bVal = b[sortBy] ?? 0

    if (sortBy === 'rule_text') {
      aVal = String(aVal).toLowerCase()
      bVal = String(bVal).toLowerCase()
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal
    }

    return 0
  })

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc)
    } else {
      setSortBy(column)
      setSortAsc(false)
    }
  }

  const getSortIndicator = (column) => {
    if (sortBy !== column) return ' ⇅'
    return sortAsc ? ' ↑' : ' ↓'
  }

  return (
    <div className="rule-table-enhanced">
      <div className="table-header">
        <h2>📋 Detailed Rule Analysis</h2>
        <p className="table-subtitle">
          Ranked by ROI (pass_delta × 3 - token_delta). Click column headers to sort.
        </p>
      </div>

      <div className="table-wrapper">
        <table className="rules-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('rank')} className="sortable">
                Rank{getSortIndicator('rank')}
              </th>
              <th onClick={() => handleSort('rule_text')} className="sortable">
                Rule Text{getSortIndicator('rule_text')}
              </th>
              <th onClick={() => handleSort('section')} className="sortable">
                Section{getSortIndicator('section')}
              </th>
              <th onClick={() => handleSort('verdict')} className="sortable">
                Verdict{getSortIndicator('verdict')}
              </th>
              <th onClick={() => handleSort('pass_delta')} className="sortable number-col">
                Pass Δ{getSortIndicator('pass_delta')}
              </th>
              <th onClick={() => handleSort('token_delta')} className="sortable number-col">
                Tokens Δ{getSortIndicator('token_delta')}
              </th>
              <th onClick={() => handleSort('roi')} className="sortable number-col highlight">
                ROI{getSortIndicator('roi')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, idx) => {
              const colors = VERDICT_COLORS[rule.verdict] || VERDICT_COLORS.NEUTRAL
              const passDelta = rule.pass_delta ?? 0
              const tokenDelta = rule.token_delta ?? 0
              const roi = rule.roi ?? 0

              return (
                <tr key={idx} className="rule-row" style={{ '--verdict-color': colors.border }}>
                  <td className="rank-cell">{rule.rank}</td>
                  <td className="rule-text-cell" title={rule.rule_text}>
                    {rule.rule_text.length > 50
                      ? rule.rule_text.substring(0, 47) + '...'
                      : rule.rule_text}
                  </td>
                  <td className="section-cell">
                    <span className="section-badge">{rule.section}</span>
                  </td>
                  <td className="verdict-cell">
                    <span
                      className="verdict-badge"
                      style={{
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    >
                      {colors.badge} {rule.verdict}
                    </span>
                  </td>
                  <td
                    className={`number-cell ${passDelta > 0 ? 'positive' : passDelta < 0 ? 'negative' : ''}`}
                  >
                    {passDelta > 0 ? '+' : ''}
                    {passDelta}%
                  </td>
                  <td
                    className={`number-cell ${tokenDelta < 0 ? 'positive' : tokenDelta > 0 ? 'negative' : ''}`}
                  >
                    {tokenDelta > 0 ? '+' : ''}
                    {tokenDelta}
                  </td>
                  <td
                    className={`number-cell roi-cell ${roi > 0 ? 'positive' : roi < 0 ? 'negative' : ''}`}
                  >
                    <span className="roi-value">{roi > 0 ? '+' : ''}{roi.toFixed(1)}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p className="legend">
          <strong>Pass Δ:</strong> Change in pass rate (%) when rule is removed
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>Tokens Δ:</strong> Change in token count when rule is removed
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>ROI:</strong> Value score (higher = more valuable)
        </p>
      </div>
    </div>
  )
}

export default RuleTableEnhanced
