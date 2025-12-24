/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Hardcoded list of allowed hosts for network isolation.
 * All other hosts are blocked by default.
 */
const ALLOWED_HOSTS = ['localhost', '127.0.0.1'];

/**
 * Get Chrome args for network isolation.
 * Returns args that block all network requests except to allowed hosts.
 */
export function getNetworkIsolationArgs(): string[] {
  const rules = [
    'MAP * ~NOTFOUND',
    ...ALLOWED_HOSTS.map(host => `EXCLUDE ${host}`),
  ];
  return [`--host-resolver-rules=${rules.join(', ')}`];
}
