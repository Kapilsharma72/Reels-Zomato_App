# foodpartner-register-redirect Bugfix Design

## Overview

After a food partner completes registration via `UnifiedRegister.jsx`, they are redirected to `/food-partner/dashboard` but immediately bounced to `/login`. The root cause is a localStorage key mismatch: registration writes session data to `localStorage.tempUserData`, but `ProtectedRoute` reads from `localStorage.userData`. The fix is a one-line change in `UnifiedRegister.jsx` — write to `localStorage.userData` with `role: 'food-partner'`, matching the structure the login flow already uses.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — a food partner completes registration and the session is stored under the wrong localStorage key (`tempUserData` instead of `userData`)
- **Property (P)**: The desired behavior — after food partner registration, `localStorage.userData` contains `{ role: 'food-partner', ... }` and the user lands on `/food-partner/dashboard`
- **Preservation**: All other registration and login flows that must remain unchanged by the fix
- **UnifiedRegister**: The component at `Frontend/src/pages/UnifiedRegister.jsx` that handles registration for all roles
- **ProtectedRoute**: The component at `Frontend/src/components/ProtectedRoute.jsx` that reads `localStorage.userData` to authorize access to role-specific routes
- **tempUserData**: The incorrect localStorage key currently used by `UnifiedRegister` for food partner session data — not read by `ProtectedRoute`
- **userData**: The correct localStorage key read by `ProtectedRoute` to determine the authenticated user's role

## Bug Details

### Bug Condition

The bug manifests when a food partner submits the registration form successfully. `UnifiedRegister.jsx` stores the session object under `localStorage.tempUserData`, but `ProtectedRoute` only reads `localStorage.userData`. Because `userData` is absent (or stale from a previous session), `ProtectedRoute` either redirects to `/login` or to the wrong role's home page.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type RegistrationAttempt {
    role: string,
    registrationSucceeded: boolean,
    localStorageKeyUsed: string   // key written after registration
  }
  OUTPUT: boolean

  RETURN input.role = 'food-partner'
         AND input.registrationSucceeded = true
         AND input.localStorageKeyUsed = 'tempUserData'  // wrong key
END FUNCTION
```

### Examples

- Food partner registers → `localStorage.tempUserData` is set, `localStorage.userData` is absent → `ProtectedRoute` redirects to `/login` (bug)
- Food partner registers when a stale `userData` with `role: 'user'` exists → `ProtectedRoute` redirects to `/user/home` instead of `/food-partner/dashboard` (bug)
- Food partner logs in → `localStorage.userData` is set with `role: 'food-partner'` → `ProtectedRoute` allows access to `/food-partner/dashboard` (works correctly, reference behavior)
- Regular user registers → `localStorage.tempUserData` is set → redirected to `/user/home` (currently works because `ProtectedRoute` is not involved in the same way, but is still inconsistent)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Regular user (`role: 'user'`) registration must continue to redirect to `/user/home`
- Food partner login must continue to store under `localStorage.userData` with `role: 'food-partner'` and redirect to `/food-partner/dashboard`
- Delivery partner registration must continue to redirect to `/delivery/dashboard`
- Editor registration must continue to redirect to `/editor/dashboard`
- Unauthenticated access to `/food-partner/dashboard` must continue to redirect to `/login`

**Scope:**
All inputs that do NOT involve a food partner completing registration are completely unaffected by this fix. This includes:
- All login flows (food partner, user, delivery partner, editor)
- Registration flows for roles other than `food-partner`
- Direct navigation to protected routes without a session

## Hypothesized Root Cause

Based on the bug description and code review, the root cause is confirmed:

1. **Wrong localStorage Key on Food Partner Registration**: In `UnifiedRegister.jsx` (lines ~110-117), after a successful food partner registration, the code writes:
   ```js
   localStorage.setItem('tempUserData', JSON.stringify({ ... role: 'food-partner' }));
   ```
   `ProtectedRoute` reads only `localStorage.userData`, so this data is invisible to the auth check.

2. **No Equivalent Bug in Login Flow**: `FoodPartnerLogin.jsx` does not write to localStorage at all — it relies on the cookie set by the backend. `ProtectedRoute` falls through to `authService.isAuthenticated()` which checks for a cookie, then reads `localStorage.userData`. The registration flow sets no cookie (the backend may set one, but the frontend doesn't write `userData`), so the fallback also fails.

3. **Stale userData Interference**: If a previous session left `localStorage.userData` with `role: 'user'`, `ProtectedRoute` will redirect the newly registered food partner to `/user/home` instead of `/login`, making the bug appear differently depending on prior state.

4. **tempUserData is Never Read**: `authService.clearAuthData()` does remove `tempUserData`, but nothing in the auth flow reads it for access control — confirming it was dead storage.

## Correctness Properties

Property 1: Bug Condition - Food Partner Registration Writes Correct Session Data

_For any_ registration attempt where `role` is `'food-partner'` and registration succeeds (isBugCondition returns true), the fixed `UnifiedRegister` SHALL write the session object to `localStorage.userData` with `role: 'food-partner'`, such that `ProtectedRoute` grants access to `/food-partner/dashboard` without redirecting.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Other Registration and Login Flows Are Unchanged

_For any_ registration or login attempt where the role is NOT `'food-partner'`, or where the action is a login rather than registration (isBugCondition returns false), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing redirects, localStorage writes, and access control outcomes.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `Frontend/src/pages/UnifiedRegister.jsx`

**Function**: `handleSubmit` — food partner branch

**Specific Changes**:

1. **Replace `tempUserData` with `userData`**: Change the `localStorage.setItem` key from `'tempUserData'` to `'userData'` in the food partner registration branch.

2. **Ensure `role` field is present**: The object written must include `role: 'food-partner'` so `ProtectedRoute`'s role check passes. The current code already includes this field, so no structural change is needed beyond the key name.

**Before:**
```js
if (response && response.foodPartner) {
  localStorage.setItem('tempUserData', JSON.stringify({
    fullName: response.foodPartner.name,
    email: response.foodPartner.email,
    role: 'food-partner'
  }));
}
```

**After:**
```js
if (response && response.foodPartner) {
  localStorage.setItem('userData', JSON.stringify({
    fullName: response.foodPartner.name,
    email: response.foodPartner.email,
    role: 'food-partner'
  }));
}
```

No other files need to change. The redirect to `/food-partner/dashboard` is already correct in the `switch` statement.

## Testing Strategy

### Validation Approach

Two-phase approach: first run exploratory tests against the unfixed code to confirm the bug and root cause, then verify the fix satisfies Property 1 and Property 2.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug on unfixed code and confirm the root cause (wrong localStorage key).

**Test Plan**: Mock `authService.registerFoodPartner` to return a successful response, submit the registration form with `role: 'food-partner'`, then assert on localStorage state and navigation target.

**Test Cases**:
1. **Wrong Key Written**: After food partner registration, assert `localStorage.getItem('tempUserData')` is set and `localStorage.getItem('userData')` is null — confirms the bug (will pass on unfixed code, demonstrating the defect)
2. **ProtectedRoute Rejects**: Mount `ProtectedRoute` with `requiredRole="food-partner"` and no `userData` in localStorage — assert it renders `<Navigate to="/login" />` (confirms the downstream failure)
3. **Stale userData Misdirects**: Set `localStorage.userData` to `{ role: 'user' }`, complete food partner registration, assert `ProtectedRoute` redirects to `/user/home` instead of allowing dashboard access

**Expected Counterexamples**:
- `localStorage.userData` is null after food partner registration
- `ProtectedRoute` redirects to `/login` or `/user/home` instead of rendering the dashboard

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := handleSubmit_fixed(input)
  ASSERT localStorage.getItem('userData') contains role = 'food-partner'
  ASSERT navigation target = '/food-partner/dashboard'
  ASSERT ProtectedRoute(requiredRole='food-partner') renders children
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleSubmit_original(input) produces same localStorage state
         AND same navigation target
         AS handleSubmit_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many role/input combinations automatically
- It catches edge cases like empty responses or missing fields
- It provides strong guarantees that non-food-partner flows are unaffected

**Test Cases**:
1. **User Registration Preservation**: Register with `role: 'user'` — assert `localStorage.userData` (or `tempUserData` if that's the existing behavior) and redirect to `/user/home` are unchanged
2. **Delivery Partner Registration Preservation**: Register with `role: 'delivery-partner'` — assert redirect to `/delivery/dashboard` is unchanged
3. **Editor Registration Preservation**: Register with `role: 'editor'` — assert redirect to `/editor/dashboard` is unchanged
4. **Unauthenticated Access Preservation**: With no localStorage entries, assert `ProtectedRoute` still redirects to `/login`

### Unit Tests

- Test that food partner registration writes `localStorage.userData` with `role: 'food-partner'`
- Test that `ProtectedRoute` grants access when `localStorage.userData` has `role: 'food-partner'`
- Test that `ProtectedRoute` redirects to `/login` when `localStorage.userData` is absent
- Test edge case: `response.foodPartner` is null/undefined — no localStorage write should occur

### Property-Based Tests

- Generate random valid food partner registration responses and verify `localStorage.userData` always contains `role: 'food-partner'`
- Generate random non-food-partner roles and verify the localStorage key and redirect behavior match the original (unfixed) code exactly
- Generate random `localStorage.userData` states and verify `ProtectedRoute` role-check outcomes are consistent before and after the fix for non-food-partner roles

### Integration Tests

- Full registration flow: fill form as food partner → submit → assert landing on `/food-partner/dashboard` with dashboard rendered
- Verify food partner login flow is unaffected: login → assert landing on `/food-partner/dashboard`
- Verify user registration flow is unaffected: register as user → assert landing on `/user/home`
- Verify that after food partner registration, refreshing `/food-partner/dashboard` does not redirect (session persists in localStorage)
