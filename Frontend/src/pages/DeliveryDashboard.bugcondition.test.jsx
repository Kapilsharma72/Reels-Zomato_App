/**
 * Bug Condition Exploration Tests — Bugs 1.1 & 1.4
 *
 * Property 1: Bug Condition — DeliveryDashboard logout modal & duplicate listeners
 *
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms each bug exists. DO NOT fix source code here.
 *
 * Validates: Requirements 1.1, 1.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
      mockSocketListeners[event] = mockSocketListeners[event].filter(h => h !== handler);
    } else {
      mockSocketListeners[event] = [];
    }
  }),
  emit: vi.fn((event, data) => {
    if (mockSocketListeners[event]) {
      mockSocketListeners[event].forEach(h => h(data));
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
    getCurrentUser: vi.fn().mockResolvedValue({ user: { _id: 'u1', fullName: 'Test', role: 'delivery' } }),
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
// Bug 1.1 — DeliveryDashboard logout modal calls authService.logout() (wrong name)
// =============================================================================
describe('Bug 1.1 — DeliveryDashboard logout modal calls wrong method', () => {
  beforeEach(() => {
    resetSocketListeners();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it(
    'EXPECTED TO FAIL: clicking modal Logout button should not throw TypeError and should navigate to /login',
    async () => {
      /**
       * On UNFIXED code:
       *   The modal onClick calls `authService.logout()` which is undefined.
       *   This throws: TypeError: authService.logout is not a function
       *   navigate('/login') is never called.
       *
       * On FIXED code:
       *   The modal onClick calls `handleLogout` which calls `authService.logoutUser()`.
       *   navigate('/login') is called.
       *
       * Counterexample: clicking modal Logout button throws TypeError, modal stays open.
       */
      const { default: DeliveryDashboard } = await import('./DeliveryDashboard');

      await act(async () => {
        render(
          <MemoryRouter>
            <DeliveryDashboard />
          </MemoryRouter>
        );
        await new Promise(r => setTimeout(r, 50));
      });

      // Open the logout confirmation modal
      const logoutBtn = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutBtn);

      // The modal should now be visible
      await waitFor(() => {
        expect(screen.getByText(/confirm logout/i)).toBeInTheDocument();
      });

      // Click the modal's "Logout" confirm button
      const modalLogoutBtns = screen.getAllByRole('button', { name: /logout/i });
      const confirmBtn = modalLogoutBtns[modalLogoutBtns.length - 1];

      let clickError = null;
      try {
        await act(async () => {
          fireEvent.click(confirmBtn);
          await new Promise(r => setTimeout(r, 100));
        });
      } catch (e) {
        clickError = e;
      }

      // ASSERTION: no TypeError should be thrown
      expect(clickError).toBeNull();
      // ASSERTION: navigate('/login') should be called
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    }
  );
});

// =============================================================================
// Bug 1.4 — DeliveryDashboard registers WebSocket listeners twice
// =============================================================================
describe('Bug 1.4 — DeliveryDashboard registers WebSocket listeners twice', () => {
  beforeEach(() => {
    resetSocketListeners();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it(
    'EXPECTED TO FAIL: socket.listeners("new_order").length should equal 1 after mount',
    async () => {
      /**
       * On UNFIXED code:
       *   Two useEffect blocks both call socket.on('new_order', ...).
       *   After mount, socket.listeners('new_order').length === 2.
       *
       * Counterexample: socket.listeners('new_order').length equals 2.
       */
      const { default: DeliveryDashboard } = await import('./DeliveryDashboard');

      await act(async () => {
        render(
          <MemoryRouter>
            <DeliveryDashboard />
          </MemoryRouter>
        );
        await new Promise(r => setTimeout(r, 50));
      });

      const listenerCount = mockSocket.listeners('new_order').length;
      // ASSERTION: exactly one listener should be registered
      expect(listenerCount).toBe(1);
    }
  );
});
