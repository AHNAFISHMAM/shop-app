#!/usr/bin/env node
/**
 * Setup agent coordination - Creates .agent-id files for each agent
 * Usage: npm run setup:agents
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.dirname(__dirname)

// Agent assignments
const agentAssignments = {
  1: {
    id: 1,
    task: 'TS6133 - Unused Variables',
    description: 'Fix all TS6133 errors (unused variables) - Quick wins',
    strategy: 'Remove unused imports/variables, prefix intentionally unused with _'
  },
  2: {
    id: 2,
    task: 'TS2322 - Type Mismatches',
    description: 'Fix all TS2322 errors (type mismatches) - Most common',
    strategy: 'Use asUpdate/asInsert helpers, add proper type assertions'
  },
  3: {
    id: 3,
    task: 'TS2345 - Argument Types',
    description: 'Fix all TS2345 errors (argument type mismatches)',
    strategy: 'Add explicit type annotations, use type guards'
  },
  4: {
    id: 4,
    task: 'TS7006 - Implicit Any',
    description: 'Fix all TS7006 errors (implicit any)',
    strategy: 'Add explicit type annotations, avoid any type'
  },
  5: {
    id: 5,
    task: 'TS18046 - Null Checks',
    description: 'Fix all TS18046 errors (null/undefined checks)',
    strategy: 'Add type guards, use optional chaining'
  },
  6: {
    id: 6,
    task: 'TS2339 - Property Missing',
    description: 'Fix all TS2339 errors (property does not exist)',
    strategy: 'Add properties to type definitions, use type assertions'
  },
  7: {
    id: 7,
    task: 'TS7053 - Index Signatures',
    description: 'Fix all TS7053 errors (index signature missing)',
    strategy: 'Add index signature to types'
  },
  8: {
    id: 8,
    task: 'Verification & Remaining',
    description: 'Fix remaining errors and verify all fixes',
    strategy: 'Run typecheck, ensure all files pass'
  }
}

console.log('🤖 Setting up agent coordination...\n')

// Create .agent-id files for each agent
for (let agentId = 1; agentId <= 8; agentId++) {
  const agent = agentAssignments[agentId]
  const agentIdFile = path.join(projectRoot, `.agent-${agentId}.json`)
  
  const agentConfig = {
    agentId: agent.id,
    task: agent.task,
    description: agent.description,
    strategy: agent.strategy,
    worktreePath: `../buildfast-shop-agent-${agentId}`,
    branchName: `agent-${agentId}-worktree`,
    createdAt: new Date().toISOString()
  }
  
  fs.writeFileSync(agentIdFile, JSON.stringify(agentConfig, null, 2), 'utf-8')
  console.log(`✅ Created .agent-${agentId}.json`)
  console.log(`   Task: ${agent.task}`)
  console.log(`   Worktree: ${agentConfig.worktreePath}\n`)
}

// Create master coordination file
const masterConfig = {
  totalAgents: 8,
  agents: Object.values(agentAssignments),
  createdAt: new Date().toISOString()
}

const masterFile = path.join(projectRoot, '.agents-coordination.json')
fs.writeFileSync(masterFile, JSON.stringify(masterConfig, null, 2), 'utf-8')

console.log('✅ Created .agents-coordination.json (master config)\n')
console.log('📋 Agent Assignments:')
Object.values(agentAssignments).forEach(agent => {
  console.log(`   Agent ${agent.id}: ${agent.task}`)
})

console.log('\n🚀 Agent coordination setup complete!')
console.log('📖 Each agent can read their .agent-{id}.json file to know their task\n')

