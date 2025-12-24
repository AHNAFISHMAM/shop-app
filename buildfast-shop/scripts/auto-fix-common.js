#!/usr/bin/env node
/**
 * Auto-fix common TypeScript error patterns
 * Usage: npm run fix:auto
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Common fix patterns
const fixes = [
  {
    name: 'Replace as Updates<> with asUpdate()',
    pattern: /\.update\(([^)]+)\s+as\s+Updates<['"]([^'"]+)['"]>\)/g,
    replacement: (match, data, table) => {
      return `.update(asUpdate('${table}', ${data.trim()}))`
    },
    requiresImport: "import { asUpdate } from '@/lib/supabase-helpers'"
  },
  {
    name: 'Fix error handling (err instanceof Error)',
    pattern: /catch\s*\((\w+)\)\s*\{[^}]*\1\.message/g,
    replacement: (match, errVar) => {
      return match.replace(
        new RegExp(`${errVar}\\.message`, 'g'),
        `${errVar} instanceof Error ? ${errVar}.message : String(${errVar})`
      )
    }
  },
  {
    name: 'Add null check for spice_level',
    pattern: /formData\.spice_level\s*===\s*['"]/g,
    replacement: 'formData.spice_level === null'
  },
  {
    name: 'Fix rows attribute (string to number)',
    pattern: /rows=["'](\d+)["']/g,
    replacement: (match, num) => `rows={${num}}`
  }
]

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    let modified = false
    const appliedFixes = []
    
    fixes.forEach(fix => {
      const before = content
      
      if (fix.replacement instanceof Function) {
        content = content.replace(fix.pattern, fix.replacement)
      } else {
        content = content.replace(fix.pattern, fix.replacement)
      }
      
      if (content !== before) {
        modified = true
        appliedFixes.push(fix.name)
        
        // Add import if needed
        if (fix.requiresImport && !content.includes(fix.requiresImport)) {
          const importMatch = content.match(/^import\s+.*from\s+['"]@\/lib\/supabase-helpers['"]/m)
          if (!importMatch) {
            // Add import after last import statement
            const lastImport = content.lastIndexOf('import ')
            const nextLine = content.indexOf('\n', lastImport)
            content = content.slice(0, nextLine + 1) + 
                     fix.requiresImport + '\n' + 
                     content.slice(nextLine + 1)
          }
        }
      }
    })
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8')
      return { file: filePath, fixes: appliedFixes }
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
      // Skip node_modules, dist, etc.
      if (!['node_modules', 'dist', 'build', '.git', '.husky'].includes(file)) {
        findTypeScriptFiles(filePath, fileList)
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

console.log('🔧 Auto-fixing common TypeScript patterns...\n')

const srcDir = path.join(path.dirname(__dirname), 'src')
const files = findTypeScriptFiles(srcDir)

console.log(`Found ${files.length} TypeScript files\n`)

const results = files.map(processFile).filter(Boolean)

if (results.length === 0) {
  console.log('✅ No files needed auto-fixing\n')
} else {
  console.log(`✅ Fixed ${results.length} files:\n`)
  results.forEach(({ file, fixes }) => {
    console.log(`  ${file}`)
    fixes.forEach(fix => {
      console.log(`    ✓ ${fix}`)
    })
  })
  console.log('\n⚠️  Please review changes and run typecheck again\n')
}

