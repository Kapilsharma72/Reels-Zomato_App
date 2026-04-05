/**
 * Property-Based Tests - Video Delivery Food Partner Feature
 * Property 12: Badge increments when not on edited-videos tab
 * Property 13: WebSocket listener registered on mount and cleaned up on unmount
 * // Feature: video-delivery-foodpartner, Property 12: Badge increments when not on edited-videos tab
 * // Feature: video-delivery-foodpartner, Property 13: WebSocket listener registered on mount and cleaned up on unmount
 */

import React from 'react';
import { render, screen, act, within, cleanup, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// ── Module mocks ────────────────────────────────────────────────────────────

vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:3001',
  API_ENDPOINTS: {},
}));

vi.mock('../styles/FoodPartnerDashboard.css', () => ({}));
vi.mock('../styles/EditedVideos.css', () => ({}));
vi.mock('../styles/NotificationCenter.css', () => ({}));
vi.mock('../styles/OrderTracking.css', () => ({}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('react-icons/fa', () => {
  const stub = () => React.createElement('span');
  return {
    FaHome: stub, FaVideo: stub, FaShoppingCart: stub, FaUser: stub,
    FaChartLine: stub, FaBell: stub, FaCog: stub, FaBars: stub, FaTimes: stub,
    FaUpload: stub, FaEdit: stub, FaEye: stub, FaStar: stub, FaClock: stub,
    FaMapMarkerAlt: stub, FaPhone: stub, FaEnvelope: stub, FaPlus: stub,
    FaTrash: stub, FaPlay: stub, FaPause: stub, FaDownload: stub, FaImage: stub,
    FaCircle: stub, FaSignOutAlt: stub, FaLock: stub, FaHistory: stub,
    FaUtensils: stub, FaCheck: stub, FaSpinner: stub, FaExclamationTriangle: stub,
    FaCheckCircle: stub, FaSearch: stub, FaComment: stub, FaDollarSign: stub,
    FaChartBar: stub, FaShoppingBag: stub, FaStore: stub, FaTag: stub,
    FaPercent: stub, FaGlobe: stub, FaFacebook: stub, FaInstagram: stub,
    FaTwitter: stub, FaWhatsapp: stub, FaCamera: stub, FaFileAlt: stub,
    FaList: stub, FaThLarge: stub, FaFilter: stub, FaSort: stub,
    FaArrowLeft: stub, FaArrowRight: stub, FaArrowUp: stub, FaArrowDown: stub,
    FaChevronLeft: stub, FaChevronRight: stub, FaChevronUp: stub, FaChevronDown: stub,
    FaInfoCircle: stub, FaQuestionCircle: stub, FaTimesCircle: stub,
    FaPlusCircle: stub, FaMinusCircle: stub, FaRegStar: stub,
  };
});

// Shared mock socket — tests can swap handlers via mockSocket.on/off
const mockSocket = {
  _handlers: {},
  on: vi.fn((event, handler) => {
    if (!mockSocket._handlers[event]) mockSocket._handlers[event] = [];
    mockSocket._handlers[event].push(handler);
  }),
  off: vi.fn((event, handler) => {
    if (mockSocket._handlers[event]) {
      mockSocket._handlers[event] = mockSocket._handlers[event].filter(h => h !== handler);
    }
  }),
  emit: (event, data) => {
    (mockSocket._handlers[event] || []).forEach(h => h(data));
  },
  _reset() {
    this._handlers = {};
    this.on.mockClear();
    this.off.mockClear();
  },
};

vi.mock('../hooks/useWebSocket', () => ({
  useWebSocket: () => ({ socket: mockSocket, isConnected: false }),
}));

vi.mock('../contexts/FoodPartnerContext', () => ({
  FoodPartnerProvider: ({ children }) => React.createElement(React.Fragment, null, children),
  useFoodPartner: () => ({
    foodPartnerData: { _id: 'fp-001', businessName: 'Test Restaurant' },
    loading: false,
  }),
}));

vi.mock('../services/authService', () => ({ default: { logout: vi.fn() } }));
vi.mock('../services/orderService', () => ({
  default: {
    getFoodPartnerOrders: vi.fn().mockResolvedValue({ orders: [] }),
    updateOrderStatus: vi.fn().mockResolvedValue({}),
  },
}));

// Stub all child components so they render nothing heavy
const stubComponent = (name) => {
  const C = () => React.createElement('div', { 'data-testid': name });
  C.displayName = name;
  return C;
};

vi.mock('../components/ReelsUpload', () => ({ default: stubComponent('ReelsUpload') }));
vi.mock('../components/PostUpload', () => ({ default: stubComponent('PostUpload') }));
vi.mock('../components/StoriesUpload', () => ({ default: stubComponent('StoriesUpload') }));
vi.mock('../components/ContentManager', () => ({ default: stubComponent('ContentManager') }));
vi.mock('../components/VideoSubmission', () => ({ default: stubComponent('VideoSubmission') }));
vi.mock('../components/VideoEditingHistory', () => ({ default: stubComponent('VideoEditingHistory') }));
vi.mock('../components/EditedVideos', () => ({
  default: ({ refreshTrigger }) =>
    React.createElement('div', { 'data-testid': 'EditedVideos', 'data-refresh': refreshTrigger }),
}));
vi.mock('../components/ProfileManagement', () => ({ default: stubComponent('ProfileManagement') }));
vi.mock('../components/NotificationCenter', () => ({ default: stubComponent('NotificationCenter') }));

// ── Helpers ─────────────────────────────────────────────────────────────────

async function renderDashboard() {
  const { default: FoodPartnerDashboard } = await import('./FoodPartnerDashboard');
  const utils = render(React.createElement(FoodPartnerDashboard));
  // Wait for initial render to settle
  await act(async () => {});
  return utils;
}

// ── Property 12: Badge increments when not on edited-videos tab ─────────────

// Feature: video-delivery-foodpartner, Property 12: Badge increments when not on edited-videos tab
describe('Property 12: Badge increments when not on edited-videos tab', () => {
  beforeEach(() => {
    mockSocket._reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('badge shows 1 after one video_edit_completed event on home tab', async () => {
    const { container } = await renderDashboard();

    await act(async () => {
      mockSocket.emit('video_edit_completed', { projectTitle: 'Test Video' });
    });

    const badge = container.querySelector('.nav-badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('1');
  });

  it('badge shows 3 after three events on home tab', async () => {
    const { container } = await renderDashboard();

    await act(async () => {
      mockSocket.emit('video_edit_completed', {});
      mockSocket.emit('video_edit_completed', {});
      mockSocket.emit('video_edit_completed', {});
    });

    const badge = container.querySelector('.nav-badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('3');
  });

  it(
    'Property 12 (fast-check): badge equals N after N events when not on edited-videos tab',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 15 }),
          async (n) => {
            cleanup();
            mockSocket._reset();

            const { container } = await renderDashboard();

            await act(async () => {
              for (let i = 0; i < n; i++) {
                mockSocket.emit('video_edit_completed', { projectTitle: `Video ${i}` });
              }
            });

            const badge = container.querySelector('.nav-badge');
            const badgeCount = badge ? parseInt(badge.textContent, 10) : 0;

            cleanup();
            return badgeCount === n;
          }
        ),
        { numRuns: 20 }
      );
    },
    60000
  );
});

// ── Property 13: WebSocket listener lifecycle ────────────────────────────────

// Feature: video-delivery-foodpartner, Property 13: WebSocket listener registered on mount and cleaned up on unmount
describe('Property 13: WebSocket listener registered on mount and cleaned up on unmount', () => {
  beforeEach(() => {
    mockSocket._reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('socket.on called with video_edit_completed on mount', async () => {
    await renderDashboard();

    const calls = mockSocket.on.mock.calls.filter(([event]) => event === 'video_edit_completed');
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });

  it('socket.off called with video_edit_completed on unmount', async () => {
    const { unmount } = await renderDashboard();

    unmount();

    const offCalls = mockSocket.off.mock.calls.filter(([event]) => event === 'video_edit_completed');
    expect(offCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('the same handler reference is used for on and off', async () => {
    const { unmount } = await renderDashboard();

    const onCall = mockSocket.on.mock.calls.find(([event]) => event === 'video_edit_completed');
    const offCall = mockSocket.off.mock.calls.find(([event]) => event === 'video_edit_completed');

    // off may not have been called yet — unmount to trigger cleanup
    unmount();

    const offCallAfter = mockSocket.off.mock.calls.find(([event]) => event === 'video_edit_completed');

    expect(onCall).toBeDefined();
    expect(offCallAfter).toBeDefined();
    expect(onCall[1]).toBe(offCallAfter[1]);
  });

  it(
    'Property 13 (fast-check): listener registered on mount and cleaned up on unmount for any render',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null), // no meaningful input needed — just repeat the check
          async () => {
            cleanup();
            mockSocket._reset();

            const { unmount } = await renderDashboard();

            const onCalls = mockSocket.on.mock.calls.filter(([e]) => e === 'video_edit_completed');
            if (onCalls.length === 0) { cleanup(); return false; }

            unmount();

            const offCalls = mockSocket.off.mock.calls.filter(([e]) => e === 'video_edit_completed');
            if (offCalls.length === 0) { cleanup(); return false; }

            // Same handler reference
            const handler = onCalls[0][1];
            const cleanedUp = offCalls.some(([, h]) => h === handler);

            cleanup();
            return cleanedUp;
          }
        ),
        { numRuns: 10 }
      );
    },
    60000
  );
});
