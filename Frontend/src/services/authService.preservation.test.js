/**
 * Preservation Property Tests — Task 2 (Preservation 3.1 / 3.2)
 *
 * Property 2: Preservation — Valid login flows unchanged
 *
 * These tests MUST PASS on unfixed code.
 * They encode the baseline behavior for login so we can confirm no regressions
 * after the logout fix (Bug 1.3) is applied.
 *
 * Observed on UNFIXED code:
 *   - loginUser() returns { id, fullName, email, role } and sets token cookie
 *   - loginFoodPartner() returns food partner object
 *   - logoutUser() followed by loginUser() still works correctly
 *
 * Validates: Requirements 3.1, 3.2
 */

import { vi, describe, it, expect, afterEach } from 'vitest';

// ─── Mock api config to avoid import.meta.env issues ─────────────────────────
vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:3001',
  API_ENDPOINTS: {},
}));

// =============================================================================
// Preservation 3.1 — Valid user login returns required fields
// =============================================================================
describe('Preservation 3.1 — Valid user login returns required fields', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loginUser() returns an object with id, fullName, email, and role', async () => {
    /**
     * Validates: Requirements 3.1
     *
     * Observed baseline: valid user login returns { id, fullName, email, role }
     * and sets the token cookie. This must continue to work after the logout fix.
     */
    const { default: realAuthService } = await import('./authService');

    const mockUserResponse = {
      message: 'Login successful',
      user: {
        id: 'user123',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'user',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => mockUserResponse,
    });

    const result = await realAuthService.loginUser({
      email: 'test@example.com',
      password: 'Password123!',
    });

    // ASSERTION: response contains required fields
    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.id).toBeDefined();
    expect(result.user.fullName).toBeDefined();
    expect(result.user.email).toBeDefined();
    expect(result.user.role).toBeDefined();
  });
});

// =============================================================================
// Preservation 3.2 — Valid food partner login returns food partner object
// =============================================================================
describe('Preservation 3.2 — Valid food partner login returns food partner object', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loginFoodPartner() returns a food partner object', async () => {
    /**
     * Validates: Requirements 3.2
     *
     * Observed baseline: valid food-partner login returns the food partner object.
     * This must continue to work after the logout fix.
     */
    const { default: realAuthService } = await import('./authService');

    const mockFoodPartnerResponse = {
      message: 'Login successful',
      foodPartner: {
        _id: 'fp123',
        businessName: 'Test Restaurant',
        email: 'restaurant@example.com',
        role: 'food-partner',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => mockFoodPartnerResponse,
    });

    const result = await realAuthService.loginFoodPartner({
      email: 'restaurant@example.com',
      password: 'Password123!',
    });

    // ASSERTION: response contains food partner object
    expect(result).toBeDefined();
    expect(result.foodPartner).toBeDefined();
    expect(result.foodPartner._id).toBeDefined();
    expect(result.foodPartner.businessName).toBeDefined();
  });
});

// =============================================================================
// Preservation — logoutUser does not break subsequent login
// =============================================================================
describe('Preservation — logoutUser does not break subsequent login', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loginUser() still works and returns user data after logoutUser() is called', async () => {
    /**
     * Validates: Requirements 3.1, 3.2
     *
     * Observed baseline: after logoutUser(), a new loginUser() call correctly
     * returns user data. The logout fix (clearing localStorage) must not break
     * the subsequent login flow.
     *
     * Note: On unfixed code, logoutUser() does NOT clear localStorage, but
     * loginUser() itself is unaffected — this test should PASS on unfixed code.
     */
    const { default: realAuthService } = await import('./authService');

    // Step 1: Pre-set userData as if user was previously logged in
    localStorage.setItem('userData', JSON.stringify({ id: '1', role: 'user' }));

    // Step 2: Mock logoutUser to succeed
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Logged out' }),
    });

    try {
      await realAuthService.logoutUser();
    } catch (_) {
      // ignore errors — we only care about subsequent login
    }

    // Step 3: Mock loginUser to return fresh user data
    const mockLoginResponse = {
      message: 'Login successful',
      user: {
        id: 'user456',
        fullName: 'New User',
        email: 'newuser@example.com',
        role: 'user',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => mockLoginResponse,
    });

    const result = await realAuthService.loginUser({
      email: 'newuser@example.com',
      password: 'Password123!',
    });

    // ASSERTION: loginUser still works and returns user data
    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.id).toBe('user456');
    expect(result.user.fullName).toBe('New User');
    expect(result.user.email).toBe('newuser@example.com');
    expect(result.user.role).toBe('user');
  });
});
