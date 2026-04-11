import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import './EnhancedSummary.css'

function EnhancedSummary({ report }) {
  if (!report) return null

  const summary = report.summary || {}

  // Prepare data for verdict breakdown
  const verdictData = [
    { name: 'CRITICAL', value: summary.critical_count, fill: '#10b981' },
    { name: 'HELPFUL', value: summary.helpful_count, fill: '#f59e0b' },
    { name: 'NEUTRAL', value: summary.neutral_count || 0, fill: '#e5e7eb' },
    { name: 'PRUNE', value: summary.prune_count, fill: '#ef4444' },
    { name: 'HARMFUL', value: summary.harmful_count, fill: '#6b7280' },
  ].filter((item) => item.value > 0)
  const totalVerdicts = verdictData.reduce((sum, item) => sum + item.value, 0)

  // Calculate savings
  const baselineTokens = summary.baseline_tokens || 0
  const criticalHelpfulTokens = (report.rules || [])
    .filter((r) => r.verdict === 'CRITICAL' || r.verdict === 'HELPFUL')
    .reduce((sum, r) => sum + (r.original_tokens || 0), 0)
  const tokensSaved = baselineTokens - criticalHelpfulTokens
  const savingsPercent =
    baselineTokens > 0 ? ((tokensSaved / baselineTokens) * 100).toFixed(1) : 0

  // Cost calculation (GPT-4: ~$0.03 per 1K tokens)
  const costPerThousandTokens = 0.03
  const baselineCost = (baselineTokens / 1000) * costPerThousandTokens
  const optimizedCost = (criticalHelpfulTokens / 1000) * costPerThousandTokens
  const costSaved = baselineCost - optimizedCost

  // Prepare data for token reduction chart
  const tokenData = [
    { name: 'Original', tokens: baselineTokens },
    { name: 'Optimized', tokens: criticalHelpfulTokens },
  ]

  // Calculate savings by section
  const savingsBySection = {}
  ;(report.rules || []).forEach((rule) => {
    if (!savingsBySection[rule.section]) {
      savingsBySection[rule.section] = 0
    }
    if (rule.verdict === 'CRITICAL' || rule.verdict === 'HELPFUL') {
      savingsBySection[rule.section] += rule.original_tokens
    }
  })

  const sectionData = Object.entries(savingsBySection).map(([section, tokens]) => ({
    name: section.length > 15 ? section.substring(0, 12) + '...' : section,
    fullName: section,
    tokens,
  }))

  return (
    <div className="enhanced-summary">
      <div className="summary-header-enhanced">
        <h1>Skill Optimizer Analysis Dashboard</h1>
        <p className="summary-subtitle">
          Optimize your AGENTS.md by identifying which rules actually help
        </p>
      </div>

      {/* Top Metrics */}
      <div className="metrics-grid">
        <div className="metric-card metric-primary">
          <div className="metric-icon">📝</div>
          <div className="metric-content">
            <div className="metric-value">{summary.total_rules}</div>
            <div className="metric-label">Rules Analyzed</div>
          </div>
        </div>
        <div className="metric-card metric-success">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-value">{summary.baseline_pass_rate.toFixed(1)}%</div>
            <div className="metric-label">Baseline Pass Rate</div>
          </div>
        </div>
        <div className="metric-card metric-highlight">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <div className="metric-value">{savingsPercent}%</div>
            <div className="metric-label">Token Savings</div>
          </div>
        </div>
        <div className="metric-card metric-savings">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-value">${costSaved.toFixed(2)}</div>
            <div className="metric-label">Cost Saved (GPT-4)</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-row">
        {/* Token Reduction Chart */}
        <div className="chart-container chart-large">
          <h3>📉 Token Usage Reduction</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tokenData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                }}
                formatter={(value) => value.toLocaleString()}
              />
              <Bar dataKey="tokens" fill="#667eea" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-footer">
            <p>
              <strong>{baselineTokens.toLocaleString()}</strong> → 
              <strong> {criticalHelpfulTokens.toLocaleString()}</strong>
            </p>
            <p className="savings-text">💾 Save {tokensSaved.toLocaleString()} tokens!</p>
          </div>
        </div>

        {/* Verdict Breakdown */}
        <div className="chart-container chart-medium">
          <h3>🎯 Verdict Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={verdictData}
                cx="50%"
                cy="50%"
                label={false}
                labelLine={false}
                innerRadius={45}
                outerRadius={78}
                fill="#8884d8"
                dataKey="value"
              >
                {verdictData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, payload) => {
                  const pct = totalVerdicts
                    ? ((payload.payload.value / totalVerdicts) * 100).toFixed(1)
                    : '0.0'
                  return [`${value} (${pct}%)`, payload.payload.name]
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="verdict-legend-grid">
            {verdictData.map((item) => {
              const pct = totalVerdicts ? ((item.value / totalVerdicts) * 100).toFixed(1) : '0.0'
              return (
                <div className="verdict-legend-item" key={item.name}>
                  <span className="verdict-dot" style={{ backgroundColor: item.fill }} />
                  <span className="verdict-name">{item.name}</span>
                  <span className="verdict-pct">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Verdict Summary Cards */}
      <div className="verdict-grid">
        <div className="verdict-card verdict-critical">
          <div className="verdict-emoji">✅</div>
          <div className="verdict-number">{summary.critical_count}</div>
          <div className="verdict-title">CRITICAL</div>
          <div className="verdict-desc">Must keep - high impact</div>
        </div>
        <div className="verdict-card verdict-helpful">
          <div className="verdict-emoji">👍</div>
          <div className="verdict-number">{summary.helpful_count}</div>
          <div className="verdict-title">HELPFUL</div>
          <div className="verdict-desc">Good to keep</div>
        </div>
        <div className="verdict-card verdict-neutral">
          <div className="verdict-emoji">➖</div>
          <div className="verdict-number">{summary.neutral_count || 0}</div>
          <div className="verdict-title">NEUTRAL</div>
          <div className="verdict-desc">No measurable impact</div>
        </div>
        <div className="verdict-card verdict-prune">
          <div className="verdict-emoji">🗑️</div>
          <div className="verdict-number">{summary.prune_count}</div>
          <div className="verdict-title">PRUNE</div>
          <div className="verdict-desc">Safe to remove</div>
        </div>
        <div className="verdict-card verdict-harmful">
          <div className="verdict-emoji">⚠️</div>
          <div className="verdict-number">{summary.harmful_count}</div>
          <div className="verdict-title">HARMFUL</div>
          <div className="verdict-desc">Actively hurting</div>
        </div>
      </div>

      {/* Savings by Section */}
      {sectionData.length > 0 && (
        <div className="chart-container chart-fullwidth">
          <h3>📊 Token Savings by Section</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, sectionData.length * 35)}>
            <BarChart data={sectionData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                }}
                formatter={(value) => value.toLocaleString() + ' tokens'}
              />
              <Bar dataKey="tokens" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cost Analysis */}
      <div className="cost-analysis-enhanced">
        <h2>💰 Cost Analysis (GPT-4 Pricing)</h2>
        <div className="cost-breakdown">
          <div className="cost-item baseline">
            <div className="cost-icon">📈</div>
            <div className="cost-label">Baseline Cost</div>
            <div className="cost-value">${baselineCost.toFixed(2)}</div>
          </div>
          <div className="cost-arrow">→</div>
          <div className="cost-item optimized">
            <div className="cost-icon">✨</div>
            <div className="cost-label">Optimized Cost</div>
            <div className="cost-value">${optimizedCost.toFixed(2)}</div>
          </div>
          <div className="cost-arrow">=</div>
          <div className="cost-item saving">
            <div className="cost-icon">💡</div>
            <div className="cost-label">Savings</div>
            <div className="cost-value">${costSaved.toFixed(2)}</div>
          </div>
        </div>

        <div className="savings-projection">
          <h3>Projected Savings at Scale</h3>
          <div className="projection-grid">
            <div className="projection-item">
              <div className="projection-frequency">100/day</div>
              <div className="projection-amount">${(costSaved * 100).toFixed(2)}</div>
              <div className="projection-period">per day</div>
            </div>
            <div className="projection-item">
              <div className="projection-frequency">1,000/day</div>
              <div className="projection-amount">${(costSaved * 1000).toFixed(2)}</div>
              <div className="projection-period">per day</div>
            </div>
            <div className="projection-item highlight">
              <div className="projection-frequency">30,000/month</div>
              <div className="projection-amount">${(costSaved * 30000).toFixed(2)}</div>
              <div className="projection-period">per month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="insights-section">
        <h2>🔍 Key Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-title">Most Valuable Rules</div>
            <p>
              {summary.critical_count} rules are CRITICAL and account for most of the baseline
              functionality.
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-title">Optimization Opportunity</div>
            <p>
              Remove {summary.prune_count} PRUNE rule(s) to save {tokensSaved.toLocaleString()} tokens without
              affecting quality.
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-title">ROI Metric</div>
            <p>
              Rules are ranked by ROI = (pass_delta × 3) - token_delta. Higher ROI = better
              value.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedSummary
