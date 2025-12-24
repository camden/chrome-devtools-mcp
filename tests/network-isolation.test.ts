/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {describe, it} from 'node:test';

import {getNetworkIsolationArgs} from '../src/network-isolation.js';

describe('network-isolation', () => {
  describe('getNetworkIsolationArgs', () => {
    it('returns hardcoded host-resolver-rules flag', () => {
      const args = getNetworkIsolationArgs();
      assert.strictEqual(args.length, 1);
      assert.strictEqual(
        args[0],
        '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1',
      );
    });
  });
});
