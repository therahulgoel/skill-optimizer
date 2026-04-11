import { useState } from 'react'
import './RuleCard.css'

function RuleCard({ rule, isSelected, onSelect, verdictColor }) {
  const [expanded, setExpanded] = useState(isSelected)

  const toggleExpand = () => {
    setExpanded(!expanded)
    onSelect(expanded ? null : rule)
  }

  const getVerdictEmoji = (verdict) => {
    const emojis = {
      CRITICAL: '🟢',
      HELPFUL: '🟡',
      PRUNE: '🔴',
      HARMFUL: '🔴',
      NEUTRAL: '⚪',
    }
    return emojis[verdict] || '○'
  }

  const getVerdictLabel = (verdict) => {
    const labels = {
      CRITICAL: 'Never remove',
      HELPFUL: 'Keep if cheap',
      PRUNE: 'Safe to remove',
      HARMFUL: 'Remove immediately',
      NEUTRAL: 'No impact',
    }
    return labels[verdict] || verdict
  }

  return (
    <div className={`rule-card ${isSelected ? 'expanded' : ''}`}>
      <div className="rule-header" onClick={toggleExpand}>
        <div className="rule-header-left">
          <div className="rule-verdict" style={{ borderColor: verdictColor }}>
            <span className="verdict-emoji">{getVerdictEmoji(rule.verdict)}</span>
            <span className="verdict-text">{rule.verdict}</span>
          </div>
          <div className="rule-text-container">
            <div className="rule-text">{rule.rule_text}</div>
            <div className="rule-section">{rule.section}</div>
          </div>
        </div>

        <div className="rule-header-right">
          <div className="metric-value-metric">
            <div className="metric-label">ROI</div>
            <div className={`metric-number ${rule.roi > 0 ? 'positive' : 'negative'}`}>
              {rule.roi > 0 ? '+' : ''}{rule.roi.toFixed(1)}
            </div>
          </div>
          <div className="metric-value-metric">
            <div className="metric-label">Pass Δ</div>
            <div className={`metric-number ${rule.pass_delta > 0 ? 'positive' : rule.pass_delta < 0 ? 'negative' : 'neutral'}`}>
              {rule.pass_delta > 0 ? '+' : ''}{rule.pass_delta.toFixed(1)}%
            </div>
          </div>
          <div className="metric-value-metric">
            <div className="metric-label">Tokens</div>
            <div className={`metric-number ${rule.token_delta < 0 ? 'positive' : rule.token_delta > 0 ? 'negative' : 'neutral'}`}>
              {rule.token_delta > 0 ? '+' : ''}{rule.token_delta}
            </div>
          </div>
          <div className="expand-icon">{expanded ? '▼' : '▶'}</div>
        </div>
      </div>

      {expanded && (
        <div className="rule-details">
          <div className="details-section">
            <h4>Rule Details</h4>
            <div className="detail-row">
              <span className="detail-label">Rule ID:</span>
              <span className="detail-value">{rule.rule_id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Section:</span>
              <span className="detail-value">{rule.section}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Original Tokens:</span>
              <span className="detail-value">{rule.original_tokens}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Verdict:</span>
              <span className="detail-value detail-verdict">
                <span className="verdict-inline">{getVerdictEmoji(rule.verdict)} {rule.verdict}</span>
                <span className="verdict-hint">({getVerdictLabel(rule.verdict)})</span>
              </span>
            </div>
          </div>

          <div className="details-section">
            <h4>Impact Metrics</h4>
            <div className="metrics-grid">
              <div className="metric-box">
                <div className="metric-name">Pass Rate Baseline</div>
                <div className="metric-large">{rule.baseline_pass_rate.toFixed(1)}%</div>
              </div>
              <div className="metric-box">
                <div className="metric-name">Pass Rate Ablated</div>
                <div className="metric-large">{rule.ablated_pass_rate.toFixed(1)}%</div>
              </div>
              <div className="metric-box">
                <div className="metric-name">Pass Delta</div>
                <div className={`metric-large ${rule.pass_delta > 0 ? 'positive' : rule.pass_delta < 0 ? 'negative' : 'neutral'}`}>
                  {rule.pass_delta > 0 ? '+' : ''}{rule.pass_delta.toFixed(1)}%
                </div>
              </div>
              <div className="metric-box">
                <div className="metric-name">Token Delta</div>
                <div className={`metric-large ${rule.token_delta < 0 ? 'positive' : rule.token_delta > 0 ? 'negative' : 'neutral'}`}>
                  {rule.token_delta > 0 ? '+' : ''}{rule.token_delta}
                </div>
              </div>
              <div className="metric-box">
                <div className="metric-name">ROI Score</div>
                <div className={`metric-large ${rule.roi > 0 ? 'positive' : 'negative'}`}>
                  {rule.roi > 0 ? '+' : ''}{rule.roi.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h4>Interpretation</h4>
            <div className="interpretation">
              {rule.verdict === 'CRITICAL' && (
                <p>
                  <strong>This rule is critical.</strong> Removing it causes a <strong>{Math.abs(rule.pass_delta).toFixed(1)}% drop</strong> in pass rate.
                  Keep this rule always.
                </p>
              )}
              {rule.verdict === 'HELPFUL' && (
                <p>
                  <strong>This rule is helpful.</strong> Removing it causes a <strong>{Math.abs(rule.pass_delta).toFixed(1)}% drop</strong> in pass rate,
                  but the impact is more modest. Keep it if the token cost is justified.
                </p>
              )}
              {rule.verdict === 'PRUNE' && (
                <p>
                  <strong>Safe to prune.</strong> Removing this rule has{' '}
                  <strong>no measurable impact on pass rate</strong>, but it costs{' '}
                  <strong>{Math.abs(rule.token_delta)} tokens</strong>. Consider removing it.
                </p>
              )}
              {rule.verdict === 'HARMFUL' && (
                <p>
                  <strong>This rule is harmful.</strong> Removing it actually <strong>improves pass rate by {rule.pass_delta.toFixed(1)}%</strong>.
                  Remove this rule immediately.
                </p>
              )}
              {rule.verdict === 'NEUTRAL' && (
                <p>
                  <strong>No statistical impact.</strong> This rule neither helps nor hurts agent performance.
                  Remove it or delegate to linting tools (ESLint, etc.).
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RuleCard
