/**
 * Preservation Property Tests — Task 2 (Preservation 3.3)
 *
 * Property 2: Preservation — Authenticated user sees UserHome content
 *
 * These tests MUST PASS on unfixed code.
 * They encode the baseline rendering behavior of UserHome so we can confirm
 * no regressions after the storedUserData scope fix (Bug 1.12) is applied.
 *
 * Observed on UNFIXED code:
 *   - UserHome renders without crash when localStorage has valid userData
 *   - No TypeError or ReferenceError is thrown during initial render
 *
 * Validates: Requirements 3.3
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, afterEach } from 'vitest';

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

// ─── Mock authService ─────────────────────────────────────────────────────────
vi.mock('../services/authService', () => ({
  default: {
    isAuthenticated: vi.fn(() => true),
    getCurrentUser: vi.fn().mockResolvedValue({
      user: { _id: 'u1', fullName: 'Test User', role: 'user' },
    }),
    clearAuthData: vi.fn(),
  },
}));

// ─── Mock uploadService ───────────────────────────────────────────────────────
vi.mock('../services/uploadService', () => ({
  postsAPI: { getPosts: vi.fn().mockResolvedValue({ posts: [] }) },
  storiesAPI: {
    getStories: vi.fn().mockResolvedValue({ stories: [] }),
  },
}));

// ─── Mock orderService ────────────────────────────────────────────────────────
vi.mock('../services/orderService', () => ({
  default: {
    getUserOrders: vi.fn().mockResolvedValue({ orders: [] }),
  },
}));

// ─── Mock useWebSocket ────────────────────────────────────────────────────────
vi.mock('../hooks/useWebSocket', () => ({
  useWebSocket: () => ({ socket: null, isConnected: false }),
}));

// ─── Mock NotificationCenter ──────────────────────────────────────────────────
vi.mock('../components/NotificationCenter', () => ({
  default: () => <div data-testid="notification-center" />,
}));

// ─── Mock StoriesViewer ───────────────────────────────────────────────────────
vi.mock('../components/StoriesViewer', () => ({
  default: (props) => props.isOpen ? <div data-testid="stories-viewer" /> : null,
}));

// ─── Mock OrderTracking ───────────────────────────────────────────────────────
vi.mock('../components/OrderTracking', () => ({
  default: () => <div data-testid="order-tracking" />,
}));

// =============================================================================
// Preservation 3.3 — Authenticated user sees UserHome content
// =============================================================================
describe('Preservation 3.3 — Authenticated user sees UserHome content', () => {
  afterEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  it('UserHome renders without crash when localStorage has valid userData', async () => {
    /**
     * Validates: Requirements 3.3
     *
     * Observed baseline: authenticated user navigating to /user/home renders
     * the UserHome page without any TypeError or ReferenceError.
     * This must continue to work after the storedUserData scope fix.
     */
    localStorage.setItem(
      'userData',
      JSON.stringify({ _id: 'u1', fullName: 'Test User', role: 'user' })
    );

    const { default: UserHome } = await import('./UserHome');

    let renderError = null;
    try {
      await act(async () => {
        render(
          <MemoryRouter>
            <UserHome />
          </MemoryRouter>
        );
        await new Promise((r) => setTimeout(r, 300));
      });
    } catch (e) {
      renderError = e;
    }

    // ASSERTION: component renders without crash (no TypeError, no ReferenceError)
    expect(renderError).toBeNull();
  });
});
