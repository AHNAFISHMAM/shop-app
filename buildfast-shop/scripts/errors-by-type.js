#!/usr/bin/env node
/**
 * Group TypeScript errors by error code for batch fixing
 * Usage: npm run typecheck:by-type
 */

import { execSync } from 'child_process'

// Error code descriptions and fix strategies
const errorInfo = {
  'TS2322': { 
    desc: 'Type mismatch', 
    strategy: 'Add type assertions or fix type definitions',
    priority: 1 
  },
  'TS2345': { 
    desc: 'Argument type mismatch', 
    strategy: 'Fix function parameters or add type guards',
    priority: 2 
  },
  'TS6133': { 
    desc: 'Unused variable', 
    strategy: 'Remove or prefix with _',
    priority: 5 
  },
  'TS7006': { 
    desc: 'Implicit any', 
    strategy: 'Add explicit type annotations',
    priority: 3 
  },
  'TS18046': { 
    desc: 'Null/undefined check', 
    strategy: 'Add type guards or optional chaining',
    priority: 4 
  },
  'TS2339': { 
    desc: 'Property does not exist', 
    strategy: 'Add property to type or use type assertion',
    priority: 2 
  },
  'TS7053': { 
    desc: 'Index signature missing', 
    strategy: 'Add index signature to type',
    priority: 3 
  }
}

try {
  let output
  try {
    output = execSync('tsc --noEmit 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
  } catch (error) {
    output = error.stdout?.toString() || error.stderr?.toString() || error.message || ''
  }
  const lines = output.split('\n')
  
  const errorsByType = {}
  
  lines.forEach(line => {
    const errorMatch = line.match(/error TS(\d+):/i)
    if (errorMatch) {
      const errorCode = `TS${errorMatch[1]}`
      const fileMatch = line.match(/([^(]+)\((\d+),(\d+)\):/)
      
      if (!errorsByType[errorCode]) {
        errorsByType[errorCode] = []
      }
      
      if (fileMatch) {
        errorsByType[errorCode].push({
          file: fileMatch[1].trim(),
          line: fileMatch[2],
          message: line.split(':').slice(3).join(':').trim()
        })
      }
    }
  })
  
  // Sort by priority (quick wins first)
  const sortedTypes = Object.entries(errorsByType)
    .map(([code, errors]) => ({
      code,
      count: errors.length,
      errors,
      info: errorInfo[code] || { desc: 'Unknown', strategy: 'Review manually', priority: 99 }
    }))
    .sort((a, b) => a.info.priority - b.info.priority)
  
  console.log('\n🎯 ERRORS BY TYPE (sorted by fix priority):\n')
  sortedTypes.forEach(({ code, count, info, errors }) => {
    console.log(`\n${code}: ${info.desc} (${count} errors)`)
    console.log(`  Strategy: ${info.strategy}`)
    console.log(`  Sample files:`)
    errors.slice(0, 5).forEach(err => {
      console.log(`    - ${err.file}:${err.line}`)
    })
    if (errors.length > 5) {
      console.log(`    ... and ${errors.length - 5} more`)
    }
  })
  
  console.log('\n\n📋 RECOMMENDED FIX ORDER:\n')
  sortedTypes.forEach(({ code, count, info }, index) => {
    console.log(`${index + 1}. Fix ${code} (${count} errors) - ${info.strategy}`)
  })
  
} catch (error) {
  console.error('Error running typecheck:', error.message)
  process.exit(1)
}

