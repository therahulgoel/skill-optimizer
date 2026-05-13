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
  const [githubUrl, setGithubUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [detectedSkills, setDetectedSkills] = useState([])
  const [selectedSkill, setSelectedSkill] = useState('')

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

  const handleGithubUrl = async () => {
    if (!githubUrl.trim()) {
      alert('Enter a GitHub URL first.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      let rawUrl = githubUrl.trim()
      let skillName = 'skill'
      let isRepoUrl = false

      // Convert github.com URL to raw URL if needed
      if (rawUrl.includes('github.com/') && !rawUrl.includes('raw.githubusercontent.com')) {
        if (rawUrl.includes('/blob/')) {
          // Direct file link - use as is
          rawUrl = rawUrl.replace('github.com/', 'raw.githubusercontent.com/').replace('/blob/', '/')
        } else if (rawUrl.includes('/tree/')) {
          // It's a repo tree URL
          const parts = rawUrl.split('github.com/')[1].split('/tree/')
          if (parts.length >= 2) {
            const [owner, repo, tree, branch = 'main'] = parts
            rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/SKILL.md`
            skillName = parts.slice(2).join('/') || repo
            isRepoUrl = true
          }
        } else {
          // Plain repo URL - try main branch
          const match = rawUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
          if (match) {
            rawUrl = `https://raw.githubusercontent.com/${match[1]}/${match[2]}/main/SKILL.md`
            skillName = match[2]
            isRepoUrl = true
          }
        }
      }

      // For repo URLs, detect available skills in various folder structures
      const folderNames = ['skills', 'agents', '.github', 'instructions', 'copilot-skills']
      if (isRepoUrl) {
        const match = rawUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/) || rawUrl.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)/)
        if (match) {
          const owner = match[1]
          const repo = match[2]

          // Try each folder name
          for (var f = 0; f < folderNames.length; f++) {
            var folder = folderNames[f]
            var contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folder}`
            try {
              var resp = await fetch(contentsUrl)
              if (resp.ok) {
                var data = await resp.json()
                var items = Array.isArray(data) ? data : []
                var skills = []
                for (var i = 0; i < items.length; i++) {
                  var item = items[i]
                  var name = item.name
                  var type = item.type
                  // For folders, check if they contain SKILL.md or AGENTS.md
                  if (type === 'file' && (name === 'SKILL.md' || name === 'AGENTS.md' || name === 'CLAUDE.md')) {
                    skills.push(folder)
                    break
                  } else if (type === 'dir' && name && name !== '.DS_Store' && name !== '.git') {
                    skills.push(name)
                  }
                }
                if (skills.length > 0) {
                  setDetectedSkills(skills)
                  setSelectedSkill('')
                  setErrorMsg(`Found ${skills.length} items in /${folder}. Select one.`)
                  setLoading(false)
                  return
                }
              }
            } catch (e) {
              continue
            }
          }

          // Also check for root level SKILL.md / AGENTS.md / CLAUDE.md
          var rootFiles = ['SKILL.md', 'AGENTS.md', 'CLAUDE.md']
          for (var r = 0; r < rootFiles.length; r++) {
            var checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${rootFiles[r]}`
            try {
              var resp = await fetch(checkUrl)
              if (resp.ok) {
                setDetectedSkills([rootFiles[r]])
                setSelectedSkill(rootFiles[r])
                setErrorMsg(`Found ${rootFiles[r]} at root. Click Load.`)
                setLoading(false)
                return
              }
            } catch (e) {
              continue
            }
          }
        }
      }

      // Try multiple paths for direct files
      const ownerRepo = rawUrl.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)/)
      var owner = ownerRepo ? ownerRepo[1] : ''
      var repo = ownerRepo ? ownerRepo[2] : ''

      var pathsToTry = isRepoUrl ? [
        rawUrl.replace('/SKILL.md', '/skills/SKILL.md'),
        rawUrl.replace('/SKILL.md', '/AGENTS.md'),
        rawUrl.replace('/SKILL.md', '/CLAUDE.md'),
        rawUrl.replace('/SKILL.md', '/agents/SKILL.md')
      ] : [rawUrl]

      let content = null
      let usedPath = null

      for (const url of pathsToTry) {
        try {
          const response = await fetch(url)
          if (response.ok) {
            content = await response.text()
            usedPath = url
            break
          }
        } catch (e) {
          continue
        }
      }

      if (!content) {
        throw new Error('No SKILL.md found. Try a direct URL to a specific skill file.')
      }

      if (!content.trim()) {
        throw new Error('Empty file - no content found.')
      }

      // Extract skill name from path
      const urlParts = usedPath.split('/')
      skillName = urlParts[urlParts.length - 3] || skillName
      if (skillName === 'main') {
        skillName = urlParts[urlParts.length - 2] || 'skill'
      }

      onFileLoad(buildSkillTrimReport(content, skillName, mode, replacementRoot))
    } catch (err) {
      const msg = err.message || 'Failed to fetch from GitHub'
      setErrorMsg(msg)
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSkillFromDropdown = async () => {
    if (!selectedSkill || !githubUrl.trim()) {
      alert('Select a skill first.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/) || githubUrl.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)/)
      if (!match) {
        throw new Error('Invalid repo URL')
      }

      var owner = match[1]
      var repo = match[2]
      var branch = 'main'
      var rawUrl = ''

      // Check if it's a root file (SKILL.md, AGENTS.md, CLAUDE.md)
      if (selectedSkill === 'SKILL.md' || selectedSkill === 'AGENTS.md' || selectedSkill === 'CLAUDE.md') {
        rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${selectedSkill}`
      } else {
        // Try skills folder with various file names
        var fileNames = ['SKILL.md', 'AGENTS.md', 'CLAUDE.md']
        for (var f = 0; f < fileNames.length; f++) {
          var testUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/skills/${selectedSkill}/${fileNames[f]}`
          var resp = await fetch(testUrl)
          if (resp.ok) {
            rawUrl = testUrl
            break
          }
          // Try agents folder
          testUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/agents/${selectedSkill}/${fileNames[f]}`
          resp = await fetch(testUrl)
          if (resp.ok) {
            rawUrl = testUrl
            break
          }
          // Try instructions folder
          testUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/instructions/${selectedSkill}/${fileNames[f]}`
          resp = await fetch(testUrl)
          if (resp.ok) {
            rawUrl = testUrl
            break
          }
        }

        // If still no url, try without subfolder
        if (!rawUrl) {
          rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${selectedSkill}/SKILL.md`
        }
      }

      var response = await fetch(rawUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch. Try a different selection.')
      }

      var content = await response.text()
      onFileLoad(buildSkillTrimReport(content, selectedSkill, mode, replacementRoot))
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch')
      alert(err.message)
    } finally {
      setLoading(false)
    }
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

        <div className="github-url-box">
          <div className="github-url-header">
            <h4>Or enter a GitHub repo URL</h4>
          </div>
          <div className="github-url-row">
            <input
              className="github-url-input"
              value={githubUrl}
              onChange={(event) => { setGithubUrl(event.target.value); setDetectedSkills([]); }}
              placeholder="https://github.com/user/repo"
              onKeyDown={(e) => e.key === 'Enter' && handleGithubUrl()}
            />
            <button
              className="load-btn fetch-btn"
              onClick={handleGithubUrl}
              disabled={loading}
            >
              {loading ? '...' : 'Fetch'}
            </button>
          </div>
          {detectedSkills.length > 0 && (
            <div className="skill-dropdown-row">
              <select
                className="skill-select"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
              >
                <option value="">Select a skill...</option>
                {detectedSkills.map(function(s) {
                  return <option key={s} value={s}>{s}</option>
                })}
              </select>
              <button
                className="load-btn fetch-btn"
                onClick={handleSkillFromDropdown}
                disabled={!selectedSkill || loading}
              >
                Load
              </button>
            </div>
          )}
          <p className="github-url-hint">
            Enter a repo URL to list and load available skills from its /skills folder
          </p>
        </div>

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
