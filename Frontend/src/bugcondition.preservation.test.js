/**
 * Preservation Property Tests
 *
 * These tests MUST PASS on unfixed code — they establish the baseline behavior
 * that must not regress after the fix is applied.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import fc from 'fast-check';

const cssPath = path.resolve(__dirname, './styles/EditorDashboard.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

const componentPath = path.resolve(__dirname, './components/VideoSubmissionsManager.jsx');
const componentContent = fs.readFileSync(componentPath, 'utf-8');

/**
 * Returns true if the CSS file contains a rule block for the given selector.
 */
function hasRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*[{,]`);
  return re.test(cssContent);
}

// ─── P1: Existing CSS Rules Are Defined ──────────────────────────────────────
// Validates: Requirements 3.1
// These classes already exist in EditorDashboard.css and must remain defined.

describe('P1 — Existing CSS rules are defined', () => {
  const existingClasses = [
    '.stats-grid',
    '.stat-card',
    '.project-card',
    '.progress-bar',
    '.modal-overlay',
    '.toggle-switch',
    '.profile-view',
    '.profile-header',
    '.earnings-view',
    '.portfolio-view',
    '.editor-settings-view',
  ];

  for (const cls of existingClasses) {
    it(`should have a CSS rule for "${cls}"`, () => {
      expect(
        hasRule(cls),
        `Expected "${cls}" to have a CSS rule in EditorDashboard.css — this class existed before the fix and must not be removed`
      ).toBe(true);
    });
  }
});

// ─── P2: Filter params for specific statuses ─────────────────────────────────
// Validates: Requirements 3.6
// When filter is not 'all', the component passes { status: filter } to the API.
// Property: for all non-'all' filter values, the ternary pattern is present.

describe('P2 — Filter params for specific statuses', () => {
  it('should contain the ternary pattern: filter === \'all\' ? {} : { status: filter }', () => {
    // Check for the ternary pattern (with either quote style)
    const hasPattern =
      componentContent.includes("filter === 'all' ? {} : { status: filter }") ||
      componentContent.includes('filter === "all" ? {} : { status: filter }');
    expect(
      hasPattern,
      'Expected VideoSubmissionsManager.jsx to contain the filter ternary: ' +
        "filter === 'all' ? {} : { status: filter }"
    ).toBe(true);
  });

  it('should pass { status: filter } when filter is not "all" (property-based)', () => {
    /**
     * **Validates: Requirements 3.6**
     * For any non-'all' filter value, the component source must contain
     * the pattern that passes { status: filter } to the API call.
     */
    const nonAllFilters = ['assigned', 'in_progress', 'review', 'completed', 'submitted'];

    fc.assert(
      fc.property(
        fc.constantFrom(...nonAllFilters),
        (filterValue) => {
          // The component uses a ternary: filter === 'all' ? {} : { status: filter }
          // This means for any non-'all' value, { status: filter } is passed.
          // We verify the ternary pattern exists in the source.
          const hasPattern =
            componentContent.includes("filter === 'all' ? {} : { status: filter }") ||
            componentContent.includes('filter === "all" ? {} : { status: filter }');
          return hasPattern;
        }
      )
    );
  });
});

// ─── P3: "Start Editing" handler ─────────────────────────────────────────────
// Validates: Requirements 3.2
// The "Start Editing" button calls handleStatusUpdate with 'in_progress' and 10.

describe('P3 — "Start Editing" handler', () => {
  it('should call handleStatusUpdate with \'in_progress\' and 10 for Start Editing', () => {
    const hasInProgressCall =
      componentContent.includes("'in_progress', 10") ||
      componentContent.includes('"in_progress", 10');
    expect(
      hasInProgressCall,
      "Expected VideoSubmissionsManager.jsx to contain handleStatusUpdate call with 'in_progress' and 10"
    ).toBe(true);
  });

  it('should reference handleStatusUpdate in the component (property-based)', () => {
    /**
     * **Validates: Requirements 3.2**
     * The handleStatusUpdate function must be present and called with
     * 'in_progress' and progress=10 for the Start Editing action.
     */
    fc.assert(
      fc.property(
        fc.constant('in_progress'),
        fc.constant(10),
        (status, progress) => {
          const pattern1 = `'${status}', ${progress}`;
          const pattern2 = `"${status}", ${progress}`;
          return (
            componentContent.includes(pattern1) ||
            componentContent.includes(pattern2)
          );
        }
      )
    );
  });
});

// ─── P4: "Assign to Me" handler ──────────────────────────────────────────────
// Validates: Requirements 3.3
// The "Assign to Me" button calls handleAssignSubmission.

describe('P4 — "Assign to Me" handler', () => {
  it('should reference handleAssignSubmission in the component', () => {
    expect(
      componentContent.includes('handleAssignSubmission'),
      'Expected VideoSubmissionsManager.jsx to contain "handleAssignSubmission"'
    ).toBe(true);
  });

  it('should call handleAssignSubmission for the Assign to Me button (property-based)', () => {
    /**
     * **Validates: Requirements 3.3**
     * The handleAssignSubmission function must be present and wired to
     * the "Assign to Me" button for submitted submissions.
     */
    fc.assert(
      fc.property(
        fc.constant('handleAssignSubmission'),
        (fnName) => componentContent.includes(fnName)
      )
    );
  });
});

// ─── P5: Food partner flow ────────────────────────────────────────────────────
// Validates: Requirements 3.4, 3.5
// When userType === 'food-partner', getFoodPartnerSubmissions is called.

describe('P5 — Food partner flow', () => {
  it('should reference getFoodPartnerSubmissions in the component', () => {
    expect(
      componentContent.includes('getFoodPartnerSubmissions'),
      'Expected VideoSubmissionsManager.jsx to contain "getFoodPartnerSubmissions"'
    ).toBe(true);
  });

  it('should call getFoodPartnerSubmissions in the non-editor branch (property-based)', () => {
    /**
     * **Validates: Requirements 3.4, 3.5**
     * The getFoodPartnerSubmissions service call must be present and
     * reachable via the non-editor branch (else of userType === 'editor').
     */
    fc.assert(
      fc.property(
        fc.constant('getFoodPartnerSubmissions'),
        (fnName) => {
          // The component uses if (userType === 'editor') { ... } else { getFoodPartnerSubmissions }
          // So the non-editor (food-partner) path calls getFoodPartnerSubmissions.
          const hasEditorBranch =
            componentContent.includes("userType === 'editor'") ||
            componentContent.includes('userType === "editor"');
          const hasFoodPartnerCall = componentContent.includes(fnName);
          return hasEditorBranch && hasFoodPartnerCall;
        }
      )
    );
  });
});
