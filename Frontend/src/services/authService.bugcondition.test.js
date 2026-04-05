/**
 * Bug Condition Exploration Test — Bug 1.3
 *
 * Property 1: Bug Condition — logoutUser does not clear localStorage
 *
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists. DO NOT fix source code here.
 *
 * Validates: Requirements 1.3
 */

import { vi, describe, it, expect, afterEach } from 'vitest';

// ─── Mock api config to avoid import.meta.env issues ─────────────────────────
vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:3001',
  API_ENDPOINTS: {},
}));

// =============================================================================
// Bug 1.3 — authService.logoutUser() does not clear localStorage
// =============================================================================
describe('Bug 1.3 — logoutUser does not clear localStorage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it(
    'EXPECTED TO FAIL: localStorage.getItem("userData") should be null after logoutUser() resolves',
    async () => {
      /**
       * On UNFIXED code:
       *   logoutUser() only calls GET /api/auth/user/logout.
       *   It never calls clearAuthData() or removes localStorage items.
       *   localStorage.getItem('userData') remains non-null after the call.
       *
       * Counterexample: localStorage.getItem('userData') is non-null after logoutUser().
       */

      // Import the REAL authService (not mocked)
      const { default: realAuthService } = await import('./authService');

      // Pre-set userData in localStorage
      localStorage.setItem('userData', JSON.stringify({ id: '1', role: 'user' }));
      localStorage.setItem('tempUserData', JSON.stringify({ id: '1' }));

      // Mock fetch so logoutUser() doesn't actually hit the network
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'Logged out' }),
      });

      try {
        await realAuthService.logoutUser();
      } catch (_) {
        // ignore network errors — we only care about localStorage state
      } finally {
        global.fetch = originalFetch;
      }

      // ASSERTION: userData should be cleared after logout
      expect(localStorage.getItem('userData')).toBeNull();
    }
  );
});
