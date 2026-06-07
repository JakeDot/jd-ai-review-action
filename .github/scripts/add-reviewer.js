#!/usr/bin/env node

/**
 * Add a new reviewer to the configuration
 * Usage: node .github/scripts/add-reviewer.js <name> <id> <type> [--priority primary|secondary] [--audit]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: node add-reviewer.js <name> <id> <type> [--priority primary|secondary] [--audit]');
  console.error('\nExample:');
  console.error('  node add-reviewer.js "Claude AI" claude-ai claude');
  console.error('  node add-reviewer.js "CodeRabbit" coderabbit coderabbit --priority secondary');
  console.error('  node add-reviewer.js "Gemini" gemini-code-assist gemini --audit');
  process.exit(1);
}

const [name, id, type] = args;
const isAudit = args.includes('--audit');
const priorityIdx = args.indexOf('--priority');
const priority = priorityIdx >= 0 ? args[priorityIdx + 1] : undefined;

const configPath = path.join(__dirname, '../reviewers-config.json');

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const newReviewer = {
    name,
    id,
    type,
    enabled: true
  };

  if (priority) {
    if (!['primary', 'secondary'].includes(priority)) {
      throw new Error(`Invalid priority "${priority}" (must be primary or secondary)`);
    }
    newReviewer.priority = priority;
  }

  if (isAudit) {
    if (!config.audit_reviewers) config.audit_reviewers = [];
    config.audit_reviewers.push(newReviewer);
    console.log(`✅ Added to audit_reviewers: ${name} (${id})`);
  } else {
    if (!config.default_reviewers) config.default_reviewers = [];
    config.default_reviewers.push(newReviewer);
    console.log(`✅ Added to default_reviewers: ${name} (${id})`);
    if (priority) {
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
