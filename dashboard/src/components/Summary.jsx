import './Summary.css'

function Summary({ report }) {
  if (!report || !report.summary) {
    return <div>Loading summary...</div>
  }

  const summary = report.summary
  const rulesToKeep = summary.critical_count + summary.helpful_count
  const rulesRemoved = summary.total_rules - rulesToKeep
  const savingsPercent = ((summary.baseline_tokens - rulesToKeep * 30) / summary.baseline_tokens * 100).toFixed(0)

  return (
    <div className="summary">
      <div className="summary-header">
        <h2>Analysis Results</h2>
        <p>Statistical impact of each rule on agent performance</p>
      </div>

      <div className="summary-grid">
        {/* Rules Kept vs Removed */}
        <div className="summary-card">
          <div className="summary-metric">
            <div className="metric-value">
              <span className="value-large">{rulesToKeep}</span>
              <span className="value-slash">/</span>
              <span className="value-large secondary">{summary.total_rules}</span>
            </div>
            <div className="metric-label">Rules to Keep</div>
            <div className="metric-bar">
              <div className="bar-filled" style={{ width: `${(rulesToKeep / summary.total_rules) * 100}%` }}></div>
            </div>
            <div className="metric-subtext">{rulesRemoved} safe to remove</div>
          </div>
        </div>

        {/* Token Savings */}
        <div className="summary-card">
          <div className="summary-metric">
            <div className="metric-value">
              <span className="value-large accent">{savingsPercent}%</span>
            </div>
            <div className="metric-label">Token Savings</div>
            <div className="metric-detail">
              {summary.baseline_tokens.toLocaleString()} →{' '}
              {Math.round(summary.baseline_tokens * (1 - savingsPercent / 100)).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Pass Rate */}
        <div className="summary-card">
          <div className="summary-metric">
            <div className="metric-value">
              <span className="value-large">{summary.baseline_pass_rate.toFixed(1)}%</span>
            </div>
            <div className="metric-label">Baseline Pass Rate</div>
            <div className="metric-detail">With all {summary.total_rules} rules</div>
          </div>
        </div>
      </div>

      {/* Verdict Breakdown */}
      <div className="verdict-breakdown">
        <h3>Rule Breakdown</h3>
        <div className="verdict-grid">
          <div className="verdict-item critical">
            <div className="verdict-count">{summary.critical_count}</div>
            <div className="verdict-label">
              <strong>CRITICAL</strong>
              <span>Never remove</span>
            </div>
          </div>

          <div className="verdict-item helpful">
            <div className="verdict-count">{summary.helpful_count}</div>
            <div className="verdict-label">
              <strong>HELPFUL</strong>
              <span>Keep if cheap</span>
            </div>
          </div>

          <div className="verdict-item prune">
            <div className="verdict-count">{summary.prune_count}</div>
            <div className="verdict-label">
              <strong>PRUNE</strong>
              <span>Safe to remove</span>
            </div>
          </div>

          <div className="verdict-item harmful">
            <div className="verdict-count">{summary.harmful_count}</div>
            <div className="verdict-label">
              <strong>HARMFUL</strong>
              <span>Remove immediately</span>
            </div>
          </div>

          <div className="verdict-item neutral">
            <div className="verdict-count">{summary.total_rules - summary.critical_count - summary.helpful_count - summary.prune_count - summary.harmful_count}</div>
            <div className="verdict-label">
              <strong>NEUTRAL</strong>
              <span>No impact</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Summary
