#!/usr/bin/env node
/**
 * Group TypeScript errors by type for batch fixing
 * Usage: npm run typecheck:group
 */

import { execSync } from 'child_process'
import fs from 'fs'

try {
  let output
  try {
    output = execSync('tsc --noEmit 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
  } catch (error) {
    // tsc returns non-zero exit code when errors exist, but we want the output
    output = error.stdout?.toString() || error.stderr?.toString() || error.message || ''
  }
  const lines = output.split('\n')
  
  const errorsByType = {}
  const errorsByFile = {}
  
  lines.forEach(line => {
    const errorMatch = line.match(/error TS(\d+):/i)
    if (errorMatch) {
      const errorCode = `TS${errorMatch[1]}`
      const fileMatch = line.match(/([^(]+)\((\d+),(\d+)\):/)
      
      if (!errorsByType[errorCode]) {
        errorsByType[errorCode] = []
      }
      
      if (fileMatch) {
        const file = fileMatch[1].trim()
        const lineNum = fileMatch[2]
        
        if (!errorsByFile[file]) {
          errorsByFile[file] = []
        }
        
        const error = {
          file,
          line: lineNum,
          message: line.split(':').slice(3).join(':').trim(),
          code: errorCode
        }
        
        errorsByType[errorCode].push(error)
        errorsByFile[file].push(error)
      }
    }
  })
  
  // Sort by frequency
  const sortedTypes = Object.entries(errorsByType)
    .sort((a, b) => b[1].length - a[1].length)
  
  console.log('\n📊 ERROR BREAKDOWN BY TYPE:\n')
  sortedTypes.forEach(([type, errors]) => {
    console.log(`  ${type}: ${errors.length} errors`)
  })
  
  console.log('\n📁 TOP FILES WITH ERRORS:\n')
  const sortedFiles = Object.entries(errorsByFile)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
  
  sortedFiles.forEach(([file, errors]) => {
    console.log(`  ${file}: ${errors.length} errors`)
  })
  
  // Save detailed report
  const report = {
    summary: {
      totalErrors: lines.filter(l => l.includes('error TS')).length,
      uniqueTypes: Object.keys(errorsByType).length,
      filesAffected: Object.keys(errorsByFile).length
    },
    byType: Object.fromEntries(
      Object.entries(errorsByType).map(([type, errors]) => [
        type,
        {
          count: errors.length,
          files: [...new Set(errors.map(e => e.file))],
          samples: errors.slice(0, 3)
        }
      ])
    ),
    byFile: Object.fromEntries(
      Object.entries(errorsByFile).map(([file, errors]) => [
        file,
        {
          count: errors.length,
          errors: errors.map(e => ({
            line: e.line,
            code: e.code,
            message: e.message
          }))
        }
      ])
    )
  }
  
  fs.writeFileSync('error-report.json', JSON.stringify(report, null, 2))
  console.log('\n✅ Detailed report saved to error-report.json\n')
  
} catch (error) {
  console.error('Error running typecheck:', error.message)
  process.exit(1)
}

