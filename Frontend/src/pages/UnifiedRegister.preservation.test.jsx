/**
 * Preservation Property Tests — Task 2
 *
 * Property 2: Preservation - Other Registration Flows Are Unchanged
 *
 * These tests MUST PASS on unfixed code.
 * They encode the baseline behavior for all non-food-partner roles,
 * so we can confirm no regressions after the fix is applied.
 *
 * Observed on UNFIXED code:
 *   - role: 'user'             → navigates to /user/home
 *   - role: 'delivery-partner' → navigates to /delivery/dashboard
 *   - role: 'editor'           → navigates to /editor/dashboard
 *   - ProtectedRoute with no localStorage.userData → renders <Navigate to="/login" />
 *
 * Validates: Requirements 3.1, 3.3, 3.4, 3.5
 */

import React from 'react';
import { render, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import UnifiedRegister from './UnifiedRegister';
import ProtectedRoute from '../components/ProtectedRoute';
import authService from '../services/authService';

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock authService
vi.mock('../services/authService', () => ({
  default: {
    registerFoodPartner: vi.fn(),
    registerUser: vi.fn(),
    isAuthenticated: vi.fn(() => false),
  },
}));

// ---------------------------------------------------------------------------
// Helper: fill and submit the registration form for a given role
// ---------------------------------------------------------------------------
async function submitRegistration(role) {
  const { container } = render(
    <MemoryRouter>
      <UnifiedRegister />
    </MemoryRouter>
  );
  const q = within(container);

  if (role !== 'user') {
    fireEvent.click(container.querySelector(`[data-role="${role}"]`));
  }

  fireEvent.change(q.getByLabelText(/full name/i), { target: { value: 'Test User' } });
  fireEvent.change(q.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
  fireEvent.change(q.getByLabelText(/^password$/i), { target: { value: 'Password123!' } });
  fireEvent.change(q.getByLabelText(/confirm password/i), { target: { value: 'Password123!' } });

  fireEvent.click(q.getByRole('button', { name: /next/i }));

  if (role === 'user') {
    await waitFor(() => q.getByLabelText(/phone number/i));
  } else if (role === 'delivery-partner') {
    await waitFor(() => q.getByLabelText(/vehicle type/i));
    fireEvent.change(q.getByLabelText(/vehicle type/i), { target: { value: 'bike' } });
    fireEvent.change(q.getByLabelText(/license number/i), { target: { value: 'DL-1234' } });
  } else if (role === 'editor') {
    await waitFor(() => q.getByLabelText(/years of experience/i));
    fireEvent.change(q.getByLabelText(/years of experience/i), { target: { value: '1-3' } });
  }

  fireEvent.click(container.querySelector('input[type="checkbox"]'));
  fireEvent.click(q.getByRole('button', { name: /create account/i }));

  await waitFor(() => expect(authService.registerUser).toHaveBeenCalledTimes(1));
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Property 2: Preservation — Other Registration Flows Are Unchanged', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    vi.clearAllMocks();
    authService.registerUser.mockResolvedValue({
      user: { fullName: 'Test User', email: 'test@example.com', role: 'user' },
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  // 3.1 — user registration → /user/home
  it('user registration navigates to /user/home', async () => {
    await submitRegistration('user');
    // Advance the 2000ms setTimeout that triggers navigation
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(mockNavigate).toHaveBeenCalledWith('/user/home');
  }, 10000);

  // 3.3 — delivery-partner registration → /delivery/dashboard
  it('delivery-partner registration navigates to /delivery/dashboard', async () => {
    await submitRegistration('delivery-partner');
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(mockNavigate).toHaveBeenCalledWith('/delivery/dashboard');
  }, 10000);

  // 3.4 — editor registration → /editor/dashboard
  it('editor registration navigates to /editor/dashboard', async () => {
    await submitRegistration('editor');
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(mockNavigate).toHaveBeenCalledWith('/editor/dashboard');
  }, 10000);

  // 3.5 — ProtectedRoute with no localStorage.userData → Navigate to /login
  it('ProtectedRoute with no localStorage.userData renders Navigate to /login', () => {
    localStorage.clear();
    authService.isAuthenticated.mockReturnValue(false);

    const { container } = render(
      <MemoryRouter initialEntries={['/food-partner/dashboard']}>
        <ProtectedRoute requiredRole="food-partner">
          <div>Dashboard Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(container.textContent).not.toContain('Dashboard Content');
  });
});
