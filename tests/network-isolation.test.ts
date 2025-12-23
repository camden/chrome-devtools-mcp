/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {describe, it} from 'node:test';

import {
  parseAllowlist,
  buildHostResolverRulesFlag,
} from '../src/network-isolation.js';

describe('network-isolation', () => {
  describe('parseAllowlist', () => {
    it('handles undefined input', () => {
      const result = parseAllowlist(undefined);
      assert.deepStrictEqual(result.patterns, []);
      assert.strictEqual(result.isValid, true);
      assert.deepStrictEqual(result.errors, []);
    });

    it('handles empty string', () => {
      const result = parseAllowlist('');
      assert.deepStrictEqual(result.patterns, []);
      assert.strictEqual(result.isValid, true);
    });

    it('handles whitespace-only string', () => {
      const result = parseAllowlist('   ');
      assert.deepStrictEqual(result.patterns, []);
      assert.strictEqual(result.isValid, true);
    });

    it('parses single domain', () => {
      const result = parseAllowlist('example.com');
      assert.deepStrictEqual(result.patterns, ['example.com']);
      assert.strictEqual(result.isValid, true);
    });

    it('parses multiple domains', () => {
      const result = parseAllowlist('example.com,test.org,localhost');
      assert.deepStrictEqual(result.patterns, [
        'example.com',
        'test.org',
        'localhost',
      ]);
      assert.strictEqual(result.isValid, true);
    });

    it('handles wildcard patterns', () => {
      const result = parseAllowlist('*.example.com,*.sub.test.org');
      assert.deepStrictEqual(result.patterns, [
        '*.example.com',
        '*.sub.test.org',
      ]);
      assert.strictEqual(result.isValid, true);
    });

    it('trims whitespace', () => {
      const result = parseAllowlist('  example.com , test.org  ');
      assert.deepStrictEqual(result.patterns, ['example.com', 'test.org']);
      assert.strictEqual(result.isValid, true);
    });

    it('converts to lowercase', () => {
      const result = parseAllowlist('EXAMPLE.COM,Test.Org');
      assert.deepStrictEqual(result.patterns, ['example.com', 'test.org']);
      assert.strictEqual(result.isValid, true);
    });

    it('ignores empty entries', () => {
      const result = parseAllowlist('example.com,,test.org,');
      assert.deepStrictEqual(result.patterns, ['example.com', 'test.org']);
      assert.strictEqual(result.isValid, true);
    });

    it('accepts localhost and IP patterns', () => {
      const result = parseAllowlist('localhost,127.0.0.1');
      assert.deepStrictEqual(result.patterns, ['localhost', '127.0.0.1']);
      assert.strictEqual(result.isValid, true);
    });

    it('accepts domains with hyphens', () => {
      const result = parseAllowlist('my-domain.com,sub-domain.test.org');
      assert.deepStrictEqual(result.patterns, [
        'my-domain.com',
        'sub-domain.test.org',
      ]);
      assert.strictEqual(result.isValid, true);
    });

    it('rejects patterns with protocols', () => {
      const result = parseAllowlist('https://example.com');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.length > 0);
      assert.ok(result.errors[0].includes('https://example.com'));
    });

    it('rejects patterns with paths', () => {
      const result = parseAllowlist('example.com/path');
      assert.strictEqual(result.isValid, false);
    });

    it('rejects multiple wildcards', () => {
      const result = parseAllowlist('*.*.example.com');
      assert.strictEqual(result.isValid, false);
    });

    it('rejects wildcards not at start', () => {
      const result = parseAllowlist('example.*.com');
      assert.strictEqual(result.isValid, false);
    });

    it('rejects patterns with ports', () => {
      const result = parseAllowlist('example.com:8080');
      assert.strictEqual(result.isValid, false);
    });

    it('collects multiple errors', () => {
      const result = parseAllowlist(
        'valid.com,https://bad1.com,bad2.com/path',
      );
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.length, 2);
      assert.deepStrictEqual(result.patterns, ['valid.com']);
    });
  });

  describe('buildHostResolverRulesFlag', () => {
    it('returns block-all rule for empty patterns', () => {
      const flag = buildHostResolverRulesFlag([]);
      assert.strictEqual(flag, '--host-resolver-rules=MAP * ~NOTFOUND');
    });

    it('builds flag with single pattern', () => {
      const flag = buildHostResolverRulesFlag(['example.com']);
      assert.strictEqual(
        flag,
        '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE example.com',
      );
    });

    it('builds flag with multiple patterns', () => {
      const flag = buildHostResolverRulesFlag([
        'example.com',
        '*.test.org',
        'localhost',
      ]);
      assert.strictEqual(
        flag,
        '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE example.com, EXCLUDE *.test.org, EXCLUDE localhost',
      );
    });

    it('preserves wildcard patterns', () => {
      const flag = buildHostResolverRulesFlag(['*.api.example.com']);
      assert.strictEqual(
        flag,
        '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE *.api.example.com',
      );
    });
  });
});
