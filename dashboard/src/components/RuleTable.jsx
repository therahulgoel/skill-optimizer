import { useState } from 'react'
import RuleCard from './RuleCard'
import './RuleTable.css'

function RuleTable({ rules = [], selectedRule, onSelectRule }) {
  const [sortKey, setSortKey] = useState('roi')
  const [sortDir, setSortDir] = useState('desc')
  const [filterVerdict, setFilterVerdict] = useState('all')
  const [searchText, setSearchText] = useState('')

  // Filter and sort rules
  let filteredRules = rules.filter(rule => {
    if (filterVerdict !== 'all' && rule.verdict !== filterVerdict) return false
    if (searchText && !rule.rule_text.toLowerCase().includes(searchText.toLowerCase())) {
      return false
    }
    return true
  })

  filteredRules.sort((a, b) => {
    let aVal = a[sortKey]
    let bVal = b[sortKey]

    // Handle numeric comparisons
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    }

    // String comparisons
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
    }

    return 0
  })

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const getVerdictColor = (verdict) => {
    const colors = {
      CRITICAL: '#22c55e',
      HELPFUL: '#eab308',
      PRUNE: '#ef4444',
      HARMFUL: '#ec4899',
      NEUTRAL: '#9ca3af',
    }
    return colors[verdict] || '#667eea'
  }

  return (
    <div className="rule-table-container">
      <div className="table-header">
        <h2>Rule Impact Analysis</h2>
        <p>Click on any rule to see detailed metrics and task impact breakdown</p>
      </div>

      {/* Filters */}
      <div className="table-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search rules..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterVerdict === 'all' ? 'active' : ''}`}
            onClick={() => setFilterVerdict('all')}
          >
            All Rules ({rules.length})
          </button>
          <button
            className={`filter-btn critical ${filterVerdict === 'CRITICAL' ? 'active' : ''}`}
            onClick={() => setFilterVerdict('CRITICAL')}
          >
            🟢 Critical
          </button>
          <button
            className={`filter-btn helpful ${filterVerdict === 'HELPFUL' ? 'active' : ''}`}
            onClick={() => setFilterVerdict('HELPFUL')}
          >
            🟡 Helpful
          </button>
          <button
            className={`filter-btn prune ${filterVerdict === 'PRUNE' ? 'active' : ''}`}
            onClick={() => setFilterVerdict('PRUNE')}
          >
            🔴 Prune
          </button>
          <button
            className={`filter-btn harmful ${filterVerdict === 'HARMFUL' ? 'active' : ''}`}
            onClick={() => setFilterVerdict('HARMFUL')}
          >
            🔴 Harmful
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="rules-list">
        {filteredRules.length === 0 ? (
          <div className="no-rules">No rules match your filters</div>
        ) : (
          filteredRules.map((rule, idx) => (
            <RuleCard
              key={rule.rule_id}
              rule={rule}
              isSelected={selectedRule?.rule_id === rule.rule_id}
              onSelect={onSelectRule}
              verdictColor={getVerdictColor(rule.verdict)}
            />
          ))
        )}
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        Showing {filteredRules.length} of {rules.length} rules
      </div>
    </div>
  )
}

export default RuleTable
