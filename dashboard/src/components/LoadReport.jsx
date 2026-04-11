import { useRef, useState } from 'react'
import './LoadReport.css'
import { buildSkillTrimReport } from '../utils/skillTrim'

function LoadReport({ onFileLoad, error, savedReports = [], onOpenSavedReport, onClearSavedReports }) {
  const reportInputRef = useRef(null)
  const skillInputRef = useRef(null)
  const [skillText, setSkillText] = useState('')
  const [skillName, setSkillName] = useState('SKILL.md')
  const [mode, setMode] = useState('balanced')
  const [replacementRoot, setReplacementRoot] = useState('')

  const handleReportSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result)
        if (data.type === 'skill_trim_report' || (data.summary && data.rules)) {
          onFileLoad(data)
        } else {
          alert('Invalid report format. Expected skill_trim_report.json or report.json.')
        }
      } catch (err) {
        alert('Failed to parse JSON: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const handleSkillSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result
      if (typeof content !== 'string') {
        alert('Failed to read skill file.')
        return
      }

      setSkillName(file.name)
      setSkillText(content)
      onFileLoad(buildSkillTrimReport(content, file.name, mode, replacementRoot))
    }
    reader.readAsText(file)
  }

  const triggerReportSelect = () => {
    reportInputRef.current?.click()
  }

  const triggerSkillSelect = () => {
    skillInputRef.current?.click()
  }

  const optimizePastedSkill = () => {
    if (!skillText.trim()) {
      alert('Paste a SKILL.md first.')
      return
    }
    onFileLoad(buildSkillTrimReport(skillText, skillName || 'SKILL.md', mode, replacementRoot))
  }

  return (
    <div className="load-report">
      <div className="load-report-box">
        <div className="load-report-icon">✂️</div>
        <h2>Optimize any skill</h2>
        <p>Start from an existing skill, a new draft, or a saved comparison report. No default sample is shown until you choose one.</p>

        {error && (
          <div className="load-report-error">
            {error}
          </div>
        )}

        <div className="trim-options-box">
          <div className="option-group">
            <label htmlFor="trim-mode">Trim mode</label>
            <select id="trim-mode" className="trim-select" value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="strict">Strict</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
          <div className="option-group option-group-wide">
            <label htmlFor="replacement-root">Replacement root (optional)</label>
            <input
              id="replacement-root"
              className="skill-name-input"
              value={replacementRoot}
              onChange={(event) => setReplacementRoot(event.target.value)}
              placeholder="/repo/.github/skills"
            />
          </div>
        </div>

        <div className="load-actions">
          <button className="load-btn" onClick={triggerSkillSelect}>
            Upload SKILL.md
          </button>
          <button className="secondary-load-btn" onClick={triggerReportSelect}>
            Load report.json
          </button>
        </div>

        <input
          ref={reportInputRef}
          type="file"
          accept=".json"
          onChange={handleReportSelect}
          style={{ display: 'none' }}
        />

        <input
          ref={skillInputRef}
          type="file"
          accept=".md,text/markdown,.txt"
          onChange={handleSkillSelect}
          style={{ display: 'none' }}
        />

        <div className="paste-skill-box">
          <div className="paste-skill-header">
            <h4>Paste a new skill you want to trim</h4>
            <input
              className="skill-name-input"
              value={skillName}
              onChange={(event) => setSkillName(event.target.value)}
              placeholder="SKILL.md"
            />
          </div>
          <textarea
            className="skill-textarea"
            value={skillText}
            onChange={(event) => setSkillText(event.target.value)}
            placeholder="Paste a complete SKILL.md here, then click Optimize pasted skill."
          />
          <button className="load-btn optimize-btn" onClick={optimizePastedSkill}>
            Optimize pasted skill
          </button>
        </div>

        {savedReports.length > 0 && (
          <div className="saved-reports-box">
            <div className="saved-reports-header">
              <h4>Recent skill reports</h4>
              <button className="saved-clear-btn" onClick={onClearSavedReports}>Clear</button>
            </div>
            <div className="saved-reports-list">
              {savedReports.map((item) => (
                <button key={item.id} className="saved-report-item" onClick={() => onOpenSavedReport(item.id)}>
                  <strong>{item.name}</strong>
                  <span>{item.mode} mode</span>
                  <span>{item.tokensSaved} tokens saved</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="load-report-hint">
          <h4>How teams use this</h4>
          <p>1. Upload an existing `SKILL.md` already used by your agent, or paste a new skill draft before adding it.</p>
          <p>2. Review what was kept, removed, and how many tokens were saved.</p>
          <p>3. Download the optimized skill and replace or add it in your agent setup.</p>
          <p>4. If you are creating a new skill, paste the draft here first and add only the minimized version to your repo.</p>
          <code>skill-optimizer trim-skill --skill /path/to/SKILL.md --output results/</code>
        </div>
      </div>
    </div>
  )
}

export default LoadReport
