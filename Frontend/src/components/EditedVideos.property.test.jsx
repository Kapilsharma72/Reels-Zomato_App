/**
 * Property-Based Tests - Video Delivery Food Partner Feature
 * Property 4: Filter tabs correctly partition the list
 * Validates: Requirements 2.6
 * // Feature: video-delivery-foodpartner, Property 4: Filter tabs correctly partition the list
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act, within, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:3001',
  API_ENDPOINTS: {},
}));

vi.mock('../styles/EditedVideos.css', () => ({}));

vi.mock('react-icons/fa', () => ({
  FaDownload: () => React.createElement('span'),
  FaPlay: () => React.createElement('span'),
  FaEye: () => React.createElement('span'),
  FaStar: () => React.createElement('span'),
  FaClock: () => React.createElement('span'),
  FaUser: () => React.createElement('span'),
  FaSpinner: () => React.createElement('span'),
  FaExclamationTriangle: () => React.createElement('span'),
  FaVideo: () => React.createElement('span'),
  FaCheckCircle: () => React.createElement('span'),
  FaTimes: () => React.createElement('span'),
  FaCheck: () => React.createElement('span'),
}));

vi.mock('../services/videoSubmissionService', () => {
  const mockService = {
    getEditedVideos: vi.fn(),
    downloadEditedVideo: vi.fn(),
    rateSubmission: vi.fn(),
    updateSubmissionStatus: vi.fn(),
    addMessage: vi.fn(),
  };
  return { default: mockService };
});

/**
 * Build a minimal submission object that EditedVideos can render.
 * Each submission needs an editedVideo field (required by the component).
 */
function buildSubmission(opts = {}) {
  return {
    _id: opts._id || `sub-${Math.random().toString(36).slice(2)}`,
    projectTitle: opts.projectTitle || 'Test Project',
    description: 'A test video project',
    status: opts.status || 'review',
    budget: 5000,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    editor: { fullName: 'Test Editor' },
    editedVideo: {
      originalName: 'edited.mp4',
      fileSize: 1024 * 1024,
      uploadedAt: new Date().toISOString(),
    },
  };
}

/**
 * Arbitrary: an array of submissions with statuses drawn from ['review', 'completed'].
 * Each submission gets a unique projectTitle with a "PROJ-" prefix so we can
 * reliably query them in the DOM without collisions.
 */
const submissionsArb = fc.array(
  fc.record({
    _id: fc.stringMatching(/^[a-z0-9]{8,16}$/),
    // Unique-ish titles: prefix + alphanumeric suffix
    projectTitle: fc.stringMatching(/^PROJ[a-zA-Z0-9]{4,16}$/),
    status: fc.constantFrom('review', 'completed'),
  }),
  { minLength: 0, maxLength: 10 }
);

describe('Property 4: Filter tabs correctly partition the list', () => {
  let svc;

  beforeEach(async () => {
    const mod = await import('../services/videoSubmissionService');
    svc = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  /**
   * Render EditedVideos with the given submissions pre-loaded via the mock service,
   * then wait for the loading state to resolve.
   */
  async function renderWithSubmissions(submissions) {
    svc.getEditedVideos.mockResolvedValue({
      success: true,
      data: { submissions },
    });

    const { default: EditedVideos } = await import('./EditedVideos');
    const utils = render(React.createElement(EditedVideos));

    // Wait for loading to finish (spinner disappears, or grid/empty-state appears)
    await waitFor(() => {
      expect(screen.queryByText('Loading edited videos...')).not.toBeInTheDocument();
    });

    return utils;
  }

  // ── Concrete examples ──────────────────────────────────────────────────────

  it('"All" tab shows every submission regardless of status', async () => {
    const submissions = [
      buildSubmission({ _id: 'a1', projectTitle: 'PROJreview1', status: 'review' }),
      buildSubmission({ _id: 'a2', projectTitle: 'PROJcompleted1', status: 'completed' }),
    ];
    await renderWithSubmissions(submissions);

    // "All" is the default active filter — both cards should be visible
    expect(screen.getByText('PROJreview1')).toBeInTheDocument();
    expect(screen.getByText('PROJcompleted1')).toBeInTheDocument();
  });

  it('"Under Review" tab shows only review submissions', async () => {
    const submissions = [
      buildSubmission({ _id: 'b1', projectTitle: 'PROJreview2', status: 'review' }),
      buildSubmission({ _id: 'b2', projectTitle: 'PROJcompleted2', status: 'completed' }),
    ];
    const { container } = await renderWithSubmissions(submissions);

    // Click the filter tab button specifically (not the status badge)
    const filterTabs = container.querySelector('.filter-tabs');
    fireEvent.click(within(filterTabs).getByText('Under Review'));

    expect(screen.getByText('PROJreview2')).toBeInTheDocument();
    expect(screen.queryByText('PROJcompleted2')).not.toBeInTheDocument();
  });

  it('"Completed" tab shows only completed submissions', async () => {
    const submissions = [
      buildSubmission({ _id: 'c1', projectTitle: 'PROJreview3', status: 'review' }),
      buildSubmission({ _id: 'c2', projectTitle: 'PROJcompleted3', status: 'completed' }),
    ];
    const { container } = await renderWithSubmissions(submissions);

    const filterTabs = container.querySelector('.filter-tabs');
    fireEvent.click(within(filterTabs).getByText('Completed'));

    expect(screen.queryByText('PROJreview3')).not.toBeInTheDocument();
    expect(screen.getByText('PROJcompleted3')).toBeInTheDocument();
  });

  it('empty list shows empty state for all filter tabs', async () => {
    await renderWithSubmissions([]);

    // "All" tab — empty state
    expect(screen.getByText(/No Edited Videos Available/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Under Review'));
    expect(screen.getByText(/No Edited Videos Available/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Completed'));
    expect(screen.getByText(/No Edited Videos Available/i)).toBeInTheDocument();
  });

  it('switching back to "All" after filtering restores full list', async () => {
    const submissions = [
      buildSubmission({ _id: 'd1', projectTitle: 'PROJreview4', status: 'review' }),
      buildSubmission({ _id: 'd2', projectTitle: 'PROJcompleted4', status: 'completed' }),
    ];
    const { container } = await renderWithSubmissions(submissions);

    const filterTabs = container.querySelector('.filter-tabs');
    fireEvent.click(within(filterTabs).getByText('Under Review'));
    expect(screen.queryByText('PROJcompleted4')).not.toBeInTheDocument();

    fireEvent.click(within(filterTabs).getByText('All'));
    expect(screen.getByText('PROJreview4')).toBeInTheDocument();
    expect(screen.getByText('PROJcompleted4')).toBeInTheDocument();
  });

  // ── Property test ──────────────────────────────────────────────────────────

  it(
    'Property 4 (fast-check): filter tabs correctly partition the list for any array of submissions',
    async () => {
      await fc.assert(
        fc.asyncProperty(submissionsArb, async (arbSubmissions) => {
          cleanup();
          vi.clearAllMocks();

          // Ensure unique _ids to avoid React key collisions
          const seen = new Set();
          const submissions = arbSubmissions
            .filter((s) => {
              if (seen.has(s._id)) return false;
              seen.add(s._id);
              return true;
            })
            .map((s) => buildSubmission(s));

          svc.getEditedVideos.mockResolvedValue({
            success: true,
            data: { submissions },
          });

          const { default: EditedVideos } = await import('./EditedVideos');
          const { container } = render(React.createElement(EditedVideos));
          const view = within(container);

          await waitFor(() => {
            expect(view.queryByText('Loading edited videos...')).not.toBeInTheDocument();
          });

          const reviewTitles = submissions
            .filter((s) => s.status === 'review')
            .map((s) => s.projectTitle);
          const completedTitles = submissions
            .filter((s) => s.status === 'completed')
            .map((s) => s.projectTitle);
          const allTitles = submissions.map((s) => s.projectTitle);

          // ── "All" tab (default) ──
          for (const title of allTitles) {
            if (!view.queryByText(title)) {
              cleanup();
              return false;
            }
          }

          // ── "Under Review" tab ──
          const filterTabsEl = container.querySelector('.filter-tabs');
          await act(async () => {
            fireEvent.click(within(filterTabsEl).getByText('Under Review'));
          });

          for (const title of reviewTitles) {
            if (!view.queryByText(title)) {
              cleanup();
              return false;
            }
          }
          for (const title of completedTitles) {
            if (view.queryByText(title)) {
              cleanup();
              return false;
            }
          }

          // ── "Completed" tab ──
          await act(async () => {
            fireEvent.click(within(filterTabsEl).getByText('Completed'));
          });

          for (const title of completedTitles) {
            if (!view.queryByText(title)) {
              cleanup();
              return false;
            }
          }
          for (const title of reviewTitles) {
            if (view.queryByText(title)) {
              cleanup();
              return false;
            }
          }

          cleanup();
          return true;
        }),
        { numRuns: 30 }
      );
    },
    60000
  );
});

// Feature: video-delivery-foodpartner, Property 6: Approve/Revision buttons shown iff status is review
/**
 * Property 6: Approve/Revision buttons shown iff status is review
 * Validates: Requirements 4.1, 4.7
 */
describe('Property 6: Approve/Revision buttons shown iff status is review', () => {
  let svc;

  beforeEach(async () => {
    const mod = await import('../services/videoSubmissionService');
    svc = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  async function renderWithSubmissions(submissions) {
    svc.getEditedVideos.mockResolvedValue({
      success: true,
      data: { submissions },
    });

    const { default: EditedVideos } = await import('./EditedVideos');
    const utils = render(React.createElement(EditedVideos));

    await waitFor(() => {
      expect(screen.queryByText('Loading edited videos...')).not.toBeInTheDocument();
    });

    return utils;
  }

  const allStatuses = ['review', 'completed', 'revision_requested', 'pending', 'in_progress'];

  it('Approve and Request Revision buttons visible for review status', async () => {
    const submissions = [
      buildSubmission({ _id: 'p6-review', projectTitle: 'PROJp6review', status: 'review' }),
    ];
    await renderWithSubmissions(submissions);
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Request Revision')).toBeInTheDocument();
  });

  it('Approve and Request Revision buttons NOT visible for completed status', async () => {
    const submissions = [
      buildSubmission({ _id: 'p6-completed', projectTitle: 'PROJp6completed', status: 'completed' }),
    ];
    await renderWithSubmissions(submissions);
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Request Revision')).not.toBeInTheDocument();
  });

  it(
    'Property 6 (fast-check): Approve/Revision buttons shown iff status is review',
    async () => {
      const submissionStatusArb = fc.array(
        fc.record({
          _id: fc.stringMatching(/^[a-z0-9]{8,16}$/),
          projectTitle: fc.stringMatching(/^P6[a-zA-Z0-9]{4,12}$/),
          status: fc.constantFrom(...allStatuses),
        }),
        { minLength: 1, maxLength: 8 }
      );

      await fc.assert(
        fc.asyncProperty(submissionStatusArb, async (arbSubmissions) => {
          cleanup();
          vi.clearAllMocks();

          // Deduplicate by _id
          const seen = new Set();
          const submissions = arbSubmissions
            .filter((s) => {
              if (seen.has(s._id)) return false;
              seen.add(s._id);
              return true;
            })
            .map((s) => buildSubmission(s));

          svc.getEditedVideos.mockResolvedValue({
            success: true,
            data: { submissions },
          });

          const { default: EditedVideos } = await import('./EditedVideos');
          const { container } = render(React.createElement(EditedVideos));

          await waitFor(() => {
            expect(
              within(container).queryByText('Loading edited videos...')
            ).not.toBeInTheDocument();
          });

          const hasReview = submissions.some((s) => s.status === 'review');

          const approveButtons = within(container).queryAllByText('Approve');
          const revisionButtons = within(container).queryAllByText('Request Revision');

          if (hasReview) {
            // At least one of each should be present
            if (approveButtons.length === 0 || revisionButtons.length === 0) {
              cleanup();
              return false;
            }
          } else {
            // None should be present
            if (approveButtons.length > 0 || revisionButtons.length > 0) {
              cleanup();
              return false;
            }
          }

          // Per-card check: each review card has both buttons; non-review cards have neither
          for (const sub of submissions) {
            const cards = container.querySelectorAll('.video-card');
            let cardForSub = null;
            for (const card of cards) {
              if (within(card).queryByText(sub.projectTitle)) {
                cardForSub = card;
                break;
              }
            }
            if (!cardForSub) continue;

            const cardApprove = within(cardForSub).queryByText('Approve');
            const cardRevision = within(cardForSub).queryByText('Request Revision');

            if (sub.status === 'review') {
              if (!cardApprove || !cardRevision) {
                cleanup();
                return false;
              }
            } else {
              if (cardApprove || cardRevision) {
                cleanup();
                return false;
              }
            }
          }

          cleanup();
          return true;
        }),
        { numRuns: 30 }
      );
    },
    60000
  );
});

// Feature: video-delivery-foodpartner, Property 7: Revision submission triggers both API calls
/**
 * Property 7: Revision submission triggers both API calls
 * Validates: Requirements 4.4
 */
describe('Property 7: Revision submission triggers both API calls', () => {
  let svc;

  beforeEach(async () => {
    const mod = await import('../services/videoSubmissionService');
    svc = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  async function renderWithReviewSubmission(submission) {
    svc.getEditedVideos.mockResolvedValue({
      success: true,
      data: { submissions: [submission] },
    });
    svc.updateSubmissionStatus.mockResolvedValue({ success: true });
    svc.addMessage.mockResolvedValue({ success: true });

    const { default: EditedVideos } = await import('./EditedVideos');
    const utils = render(React.createElement(EditedVideos));

    await waitFor(() => {
      expect(screen.queryByText('Loading edited videos...')).not.toBeInTheDocument();
    });

    return utils;
  }

  it('clicking Request Revision then Send calls updateSubmissionStatus and addMessage', async () => {
    const sub = buildSubmission({ _id: 'p7-concrete', projectTitle: 'PROJp7concrete', status: 'review' });
    await renderWithReviewSubmission(sub);

    fireEvent.click(screen.getByText('Request Revision'));

    const input = screen.getByPlaceholderText('Describe the revision needed...');
    fireEvent.change(input, { target: { value: 'Please fix the color grading' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Send'));
    });

    await waitFor(() => {
      expect(svc.updateSubmissionStatus).toHaveBeenCalledWith(
        'p7-concrete',
        'revision_requested',
        undefined,
        'food-partner'
      );
      expect(svc.addMessage).toHaveBeenCalledWith(
        'p7-concrete',
        'Please fix the color grading',
        'food-partner'
      );
    });
  });

  it(
    'Property 7 (fast-check): revision triggers both API calls with correct args for any id/note',
    async () => {
      const revisionArb = fc.record({
        _id: fc.stringMatching(/^[a-z][a-z0-9]{4,14}$/),
        projectTitle: fc.stringMatching(/^P7[a-zA-Z0-9]{4,12}$/),
        note: fc.string({ minLength: 1, maxLength: 80 }),
      });

      await fc.assert(
        fc.asyncProperty(revisionArb, async ({ _id, projectTitle, note }) => {
          cleanup();
          vi.clearAllMocks();

          const sub = buildSubmission({ _id, projectTitle, status: 'review' });

          svc.getEditedVideos.mockResolvedValue({
            success: true,
            data: { submissions: [sub] },
          });
          svc.updateSubmissionStatus.mockResolvedValue({ success: true });
          svc.addMessage.mockResolvedValue({ success: true });

          const { default: EditedVideos } = await import('./EditedVideos');
          const { container } = render(React.createElement(EditedVideos));

          await waitFor(() => {
            expect(
              within(container).queryByText('Loading edited videos...')
            ).not.toBeInTheDocument();
          });

          // Open revision mode
          const revisionBtn = within(container).getByText('Request Revision');
          fireEvent.click(revisionBtn);

          // Enter revision note
          const input = within(container).getByPlaceholderText('Describe the revision needed...');
          fireEvent.change(input, { target: { value: note } });

          // Submit
          await act(async () => {
            fireEvent.click(within(container).getByText('Send'));
          });

          await waitFor(() => {
            expect(svc.updateSubmissionStatus).toHaveBeenCalledWith(
              _id,
              'revision_requested',
              undefined,
              'food-partner'
            );
            expect(svc.addMessage).toHaveBeenCalledWith(_id, note, 'food-partner');
          });

          cleanup();
          return true;
        }),
        { numRuns: 25 }
      );
    },
    90000
  );
});

// Feature: video-delivery-foodpartner, Property 8: Action buttons disabled during in-flight requests
/**
 * Property 8: Action buttons disabled during in-flight requests
 * Validates: Requirements 4.5
 */
describe('Property 8: Action buttons disabled during in-flight requests', () => {
  let svc;

  beforeEach(async () => {
    const mod = await import('../services/videoSubmissionService');
    svc = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  async function renderWithReviewSubmission(submission) {
    svc.getEditedVideos.mockResolvedValue({
      success: true,
      data: { submissions: [submission] },
    });

    const { default: EditedVideos } = await import('./EditedVideos');
    const utils = render(React.createElement(EditedVideos));

    await waitFor(() => {
      expect(screen.queryByText('Loading edited videos...')).not.toBeInTheDocument();
    });

    return utils;
  }

  it('Approve button is disabled while approve request is in-flight', async () => {
    const sub = buildSubmission({ _id: 'p8-approve', projectTitle: 'PROJp8approve', status: 'review' });

    // Never resolves — simulates in-flight
    svc.updateSubmissionStatus.mockReturnValue(new Promise(() => {}));

    await renderWithReviewSubmission(sub);

    const approveBtn = screen.getByText('Approve').closest('button');
    const revisionBtn = screen.getByText('Request Revision').closest('button');

    expect(approveBtn).not.toBeDisabled();
    expect(revisionBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(approveBtn);
    });

    expect(approveBtn).toBeDisabled();
    expect(revisionBtn).toBeDisabled();
  });

  it('Request Revision Send button is disabled while revision request is in-flight', async () => {
    const sub = buildSubmission({ _id: 'p8-revision', projectTitle: 'PROJp8revision', status: 'review' });

    // Never resolves — simulates in-flight
    svc.updateSubmissionStatus.mockReturnValue(new Promise(() => {}));

    await renderWithReviewSubmission(sub);

    // Open revision mode
    fireEvent.click(screen.getByText('Request Revision'));

    const input = screen.getByPlaceholderText('Describe the revision needed...');
    fireEvent.change(input, { target: { value: 'Fix audio' } });

    const sendBtn = screen.getByText('Send').closest('button');
    expect(sendBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(sendBtn);
    });

    // Both action buttons should be disabled
    const approveBtn = screen.getByText('Approve').closest('button');
    const revisionBtn = screen.getByText('Request Revision').closest('button');
    expect(approveBtn).toBeDisabled();
    expect(revisionBtn).toBeDisabled();
    expect(sendBtn).toBeDisabled();
  });

  it(
    'Property 8 (fast-check): action buttons disabled during in-flight for any submission id',
    async () => {
      const submissionArb = fc.record({
        _id: fc.stringMatching(/^[a-z][a-z0-9]{4,14}$/),
        projectTitle: fc.stringMatching(/^P8[a-zA-Z0-9]{4,12}$/),
        triggerAction: fc.constantFrom('approve', 'revision'),
      });

      await fc.assert(
        fc.asyncProperty(submissionArb, async ({ _id, projectTitle, triggerAction }) => {
          cleanup();
          vi.clearAllMocks();

          const sub = buildSubmission({ _id, projectTitle, status: 'review' });

          svc.getEditedVideos.mockResolvedValue({
            success: true,
            data: { submissions: [sub] },
          });
          // Never resolves — simulates in-flight
          svc.updateSubmissionStatus.mockReturnValue(new Promise(() => {}));
          svc.addMessage.mockReturnValue(new Promise(() => {}));

          const { default: EditedVideos } = await import('./EditedVideos');
          const { container } = render(React.createElement(EditedVideos));

          await waitFor(() => {
            expect(
              within(container).queryByText('Loading edited videos...')
            ).not.toBeInTheDocument();
          });

          const approveBtn = within(container).getByText('Approve').closest('button');
          const revisionBtn = within(container).getByText('Request Revision').closest('button');

          // Both should be enabled before action
          if (approveBtn.disabled || revisionBtn.disabled) {
            cleanup();
            return false;
          }

          if (triggerAction === 'approve') {
            await act(async () => {
              fireEvent.click(approveBtn);
            });
          } else {
            // Open revision mode and submit
            fireEvent.click(revisionBtn);
            const input = within(container).getByPlaceholderText('Describe the revision needed...');
            fireEvent.change(input, { target: { value: 'needs work' } });
            await act(async () => {
              fireEvent.click(within(container).getByText('Send'));
            });
          }

          // After triggering, both buttons should be disabled
          const approveBtnAfter = within(container).getByText('Approve').closest('button');
          const revisionBtnAfter = within(container).getByText('Request Revision').closest('button');

          const result = approveBtnAfter.disabled && revisionBtnAfter.disabled;

          cleanup();
          return result;
        }),
        { numRuns: 20 }
      );
    },
    90000
  );
});

// Feature: video-delivery-foodpartner, Property 9: Rating form shown iff completed and unrated
/**
 * Property 9: Rating form shown iff completed and unrated
 * Validates: Requirements 5.1, 5.6
 */
describe('Property 9: Rating form shown iff completed and unrated', () => {
  let svc;

  beforeEach(async () => {
    const mod = await import('../services/videoSubmissionService');
    svc = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  async function renderWithSubmissions(submissions) {
    svc.getEditedVideos.mockResolvedValue({
      success: true,
      data: { submissions },
    });

    const { default: EditedVideos } = await import('./EditedVideos');
    const utils = render(React.createElement(EditedVideos));

    await waitFor(() => {
      expect(screen.queryByText('Loading edited videos...')).not.toBeInTheDocument();
    });

    return utils;
  }

  // ── Concrete examples ──────────────────────────────────────────────────────

  it('shows rating form for completed and unrated submission', async () => {
    const sub = buildSubmission({ _id: 'p9-a', projectTitle: 'PROJp9a', status: 'completed' });
    // no rating field
    await renderWithSubmissions([sub]);
    expect(screen.getByText('Submit Rating')).toBeInTheDocument();
  });

  it('does NOT show rating form for completed submission that already has a rating', async () => {
    const sub = { ...buildSubmission({ _id: 'p9-b', projectTitle: 'PROJp9b', status: 'completed' }), rating: 4 };
    await renderWithSubmissions([sub]);
    expect(screen.queryByText('Submit Rating')).not.toBeInTheDocument();
  });

  it('does NOT show rating form for review submission without a rating', async () => {
    const sub = buildSubmission({ _id: 'p9-c', projectTitle: 'PROJp9c', status: 'review' });
    await renderWithSubmissions([sub]);
    expect(screen.queryByText('Submit Rating')).not.toBeInTheDocument();
  });

  it('does NOT show rating form for review submission that has a rating', async () => {
    const sub = { ...buildSubmission({ _id: 'p9-d', projectTitle: 'PROJp9d', status: 'review' }), rating: 3 };
    await renderWithSubmissions([sub]);
    expect(screen.queryByText('Submit Rating')).not.toBeInTheDocument();
  });

  // ── Property test ──────────────────────────────────────────────────────────

  it(
    'Property 9 (fast-check): rating form shown iff status is completed and no rating exists',
    async () => {
      // Generate submissions with all combinations of status and rating presence
      const submissionArb = fc.array(
        fc.record({
          _id: fc.stringMatching(/^[a-z0-9]{8,16}$/),
          projectTitle: fc.stringMatching(/^P9[a-zA-Z0-9]{4,12}$/),
          status: fc.constantFrom('review', 'completed'),
          // rating is either absent (undefined) or a number 1-5
          rating: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
        }),
        { minLength: 1, maxLength: 8 }
      );

      await fc.assert(
        fc.asyncProperty(submissionArb, async (arbSubmissions) => {
          cleanup();
          vi.clearAllMocks();

          // Deduplicate by _id
          const seen = new Set();
          const submissions = arbSubmissions
            .filter((s) => {
              if (seen.has(s._id)) return false;
              seen.add(s._id);
              return true;
            })
            .map((s) => {
              const base = buildSubmission({ _id: s._id, projectTitle: s.projectTitle, status: s.status });
              if (s.rating !== undefined) {
                base.rating = s.rating;
              }
              return base;
            });

          svc.getEditedVideos.mockResolvedValue({
            success: true,
            data: { submissions },
          });

          const { default: EditedVideos } = await import('./EditedVideos');
          const { container } = render(React.createElement(EditedVideos));

          await waitFor(() => {
            expect(
              within(container).queryByText('Loading edited videos...')
            ).not.toBeInTheDocument();
          });

          // Per-card check: rating form (Submit Rating button) visible iff completed && !rating
          for (const sub of submissions) {
            const cards = container.querySelectorAll('.video-card');
            let cardForSub = null;
            for (const card of cards) {
              if (within(card).queryByText(sub.projectTitle)) {
                cardForSub = card;
                break;
              }
            }
            if (!cardForSub) {
              cleanup();
              return false;
            }

            const submitRatingBtn = within(cardForSub).queryByText('Submit Rating');
            const shouldShowForm = sub.status === 'completed' && !sub.rating;

            if (shouldShowForm && !submitRatingBtn) {
              cleanup();
              return false;
            }
            if (!shouldShowForm && submitRatingBtn) {
              cleanup();
              return false;
            }
          }

          cleanup();
          return true;
        }),
        { numRuns: 30 }
      );
    },
    60000
  );
});
