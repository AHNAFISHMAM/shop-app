#!/usr/bin/env node
/**
 * Group TypeScript errors by file for parallel processing
 * Usage: npm run typecheck:by-file
 */

import { execSync } from 'child_process'

try {
  let output
  try {
    output = execSync('tsc --noEmit 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
  } catch (error) {
    output = error.stdout?.toString() || error.stderr?.toString() || error.message || ''
  }
  const lines = output.split('\n')
  
  const errorsByFile = {}
  
  lines.forEach(line => {
    const fileMatch = line.match(/([^(]+)\((\d+),(\d+)\):/)
    if (fileMatch) {
      const file = fileMatch[1].trim()
      const lineNum = fileMatch[2]
      const errorMatch = line.match(/error TS(\d+):/i)
      
      if (errorMatch) {
        if (!errorsByFile[file]) {
          errorsByFile[file] = []
        }
        
        errorsByFile[file].push({
          line: lineNum,
          code: `TS${errorMatch[1]}`,
          message: line.split(':').slice(3).join(':').trim()
        })
      }
    }
  })
  
  // Sort by error count
  const sortedFiles = Object.entries(errorsByFile)
    .sort((a, b) => b[1].length - a[1].length)
  
  console.log('\n📁 ERRORS BY FILE (sorted by count):\n')
  sortedFiles.forEach(([file, errors]) => {
    console.log(`\n${file} (${errors.length} errors):`)
    errors.forEach(err => {
      console.log(`  Line ${err.line}: ${err.code} - ${err.message.substring(0, 80)}`)
    })
  })
  
  // Group files for parallel processing (3-5 files per batch)
  console.log('\n\n🔄 PARALLEL PROCESSING GROUPS:\n')
  const batchSize = 4
  for (let i = 0; i < sortedFiles.length; i += batchSize) {
    const batch = sortedFiles.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    console.log(`\nBatch ${batchNum} (${batch.length} files):`)
    batch.forEach(([file]) => {
      console.log(`  - ${file}`)
    })
  }
  
} catch (error) {
  console.error('Error running typecheck:', error.message)
  process.exit(1)
}

