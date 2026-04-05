# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Food Partner Registration Writes Wrong localStorage Key
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — food partner registration with a valid response — to ensure reproducibility
  - Mock `authService.registerFoodPartner` to return `{ foodPartner: { name: 'Test', email: 'test@example.com' } }`
  - Submit the registration form with `role: 'food-partner'` and all required fields filled
  - Assert that `localStorage.getItem('userData')` contains `{ role: 'food-partner', ... }` (from Bug Condition in design: `isBugCondition` where `localStorageKeyUsed = 'tempUserData'`)
  - Assert that `localStorage.getItem('tempUserData')` is null after the fix
  - Run test on UNFIXED code — `localStorage.userData` will be null, `tempUserData` will be set
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists)
  - Document counterexample: `localStorage.userData` is null after food partner registration; `tempUserData` is set instead
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Other Registration Flows Are Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe on UNFIXED code: `role: 'user'` registration writes `localStorage.tempUserData` and navigates to `/user/home`
  - Observe on UNFIXED code: `role: 'delivery-partner'` registration navigates to `/delivery/dashboard`
  - Observe on UNFIXED code: `role: 'editor'` registration navigates to `/editor/dashboard`
  - Observe on UNFIXED code: `ProtectedRoute` with no `localStorage.userData` renders `<Navigate to="/login" />`
  - Write property-based tests: for all roles other than `'food-partner'`, the localStorage state and navigation target match the observed unfixed behavior (from Preservation Requirements in design)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix food partner registration localStorage key

  - [x] 3.1 Implement the fix in UnifiedRegister.jsx
    - In `handleSubmit`, locate the food partner branch (`formData.role === 'food-partner'`)
    - Change `localStorage.setItem('tempUserData', ...)` to `localStorage.setItem('userData', ...)` — one-line change
    - The object written already contains `role: 'food-partner'`, so no structural change is needed
    - _Bug_Condition: `isBugCondition(input)` where `input.role = 'food-partner' AND input.registrationSucceeded = true AND input.localStorageKeyUsed = 'tempUserData'`_
    - _Expected_Behavior: `localStorage.userData` contains `{ role: 'food-partner', fullName, email }` and navigation target is `/food-partner/dashboard`_
    - _Preservation: All non-food-partner registration and login flows produce identical localStorage state and navigation targets as before the fix_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Food Partner Registration Writes Correct localStorage Key
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior (localStorage.userData contains role: 'food-partner')
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Other Registration Flows Are Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all non-food-partner flows still produce the same localStorage state and navigation targets

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass; ask the user if questions arise.
