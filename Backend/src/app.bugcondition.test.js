/**
 * Bug Condition Exploration Test — Bug 1.13
 *
 * Property 1: Bug Condition — sanitizeValue checks raw newline instead of '$'
 *
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists. DO NOT fix source code here.
 *
 * Validates: Requirements 1.13
 *
 * Uses Node.js built-in test runner (node:test) — available in Node 18+
 */

const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

// =============================================================================
// Bug 1.13 — sanitizeValue checks raw newline instead of '$'
// =============================================================================
describe('Bug 1.13 — sanitizeValue checks raw newline instead of "$"', () => {
  /**
   * Extract the sanitizeValue function directly from app.js source.
   * This tests the ACTUAL function in the file, not a copy.
   */
  let sanitizeValue;

  before(() => {
    const src = fs.readFileSync(require.resolve('./app.js'), 'utf8');
    const start = src.indexOf('function sanitizeValue');
    const end = src.indexOf('\nfunction mongoSanitize');
    const fnSrc = src.substring(start, end);

    // Eval the function into local scope
    const fn = new Function(`${fnSrc}; return sanitizeValue;`);
    sanitizeValue = fn();
  });

  test(
    'EXPECTED TO FAIL: sanitizeValue should delete keys starting with "$"',
    () => {
      /**
       * On UNFIXED code:
       *   key.startsWith('\n') — raw newline embedded in source
       *   '$where'.startsWith('\n') === false → key is NOT deleted
       *   Result: { "$where": "malicious" } survives sanitization
       *
       * On FIXED code:
       *   key.startsWith('$') → '$where' is deleted
       *   Result: {} (key removed)
       *
       * Counterexample: sanitizeValue({ "$where": "x" }) returns { "$where": "x" } unchanged
       */
      const obj = { '$where': 'malicious', name: 'ok' };
      sanitizeValue(obj);

      // ASSERTION: the $where key should be deleted
      assert.equal(
        obj.hasOwnProperty('$where'),
        false,
        `Counterexample: sanitizeValue({ "$where": "x" }) returned { "$where": "x" } unchanged. ` +
        `Bug: key.startsWith('\\n') is false for '$where', so the key survives.`
      );
    }
  );
});
