/**
 * Bug Condition Exploration Tests — Bugs 1.2 & 1.5
 *
 * Property 1: Bug Condition — EditorDashboard logout modal & undeclared setNotifications
 *
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms each bug exists. DO NOT fix source code here.
 *
 * Validates: Requirements 1.2, 1.5
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
    getCurrentUser: vi.fn().mockResolvedValue({ user: { _id: 'u1', fullName: 'Test Editor', role: 'editor' } }),
    clearAuthData: vi.fn(),
  },
}));

// ─── Mock videoSubmissionService ─────────────────────────────────────────────
vi.mock('../services/videoSubmissionService', () => ({
  default: {
    getAvailableProjects: vi.fn().mockResolvedValue({ success: true, projects: [] }),
    getEditorProjects: vi.fn().mockResolvedValue({ success: true, projects: [] }),
    getEditorStats: vi.fn().mockResolvedValue({ success: true, stats: {} }),
  },
}));

// ─── Mock NotificationCenter ──────────────────────────────────────────────────
vi.mock('../components/NotificationCenter', () => ({
  default: () => <div data-testid="notification-center" />,
}));

// ─── Mock VideoSubmissionsManager ────────────────────────────────────────────
vi.mock('../components/VideoSubmissionsManager', () => ({
  default: () => <div data-testid="video-submissions-manager" />,
}));

function resetSocketListeners() {
  mockSocketListeners = {};
  mockSocket.on.mockClear();
  mockSocket.off.mockClear();
  mockSocket.emit.mockClear();
}

// =============================================================================
// Bug 1.2 — EditorDashboard logout modal calls authService.logout() (wrong name)
// =============================================================================
describe('Bug 1.2 — EditorDashboard logout modal calls wrong method', () => {
  beforeEach(() => {
    resetSocketListeners();
    mockNavigate.mockClear();
    localStorage.setItem('userData', JSON.stringify({ _id: 'editor1', fullName: 'Test Editor', role: 'editor' }));
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
      const { default: EditorDashboard } = await import('./EditorDashboard');

      await act(async () => {
        render(
          <MemoryRouter>
            <EditorDashboard />
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
// Bug 1.5 — EditorDashboard references undeclared setNotifications
// =============================================================================
describe('Bug 1.5 — EditorDashboard references undeclared setNotifications', () => {
  beforeEach(() => {
    resetSocketListeners();
    mockNavigate.mockClear();
    // Set up currentEditor in localStorage so the socket effect runs
    localStorage.setItem('userData', JSON.stringify({ _id: 'editor1', fullName: 'Test Editor', role: 'editor' }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it(
    'EXPECTED TO FAIL: emitting new_video_submission should not throw ReferenceError',
    async () => {
      /**
       * On UNFIXED code:
       *   handleNewVideoSubmission calls setNotifications(...) which is not declared.
       *   This throws: ReferenceError: setNotifications is not defined
       *
       * Counterexample: component crashes on new_video_submission event.
       */
      const { default: EditorDashboard } = await import('./EditorDashboard');

      await act(async () => {
        render(
          <MemoryRouter>
            <EditorDashboard />
          </MemoryRouter>
        );
        await new Promise(r => setTimeout(r, 50));
      });

      let emitError = null;
      try {
        await act(async () => {
          // Emit the event that triggers the buggy handler
          mockSocket.emit('new_video_submission', {
            data: {
              _id: 'vs1',
              foodPartnerName: 'Test Partner',
              title: 'Test Video',
            },
          });
          await new Promise(r => setTimeout(r, 50));
        });
      } catch (e) {
        emitError = e;
      }

      // ASSERTION: no ReferenceError should be thrown
      expect(emitError).toBeNull();
    }
  );
});
