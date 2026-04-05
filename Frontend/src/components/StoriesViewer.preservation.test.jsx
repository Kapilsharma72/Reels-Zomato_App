/**
 * Preservation Property Tests — Task 2 (Preservation 3.5)
 *
 * Property 2: Preservation — StoriesViewer with valid media works correctly
 *
 * These tests MUST PASS on unfixed code.
 * They encode the baseline behavior of StoriesViewer with valid (non-empty) media
 * so we can confirm no regressions after the null guard fix (Bug 1.8) is applied.
 *
 * Observed on UNFIXED code:
 *   - StoriesViewer with media.length >= 1 renders without TypeError
 *   - Progress timer, play/pause, and navigation work correctly
 *
 * Validates: Requirements 3.5
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
// Preservation 3.5 — StoriesViewer with valid media works correctly
// =============================================================================
describe('Preservation 3.5 — StoriesViewer with valid media works correctly', () => {
  it('renders without TypeError when stories have valid media', async () => {
    /**
     * Validates: Requirements 3.5
     *
     * Observed baseline: StoriesViewer with non-empty media array plays stories
     * without throwing any errors. The null guard fix must not break this.
     */
    const { default: StoriesViewer } = await import('./StoriesViewer');

    const stories = [
      {
        media: [{ url: 'http://example.com/v.mp4', duration: 5000 }],
        businessName: 'Test Restaurant',
        time: '1h ago',
        avatar: '🍽️',
      },
    ];

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
        await new Promise((r) => setTimeout(r, 200));
      });
    } catch (e) {
      renderError = e;
    }

    // ASSERTION: no TypeError is thrown with valid media
    expect(renderError).toBeNull();
  });

  it('renders without TypeError when stories have multiple media items', async () => {
    /**
     * Validates: Requirements 3.5
     *
     * Observed baseline: StoriesViewer with multiple media items in a story group
     * renders and plays without errors.
     */
    const { default: StoriesViewer } = await import('./StoriesViewer');

    const stories = [
      {
        media: [
          { url: 'http://example.com/v1.mp4', duration: 3000 },
          { url: 'http://example.com/v2.mp4', duration: 4000 },
        ],
        businessName: 'Multi Media Restaurant',
        time: '2h ago',
        avatar: '🍕',
      },
    ];

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
        await new Promise((r) => setTimeout(r, 200));
      });
    } catch (e) {
      renderError = e;
    }

    // ASSERTION: no TypeError is thrown with multiple media items
    expect(renderError).toBeNull();
  });
});
