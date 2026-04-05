# Implementation Plan

- [x] 1. Write bug condition exploration tests (BEFORE implementing any fix)
  - **Property 1: Bug Condition** - Multi-Bug Exploration Suite
  - **CRITICAL**: Write ALL of these tests BEFORE implementing any fix
  - **GOAL**: Surface counterexamples that confirm each bug exists on unfixed code
  - **EXPECTED OUTCOME**: Tests FAIL on unfixed code (this is correct — it proves the bugs exist)
  - **DO NOT attempt to fix the code when tests fail**

  **Bug 1.1 / 1.2 — Wrong logout method name**
  - Render DeliveryDashboard with a mock `authService` that has `logoutUser` but NOT `logout`
  - Open the logout confirmation modal and click the "Logout" button
  - Assert: no TypeError is thrown and `navigate('/login')` is called
  - Run on UNFIXED code — expect FAILURE: `TypeError: authService.logout is not a function`
  - Repeat for EditorDashboard modal
  - Document counterexample: clicking modal Logout button throws TypeError, modal stays open

  **Bug 1.3 — logoutUser does not clear localStorage**
  - Call `authService.logoutUser()` with `localStorage.setItem('userData', '{"id":"1"}')` pre-set
  - Assert: `localStorage.getItem('userData')` returns `null` after the call resolves
  - Run on UNFIXED code — expect FAILURE: userData persists in localStorage after logout
  - Document counterexample: `localStorage.getItem('userData')` is non-null after logoutUser()

  **Bug 1.4 — DeliveryDashboard registers WebSocket listeners twice**
  - Mount DeliveryDashboard with a mock socket
  - Assert: `socket.listeners('new_order').length === 1`
  - Run on UNFIXED code — expect FAILURE: listener count is 2
  - Document counterexample: `socket.listeners('new_order').length` equals 2

  **Bug 1.5 — EditorDashboard references undeclared setNotifications**
  - Mount EditorDashboard with a mock socket that emits `new_video_submission`
  - Assert: no ReferenceError is thrown
  - Run on UNFIXED code — expect FAILURE: `ReferenceError: setNotifications is not defined`
  - Document counterexample: component crashes on `new_video_submission` event

  **Bug 1.6 — createOrder silently creates Default Restaurant**
  - POST `/api/orders` with a non-existent `foodPartnerId` (valid ObjectId format, no DB match)
  - Assert: response status is 400 with message "Food partner not found"
  - Assert: no new FoodPartner document is created in the DB
  - Run on UNFIXED code — expect FAILURE: response is 201 with a "Default Restaurant" order
  - Document counterexample: `{ foodPartnerId: "000000000000000000000001" }` → 201 response

  **Bug 1.7 — rateOrder rejects 'completed' status**
  - Create an order with `status: 'completed'`, POST to `/api/orders/:id/rate` with `{ rating: 5 }`
  - Assert: response status is 200
  - Run on UNFIXED code — expect FAILURE: response is 403 "Can only rate delivered orders"
  - Document counterexample: order with status='completed' returns 403 on rating attempt

  **Bug 1.8 — StoriesViewer crashes on undefined currentMedia**
  - Render StoriesViewer with `stories=[{ media: [] }]`, `isOpen=true`, `isPlaying=true`
  - Assert: no TypeError is thrown
  - Run on UNFIXED code — expect FAILURE: `TypeError: Cannot read properties of undefined (reading 'duration')`
  - Document counterexample: empty media array causes crash in startProgress

  **Bug 1.9 — fetchStories sorts by formatted string instead of ISO date**
  - Call `fetchStories` and inspect the resulting story groups array
  - Assert: for every group, `new Date(group.sortKey)` is a valid (non-NaN) Date
  - Run on UNFIXED code — expect FAILURE: `new Date(group.time)` returns Invalid Date for "2h ago"
  - Document counterexample: `new Date("2h ago")` → NaN, sort order is non-deterministic

  **Bug 1.12 — storedUserData not accessible in catch block**
  - Mock `authService.getCurrentUser()` to throw a network error
  - Call `fetchCurrentUser()` and assert: no ReferenceError is thrown in the catch handler
  - Run on UNFIXED code — expect FAILURE: `ReferenceError: storedUserData is not defined`
  - Document counterexample: catch block crashes when API throws before storedUserData is assigned

  **Bug 1.13 — sanitizeValue checks raw newline instead of '$'**
  - Call `sanitizeValue({ "$where": "malicious" })` and assert the `$where` key is deleted
  - Run on UNFIXED code — expect FAILURE: `$where` key survives because `'$where'.startsWith('\n')` is false
  - Document counterexample: `sanitizeValue({ "$where": "x" })` returns `{ "$where": "x" }` unchanged

  - Mark task complete when all exploration tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.12, 1.13_

- [x] 2. Write preservation property tests (BEFORE implementing any fix)
  - **Property 2: Preservation** - Existing Behavior Baseline
  - **IMPORTANT**: Follow observation-first methodology — run UNFIXED code with non-buggy inputs first
  - **EXPECTED OUTCOME**: ALL tests PASS on unfixed code (confirms baseline to preserve)

  **Preservation 3.1 / 3.2 — Valid login flows unchanged**
  - Observe: valid user login returns `{ id, fullName, email, role }` and sets token cookie
  - Observe: valid food-partner login returns food partner object and sets token cookie
  - Write property test: for any valid credentials, login response contains required fields
  - Verify passes on UNFIXED code

  **Preservation 3.3 — Authenticated user sees UserHome content**
  - Observe: authenticated user navigating to `/user/home` renders posts, stories, categories
  - Write test: UserHome renders without crash when localStorage has valid userData
  - Verify passes on UNFIXED code

  **Preservation 3.5 — StoriesViewer with valid media works correctly**
  - Observe: StoriesViewer with non-empty media array plays stories, shows progress bars
  - Write property test: for any story group with `media.length >= 1`, startProgress runs without error
  - Verify passes on UNFIXED code

  **Preservation 3.6 — Valid order creation still works**
  - Observe: POST `/api/orders` with a real `foodPartnerId` returns 201 with order details
  - Write property test: for any request with a valid foodPartnerId, response is 201
  - Verify passes on UNFIXED code

  **Preservation 3.7 — NotificationCenter WebSocket notifications unaffected**
  - Observe: DeliveryDashboard with a single socket mount shows one notification per event
  - Write test: after fix, `new_order` event produces exactly one notification entry
  - Verify baseline (two notifications) on UNFIXED code, document it

  **Preservation — logoutUser does not break subsequent login**
  - Observe: after logoutUser(), a new loginUser() call correctly stores new userData
  - Write test: login after logout sets fresh userData in localStorage
  - Verify passes on UNFIXED code (login itself is unaffected by the missing clearAuthData)

  - Mark task complete when all preservation tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7_

- [x] 3. Fix authService — add clearAuthData() in finally blocks (Bug 1.3)

  - [x] 3.1 Implement fix in Frontend/src/services/authService.js
    - Wrap `logoutUser()` body in try/finally; call `this.clearAuthData()` in the finally block
    - Apply the same try/finally pattern to `logoutFoodPartner()`
    - `clearAuthData()` already removes `userData`, `tempUserData`, `token`, `authToken` from localStorage
    - _Bug_Condition: localStorage.getItem('userData') IS NOT null AFTER logoutUser() resolves_
    - _Expected_Behavior: localStorage.getItem('userData') returns null after logoutUser() resolves_
    - _Preservation: loginUser() and loginFoodPartner() flows are unchanged; clearAuthData() only runs on logout_
    - _Requirements: 1.3, 2.2, 3.1, 3.2_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - logoutUser clears localStorage
    - Re-run the SAME test from task 1 (Bug 1.3 exploration test)
    - **EXPECTED OUTCOME**: Test PASSES — `localStorage.getItem('userData')` returns null after logout
    - _Requirements: 2.2_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Login flow unchanged after logout fix
    - Re-run the SAME preservation tests from task 2
    - **EXPECTED OUTCOME**: Tests PASS — login after logout still works correctly

- [x] 4. Fix DeliveryDashboard — replace inline logout call and remove duplicate useEffect (Bugs 1.1, 1.4)

  - [x] 4.1 Implement fix in Frontend/src/pages/DeliveryDashboard.jsx
    - In the logout confirmation modal, replace `onClick={async () => { await authService.logout(); navigate('/login'); }}` with `onClick={handleLogout}`
    - Delete the second `useEffect` block (the one with anonymous handlers for `new_order`, `order_update`, `order_assigned`, `order_ready` and no named references in cleanup)
    - Keep only the first `useEffect` which uses named handler functions with proper `socket.off(handler)` cleanup
    - Add `order_ready` handling to the first effect if not already present
    - _Bug_Condition (1.1): authService.logout IS undefined AND modal Logout button is clicked_
    - _Bug_Condition (1.4): socket.listeners('new_order').length > 1_
    - _Expected_Behavior: handleLogout is called; each listener registered exactly once_
    - _Preservation: WebSocket notifications still fire; handleLogout still calls logoutUser() and navigates_
    - _Requirements: 1.1, 1.4, 2.1, 2.3, 3.7_

  - [x] 4.2 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - DeliveryDashboard logout modal and single listener
    - Re-run the SAME tests from task 1 (Bug 1.1 and Bug 1.4 exploration tests)
    - **EXPECTED OUTCOME**: Both tests PASS

  - [x] 4.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Notification behavior preserved
    - Re-run the SAME preservation tests from task 2
    - **EXPECTED OUTCOME**: Tests PASS — one notification per WebSocket event

- [x] 5. Fix EditorDashboard — replace inline logout call and add notifications state (Bugs 1.2, 1.5)

  - [x] 5.1 Implement fix in Frontend/src/pages/EditorDashboard.jsx
    - In the logout confirmation modal, replace `onClick={async () => { await authService.logout(); navigate('/login'); }}` with `onClick={handleLogout}`
    - Add `const [notifications, setNotifications] = useState([]);` to the state declarations at the top of the `EditorDashboard` component, alongside the other state variables
    - _Bug_Condition (1.2): authService.logout IS undefined AND modal Logout button is clicked_
    - _Bug_Condition (1.5): setNotifications IS NOT defined IN EditorDashboard scope_
    - _Expected_Behavior: handleLogout is called; setNotifications updates notifications array_
    - _Preservation: WebSocket video submission handlers continue to work; handleLogout navigates correctly_
    - _Requirements: 1.2, 1.5, 2.1, 2.4_

  - [x] 5.2 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - EditorDashboard logout modal and setNotifications
    - Re-run the SAME tests from task 1 (Bug 1.2 and Bug 1.5 exploration tests)
    - **EXPECTED OUTCOME**: Both tests PASS

  - [x] 5.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Editor WebSocket handlers unaffected
    - Re-run the SAME preservation tests from task 2
    - **EXPECTED OUTCOME**: Tests PASS

- [x] 6. Fix UserHome — store raw createdAt for sorting and move storedUserData before try (Bugs 1.9, 1.12)

  - [x] 6.1 Implement fix in Frontend/src/pages/UserHome.jsx
    - In `fetchStories`, when creating a group add `createdAt: story.createdAt` alongside `time: formatTimeAgo(story.createdAt)`
    - When updating time to the most recent story, also update `createdAt: story.createdAt`
    - In the FINAL FALLBACK merge block, update `createdAt` when merging groups with the same business name
    - Change the final sort to use `new Date(b.createdAt) - new Date(a.createdAt)` instead of `new Date(b.time) - new Date(a.time)`
    - In `fetchCurrentUser`, move `let storedUserData = null;` to before the `try` block; inside `try`, assign `storedUserData = localStorage.getItem('userData')`
    - _Bug_Condition (1.9): EXISTS group WHERE isNaN(new Date(group.time))_
    - _Bug_Condition (1.12): storedUserData IS referenced IN catch block AND declared WITH const INSIDE try_
    - _Expected_Behavior: sort uses valid ISO date; catch block accesses storedUserData without ReferenceError_
    - _Preservation: Story display order is chronological; fetchCurrentUser redirect logic unchanged_
    - _Requirements: 1.9, 1.12, 2.8, 2.10, 3.3_

  - [x] 6.2 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - Valid sort key and accessible storedUserData
    - Re-run the SAME tests from task 1 (Bug 1.9 and Bug 1.12 exploration tests)
    - **EXPECTED OUTCOME**: Both tests PASS

  - [x] 6.3 Verify preservation tests still pass
    - **Property 2: Preservation** - UserHome content rendering unchanged
    - Re-run the SAME preservation tests from task 2
    - **EXPECTED OUTCOME**: Tests PASS

- [x] 7. Fix StoriesViewer — add null guard in startProgress (Bug 1.8)

  - [x] 7.1 Implement fix in Frontend/src/components/StoriesViewer.jsx
    - Inside the `startProgress` useCallback, add `if (!currentMedia) return;` as the first line of the function body, before accessing `currentMedia.duration`
    - _Bug_Condition: currentMedia IS undefined AND isOpen IS true AND isPlaying IS true_
    - _Expected_Behavior: startProgress returns early without accessing currentMedia.duration_
    - _Preservation: StoriesViewer with valid non-empty media arrays continues to play with progress bars_
    - _Requirements: 1.8, 2.7, 3.5_

  - [x] 7.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - StoriesViewer null guard
    - Re-run the SAME test from task 1 (Bug 1.8 exploration test)
    - **EXPECTED OUTCOME**: Test PASSES — no TypeError when media array is empty

  - [x] 7.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Valid story playback unchanged
    - Re-run the SAME preservation tests from task 2
    - **EXPECTED OUTCOME**: Tests PASS

- [x] 8. Fix order.controller — return 400 for unknown foodPartnerId and accept 'completed' in rateOrder (Bugs 1.6, 1.7)

  - [x] 8.1 Implement fix in Backend/src/controllers/order.controller.js
    - In `createOrder`, replace the entire `if (!foodPartner) { ... }` block (which creates/finds the default partner) with an early return: `if (!foodPartner) { return res.status(400).json({ message: 'Food partner not found' }); }`
    - Also remove the `isValidObjectId` check block that comments "we'll create a default partner" since it's no longer needed
    - In `rateOrder`, change `if (order.status !== 'delivered')` to `if (order.status !== 'delivered' && order.status !== 'completed')`
    - _Bug_Condition (1.6): FoodPartnerModel.findById(foodPartnerId) IS null_
    - _Bug_Condition (1.7): order.status === 'completed' AND order.status !== 'delivered'_
    - _Expected_Behavior (1.6): HTTP 400 with "Food partner not found"; no FoodPartner document created_
    - _Expected_Behavior (1.7): HTTP 200 rating saved for both 'delivered' and 'completed' orders_
    - _Preservation: Valid orders with existing foodPartnerId still return 201; 'delivered' orders still rateable_
    - _Requirements: 1.6, 1.7, 2.5, 2.6, 3.6_

  - [x] 8.2 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - 400 for unknown partner and rating 'completed' orders
    - Re-run the SAME tests from task 1 (Bug 1.6 and Bug 1.7 exploration tests)
    - **EXPECTED OUTCOME**: Both tests PASS

  - [x] 8.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Valid order creation unchanged
    - Re-run the SAME preservation tests from task 2
    - **EXPECTED OUTCOME**: Tests PASS — valid foodPartnerId still creates order with 201

- [x] 9. Fix Backend/src/app.js — replace corrupted newline with '$' in sanitizeValue (Bug 1.13)

  - [x] 9.1 Implement fix in Backend/src/app.js
    - In the `sanitizeValue` function, replace the corrupted `key.startsWith('\n')` (raw newline character embedded in source) with `key.startsWith('$')`
    - The corrected line should read: `if (key.startsWith('$') || key.includes('.')) {`
    - _Bug_Condition: source line CONTAINS raw_newline_character instead of '$'_
    - _Expected_Behavior: sanitizeValue deletes any key starting with '$' (e.g., $where, $gt, $ne)_
    - _Preservation: Non-operator keys (no '$' prefix, no '.') pass through sanitizeValue unchanged_
    - _Requirements: 1.13, 2.11_

  - [x] 9.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - sanitizeValue removes '$' prefixed keys
    - Re-run the SAME test from task 1 (Bug 1.13 exploration test)
    - **EXPECTED OUTCOME**: Test PASSES — `sanitizeValue({ "$where": "x" })` returns `{}`

  - [x] 9.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Normal request bodies unaffected
    - Re-run the SAME preservation tests from task 2
    - **EXPECTED OUTCOME**: Tests PASS — regular keys like `{ "name": "test" }` pass through unchanged

- [x] 10. Checkpoint — Ensure all tests pass
  - Re-run the full exploration test suite (Property 1 tests from task 1) — all should now PASS
  - Re-run the full preservation test suite (Property 2 tests from task 2) — all should still PASS
  - Confirm no regressions in: login flows, valid order creation, StoriesViewer with valid media, NotificationCenter, FoodPartnerDashboard orders, AdminDashboard, PaymentModal
  - Ask the user if any questions arise
