#!/usr/bin/env node

/**
 * Add a new reviewer to the configuration
 * Usage: node .github/scripts/add-reviewer.js <name> <id> <type> [--priority primary|secondary] [--audit]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

// Robust argument parsing: separate positional args from flags
let name, id, type;
let isAudit = false;
let priority;
let hasPriority = false;

const positionals = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--audit') {
    isAudit = true;
  } else if (args[i] === '--priority') {
    hasPriority = true;
    priority = args[i + 1];
    i++;
  } else {
    positionals.push(args[i]);
  }
}

if (positionals.length < 3) {
  console.error('Usage: node add-reviewer.js <name> <id> <type> [--priority primary|secondary] [--audit]');
  console.error('\nExample:');
  console.error('  node add-reviewer.js "Claude AI" claude-ai claude');
  console.error('  node add-reviewer.js "CodeRabbit" coderabbit coderabbit --priority secondary');
  console.error('  node add-reviewer.js "Gemini" gemini-code-assist gemini --audit');
  process.exit(1);
}

[name, id, type] = positionals;

const configPath = path.join(__dirname, '../reviewers-config.json');

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Input validation
  if (!name.trim() || !id.trim() || !type.trim()) {
    throw new Error('Name, ID, and Type cannot be empty or whitespace-only');
  }

  // Check for duplicates across all reviewer lists
  const exists = [
    ...(config.default_reviewers || []),
    ...(config.audit_reviewers || []),
    ...(config.custom_reviewers || [])
  ].some(r => r.id === id);

  if (exists) {
    throw new Error(`Reviewer with ID "${id}" already exists in the configuration`);
  }

  const newReviewer = {
    name,
    id,
    type,
    enabled: true
  };

  // Validate priority if provided
  if (hasPriority) {
    if (!['primary', 'secondary'].includes(priority)) {
      throw new Error(`Invalid priority "${priority}" (must be primary or secondary)`);
    }
    newReviewer.priority = priority;
  }

  // Route to appropriate list
  if (isAudit) {
    if (!config.audit_reviewers) config.audit_reviewers = [];
    config.audit_reviewers.push(newReviewer);
    console.log(`✅ Added to audit_reviewers: ${name} (${id})`);
  } else if (type === 'custom') {
    if (!config.custom_reviewers) config.custom_reviewers = [];
    config.custom_reviewers.push(newReviewer);
    console.log(`✅ Added to custom_reviewers: ${name} (${id})`);
    if (hasPriority) {
      console.log(`   Priority: ${priority}`);
    }
  } else {
    if (!config.default_reviewers) config.default_reviewers = [];
    config.default_reviewers.push(newReviewer);
    console.log(`✅ Added to default_reviewers: ${name} (${id})`);
    if (hasPriority) {
      console.log(`   Priority: ${priority}`);
    }
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log('\n✅ Configuration updated. Run the validator:');
  console.log('   node .github/scripts/validate-reviewers-config.js');

} catch (err) {
  console.error(`❌ Failed to add reviewer: ${err.message}`);
  process.exit(1);
}
