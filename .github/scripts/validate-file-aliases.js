#!/usr/bin/env node

/**
 * Validate and manage file aliases for deduplication
 * Run: node .github/scripts/validate-file-aliases.js
 */

const fs = require('fs');
const path = require('path');

const aliasConfigPath = path.join(__dirname, '../file-aliases.json');
const repoRoot = path.join(__dirname, '../../');

try {
  const config = JSON.parse(fs.readFileSync(aliasConfigPath, 'utf8'));
  const errors = [];
  const warnings = [];

  // Validate alias config structure
  if (!Array.isArray(config.aliases)) {
    errors.push('Missing or invalid "aliases" array');
  } else {
    config.aliases.forEach((alias, index) => {
      const prefix = `aliases[${index}]`;

      // Defensive check: ensure alias is a valid object
      if (!alias || typeof alias !== 'object') {
        errors.push(`${prefix}: must be an object`);
        return;
      }

      if (!alias.canonical) {
        errors.push(`${prefix}: missing "canonical" file`);
      } else {
        const canonicalPath = path.resolve(repoRoot, alias.canonical);
        if (path.relative(repoRoot, canonicalPath).startsWith('..')) {
          errors.push(`${prefix}: canonical file path is outside repository root: ${alias.canonical}`);
        } else if (!fs.existsSync(canonicalPath)) {
          errors.push(`${prefix}: canonical file not found: ${alias.canonical}`);
        }
      }

      if (!Array.isArray(alias.aliases)) {
        errors.push(`${prefix}: "aliases" must be an array`);
      } else if (alias.aliases.length === 0) {
        warnings.push(`${prefix}: no aliases defined for ${alias.canonical}`);
      } else {
        alias.aliases.forEach((aliasName, aliasIdx) => {
          const aliasPath = path.resolve(repoRoot, aliasName);
          if (path.relative(repoRoot, aliasPath).startsWith('..')) {
            warnings.push(`${prefix}.aliases[${aliasIdx}]: alias file path is outside repository root: ${aliasName}`);
          } else if (fs.existsSync(aliasPath)) {
            warnings.push(`${prefix}.aliases[${aliasIdx}]: alias file exists (should not exist): ${aliasName}`);
          }
        });
      }

      if (!alias.description) {
        warnings.push(`${prefix}: missing description`);
      }
    });
  }

  // Validate deduplication config
  if (config.deduplication !== undefined) {
    if (typeof config.deduplication !== 'object' || config.deduplication === null) {
      warnings.push('deduplication: must be an object');
    } else {
      if (!Array.isArray(config.deduplication.scan_paths)) {
        warnings.push('deduplication: scan_paths must be an array');
      }
      if (config.deduplication.ignore_patterns && !Array.isArray(config.deduplication.ignore_patterns)) {
        warnings.push('deduplication: ignore_patterns should be an array');
      }
    }
  }

  // Output results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ File aliases configuration is valid');
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
  console.error(`❌ Failed to validate aliases: ${err.message}`);
  process.exit(1);
}
