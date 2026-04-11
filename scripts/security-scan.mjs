import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const includeRoots = ['app', 'server', 'nuxt.config.ts']
const ignoreDirectories = new Set(['node_modules', '.nuxt', '.output', '.git', 'coverage', 'dist'])
const allowedFiles = new Set([
  'app/utils/payments.ts'
])

function isLikelyPan(value) {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) {
    return false
  }

  let checksum = 0
  let shouldDouble = false

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index])
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    checksum += digit
    shouldDouble = !shouldDouble
  }

  return checksum % 10 === 0
}

function visit(path, results) {
  const stats = statSync(path)
  if (stats.isDirectory()) {
    const name = path.split(/[\\/]/).at(-1) || ''
    if (ignoreDirectories.has(name)) {
      return
    }
    for (const entry of readdirSync(path)) {
      visit(join(path, entry), results)
    }
    return
  }

  if (!/\.(ts|vue|js|json|md|yml|yaml)$/i.test(path)) {
    return
  }

  const relPath = relative(root, path).replace(/\\/g, '/')
  const content = readFileSync(path, 'utf8')
  const lines = content.split(/\r?\n/)

  if (!allowedFiles.has(relPath)) {
    const panPattern = /\b(?:\d[ -]?){13,19}\b/g
    lines.forEach((line, index) => {
      const matches = line.match(panPattern) || []
      for (const match of matches) {
        if (isLikelyPan(match)) {
          results.push(`${relPath}:${index + 1}: Possible PAN literal detected -> ${match}`)
        }
      }
    })
  }

  lines.forEach((line, index) => {
    const normalized = line.toLowerCase()
    if (
      normalized.includes('console.log')
      && (
        normalized.includes('card')
        || normalized.includes('cvv')
        || normalized.includes('token')
        || normalized.includes('confirmation_token')
      )
    ) {
      results.push(`${relPath}:${index + 1}: Suspicious console log with financial terms`)
    }
  })
}

const findings = []

for (const target of includeRoots) {
  visit(join(root, target), findings)
}

if (findings.length > 0) {
  console.error('Financial data security scan failed:')
  for (const finding of findings) {
    console.error(`- ${finding}`)
  }
  process.exit(1)
}

console.log('Financial data security scan passed.')
