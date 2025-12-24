#!/usr/bin/env node
/**
 * Parallel file processing for TypeScript error fixes
 * Usage: npm run fix:parallel
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get files with errors
function getFilesWithErrors() {
  try {
    let output
    try {
      output = execSync('tsc --noEmit 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
    } catch (error) {
      output = error.stdout?.toString() || error.stderr?.toString() || error.message || ''
    }
    const lines = output.split('\n')
    const files = new Set()
    
    lines.forEach(line => {
      const fileMatch = line.match(/([^(]+)\((\d+),(\d+)\):/)
      if (fileMatch) {
        const file = fileMatch[1].trim()
        if (file.startsWith('src/')) {
          files.add(path.join(path.dirname(__dirname), file))
        }
      }
    })
    
    const projectRoot = path.dirname(__dirname)
  return Array.from(files).map(f => path.resolve(projectRoot, f))
  } catch (error) {
    return []
  }
}

// Group files into batches
function createBatches(files, batchSize = 4) {
  const batches = []
  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize))
  }
  return batches
}

// Generate fix commands for each batch
function generateFixCommands(batches) {
  const commands = []
  
  batches.forEach((batch, index) => {
    const batchNum = index + 1
    const filesArg = batch.map(f => `"${f}"`).join(' ')
    
    commands.push({
      batch: batchNum,
      files: batch,
      command: `echo "Processing batch ${batchNum}..." && npm run lint:fix -- ${filesArg}`
    })
  })
  
  return commands
}

console.log('🔄 Parallel Fix Strategy\n')

const files = getFilesWithErrors()

if (files.length === 0) {
  console.log('✅ No files with errors found\n')
  process.exit(0)
}

console.log(`Found ${files.length} files with errors\n`)

const batches = createBatches(files, 4)
console.log(`Created ${batches.length} batches (${batches[0].length} files per batch)\n`)

const commands = generateFixCommands(batches)

console.log('📋 BATCH PROCESSING PLAN:\n')
commands.forEach(({ batch, files }) => {
  console.log(`Batch ${batch} (${files.length} files):`)
  files.forEach(file => {
    console.log(`  - ${path.relative(process.cwd(), file)}`)
  })
  console.log()
})

// Save commands to file for manual execution
const scriptContent = commands.map(({ batch, files, command }) => {
  return `# Batch ${batch}\n${command}\n`
}).join('\n')

fs.writeFileSync('parallel-fix-commands.sh', scriptContent)
fs.writeFileSync('parallel-fix-commands.ps1', commands.map(({ batch, files }) => {
  const filesArg = files.map(f => `"${f}"`).join(' ')
  return `# Batch ${batch}\nWrite-Host "Processing batch ${batch}..."; npm run lint:fix -- ${filesArg}`
}).join('\n\n'))

console.log('✅ Generated fix commands:')
console.log('  - parallel-fix-commands.sh (Linux/Mac)')
console.log('  - parallel-fix-commands.ps1 (Windows PowerShell)')
console.log('\n💡 Run these in separate terminals for parallel processing\n')

