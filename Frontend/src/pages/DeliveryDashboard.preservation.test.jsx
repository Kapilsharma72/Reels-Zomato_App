/**
 * Preservation Property Tests — Task 2 (Preservation 3.7)
 *
 * Property 2: Preservation — NotificationCenter WebSocket notifications unaffected
 *
 * These tests MUST PASS on unfixed code.
 * They encode the baseline notification behavior of DeliveryDashboard so we can
 * confirm no regressions after the duplicate listener fix (Bug 1.4) is applied.
 *
 * Observed on UNFIXED code:
 *   - DeliveryDashboard registers new_order listeners when socket is connected
 *   - Due to Bug 1.4 (duplicate listeners), currently 2 handlers fire per event
 *   - This test documents the CURRENT baseline (2 handler calls) on unfixed code
 *   - After the fix, exactly 1 handler should fire per event (see task 4.3)
 *
 * Validates: Requirements 3.7
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ─── Mock react-router-dom ────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Mock api config to avoid import.meta.env issues ─────────────────────────
vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:3001',
  API_ENDPOINTS: {
    FOOD: 'http://localhost:3001/api/food',
    AUTH: 'http://localhost:3001/api/auth',
    FOOD_PARTNER: 'http://localhost:3001/api/food-partner',
    POSTS: 'http://localhost:3001/api/posts',
    STORIES: 'http://localhost:3001/api/stories',
    SEARCH: 'http://localhost:3001/api/search',
    ORDERS: 'http://localhost:3001/api/orders',
    ADMIN: 'http://localhost:3001/api/admin',
  },
}));

// ─── Controllable mock socket ─────────────────────────────────────────────────
let mockSocketListeners = {};
const mockSocket = {
  on: vi.fn((event, handler) => {
    if (!mockSocketListeners[event]) mockSocketListeners[event] = [];
    mockSocketListeners[event].push(handler);
  }),
  off: vi.fn((event, handler) => {
    if (!mockSocketListeners[event]) return;
    if (handler) {
      mockSocketListeners[event] = mockSocketListeners[event].filter((h) => h !== handler);
    } else {
      mockSocketListeners[event] = [];
    }
  }),
  emit: vi.fn((event, data) => {
    if (mockSocketListeners[event]) {
      mockSocketListeners[event].forEach((h) => h(data));
    }
  }),
  listeners: (event) => mockSocketListeners[event] || [],
};

vi.mock('../hooks/useWebSocket', () => ({
  useWebSocket: () => ({ socket: mockSocket, isConnected: true }),
}));

// ─── Mock authService ─────────────────────────────────────────────────────────
vi.mock('../services/authService', () => ({
  default: {
    logoutUser: vi.fn().mockResolvedValue({}),
    isAuthenticated: vi.fn(() => true),
    getCurrentUser: vi.fn().mockResolvedValue({
      user: { _id: 'u1', fullName: 'Test Delivery', role: 'delivery' },
    }),
    clearAuthData: vi.fn(),
  },
}));

// ─── Mock deliveryService ─────────────────────────────────────────────────────
vi.mock('../services/deliveryService', () => ({
  default: {
    getAvailableOrders: vi.fn().mockResolvedValue({ success: true, orders: [] }),
    getDeliveryPartnerOrders: vi.fn().mockResolvedValue({ success: true, orders: [] }),
    getDeliveryStats: vi.fn().mockResolvedValue({ success: true, stats: {} }),
  },
}));

// ─── Mock NotificationCenter ──────────────────────────────────────────────────
vi.mock('../components/NotificationCenter', () => ({
  default: () => <div data-testid="notification-center" />,
}));

function resetSocketListeners() {
  mockSocketListeners = {};
  mockSocket.on.mockClear();
  mockSocket.off.mockClear();
  mockSocket.emit.mockClear();
}

// =============================================================================
// Preservation 3.7 — NotificationCenter WebSocket notifications unaffected
// =============================================================================
describe('Preservation 3.7 — NotificationCenter WebSocket notifications unaffected', () => {
  beforeEach(() => {
    resetSocketListeners();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    resetSocketListeners();
  });

  it(
    'new_order event fires at least one handler after mount (baseline: currently 2 due to Bug 1.4)',
    async () => {
      /**
       * Validates: Requirements 3.7
       *
       * Observed baseline on UNFIXED code:
       *   Due to Bug 1.4 (duplicate listeners), a single new_order event fires
       *   two handlers. The socket.on('new_order', ...) is called twice on mount.
       *
       * This test asserts the MINIMUM: at least one new_order listener is registered.
       * This passes on BOTH unfixed code (2 listeners) and fixed code (1 listener).
       *
       * DOCUMENTED BASELINE: On unfixed code, socket.listeners('new_order').length === 2.
       * After the fix, socket.listeners('new_order').length === 1.
       */
      const { default: DeliveryDashboard } = await import('./DeliveryDashboard');

      await act(async () => {
        render(
          <MemoryRouter>
            <DeliveryDashboard />
          </MemoryRouter>
        );
        await new Promise((r) => setTimeout(r, 100));
      });

      // ASSERTION: at least one new_order listener is registered
      // (On unfixed code this will be 2 due to Bug 1.4 — that is the documented baseline)
      const listenerCount = mockSocket.listeners('new_order').length;
      expect(listenerCount).toBeGreaterThanOrEqual(1);
    }
  );

  it(
    'new_order event handler is called when event fires (WebSocket notifications work)',
    async () => {
      /**
       * Validates: Requirements 3.7
       *
       * Observed baseline: when a new_order event fires, the registered handlers
       * are called. This must continue to work after the duplicate listener fix.
       */
      const { default: DeliveryDashboard } = await import('./DeliveryDashboard');

      let handlerCallCount = 0;
      const originalOn = mockSocket.on;
      mockSocket.on = vi.fn((event, handler) => {
        if (event === 'new_order') {
          const wrappedHandler = (data) => {
            handlerCallCount++;
            handler(data);
          };
          if (!mockSocketListeners[event]) mockSocketListeners[event] = [];
          mockSocketListeners[event].push(wrappedHandler);
        } else {
          originalOn(event, handler);
        }
      });

      await act(async () => {
        render(
          <MemoryRouter>
            <DeliveryDashboard />
          </MemoryRouter>
        );
        await new Promise((r) => setTimeout(r, 100));
      });

      // Emit a new_order event
      await act(async () => {
        mockSocket.emit('new_order', {
          orderId: 'order_test_1',
          customerName: 'Test Customer',
          total: 250,
        });
        await new Promise((r) => setTimeout(r, 100));
      });

      // ASSERTION: at least one handler was called when new_order fired
      expect(handlerCallCount).toBeGreaterThanOrEqual(1);
    }
  );
});
