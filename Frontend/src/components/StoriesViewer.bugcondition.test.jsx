/**
 * Bug Condition Exploration Test — Bug 1.8
 *
 * Property 1: Bug Condition — StoriesViewer crashes on undefined currentMedia
 *
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists. DO NOT fix source code here.
 *
 * Validates: Requirements 1.8
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ─── Mock api config to avoid import.meta.env issues ─────────────────────────
vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:3001',
  API_ENDPOINTS: {},
}));

// =============================================================================
// Bug 1.8 — StoriesViewer crashes when currentMedia is undefined
// =============================================================================
describe('Bug 1.8 — StoriesViewer crashes on undefined currentMedia', () => {
  it(
    'EXPECTED TO FAIL: rendering StoriesViewer with empty media array should not throw TypeError',
    async () => {
      /**
       * On UNFIXED code:
       *   startProgress reads currentMedia?.duration but currentMedia is undefined.
       *   The useEffect guard `if (isOpen && currentMedia && isPlaying)` should prevent
       *   the call, but startProgress is memoized with currentMedia in deps — if the
       *   guard passes with a stale truthy value, currentMedia.duration throws.
       *
       * Counterexample: empty media array causes crash in startProgress.
       */

      // Import the REAL StoriesViewer (not mocked)
      const { default: StoriesViewer } = await import('./StoriesViewer');

      const stories = [{ media: [], businessName: 'Test', time: '1h ago', avatar: '🍽️' }];

      let renderError = null;
      try {
        await act(async () => {
          render(
            <StoriesViewer
              stories={stories}
              isOpen={true}
              isPlaying={true}
              onClose={vi.fn()}
              initialStoryIndex={0}
            />
          );
          await new Promise(r => setTimeout(r, 200));
        });
      } catch (e) {
        renderError = e;
      }

      // ASSERTION: no TypeError should be thrown
      expect(renderError).toBeNull();
    }
  );
});
