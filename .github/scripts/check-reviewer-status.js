#!/usr/bin/env node

/**
 * Check which reviewers are enabled/disabled
 * Run: node .github/scripts/check-reviewer-status.js
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../reviewers-config.json');

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  console.log('\n📋 Reviewer Status\n');
  
  // Default reviewers
  if (config.default_reviewers?.length > 0) {
    console.log('Default Reviewers:');
    config.default_reviewers.forEach(reviewer => {
      const status = reviewer.enabled ? '✅' : '❌';
      const priority = reviewer.priority ? ` [${reviewer.priority.toUpperCase()}]` : '';
      console.log(`  ${status} ${reviewer.name} (${reviewer.id})${priority}`);
    });
  }
  
  // Audit reviewers
  if (config.audit_reviewers?.length > 0) {
    console.log('\nAudit Reviewers:');
    config.audit_reviewers.forEach(reviewer => {
      const status = reviewer.enabled ? '✅' : '❌';
      console.log(`  ${status} ${reviewer.name} (${reviewer.id})`);
    });
  }
  
  // Custom reviewers
  if (config.custom_reviewers?.length > 0) {
    console.log('\nCustom Reviewers:');
    config.custom_reviewers.forEach(reviewer => {
      const status = reviewer.enabled ? '✅' : '❌';
      console.log(`  ${status} ${reviewer.name} (${reviewer.id})`);
    });
  }
  
  // Summary
  const enabledDefault = config.default_reviewers?.filter(r => r.enabled).length || 0;
  const totalDefault = config.default_reviewers?.length || 0;
  const primary = config.default_reviewers?.find(r => r.priority === 'primary' && r.enabled);
  
  console.log(`\nSummary:`);
  console.log(`  ${enabledDefault}/${totalDefault} default reviewers enabled`);
  console.log(`  Primary reviewer: ${primary ? `${primary.name} (${primary.id})` : 'NONE'}`);
  
  if (!primary) {
    console.log('\n⚠️  WARNING: No primary reviewer enabled. Auto-merge will not work.');
  }
  
  console.log('');
  
} catch (err) {
  console.error(`❌ Failed to check status: ${err.message}`);
  process.exit(1);
}
