#!/usr/bin/env node

/**
 * Validate reviewers configuration structure and required fields
 * Run: node .github/scripts/validate-reviewers-config.js
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../reviewers-config.json');

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const errors = [];
  const warnings = [];

  // Check required root properties
  const hasDefaultReviewers = Array.isArray(config.default_reviewers);
  if (!hasDefaultReviewers) {
    errors.push('Missing or invalid "default_reviewers" array');
  }

  // Validate each reviewer in default_reviewers
  if (hasDefaultReviewers) {
    config.default_reviewers.forEach((reviewer, index) => {
      const prefix = `default_reviewers[${index}]`;

      if (!reviewer.name) errors.push(`${prefix}: missing "name"`);
      if (!reviewer.id) errors.push(`${prefix}: missing "id"`);
      if (!reviewer.type) errors.push(`${prefix}: missing "type"`);
      if (typeof reviewer.enabled !== 'boolean') {
        errors.push(`${prefix}: "enabled" must be boolean`);
      }

      // Check priority if present
      if (reviewer.priority && !['primary', 'secondary'].includes(reviewer.priority)) {
        errors.push(`${prefix}: invalid priority "${reviewer.priority}" (must be "primary" or "secondary")`);
      }

      // Warn if primary but disabled
      if (reviewer.priority === 'primary' && !reviewer.enabled) {
        warnings.push(`${prefix}: primary reviewer is disabled`);
      }
    });

    // Check for duplicate IDs
    const ids = config.default_reviewers.map(r => r.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate reviewer IDs: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Check for at least one primary reviewer
    const hasPrimary = config.default_reviewers.some(r => r.priority === 'primary' && r.enabled);
    if (!hasPrimary) {
      warnings.push('No enabled primary reviewer configured');
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
