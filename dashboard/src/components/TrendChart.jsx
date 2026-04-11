import './TrendChart.css'

function TrendChart({ reports = [] }) {
  if (reports.length < 2) {
    return (
      <div className="trend-chart">
        <p className="trend-empty">Load multiple reports to see trends</p>
      </div>
    )
  }

  // Sort by date
  const sorted = [...reports].sort((a, b) => 
    new Date(a.metadata?.timestamp) - new Date(b.metadata?.timestamp)
  )

  const maxPassRate = Math.max(...sorted.map(r => r.summary.baseline_pass_rate), 100)
  const minPassRate = Math.min(...sorted.map(r => r.summary.baseline_pass_rate), 0)
  const range = maxPassRate - minPassRate || 1

  return (
    <div className="trend-chart">
      <h3>Performance Trend</h3>
      <div className="chart-container">
        <div className="chart-axis">
          <div className="axis-label">{maxPassRate.toFixed(1)}%</div>
          <div className="axis-label">{((maxPassRate + minPassRate) / 2).toFixed(1)}%</div>
          <div className="axis-label">{minPassRate.toFixed(1)}%</div>
        </div>
        
        <div className="chart-bars">
          {sorted.map((report, idx) => {
            const passRate = report.summary.baseline_pass_rate
            const height = ((passRate - minPassRate) / range * 100)
            const date = new Date(report.metadata?.timestamp)
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            return (
              <div key={idx} className="chart-bar-wrapper">
                <div 
                  className="chart-bar"
                  style={{ height: `${height}%` }}
                  title={`${passRate.toFixed(1)}% on ${label}`}
                >
                  <span className="bar-value">{passRate.toFixed(0)}%</span>
                </div>
                <div className="bar-label">{label}</div>
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="trend-stats">
        <div className="stat">
          <span className="stat-label">Latest</span>
          <span className="stat-value">{sorted[sorted.length - 1]?.summary.baseline_pass_rate.toFixed(1)}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Improvement</span>
          <span className={`stat-value ${sorted[sorted.length - 1].summary.baseline_pass_rate >= sorted[0].summary.baseline_pass_rate ? 'positive' : 'negative'}`}>
            {(sorted[sorted.length - 1].summary.baseline_pass_rate - sorted[0].summary.baseline_pass_rate).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default TrendChart
