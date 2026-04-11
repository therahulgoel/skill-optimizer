import { useState, useEffect } from 'react'
import './App.css'
import EnhancedSummary from './components/EnhancedSummary'
import RuleTableEnhanced from './components/RuleTableEnhanced'
import LoadReport from './components/LoadReport'
import ExportButton from './components/ExportButton'
import TrendChart from './components/TrendChart'
import SkillTrimReport from './components/SkillTrimReport'

function AppContent() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [trendReports, setTrendReports] = useState([])
  const [savedReports, setSavedReports] = useState([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('skill-optimizer-reports')
      if (!raw) {
        return
      }
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setSavedReports(parsed)
      }
    } catch (err) {
      setError('Could not load saved dashboard reports.')
    }
  }, [])

  const handleFileLoad = (data) => {
    setReport(data)
    setError(null)
    if (data.type === 'skill_trim_report') {
      const entry = {
        id: `${data.skill.name}-${data.metadata.timestamp}`,
        name: data.skill.name,
        timestamp: data.metadata.timestamp,
        mode: data.metadata.mode || 'balanced',
        tokensSaved: data.skill.actual_tokens_saved,
        report: data,
      }
      const next = [entry, ...savedReports.filter((item) => item.id !== entry.id)].slice(0, 12)
      setSavedReports(next)
      window.localStorage.setItem('skill-optimizer-reports', JSON.stringify(next))
    }
    if (data.metadata?.timestamp && data.summary) {
      setTrendReports([...trendReports, data])
    }
  }

  const openSavedReport = (savedReportId) => {
    const selected = savedReports.find((item) => item.id === savedReportId)
    if (selected) {
      setReport(selected.report)
      setError(null)
    }
  }

  const clearSavedReports = () => {
    setSavedReports([])
    window.localStorage.removeItem('skill-optimizer-reports')
  }

  const goHome = () => {
    setReport(null)
    setError(null)
  }

  const isSkillTrimReport = report?.type === 'skill_trim_report'

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Skill Optimizer</h1>
            <p>Minimize existing agent skills to the smallest usable rule set and measure token savings.</p>
          </div>
          <div className="header-actions">
            {report && <button className="nav-btn" onClick={goHome}>Home</button>}
            {report && !isSkillTrimReport && <ExportButton report={report} />}
          </div>
        </div>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading">⏳ Loading report...</div>
        ) : report ? (
          isSkillTrimReport ? (
            <SkillTrimReport report={report} />
          ) : (
            <>
              <EnhancedSummary report={report} />
              {trendReports.length > 0 && <TrendChart reports={trendReports} />}
              <RuleTableEnhanced report={report} />
            </>
          )
        ) : (
          <LoadReport
            onFileLoad={handleFileLoad}
            error={error}
            savedReports={savedReports}
            onOpenSavedReport={openSavedReport}
            onClearSavedReports={clearSavedReports}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Generate a `skill_trim_report.json`, compare original vs optimized rules, then replace the skills already used by your agent.</p>
      </footer>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App
