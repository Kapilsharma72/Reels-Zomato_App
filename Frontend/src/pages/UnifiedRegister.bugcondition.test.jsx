/**
 * Bug Condition Exploration Test — Task 1
 *
 * Property 1: Bug Condition - Food Partner Registration Writes Wrong localStorage Key
 *
 * CRITICAL: This test MUST FAIL on unfixed code.
 * Failure confirms the bug exists: after food partner registration,
 * localStorage.userData is null and localStorage.tempUserData is set instead.
 *
 * Validates: Requirements 1.1, 1.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import UnifiedRegister from './UnifiedRegister';
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

describe('Property 1: Bug Condition — Food Partner Registration Writes Wrong localStorage Key', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    vi.clearAllMocks();

    // Mock registerFoodPartner to return a successful response
    authService.registerFoodPartner.mockResolvedValue({
      foodPartner: {
        name: 'Test',
        email: 'test@example.com',
      },
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Helper: fill and submit the food partner registration form.
   * Navigates through both steps of the multi-step form.
   */
  async function submitFoodPartnerRegistration() {
    render(
      <MemoryRouter>
        <UnifiedRegister />
      </MemoryRouter>
    );

    // Step 1: Select food-partner role
    const foodPartnerRoleBtn = document.querySelector('[data-role="food-partner"]');
    fireEvent.click(foodPartnerRoleBtn);

    // Fill basic info
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test Partner' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123!' },
    });

    // Advance to step 2
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: Fill food partner specific fields
    await waitFor(() => screen.getByLabelText(/business name/i));

    fireEvent.change(screen.getByLabelText(/business name/i), {
      target: { value: 'Test Restaurant' },
    });
    fireEvent.change(screen.getByLabelText(/business address/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByLabelText(/business phone/i), {
      target: { value: '+91 9876543210' },
    });

    // Select cuisine type
    fireEvent.change(screen.getByLabelText(/cuisine type/i), {
      target: { value: 'indian' },
    });

    // Accept terms
    const checkbox = document.querySelector('input[type="checkbox"]');
    fireEvent.click(checkbox);

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for the async registration to complete
    await waitFor(() => {
      expect(authService.registerFoodPartner).toHaveBeenCalledTimes(1);
    });
  }

  it(
    'EXPECTED TO FAIL: after food partner registration, localStorage.userData should contain role: food-partner (but on unfixed code it is null)',
    async () => {
      await submitFoodPartnerRegistration();

      /**
       * On UNFIXED code:
       *   localStorage.getItem('userData')    === null        ← BUG
       *   localStorage.getItem('tempUserData') !== null       ← wrong key written
       *
       * On FIXED code:
       *   localStorage.getItem('userData')    contains { role: 'food-partner', ... }
       *   localStorage.getItem('tempUserData') === null
       *
       * This assertion FAILS on unfixed code, proving the bug exists.
       */
      const userData = localStorage.getItem('userData');
      const tempUserData = localStorage.getItem('tempUserData');

      // Assert userData is set and contains role: 'food-partner'
      expect(userData).not.toBeNull();
      const parsed = JSON.parse(userData);
      expect(parsed).toMatchObject({ role: 'food-partner' });

      // Assert tempUserData is NOT set (it should not be used)
      expect(tempUserData).toBeNull();
    }
  );
});
