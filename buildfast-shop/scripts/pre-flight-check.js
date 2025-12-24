#!/usr/bin/env node
/**
 * Pre-flight check for Multi-Agent execution
 * Verifies all prerequisites are met before starting
 * Usage: npm run preflight:check
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.dirname(__dirname)

const checks = []
let allPassed = true

console.log('🔍 Pre-Flight Check for Multi-Agent Execution\n')

// Check 1: Agent files exist
console.log('1️⃣ Checking agent configuration files...')
for (let i = 1; i <= 8; i++) {
  const agentFile = path.join(projectRoot, `.agent-${i}.json`)
  const exists = fs.existsSync(agentFile)
  checks.push({ name: `.agent-${i}.json`, passed: exists })
  if (!exists) {
    console.log(`   ❌ Missing .agent-${i}.json`)
    allPassed = false
  } else {
    console.log(`   ✅ Found .agent-${i}.json`)
  }
}

// Check 2: Required scripts exist
console.log('\n2️⃣ Checking npm scripts...')
const requiredScripts = [
  'verify:setup',
  'typecheck:by-type',
  'typecheck:by-file',
  'fix:auto',
  'fix:type-imports',
  'typecheck:watch:preserve'
]

try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
  )
  const scripts = packageJson.scripts || {}
  
  requiredScripts.forEach(script => {
    const exists = script in scripts
    checks.push({ name: `npm run ${script}`, passed: exists })
    if (!exists) {
      console.log(`   ❌ Missing script: ${script}`)
      allPassed = false
    } else {
      console.log(`   ✅ Found script: ${script}`)
    }
  })
} catch (error) {
  console.log(`   ❌ Error reading package.json: ${error.message}`)
  allPassed = false
}

// Check 3: Helper functions exist
console.log('\n3️⃣ Checking helper functions...')
const helperFile = path.join(projectRoot, 'src/lib/supabase-helpers.ts')
const helperExists = fs.existsSync(helperFile)
checks.push({ name: 'supabase-helpers.ts', passed: helperExists })

if (!helperExists) {
  console.log('   ❌ Missing src/lib/supabase-helpers.ts')
  allPassed = false
} else {
  const helperContent = fs.readFileSync(helperFile, 'utf-8')
  const hasAsUpdate = helperContent.includes('asUpdate')
  const hasAsInsert = helperContent.includes('asInsert')
  
  if (!hasAsUpdate || !hasAsInsert) {
    console.log('   ⚠️  Missing asUpdate or asInsert functions')
    allPassed = false
  } else {
    console.log('   ✅ Helper functions found')
  }
}

// Check 4: Documentation files
console.log('\n4️⃣ Checking documentation...')
const docs = [
  'docs/MULTI_AGENT_PROMPT_READY.md',
  'docs/HOW_TO_USE_MULTI_AGENT.md',
  'docs/AGENT_QUICK_REFERENCE.md'
]

docs.forEach(doc => {
  const docPath = path.join(projectRoot, doc)
  const exists = fs.existsSync(docPath)
  checks.push({ name: doc, passed: exists })
  if (!exists) {
    console.log(`   ⚠️  Missing: ${doc}`)
  } else {
    console.log(`   ✅ Found: ${doc}`)
  }
})

// Check 5: Git repository
console.log('\n5️⃣ Checking git repository...')
try {
  execSync('git rev-parse --git-dir', { cwd: projectRoot, stdio: 'ignore' })
  console.log('   ✅ Git repository found')
  checks.push({ name: 'Git repository', passed: true })
} catch {
  console.log('   ⚠️  Not a git repository (worktrees may not work)')
  checks.push({ name: 'Git repository', passed: false })
}

// Check 6: TypeScript configuration
console.log('\n6️⃣ Checking TypeScript configuration...')
const tsconfigPath = path.join(projectRoot, 'tsconfig.json')
if (fs.existsSync(tsconfigPath)) {
  console.log('   ✅ tsconfig.json found')
  checks.push({ name: 'tsconfig.json', passed: true })
} else {
  console.log('   ❌ Missing tsconfig.json')
  allPassed = false
  checks.push({ name: 'tsconfig.json', passed: false })
}

// Summary
console.log('\n' + '='.repeat(50))
console.log('📊 Pre-Flight Check Summary')
console.log('='.repeat(50))

const passed = checks.filter(c => c.passed).length
const total = checks.length

console.log(`\n✅ Passed: ${passed}/${total}`)
console.log(`❌ Failed: ${total - passed}/${total}\n`)

if (allPassed) {
  console.log('🎉 All checks passed! Ready for Multi-Agent execution.')
  console.log('\n📋 Next Steps:')
  console.log('   1. Open Cursor Multi-Agents mode')
  console.log('   2. Copy docs/MULTI_AGENT_PROMPT_READY.md')
  console.log('   3. Paste into Multi-Agents chat')
  console.log('   4. Execute and monitor progress\n')
  process.exit(0)
} else {
  console.log('⚠️  Some checks failed. Please fix issues before proceeding.')
  console.log('\n💡 Quick Fixes:')
  console.log('   - Run: npm run setup:agents')
  console.log('   - Run: npm install')
  console.log('   - Verify all scripts exist in package.json\n')
  process.exit(1)
}

