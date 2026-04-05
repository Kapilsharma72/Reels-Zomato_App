/**
 * Property-Based Tests - Video Delivery Food Partner Feature
 * Property 1: Upload confirmation shown before modal closes
 * Validates: Requirements 1.1, 1.3
 * // Feature: video-delivery-foodpartner, Property 1: Upload confirmation shown before modal closes
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act, within, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:3001',
  API_ENDPOINTS: {},
}));

vi.mock('../styles/VideoSubmissionsManager.css', () => ({}));

vi.mock('react-icons/fa', () => ({
  FaVideo: () => React.createElement('span'),
  FaPlay: () => React.createElement('span'),
  FaDownload: () => React.createElement('span'),
  FaClock: () => React.createElement('span'),
  FaDollarSign: () => React.createElement('span'),
  FaUser: () => React.createElement('span'),
  FaCheck: () => React.createElement('span'),
  FaTimes: () => React.createElement('span'),
  FaEdit: () => React.createElement('span'),
  FaUpload: () => React.createElement('span'),
  FaComment: () => React.createElement('span'),
  FaStar: () => React.createElement('span'),
  FaEye: () => React.createElement('span'),
  FaSearch: () => React.createElement('span'),
}));

vi.mock('../services/videoSubmissionService', () => {
  const mockService = {
    getEditorSubmissions: vi.fn(),
    getAvailableSubmissions: vi.fn(),
    getFoodPartnerSubmissions: vi.fn(),
    uploadEditedVideo: vi.fn(),
    assignSubmission: vi.fn(),
    updateSubmissionStatus: vi.fn(),
    getSubmissionDetails: vi.fn(),
    addMessage: vi.fn(),
    formatTimeRemaining: vi.fn(() => '5 days remaining'),
    formatFileSize: vi.fn((bytes) => `${bytes} Bytes`),
  };
  return { default: mockService };
});

function buildSubmission(opts) {
  const o = opts || {};
  return {
    _id: o._id || 'sub-001',
    projectTitle: o.projectTitle || 'Test Project',
    description: 'A test video project',
    status: 'in_progress',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    budget: 5000,
    progress: 50,
    foodPartner: { businessName: o.businessName || 'Test Restaurant' },
  };
}

// Generate submissions where projectTitle and businessName are guaranteed distinct
// by using different fixed prefixes and no trailing spaces
const submissionArb = fc.record({
  _id: fc.stringMatching(/^[a-z0-9]{8,20}$/),
  // "TITLE-" prefix ensures projectTitle is always distinct from businessName
  projectTitle: fc.stringMatching(/^TITLE[a-zA-Z0-9]{1,20}$/),
  businessName: fc.stringMatching(/^BNAME[a-zA-Z0-9]{1,20}$/),
});

describe('Property 1: Upload confirmation shown before modal closes', () => {
  let svc;

  beforeEach(async () => {
    const mod = await import('../services/videoSubmissionService');
    svc = mod.default;
    svc.uploadEditedVideo.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    cleanup();
  });

  async function renderAndUpload(submission) {
    const { default: VideoSubmissionsManager } = await import('./VideoSubmissionsManager');
    svc.getEditorSubmissions.mockResolvedValue({ data: { submissions: [submission] } });

    const utils = render(
      React.createElement(VideoSubmissionsManager, { userType: 'editor', tabType: 'assigned' })
    );

    await waitFor(() => expect(screen.getByText(submission.projectTitle)).toBeInTheDocument());
    fireEvent.click(screen.getByText('Submit for Review'));
    await waitFor(() => expect(screen.getByText('Upload Edited Video')).toBeInTheDocument());

    const fileInput = utils.container.querySelector('input[type="file"]');
    fireEvent.change(fileInput, {
      target: { files: [new File(['video'], 'edited.mp4', { type: 'video/mp4' })] },
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Send to Food Partner'));
    });

    return utils;
  }

  it('shows Sent to Food Partner banner immediately after upload resolves', async () => {
    await renderAndUpload(buildSubmission());
    expect(screen.getByText('Sent to Food Partner')).toBeInTheDocument();
  });

  it('modal is still open immediately after upload resolves', async () => {
    await renderAndUpload(buildSubmission());
    expect(screen.getByText('Upload Edited Video')).toBeInTheDocument();
  });

  it('modal does NOT close before 2 seconds have elapsed', async () => {
    const submission = buildSubmission();
    const { default: VideoSubmissionsManager } = await import('./VideoSubmissionsManager');
    svc.getEditorSubmissions.mockResolvedValue({ data: { submissions: [submission] } });

    const utils = render(
      React.createElement(VideoSubmissionsManager, { userType: 'editor', tabType: 'assigned' })
    );

    await waitFor(() => expect(screen.getByText(submission.projectTitle)).toBeInTheDocument());
    fireEvent.click(screen.getByText('Submit for Review'));
    await waitFor(() => expect(screen.getByText('Upload Edited Video')).toBeInTheDocument());

    const fileInput = utils.container.querySelector('input[type="file"]');
    fireEvent.change(fileInput, {
      target: { files: [new File(['v'], 'v.mp4', { type: 'video/mp4' })] },
    });

    vi.useFakeTimers({ shouldAdvanceTime: false });

    await act(async () => {
      fireEvent.click(screen.getByText('Send to Food Partner'));
    });

    act(() => { vi.advanceTimersByTime(1999); });

    expect(screen.getByText('Upload Edited Video')).toBeInTheDocument();
    expect(screen.getByText('Sent to Food Partner')).toBeInTheDocument();
  });

  it('modal closes after the 2-second timer fires', async () => {
    const submission = buildSubmission();
    const { default: VideoSubmissionsManager } = await import('./VideoSubmissionsManager');
    svc.getEditorSubmissions.mockResolvedValue({ data: { submissions: [submission] } });

    const utils = render(
      React.createElement(VideoSubmissionsManager, { userType: 'editor', tabType: 'assigned' })
    );

    await waitFor(() => expect(screen.getByText(submission.projectTitle)).toBeInTheDocument());
    fireEvent.click(screen.getByText('Submit for Review'));
    await waitFor(() => expect(screen.getByText('Upload Edited Video')).toBeInTheDocument());

    const fileInput = utils.container.querySelector('input[type="file"]');
    fireEvent.change(fileInput, {
      target: { files: [new File(['v'], 'v.mp4', { type: 'video/mp4' })] },
    });

    vi.useFakeTimers({ shouldAdvanceTime: false });

    await act(async () => {
      fireEvent.click(screen.getByText('Send to Food Partner'));
    });

    act(() => { vi.advanceTimersByTime(2001); });

    expect(screen.queryByText('Upload Edited Video')).not.toBeInTheDocument();
  });

  it(
    'Property 1 (fast-check): for any submission, confirmation banner visible and modal open immediately after upload',
    async () => {
      await fc.assert(
        fc.asyncProperty(submissionArb, async (arb) => {
          cleanup();
          vi.clearAllMocks();
          svc.uploadEditedVideo.mockResolvedValue({ success: true });

          const submission = buildSubmission({
            _id: arb._id,
            projectTitle: arb.projectTitle,
            businessName: arb.businessName,
          });

          svc.getEditorSubmissions.mockResolvedValue({ data: { submissions: [submission] } });

          const { default: VideoSubmissionsManager } = await import('./VideoSubmissionsManager');
          const { container } = render(
            React.createElement(VideoSubmissionsManager, { userType: 'editor', tabType: 'assigned' })
          );

          const view = within(container);

          // projectTitle starts with "TITLE" so it is unique in the DOM
          await waitFor(() => expect(view.getByText(arb.projectTitle)).toBeInTheDocument());
          fireEvent.click(view.getByText('Submit for Review'));
          await waitFor(() => expect(view.getByText('Upload Edited Video')).toBeInTheDocument());

          const fileInput = container.querySelector('input[type="file"]');
          fireEvent.change(fileInput, {
            target: { files: [new File(['v'], 'v.mp4', { type: 'video/mp4' })] },
          });

          await act(async () => {
            fireEvent.click(view.getByText('Send to Food Partner'));
          });

          // Assertion 1: confirmation banner visible immediately after upload
          const hasBanner = view.queryByText('Sent to Food Partner') !== null;

          // Assertion 2: modal still open (2-second timer has not fired yet)
          const modalOpen = view.queryByText('Upload Edited Video') !== null;

          cleanup();
          return hasBanner && modalOpen;
        }),
        { numRuns: 20 }
      );
    },
    30000
  );
});

/**
 * Property 2: Upload modal stays open on error
 * Validates: Requirements 1.4
 * // Feature: video-delivery-foodpartner, Property 2: Upload modal stays open on error
 */
describe('Property 2: Upload modal stays open on error', () => {
  let svc;

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    const mod = await import('../services/videoSubmissionService');
    svc = mod.default;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    cleanup();
  });

  // Arbitrary error messages (non-empty strings with ERR prefix to avoid collisions)
  const errorMessageArb = fc.stringMatching(/^ERR[a-zA-Z0-9 ]{1,40}$/);

  // Arbitrary submission objects for Property 2
  const submissionArb2 = fc.record({
    _id: fc.stringMatching(/^[a-z0-9]{8,20}$/),
    projectTitle: fc.stringMatching(/^TITLE[a-zA-Z0-9]{1,20}$/),
    businessName: fc.stringMatching(/^BNAME[a-zA-Z0-9]{1,20}$/),
  });

  async function renderAndUploadWithError(submission, errorMessage) {
    const { default: VideoSubmissionsManager } = await import('./VideoSubmissionsManager');
    svc.getEditorSubmissions.mockResolvedValue({ data: { submissions: [submission] } });
    svc.uploadEditedVideo.mockRejectedValue(new Error(errorMessage));

    const utils = render(
      React.createElement(VideoSubmissionsManager, { userType: 'editor', tabType: 'assigned' })
    );

    await waitFor(() => expect(screen.getByText(submission.projectTitle)).toBeInTheDocument());
    fireEvent.click(screen.getByText('Submit for Review'));
    await waitFor(() => expect(screen.getByText('Upload Edited Video')).toBeInTheDocument());

    const fileInput = utils.container.querySelector('input[type="file"]');
    fireEvent.change(fileInput, {
      target: { files: [new File(['video'], 'edited.mp4', { type: 'video/mp4' })] },
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Send to Food Partner'));
    });

    return utils;
  }

  it('modal stays open after upload rejects', async () => {
    const submission = buildSubmission();
    await renderAndUploadWithError(submission, 'Network error');
    expect(screen.getByText('Upload Edited Video')).toBeInTheDocument();
  });

  it('displays an error message after upload rejects', async () => {
    const submission = buildSubmission();
    await renderAndUploadWithError(submission, 'Network error');
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('does NOT show the success banner after upload rejects', async () => {
    const submission = buildSubmission();
    await renderAndUploadWithError(submission, 'Server error');
    expect(screen.queryByText('Sent to Food Partner')).not.toBeInTheDocument();
  });

  it('modal stays open after 2+ seconds when upload rejected (no auto-close timer)', async () => {
    const submission = buildSubmission();
    await renderAndUploadWithError(submission, 'Timeout error');

    // Advance time well past the 2-second auto-close threshold
    act(() => { vi.advanceTimersByTime(3000); });

    // Modal must still be open — no auto-close timer was started
    expect(screen.getByText('Upload Edited Video')).toBeInTheDocument();
  });

  it(
    'Property 2 (fast-check): for any error message and submission, modal stays open and error shown, no auto-close',
    async () => {
      await fc.assert(
        fc.asyncProperty(errorMessageArb, submissionArb2, async (errorMessage, arb) => {
          cleanup();
          vi.clearAllMocks();
          vi.useFakeTimers({ shouldAdvanceTime: false });

          const submission = buildSubmission({
            _id: arb._id,
            projectTitle: arb.projectTitle,
            businessName: arb.businessName,
          });

          svc.uploadEditedVideo.mockRejectedValue(new Error(errorMessage));
          svc.getEditorSubmissions.mockResolvedValue({ data: { submissions: [submission] } });

          const { default: VideoSubmissionsManager } = await import('./VideoSubmissionsManager');
          const { container } = render(
            React.createElement(VideoSubmissionsManager, { userType: 'editor', tabType: 'assigned' })
          );

          const view = within(container);

          await waitFor(() => expect(view.getByText(arb.projectTitle)).toBeInTheDocument());
          fireEvent.click(view.getByText('Submit for Review'));
          await waitFor(() => expect(view.getByText('Upload Edited Video')).toBeInTheDocument());

          const fileInput = container.querySelector('input[type="file"]');
          fireEvent.change(fileInput, {
            target: { files: [new File(['v'], 'v.mp4', { type: 'video/mp4' })] },
          });

          await act(async () => {
            fireEvent.click(view.getByText('Send to Food Partner'));
          });

          // Advance time past 2 seconds to confirm no auto-close timer was started
          act(() => { vi.advanceTimersByTime(2500); });

          // Assertion 1: modal still open (no auto-close)
          const modalOpen = view.queryByText('Upload Edited Video') !== null;

          // Assertion 2: error message is displayed
          const errorShown = view.queryByText(errorMessage) !== null;

          // Assertion 3: success banner NOT shown
          const noSuccessBanner = view.queryByText('Sent to Food Partner') === null;

          cleanup();
          vi.useRealTimers();
          return modalOpen && errorShown && noSuccessBanner;
        }),
        { numRuns: 20 }
      );
    },
    30000
  );
});
