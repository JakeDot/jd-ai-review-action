#!/usr/bin/env node

/**
 * Validate reviewers configuration structure and required fields
 * Run: node .github/scripts/validate-reviewers-config.js
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../reviewers-config.json');
const validTypes = ['gemini', 'copilot', 'custom', 'openai', 'claude', 'coderabbit'];

function validateReviewerList(list, listName, errors, warnings) {
  if (!Array.isArray(list)) {
    errors.push(`Missing or invalid "${listName}" array`);
    return;
  }

  const allIds = [];
  list.forEach((reviewer, index) => {
    const prefix = `${listName}[${index}]`;

    if (!reviewer.name) errors.push(`${prefix}: missing "name"`);
    if (!reviewer.id) errors.push(`${prefix}: missing "id"`);
    if (!reviewer.type) errors.push(`${prefix}: missing "type"`);
    if (typeof reviewer.enabled !== 'boolean') {
      errors.push(`${prefix}: "enabled" must be boolean`);
    }

    // Check type is valid
    if (reviewer.type && !validTypes.includes(reviewer.type)) {
      warnings.push(`${prefix}: unknown reviewer type "${reviewer.type}" (known types: ${validTypes.join(', ')})`);
    }

    // Check priority if present (only for default_reviewers)
    if (listName === 'default_reviewers') {
      if (reviewer.priority && !['primary', 'secondary'].includes(reviewer.priority)) {
        errors.push(`${prefix}: invalid priority "${reviewer.priority}" (must be "primary" or "secondary")`);
      }

      // Warn if primary but disabled
      if (reviewer.priority === 'primary' && !reviewer.enabled) {
        warnings.push(`${prefix}: primary reviewer is disabled`);
      }
    }

    if (reviewer.id) allIds.push(reviewer.id);
  });

  // Check for duplicate IDs within this list
  const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate reviewer IDs in ${listName}: ${[...new Set(duplicates)].join(', ')}`);
  }
}

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const errors = [];
  const warnings = [];

  // Validate all reviewer lists
  validateReviewerList(config.default_reviewers, 'default_reviewers', errors, warnings);
  validateReviewerList(config.audit_reviewers, 'audit_reviewers', errors, warnings);
  validateReviewerList(config.custom_reviewers, 'custom_reviewers', errors, warnings);

  // Check for at least one primary reviewer in default_reviewers
  if (Array.isArray(config.default_reviewers)) {
    const hasPrimary = config.default_reviewers.some(r => r.priority === 'primary' && r.enabled);
    if (!hasPrimary) {
      warnings.push('No enabled primary reviewer in default_reviewers');
    }
  }

  // Output results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Reviewers configuration is valid');
    process.exit(0);
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(w => console.log(`  - ${w}`));
  }

  if (errors.length > 0) {
    console.log('❌ Errors:');
    errors.forEach(e => console.log(`  - ${e}`));
    process.exit(1);
  }

  process.exit(0);
} catch (err) {
  console.error(`❌ Failed to validate config: ${err.message}`);
  process.exit(1);
}
