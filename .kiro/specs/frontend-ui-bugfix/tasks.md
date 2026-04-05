# Implementation Plan

- [x] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - Story Order Closes Viewer + Orders Panel 500 Error
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: These tests encode the expected behavior — they will validate the fix when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bugs exist
  - **Scoped PBT Approach**: Scope each property to the concrete failing case(s) for reproducibility

  - Test 1.A — Story Order Modal (StoriesViewer):
    - Render `StoriesViewer` with a story that has `price > 0`
    - Simulate clicking the "Order Now" button
    - Assert `showOrderModal` becomes `true`
    - Assert `onClose` is NOT called (spy on the prop)
    - Run on UNFIXED code — **EXPECTED OUTCOME**: FAILS because `handleOrderNow` calls `onClose()`
    - Document counterexample: `onClose()` is called when Order button is clicked

  - Test 1.B — Orders Panel 500 Error (OrdersModal):
    - Mock `user` in localStorage as `{ fullName: "John Doe", _id: "507f1f77bcf86cd799439011" }`
    - Render `OrdersModal` and trigger `fetchOrders()`
    - Assert the API call uses `user._id` (ObjectId), NOT `user.fullName`
    - Assert the response is HTTP 200, not 500
    - Run on UNFIXED code — **EXPECTED OUTCOME**: FAILS because `user.fullName` is passed to the API
    - Document counterexample: `GET /api/orders/user/John%20Doe` returns 500

  - Test 1.C — Post Metrics Hardcoded (UserHome):
    - Mock `postsAPI.getPosts()` to return a post with `likes: [{}, {}]` (2 likes), `comments: [{}, {}]` (2 comments)
    - Call `fetchPosts()` and capture the transformed post
    - Assert `post.likes === 2` and `post.comments === 2` (not a random number)
    - Run on UNFIXED code — **EXPECTED OUTCOME**: FAILS because `Math.random()` is used

  - Test 1.D — Reels Desc-Toggle Button Text (home.jsx):
    - Render the reels page with at least one reel item
    - Find the `desc-toggle` button
    - Assert its text content is NOT `'+'` or `'−'`
    - Run on UNFIXED code — **EXPECTED OUTCOME**: FAILS because button renders `'+'`

  - Mark task complete when all exploration tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.3, 1.5, 1.9, 1.11_

- [~] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Story Navigation, Cart Persistence, Order Creation, WebSocket Updates
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for all non-buggy inputs (cases where `isBugCondition` returns false)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements

  - Test 2.A — Story Navigation Preservation:
    - Observe: clicking prev/next in StoriesViewer advances `currentIndex` correctly on unfixed code
    - Observe: play/pause toggle updates `isPlaying` state correctly
    - Observe: keyboard arrow navigation fires the correct handlers
    - Write property-based test: for any story array of length N, navigating forward N times wraps or stops correctly
    - Verify test PASSES on UNFIXED code
    - _Requirements: 3.3_

  - Test 2.B — Cart Persistence Preservation:
    - Observe: `addToCart(item)` on unfixed code writes to `localStorage['reelsCart']` with correct structure
    - Observe: `updateQuantity(id, qty)` updates the correct item quantity
    - Observe: `removeFromCart(id)` removes the item from the array
    - Write property-based test: for any sequence of add/update/remove operations, `reelsCart` localStorage state is consistent
    - Verify test PASSES on UNFIXED code
    - _Requirements: 3.2_

  - Test 2.C — Order Creation Preservation:
    - Observe: the full checkout flow (address → payment → confirmation) sends correct data to the backend on unfixed code
    - Write test: simulate checkout flow and assert `POST /api/orders` is called with correct `customerId`, `items`, and `foodPartnerId`
    - Verify test PASSES on UNFIXED code
    - _Requirements: 3.4_

  - Test 2.D — WebSocket Order Status Preservation:
    - Observe: when a WebSocket `orderUpdate` message is received, the order status in the UI updates in real time on unfixed code
    - Write test: simulate a WebSocket message and assert the order status updates correctly
    - Verify test PASSES on UNFIXED code
    - _Requirements: 3.7_

  - Test 2.E — Protected Route Preservation:
    - Observe: unauthenticated users are redirected to login for protected routes on unfixed code
    - Write test: render a protected route without auth token and assert redirect to `/login`
    - Verify test PASSES on UNFIXED code
    - _Requirements: 3.6_

  - Mark task complete when all preservation tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_

- [x] 3. Fix Story page bugs (StoriesViewer.jsx)

  - [x] 3.1 Fix Bug 1.1 + 1.3 — Order button opens in-viewer modal without closing viewer or flickering
    - In `StoriesViewer.jsx`, locate `handleOrderNow` function
    - Remove the `onClose()` call from `handleOrderNow` — the viewer must stay open
    - The "Order Now" button already calls `setShowOrderModal(true)` — verify this is the entry point
    - The `storyOrderNow` event dispatch can remain for `home.jsx` to start checkout, but `onClose()` must NOT be called until the user explicitly closes the viewer
    - Verify the order modal renders inside the viewer overlay without unmounting the viewer
    - _Bug_Condition: `input.component === 'StoriesViewer' AND input.action === 'clickOrder'`_
    - _Expected_Behavior: `showOrderModal = true`, `onClose` NOT called, no DOM flicker_
    - _Preservation: Story media auto-advance, play/pause, keyboard navigation unchanged_
    - _Requirements: 2.1, 2.3_

  - [x] 3.2 Fix Bug 1.2 — Show cart indicator after story add-to-cart
    - In `StoriesViewer.jsx`, after `handleAddToCart` updates the cart, dispatch a `cartUpdated` custom event with the new cart count
    - In `UserHome.jsx`, add an event listener for `cartUpdated` and show a toast notification with the cart count and a link to the cart
    - Ensure the toast is visible and dismissible
    - _Bug_Condition: `input.component === 'StoriesViewer' AND input.action === 'addToCart'`_
    - _Expected_Behavior: visible cart badge/toast with item count shown after add_
    - _Preservation: Cart state in `reelsCart` localStorage unchanged_
    - _Requirements: 2.2, 3.2_

  - [x] 3.3 Verify bug condition exploration test now passes (Story bugs)
    - **Property 1: Expected Behavior** - Story Order Opens In-Viewer Modal
    - **IMPORTANT**: Re-run the SAME test from task 1 (Test 1.A) — do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - Run Test 1.A: assert `showOrderModal = true` and `onClose` NOT called
    - **EXPECTED OUTCOME**: Test PASSES (confirms bugs 1.1 and 1.3 are fixed)
    - _Requirements: 2.1, 2.3_

  - [x] 3.4 Verify preservation tests still pass after story fix
    - **Property 2: Preservation** - Story Navigation Unaffected
    - **IMPORTANT**: Re-run the SAME tests from task 2 (Tests 2.A, 2.B) — do NOT write new tests
    - Run Test 2.A: story navigation (prev/next, play/pause, keyboard) still works
    - Run Test 2.B: cart persistence unchanged
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)

- [x] 4. Fix Home page bugs (UserHome.jsx + UserHome.css)

  - [x] 4.1 Fix Bug 1.4 — Post image cropped
    - In `UserHome.css`, find `.post-image` and `.post-media-container`
    - Add `object-fit: cover` and `aspect-ratio: 4/3` to `.post-image`
    - Ensure `.post-media-container` has `overflow: hidden` and consistent dimensions
    - _Bug_Condition: `input.component === 'UserHome' AND input.element === 'postImage'`_
    - _Expected_Behavior: image fully visible with consistent aspect ratio, no cropping_
    - _Requirements: 2.4_

  - [x] 4.2 Fix Bug 1.5 — Hardcoded engagement metrics
    - In `UserHome.jsx`, locate `fetchPosts()` and the post transform
    - Replace `Math.floor(Math.random() * 200) + 50` with `post.likes?.length || 0`
    - Replace `Math.floor(Math.random() * 50) + 10` with `post.comments?.length || 0`
    - Replace `Math.floor(Math.random() * 20) + 5` with `post.shares || 0`
    - _Bug_Condition: `input.component === 'UserHome' AND input.element === 'postMetrics' AND input.source === 'hardcoded'`_
    - _Expected_Behavior: real like/comment/share counts from API response_
    - _Requirements: 2.5_

  - [x] 4.3 Fix Bug 1.6 — Poor comments section CSS
    - In `UserHome.css`, redesign `.comment-modal`, `.comment-item`, `.comment-form`, and `.comment-input`
    - Apply clean card-style layout with proper padding, font sizes, and color contrast
    - Style comment avatars, timestamps, and action buttons consistently
    - Ensure the comment form input is clearly visible and accessible
    - _Bug_Condition: `input.component === 'UserHome' AND input.element === 'commentsSection'`_
    - _Expected_Behavior: clean, readable, visually consistent comments section_
    - _Requirements: 2.6_

  - [x] 4.4 Verify bug condition exploration test now passes (Home page metrics)
    - **Property 1: Expected Behavior** - Post Metrics Use Real API Data
    - **IMPORTANT**: Re-run the SAME test from task 1 (Test 1.C) — do NOT write a new test
    - Run Test 1.C: assert `post.likes` and `post.comments` match API response, not random numbers
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug 1.5 is fixed)
    - _Requirements: 2.5_

  - [x] 4.5 Verify preservation tests still pass after home page fix
    - **Property 2: Preservation** - Post Display and Navigation Unaffected
    - Re-run Tests 2.C and 2.E: order creation and protected routes still work
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)

- [x] 5. Fix Reels page bugs (home.jsx + Home.css)

  - [x] 5.1 Fix Bug 1.7 + 1.8 — Order button and cart panel z-index
    - In `Home.css`, ensure `.order-modal-overlay` has `z-index: 9999`
    - Ensure `.cart-modal-overlay` has `z-index: 9999`
    - Ensure `.cart-button` has `z-index: 1000` above the reel overlay (`.reel-overlay`)
    - Verify the order modal and cart panel are fully visible and interactive when open
    - _Bug_Condition: `input.component === 'Home' AND (input.action === 'clickOrder' OR (input.action === 'addToCart' AND input.effect === 'cartPanelBroken'))`_
    - _Expected_Behavior: order modal opens for selected reel; cart panel opens showing all added items_
    - _Preservation: Cart state in `reelsCart` localStorage unchanged_
    - _Requirements: 2.7, 2.8, 3.2_

  - [x] 5.2 Fix Bug 1.9 — Remove extraneous + button
    - In `home.jsx`, locate the `desc-toggle` button that renders `'+'` / `'−'`
    - Replace with `'▼'` / `'▲'` chevrons or `'More'` / `'Less'` text labels
    - Alternatively, remove the toggle entirely and always show the description (simpler fix)
    - _Bug_Condition: `input.component === 'Home' AND input.element === 'descToggleButton'`_
    - _Expected_Behavior: no ambiguous `+` button; description toggle is clearly labeled or removed_
    - _Requirements: 2.9_

  - [x] 5.3 Fix Bug 1.10 — Replace confusing "Added" button with quantity controls
    - In `home.jsx`, locate the `add-to-cart` button render logic
    - When `getCartItemQuantity(reel._id) > 0`, replace the "Added (N)" button with inline quantity controls:
      - A `−` button calling `updateQuantity(reel._id, qty - 1)`
      - A count display showing current quantity
      - A `+` button calling `updateQuantity(reel._id, qty + 1)`
    - When quantity is 0, show the standard "Add to Cart" button
    - Add `.quantity-controls-inline` CSS class with appropriate styling in `Home.css`
    - _Bug_Condition: `input.component === 'Home' AND input.element === 'addedButton'`_
    - _Expected_Behavior: clear quantity controls (`−`, count, `+`) when item is in cart_
    - _Preservation: Cart state in `reelsCart` localStorage unchanged_
    - _Requirements: 2.10, 3.2_

  - [x] 5.4 Verify bug condition exploration test now passes (Reels desc-toggle)
    - **Property 1: Expected Behavior** - Reels Desc-Toggle Button Not `+`
    - **IMPORTANT**: Re-run the SAME test from task 1 (Test 1.D) — do NOT write a new test
    - Run Test 1.D: assert desc-toggle button text is NOT `'+'` or `'−'`
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug 1.9 is fixed)
    - _Requirements: 2.9_

  - [x] 5.5 Verify preservation tests still pass after reels fix
    - **Property 2: Preservation** - Cart Persistence and Likes/Comments Unaffected
    - Re-run Tests 2.B and 2.D: cart persistence and WebSocket updates still work
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - _Requirements: 3.2, 3.5, 3.7_

- [x] 6. Fix Orders panel 500 error (UserHome.jsx)

  - [x] 6.1 Fix Bug 1.11 — Use user._id instead of user.fullName for orders API call
    - In `UserHome.jsx`, locate `OrdersModal.fetchOrders()` (or the inline `fetchOrders` function)
    - Replace `user.fullName || user.name || user.email || user.phone` with `user._id || user.id`
    - Add a guard: if `userId` is falsy, throw `new Error('User ID not found')` and show an error message
    - Verify the API call becomes `GET /api/orders/user/:objectId` with a valid MongoDB ObjectId
    - _Bug_Condition: `input.component === 'OrdersModal' AND input.action === 'open'`_
    - _Expected_Behavior: HTTP 200 response with user's order history; no 500 CastError_
    - _Preservation: WebSocket real-time order status updates still fire correctly_
    - _Requirements: 2.11, 3.7_

  - [x] 6.2 Verify bug condition exploration test now passes (Orders panel)
    - **Property 1: Expected Behavior** - Orders Panel Fetches Successfully with ObjectId
    - **IMPORTANT**: Re-run the SAME test from task 1 (Test 1.B) — do NOT write a new test
    - Run Test 1.B: assert API call uses `user._id` and returns HTTP 200
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug 1.11 is fixed)
    - _Requirements: 2.11_

  - [x] 6.3 Verify preservation tests still pass after orders fix
    - **Property 2: Preservation** - WebSocket and Order Creation Unaffected
    - Re-run Tests 2.C and 2.D: order creation flow and WebSocket updates still work
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - _Requirements: 3.4, 3.7_

- [x] 7. UI Redesign — Header (UserHome.css + UserHome.jsx)

  - [x] 7.1 Fix Bug 1.12 — Redesign app header
    - In `UserHome.css`, redesign `.modern-topbar`:
      - Add gradient background: `background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)`
      - Add `box-shadow: 0 2px 20px rgba(0,0,0,0.4)` for separation
      - Add `border-bottom: 1px solid rgba(255,255,255,0.08)`
    - In `UserHome.jsx`, update the header JSX:
      - Add the ReelZomato brand name/logo on the left with styled typography
      - Move location selector to a compact pill button with a location icon
      - Style the notification bell with a badge counter
    - _Bug_Condition: `input.component === 'UserHome' AND input.element === 'header'`_
    - _Expected_Behavior: visually polished header consistent with app's dark brand identity_
    - _Requirements: 2.12_

- [x] 8. UI Redesign — Home page layout (UserHome.css + UserHome.jsx)

  - [x] 8.1 Fix Bug 1.13 — Redesign home page layout
    - In `UserHome.css`, redesign post feed cards:
      - Add `border-radius: 16px` and `box-shadow: 0 4px 24px rgba(0,0,0,0.3)` to post cards
      - Improve post header with better avatar styling (gradient ring, larger size)
      - Add a gradient overlay on post images for text readability
      - Style action buttons (like, comment, share) with icon + count layout
    - In `UserHome.jsx`, add an "Order Now" CTA button on each post card that opens the order flow
    - Ensure the overall layout is well-organized with consistent spacing and typography
    - _Bug_Condition: `input.component === 'UserHome' AND input.element === 'layout'`_
    - _Expected_Behavior: visually appealing, well-organized home page layout_
    - _Requirements: 2.13_

- [x] 9. UI Redesign — Profile page (UserHome.css + UserHome.jsx)

  - [x] 9.1 Fix Bug 1.14 — Redesign profile page
    - In `UserHome.css`, redesign `.profile-modal`:
      - Add a hero banner/cover image area at the top with a gradient background
      - Style the avatar with a gradient ring (`border: 3px solid transparent; background: linear-gradient(...)`)
      - Use card-based sections for profile info, preferences, and help
      - Add smooth tab transitions with CSS transitions
    - In `UserHome.jsx`, update the `ProfileModal` JSX structure to match the new design
    - Ensure all existing profile actions (update name, email, phone, password, addresses) still work
    - _Bug_Condition: `input.component === 'ProfileModal' AND input.element === 'layout'`_
    - _Expected_Behavior: visually interesting, user-friendly profile page with clear sections_
    - _Preservation: Profile update actions (name, email, phone, password, addresses) unchanged_
    - _Requirements: 2.14, 3.10_

- [x] 10. Checkpoint — Ensure all tests pass
  - Re-run all exploration tests (1.A, 1.B, 1.C, 1.D) — all must PASS
  - Re-run all preservation tests (2.A, 2.B, 2.C, 2.D, 2.E) — all must PASS
  - Manually verify each of the 14 bug fixes in the browser:
    - Story Order button opens in-viewer modal (1.1)
    - Cart indicator visible after story add-to-cart (1.2)
    - No page flicker when clicking Order in story (1.3)
    - Post images fully visible with correct aspect ratio (1.4)
    - Post metrics show real data, not random numbers (1.5)
    - Comments section is clean and readable (1.6)
    - Reels Order button opens order modal (1.7)
    - Cart panel opens correctly after Reels add-to-cart (1.8)
    - No extraneous `+` button on Reels page (1.9)
    - Quantity controls replace "Added" button (1.10)
    - Orders panel loads without 500 error (1.11)
    - Header is visually polished (1.12)
    - Home page layout is redesigned (1.13)
    - Profile page is redesigned (1.14)
  - Ensure all tests pass; ask the user if questions arise
