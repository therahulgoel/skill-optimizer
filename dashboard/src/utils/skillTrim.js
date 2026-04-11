const BASE_BASIS = [
  {
    name: 'Actionable directives',
    description: 'Keep explicit instructions that change implementation or review behavior.',
  },
  {
    name: 'Runtime and platform constraints',
    description: 'Keep deployment target, language version, framework restrictions, and compatibility assumptions.',
  },
  {
    name: 'Output requirements',
    description: 'Keep only the formatting rules needed to make the output usable by teams.',
  },
  {
    name: 'Reference preservation',
    description: 'Keep unique reference files because they are reusable, but drop duplicate or explanatory reference bullets.',
  },
  {
    name: 'Remove examples and editorial text',
    description: 'Drop sample findings, before/after demonstrations, and narrative text because they add context size but not operational value.',
  },
]

const DIRECTIVE_KEYWORDS = [
  'ensure',
  'validate',
  'must',
  'avoid',
  'prefer',
  'should',
  'target',
  'use',
  'never',
  'always',
  'focus',
  'require',
  'organize',
  'state the file',
  'show a brief',
  'do not',
]

const MODE_CONFIG = {
  strict: {
    label: 'Strict',
    keepProjectStructure: true,
    keepReviewProcessSteps: true,
    keepGenericDirectives: true,
  },
  balanced: {
    label: 'Balanced',
    keepProjectStructure: true,
    keepReviewProcessSteps: false,
    keepGenericDirectives: true,
  },
  aggressive: {
    label: 'Aggressive',
    keepProjectStructure: false,
    keepReviewProcessSteps: false,
    keepGenericDirectives: false,
  },
}

function splitFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { frontmatter: '', body: content }
  }

  const parts = content.split('---', 3)
  if (parts.length < 3) {
    return { frontmatter: '', body: content }
  }

  return {
    frontmatter: parts[1].trim(),
    body: parts[2].replace(/^\n+/, ''),
  }
}

function estimateTokens(text) {
  return Math.max(1, Math.floor(text.trim().split(/\s+/).filter(Boolean).length / 2))
}

function parseRules(body) {
  const lines = body.split('\n')
  let currentSection = 'General'
  let counter = 1
  const rules = []

  lines.forEach((line) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('##')) {
      currentSection = trimmed.replace(/^##+/, '').trim() || 'General'
      return
    }

    if (trimmed.startsWith('- ')) {
      const text = trimmed.slice(2).trim()
      rules.push({
        id: `rule_${String(counter).padStart(3, '0')}`,
        text,
        section: currentSection,
        tokens: estimateTokens(text),
      })
      counter += 1
      return
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s+/, '').trim()
      rules.push({
        id: `rule_${String(counter).padStart(3, '0')}`,
        text,
        section: currentSection,
        tokens: estimateTokens(text),
      })
      counter += 1
    }
  })

  return rules
}

function deriveSkillName(fileName, frontmatter) {
  const match = frontmatter.match(/^name:\s*([^\n]+)$/m)
  if (match) {
    return match[1].trim().replace(/^['"]|['"]$/g, '')
  }

  if (!fileName) {
    return 'optimized-skill'
  }

  const baseName = fileName.replace(/\.[^.]+$/, '')
  if (baseName.toUpperCase() === 'SKILL') {
    return 'skill'
  }
  return baseName
}

function isOutputRule(text) {
  return (
    text.includes('output format')
    || text.includes('organize findings by file')
    || text.includes('state the file')
    || text.includes('show a brief before/after')
    || text.includes('prioritized summary')
    || text.includes('skip files with no issues')
  )
}

function isConstraintRule(text) {
  return (
    text.startsWith('ios ')
    || text.includes('target swift')
    || text.includes('avoid uikit')
    || text.includes('third-party frameworks')
    || text.includes('project structure')
    || text.includes('swift concurrency')
  )
}

function isActionableDirective(text) {
  return DIRECTIVE_KEYWORDS.some((keyword) => text.includes(keyword))
}

function isExampleOrDemo(text) {
  return (
    text.startsWith('**accessibility')
    || text.startsWith('**deprecated api')
    || text.startsWith('**data flow')
    || text.includes('line 12')
    || text.includes('line 24')
    || text.includes('line 31')
    || text === 'end of example.'
    || text.startsWith('line ')
  )
}

function isGenericDirective(text) {
  return (
    text.startsWith('name the rule')
    || text.startsWith('state the file')
    || text.startsWith('show a brief before/after')
    || text.includes('project structure')
  )
}

function classifyRule(section, text, mode) {
  const lowered = text.trim().toLowerCase()
  const loweredSection = section.trim().toLowerCase()
  const config = MODE_CONFIG[mode] || MODE_CONFIG.balanced

  if (isExampleOrDemo(lowered)) {
    return ['remove', 'Example or sample output removed to reduce context size.']
  }

  if (lowered.includes('references/') && loweredSection === 'references') {
    return ['keep-reference', 'Unique reference file retained for targeted deep review.']
  }

  if (lowered.includes('references/')) {
    if (config.keepReviewProcessSteps) {
      return ['keep', 'Review-process step retained in strict mode for extra guidance.']
    }
    return ['remove', 'Review-process step removed because the same source is already covered by the compact references list.']
  }

  if (isOutputRule(lowered)) {
    return ['keep', 'Output-format rule retained because teams need consistent, usable review output.']
  }

  if (isConstraintRule(lowered)) {
    if (lowered.includes('project structure') && !config.keepProjectStructure) {
      return ['remove', 'Project-structure guidance removed in aggressive mode to keep only hard constraints.']
    }
    return ['keep', 'Platform or framework constraint retained because it changes implementation decisions.']
  }

  if (isActionableDirective(lowered)) {
    if (!config.keepGenericDirectives && isGenericDirective(lowered)) {
      return ['remove', 'Generic directive removed in aggressive mode to maximize token savings.']
    }
    return ['keep', 'Actionable directive retained because it changes what the reviewer should check.']
  }

  return ['remove', 'Low-signal editorial content removed because it does not materially change behavior.']
}

function buildOptimizedSkill(frontmatter, keptRules, references) {
  const lines = []

  if (frontmatter) {
    lines.push('---')
    lines.push(...frontmatter.split('\n'))
    lines.push('---')
    lines.push('')
  }

  lines.push('Review code using the minimum rules needed for correctness, constraints, output quality, and focused references.')
  lines.push('')
  lines.push('## Core Instructions')
  lines.push('')

  keptRules.forEach((rule) => {
    if (rule.text.toLowerCase().includes('references/')) {
      return
    }
    lines.push(`- ${rule.text}`)
  })

  if (references.length > 0) {
    lines.push('')
    lines.push('## References')
    lines.push('')
    references.forEach((rule) => {
      lines.push(`- ${rule.text}`)
    })
  }

  return `${lines.join('\n').trim()}\n`
}

function buildBasis(mode) {
  const note = {
    strict: 'Strict mode keeps more review-structure guidance to reduce the chance of removing something teams still depend on.',
    balanced: 'Balanced mode removes duplication while preserving practical team guidance.',
    aggressive: 'Aggressive mode keeps only the smallest viable rule set for maximum token savings.',
  }

  return [
    ...BASE_BASIS,
    {
      name: `Mode: ${MODE_CONFIG[mode]?.label || MODE_CONFIG.balanced.label}`,
      description: note[mode] || note.balanced,
    },
  ]
}

function buildReplacementPath(skillName, replacementRoot) {
  if (!replacementRoot?.trim()) {
    return null
  }
  const root = replacementRoot.replace(/\/$/, '')
  return `${root}/${skillName}/SKILL.md`
}

export function buildSkillTrimReport(content, fileName = 'SKILL.md', mode = 'balanced', replacementRoot = '') {
  const { frontmatter, body } = splitFrontmatter(content)
  const skillName = deriveSkillName(fileName, frontmatter)
  const rules = parseRules(body)
  const keptRules = []
  const removedRules = []
  const references = []
  const seenReferences = new Set()

  rules.forEach((rule) => {
    const [decision, reason] = classifyRule(rule.section, rule.text, mode)
    const entry = {
      ...rule,
      reason,
    }

    if (decision === 'keep-reference') {
      if (seenReferences.has(rule.text)) {
        removedRules.push({ ...entry, reason: 'Duplicate reference entry removed.' })
        return
      }
      seenReferences.add(rule.text)
      references.push(entry)
      keptRules.push(entry)
      return
    }

    if (decision === 'keep') {
      keptRules.push(entry)
      return
    }

    removedRules.push(entry)
  })

  const originalTokens = rules.reduce((sum, rule) => sum + rule.tokens, 0)
  const optimizedTokens = keptRules.reduce((sum, rule) => sum + rule.tokens, 0)
  const actualTokensSaved = originalTokens - optimizedTokens
  const tokenReductionPct = originalTokens > 0
    ? Number(((actualTokensSaved / originalTokens) * 100).toFixed(1))
    : 0
  const optimizedContent = buildOptimizedSkill(frontmatter, keptRules, references)
  const replacementPath = buildReplacementPath(skillName, replacementRoot)

  return {
    type: 'skill_trim_report',
    metadata: {
      timestamp: new Date().toISOString(),
      source_path: fileName,
      optimized_skill_path: `${skillName}.optimized.md`,
      generated_in: 'dashboard',
      mode,
      replacement_path: replacementPath,
    },
    skill: {
      name: skillName,
      original_rule_count: rules.length,
      kept_rule_count: keptRules.length,
      removed_rule_count: removedRules.length,
      original_tokens: originalTokens,
      optimized_tokens: optimizedTokens,
      actual_tokens_saved: actualTokensSaved,
      token_reduction_pct: tokenReductionPct,
    },
    basis: buildBasis(mode),
    kept_rules: keptRules,
    removed_rules: removedRules,
    original_content: content,
    optimized_content: optimizedContent,
  }
}