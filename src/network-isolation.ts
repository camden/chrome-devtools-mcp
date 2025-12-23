/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export const ENV_VAR_NAME = 'CHROME_DEVTOOLS_ALLOWED_HOSTS';

export interface ParsedAllowlist {
  patterns: string[];
  isValid: boolean;
  errors: string[];
}

/**
 * Parse and validate the allowlist from the environment variable.
 * Patterns should be comma-separated host patterns like:
 * "example.com,*.api.example.com,localhost"
 */
export function parseAllowlist(envValue: string | undefined): ParsedAllowlist {
  if (!envValue || envValue.trim() === '') {
    return {patterns: [], isValid: true, errors: []};
  }

  const errors: string[] = [];
  const patterns: string[] = [];

  const entries = envValue.split(',').map(e => e.trim().toLowerCase());

  for (const entry of entries) {
    if (entry === '') continue;

    // Validation regex: optional leading "*." followed by valid hostname
    // Hostname: starts with alphanumeric, can contain alphanumeric and hyphens,
    // can have multiple dot-separated labels
    const validPattern =
      /^(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;

    if (!validPattern.test(entry)) {
      errors.push(`Invalid host pattern: "${entry}"`);
      continue;
    }

    patterns.push(entry);
  }

  return {
    patterns,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Build the Chrome --host-resolver-rules flag from parsed patterns.
 * The flag blocks all hosts by default, then excludes (allows) specific patterns.
 */
export function buildHostResolverRulesFlag(patterns: string[]): string {
  // Always start with blocking everything
  const rules: string[] = ['MAP * ~NOTFOUND'];

  // Add EXCLUDE rules for each allowed pattern
  for (const pattern of patterns) {
    rules.push(`EXCLUDE ${pattern}`);
  }

  return `--host-resolver-rules=${rules.join(', ')}`;
}

/**
 * Get Chrome args for network isolation.
 * Always returns isolation args - network isolation is mandatory.
 * Throws if allowlist contains invalid patterns.
 */
export function getNetworkIsolationArgs(): string[] {
  const envValue = process.env[ENV_VAR_NAME];
  const {patterns, isValid, errors} = parseAllowlist(envValue);

  if (!isValid) {
    throw new Error(
      `Invalid ${ENV_VAR_NAME} configuration:\n${errors.join('\n')}`,
    );
  }

  const flag = buildHostResolverRulesFlag(patterns);
  return [flag];
}
