/**
 * Bug Condition Exploration Tests
 *
 * These tests MUST FAIL on unfixed code — failure confirms the bugs exist.
 * DO NOT fix the code when tests fail.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ─── C1: CSS Class Presence Test ─────────────────────────────────────────────
// Reads EditorDashboard.css and asserts each missing class has a CSS rule.
// EXPECTED TO FAIL on unfixed code (classes are absent).

describe('C1 — CSS Class Presence', () => {
  const cssPath = path.resolve(__dirname, './styles/EditorDashboard.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  /**
   * Returns true if the CSS file contains a rule block starting with the
   * given selector (e.g. ".profile-fields {" or ".profile-fields.foo {").
   * We strip whitespace and look for the selector followed by optional
   * combinators / whitespace and then an opening brace.
   */
  function hasRule(selector) {
    // Escape special regex chars in the selector string
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match the selector at the start of a rule (possibly preceded by newline/space)
    const re = new RegExp(`${escaped}\\s*[{,]`);
    return re.test(cssContent);
  }

  const missingClasses = [
    // Profile view
    '.profile-fields',
    '.field-group',
    '.skills-container',
    '.add-skill-btn',
    '.remove-skill',
    '.account-info',
    '.info-item',
    '.info-label',
    '.info-value',
    // Settings view
    '.settings-view',
    '.settings-section',
    '.setting-item',
    '.setting-info',
    '.number-input',
    '.time-selector',
    '.account-actions',
    // Portfolio / content items
    '.item-content',
    '.item-description',
    '.item-stats',
    '.play-btn',
    '.item-duration',
    '.tag',
    // Earnings / withdrawal
    '.withdrawal-info',
    '.form-group',
    // Active projects (detailed)
    '.project-card.detailed',
    '.project-header',
    '.project-description',
    '.project-details',
    '.requirements',
    '.project-actions',
    '.action-btn.edit',
    '.action-btn.upload',
    '.action-btn.complete',
    // Completed projects (detailed)
    '.completed-grid',
    '.completed-card.detailed',
    '.completed-overlay',
  ];

  for (const cls of missingClasses) {
    it(`should have a CSS rule for "${cls}"`, () => {
      expect(
        hasRule(cls),
        `Expected "${cls}" to have a CSS rule in EditorDashboard.css, but none was found`
      ).toBe(true);
    });
  }
});

// ─── C2: Upload Flow Test ─────────────────────────────────────────────────────
// Reads VideoSubmissionsManager.jsx and asserts the upload service method is
// referenced and a file input is present for in_progress submissions.
// EXPECTED TO FAIL on unfixed code (upload flow is missing).

describe('C2 — Upload Flow in VideoSubmissionsManager', () => {
  const componentPath = path.resolve(
    __dirname,
    './components/VideoSubmissionsManager.jsx'
  );
  const componentContent = fs.readFileSync(componentPath, 'utf-8');

  it('should call uploadEditedVideo service method somewhere in the component', () => {
    expect(
      componentContent.includes('uploadEditedVideo'),
      'Expected "uploadEditedVideo" to appear in VideoSubmissionsManager.jsx, but it was not found. ' +
        'The upload flow is missing — only updateSubmissionStatus is called.'
    ).toBe(true);
  });

  it('should render a file input (type="file" or type=\'file\') for in_progress submissions', () => {
    const hasFileInput =
      componentContent.includes('type="file"') ||
      componentContent.includes("type='file'");
    expect(
      hasFileInput,
      'Expected a <input type="file"> to be present in VideoSubmissionsManager.jsx for in_progress submissions, ' +
        'but no file input was found. The upload UI is missing.'
    ).toBe(true);
  });
});

// ─── C3: Backend Log Conditionality Test ─────────────────────────────────────
// Reads videoSubmission.controller.js and asserts the console.log for
// 'Status filter:' is wrapped in an if (status) guard.
// EXPECTED TO FAIL on unfixed code (log is unconditional).

describe('C3 — Backend Status Filter Log is Conditional', () => {
  const controllerPath = path.resolve(
    __dirname,
    '../../Backend/src/controllers/videoSubmission.controller.js'
  );
  const controllerContent = fs.readFileSync(controllerPath, 'utf-8');

  it('should only log "Status filter:" when status is defined (wrapped in if (status) check)', () => {
    // The unconditional form is: console.log('Status filter:', status) NOT preceded by if (status)
    // We look for the conditional form: if (status) ... console.log('Status filter:', status)
    // or if (status) { console.log('Status filter:', status) }
    const conditionalPattern =
      /if\s*\(\s*status\s*\)[^;{]*console\.log\s*\(\s*['"]Status filter:['"]/;
    const conditionalBlockPattern =
      /if\s*\(\s*status\s*\)\s*\{[^}]*console\.log\s*\(\s*['"]Status filter:['"]/;

    const isConditional =
      conditionalPattern.test(controllerContent) ||
      conditionalBlockPattern.test(controllerContent);

    expect(
      isConditional,
      'Expected console.log(\'Status filter:\', status) to be wrapped in an if (status) check, ' +
        'but it appears to be unconditional. This means it logs "Status filter: undefined" ' +
        'on every request even when no status filter is provided.'
    ).toBe(true);
  });
});
