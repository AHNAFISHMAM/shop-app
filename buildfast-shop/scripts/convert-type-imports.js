#!/usr/bin/env node
/**
 * Convert regular imports to type-only imports where appropriate
 * Usage: npm run fix:type-imports
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Type-only import patterns (files that only export types)
const typeOnlyFiles = [
  'database.types.ts',
  'types.ts',
  '.types.ts',
  '.d.ts'
]

// Patterns to convert
const patterns = [
  // import { Type } from './types' -> import type { Type } from './types'
  {
    pattern: /^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]*(?:types|database\.types))['"]/gm,
    replacement: (match, imports, module) => {
      // Check if file is type-only
      const isTypeOnly = typeOnlyFiles.some(t => module.includes(t))
      if (isTypeOnly) {
        return `import type {${imports}} from '${module}'`
      }
      return match
    }
  },
  // import { Type, value } from './file' -> import type { Type } from './file'; import { value } from './file'
  // (More complex - would need AST parsing, skipping for now)
]

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    let modified = false
    
    patterns.forEach(({ pattern, replacement }) => {
      const before = content
      if (typeof replacement === 'function') {
        content = content.replace(pattern, replacement)
      } else {
        content = content.replace(pattern, replacement)
      }
      
      if (content !== before) {
        modified = true
      }
    })
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8')
      return { file: filePath, modified: true }
    }
    
    return null
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
    return null
  }
}

function findTypeScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git', '.husky'].includes(file)) {
        findTypeScriptFiles(filePath, fileList)
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

console.log('🔄 Converting type-only imports...\n')

const srcDir = path.join(path.dirname(__dirname), 'src')
const files = findTypeScriptFiles(srcDir)

console.log(`Found ${files.length} TypeScript files\n`)

const results = files.map(processFile).filter(Boolean)

if (results.length === 0) {
  console.log('✅ No files needed conversion\n')
} else {
  console.log(`✅ Converted ${results.length} files:\n`)
  results.forEach(({ file }) => {
    console.log(`  ${path.relative(process.cwd(), file)}`)
  })
  console.log('\n⚠️  Please review changes and run typecheck again\n')
}

