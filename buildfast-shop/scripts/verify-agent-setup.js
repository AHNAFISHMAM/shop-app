#!/usr/bin/env node
/**
 * Verify that all optimization tools are properly set up
 * Usage: npm run verify:setup
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.dirname(__dirname)

const checks = []

// Check tsconfig.json optimizations
const tsconfigPath = path.join(projectRoot, 'tsconfig.json')
if (fs.existsSync(tsconfigPath)) {
  try {
    const content = fs.readFileSync(tsconfigPath, 'utf-8')
    // Check for optimizations using string matching (tsconfig.json allows comments)
    const hasIncremental = /"incremental"\s*:\s*true/.test(content)
    const hasPreserveWatch = /"preserveWatchOutput"\s*:\s*true/.test(content)
    const hasMaxDepth = /"maxNodeModuleJsDepth"\s*:\s*1/.test(content)
    
    checks.push({
      name: 'Incremental compilation',
      passed: hasIncremental,
      fix: 'Add "incremental": true to tsconfig.json'
    })
    checks.push({
      name: 'preserveWatchOutput',
      passed: hasPreserveWatch,
      fix: 'Add "preserveWatchOutput": true to tsconfig.json'
    })
    checks.push({
      name: 'maxNodeModuleJsDepth',
      passed: hasMaxDepth,
      fix: 'Add "maxNodeModuleJsDepth": 1 to tsconfig.json'
    })
  } catch (error) {
    checks.push({
      name: 'tsconfig.json readable',
      passed: false,
      fix: `Cannot read tsconfig.json: ${error.message}`
    })
  }
} else {
  checks.push({
    name: 'tsconfig.json exists',
    passed: false,
    fix: 'Create tsconfig.json'
  })
}

// Check project references
const hasAdminRef = fs.existsSync(path.join(projectRoot, 'tsconfig.admin.json'))
const hasComponentsRef = fs.existsSync(path.join(projectRoot, 'tsconfig.components.json'))
const hasLibRef = fs.existsSync(path.join(projectRoot, 'tsconfig.lib.json'))
checks.push({
  name: 'Project references (admin)',
  passed: hasAdminRef,
  fix: 'Create tsconfig.admin.json'
})
checks.push({
  name: 'Project references (components)',
  passed: hasComponentsRef,
  fix: 'Create tsconfig.components.json'
})
checks.push({
  name: 'Project references (lib)',
  passed: hasLibRef,
  fix: 'Create tsconfig.lib.json'
})

// Check scripts exist
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'))
  const requiredScripts = [
    'typecheck:group',
    'typecheck:by-type',
    'typecheck:by-file',
    'fix:auto',
    'fix:parallel',
    'typecheck:build:watch',
    'typecheck:watch:preserve',
    'fix:type-imports'
  ]

  requiredScripts.forEach(script => {
    checks.push({
      name: `Script: ${script}`,
      passed: packageJson.scripts?.[script] !== undefined,
      fix: `Add "${script}" to package.json scripts`
    })
  })
} catch (error) {
  checks.push({
    name: 'package.json exists',
    passed: false,
    fix: 'Create package.json'
  })
}

// Check helper functions
const helpersExist = fs.existsSync(path.join(projectRoot, 'src/lib/supabase-helpers.ts'))
checks.push({
  name: 'Helper functions (supabase-helpers.ts)',
  passed: helpersExist,
  fix: 'Create src/lib/supabase-helpers.ts with asUpdate/asInsert'
})

// Check pre-commit hook
const preCommitExists = fs.existsSync(path.join(projectRoot, '.husky/pre-commit'))
checks.push({
  name: 'Pre-commit hook',
  passed: preCommitExists,
  fix: 'Run: npx husky init && create .husky/pre-commit'
})

// Check optimization scripts exist
const scriptFiles = [
  'scripts/group-errors.js',
  'scripts/errors-by-file.js',
  'scripts/errors-by-type.js',
  'scripts/auto-fix-common.js',
  'scripts/parallel-fix.js',
  'scripts/convert-type-imports.js'
]

scriptFiles.forEach(script => {
  const scriptPath = path.join(projectRoot, script)
  checks.push({
    name: `Script file: ${script}`,
    passed: fs.existsSync(scriptPath),
    fix: `Create ${script}`
  })
})

// Report results
console.log('\n🔍 Agent Setup Verification\n')
const passed = checks.filter(c => c.passed).length
const total = checks.length

checks.forEach(check => {
  const icon = check.passed ? '✅' : '❌'
  console.log(`${icon} ${check.name}`)
  if (!check.passed) {
    console.log(`   Fix: ${check.fix}`)
  }
})

console.log(`\n📊 Results: ${passed}/${total} checks passed\n`)

if (passed === total) {
  console.log('✅ All optimizations are properly configured!')
  console.log('🚀 Ready for 10-30x faster TypeScript error fixing\n')
  process.exit(0)
} else {
  console.log('⚠️  Some optimizations are missing.')
  console.log('📖 See docs/SPEED_OPTIMIZATIONS.md for setup guide\n')
  process.exit(1)
}

