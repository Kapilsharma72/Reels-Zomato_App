# ReelZomato Full-Project Bug Audit — Bugfix Design

## Overview

This document formalizes the fix strategy for 13 bugs discovered across the ReelZomato
full-stack application (React/Vite frontend + Node.js/Express/MongoDB backend). The bugs
span authentication logout flows, WebSocket listener duplication, order creation validation,
story viewer crash guards, post schema completeness, route access control, variable scoping,
and a corrupted backend string literal. Each fix is minimal and targeted to avoid regressions.


## Glossary

- **Bug_Condition (C)**: The set of inputs or runtime states that trigger a defect.
- **Property (P)**: The correct observable behavior that must hold when C is satisfied.
- **Preservation**: All behaviors outside C that must remain unchanged after the fix.
- **isBugCondition(input)**: Pseudocode predicate returning `true` when the bug can fire.
- **expectedBehavior(result)**: Pseudocode predicate returning `true` when the result is correct.
- **authService**: `Frontend/src/services/authService.js` — singleton managing auth API calls and localStorage cleanup.
- **DeliveryDashboard**: `Frontend/src/pages/DeliveryDashboard.jsx` — delivery partner SPA page.
- **EditorDashboard**: `Frontend/src/pages/EditorDashboard.jsx` — video editor SPA page.
- **ProtectedRoute**: `Frontend/src/components/ProtectedRoute.jsx` — role-based route guard.
- **StoriesViewer**: `Frontend/src/components/StoriesViewer.jsx` — story playback component.
- **UserHome**: `Frontend/src/pages/UserHome.jsx` — main user feed page.
- **PostModel**: `Backend/src/models/post.model.js` — Mongoose schema for food-partner posts.
- **order.controller**: `Backend/src/controllers/order.controller.js` — order CRUD and rating logic.
- **app.js**: `Backend/src/app.js` — Express app setup including custom NoSQL sanitizer.


---

## Bug Details

### Bug 1.1 — DeliveryDashboard calls `authService.logout()` (wrong method name)

**Bug Condition:**

The logout confirmation modal in `DeliveryDashboard` calls `authService.logout()` inline
(`onClick={async () => { await authService.logout(); navigate('/login'); }}`).
`authService` has no `logout` method; the correct method is `logoutUser()`.

```
FUNCTION isBugCondition(input)
  INPUT: input — a click event on the "Logout" button inside the confirmation modal
  OUTPUT: boolean

  RETURN input.target === DeliveryDashboard_LogoutConfirmButton
         AND authService.logout IS undefined
END FUNCTION
```

**Examples:**
- User clicks "Logout" in the modal → `TypeError: authService.logout is not a function` is thrown, modal stays open, user is not logged out.
- The `handleLogout` function (called from the sidebar logout button) correctly calls `authService.logoutUser()` — only the inline modal handler is broken.

---

### Bug 1.2 — EditorDashboard calls `authService.logout()` (wrong method name)

**Bug Condition:**

Identical pattern to 1.1 in `EditorDashboard`. The confirmation modal's inline handler calls `authService.logout()`.

```
FUNCTION isBugCondition(input)
  INPUT: input — a click event on the "Logout" button inside EditorDashboard confirmation modal
  OUTPUT: boolean

  RETURN input.target === EditorDashboard_LogoutConfirmButton
         AND authService.logout IS undefined
END FUNCTION
```

**Examples:**
- Editor clicks "Logout" in the modal → `TypeError: authService.logout is not a function`.

---

### Bug 1.3 — `authService.logoutUser()` does not clear localStorage

**Bug Condition:**

`authService.logoutUser()` only calls `GET /api/auth/user/logout` (clears the server-side
cookie) but never removes `userData` or `tempUserData` from `localStorage`. After logout,
`isAuthenticated()` still returns `true` because `localStorage.getItem('userData') !== null`.

```
FUNCTION isBugCondition(input)
  INPUT: input — a call to authService.logoutUser()
  OUTPUT: boolean

  RETURN localStorage.getItem('userData') IS NOT null
         OR localStorage.getItem('tempUserData') IS NOT null
         AFTER logoutUser() resolves
END FUNCTION
```

**Examples:**
- User logs out → cookie cleared, but `localStorage.userData` persists → navigating to `/user/home` succeeds without re-authentication.
- `ProtectedRoute` reads `localStorage.userData` and grants access to a logged-out user.


---

### Bug 1.4 — DeliveryDashboard registers WebSocket listeners twice

**Bug Condition:**

`DeliveryDashboard` has two separate `useEffect` blocks that both depend on `[socket]`.
The first registers named handler functions for `new_order`, `order_assigned`, and
`order_update` with proper cleanup. The second registers anonymous handlers for the same
three events plus `order_ready`, with cleanup that calls `socket.off(event)` without
passing the handler reference (which in socket.io removes ALL listeners for that event,
but only after both effects have already added two listeners each).

```
FUNCTION isBugCondition(input)
  INPUT: input — a WebSocket event arriving at DeliveryDashboard while socket is connected
  OUTPUT: boolean

  RETURN socket.listeners('new_order').length > 1
         OR socket.listeners('order_update').length > 1
         OR socket.listeners('order_assigned').length > 1
END FUNCTION
```

**Examples:**
- A `new_order` event arrives → two notifications are added, `fetchAvailableOrders()` is called twice.
- An `order_update` event arrives → `fetchMyOrders()` is called twice, two duplicate notifications shown.

---

### Bug 1.5 — EditorDashboard references undeclared `setNotifications`

**Bug Condition:**

Inside the first `useEffect` in `EditorDashboard` (the one guarded by `socket && currentEditor?._id`),
the `handleNewVideoSubmission` handler calls `setNotifications(...)`. However, no
`const [notifications, setNotifications] = useState(...)` is declared anywhere in
`EditorDashboard`. The `notifications` state exists only in `DeliveryDashboard`.

```
FUNCTION isBugCondition(input)
  INPUT: input — a 'new_video_submission' WebSocket event received by EditorDashboard
  OUTPUT: boolean

  RETURN setNotifications IS NOT defined IN EditorDashboard scope
         AND input.event === 'new_video_submission'
END FUNCTION
```

**Examples:**
- A food partner uploads a video → WebSocket fires `new_video_submission` → `ReferenceError: setNotifications is not defined` crashes the component.

---

### Bug 1.6 — Order creation silently creates "Default Restaurant"

**Bug Condition:**

In `createOrder`, when `FoodPartnerModel.findById(foodPartnerId)` returns `null`, the
controller creates (or reuses) a `Default Restaurant` food partner and assigns the order
to it instead of returning an error.

```
FUNCTION isBugCondition(input)
  INPUT: input — an HTTP POST /api/orders request body
  OUTPUT: boolean

  RETURN FoodPartnerModel.findById(input.foodPartnerId) IS null
END FUNCTION
```

**Examples:**
- User orders from a deleted restaurant → order silently goes to "Default Restaurant", real restaurant never notified.
- Stale `foodPartnerId` from a cached frontend → same silent mismatch.


---

### Bug 1.7 — `rateOrder` checks `status !== 'delivered'` but food partner sets `'completed'`

**Bug Condition:**

`rateOrder` rejects rating attempts unless `order.status === 'delivered'`. However,
`updateOrderStatus` (called by the food partner dashboard) sets status to `'completed'`
when the order is done. Delivery partners set `'delivered'`. In practice, many orders
end at `'completed'` and can never be rated.

```
FUNCTION isBugCondition(input)
  INPUT: input — an HTTP POST /api/orders/:orderId/rate request
  OUTPUT: boolean

  order = OrderModel.findById(input.orderId)
  RETURN order.status === 'completed'
         AND order.status !== 'delivered'
END FUNCTION
```

**Examples:**
- Food partner marks order `completed` → user tries to rate → `403 Can only rate delivered orders`.
- Only orders explicitly set to `delivered` by a delivery partner can be rated, excluding all food-partner-fulfilled orders.

---

### Bug 1.8 — StoriesViewer crashes when `currentMedia` is undefined

**Bug Condition:**

`startProgress` reads `currentMedia?.duration` via the `currentMedia` variable captured
in its closure. If a story group has zero media items, `currentMedia` is `undefined`.
The `useEffect` that calls `startProgress` does not guard against this case before
the `if (isOpen && currentMedia && isPlaying)` check — but `startProgress` itself
is defined with `currentMedia` in its dependency array and will be recreated with
`undefined`, then called if the guard passes with a stale truthy value.

```
FUNCTION isBugCondition(input)
  INPUT: input — StoriesViewer render state
  OUTPUT: boolean

  currentStory = stories[currentStoryIndex]
  currentMedia = currentStory?.media?.[currentMediaIndex]
  RETURN currentMedia IS undefined
         AND isOpen IS true
         AND isPlaying IS true
END FUNCTION
```

**Examples:**
- A story group is fetched with an empty `media` array → viewer opens → `startProgress` fires → `currentMedia.duration` throws `TypeError: Cannot read properties of undefined`.
- `currentMediaIndex` advances past the last media item before the effect cleanup runs → same crash.

---

### Bug 1.9 — `fetchStories` sorts by formatted "Xh ago" string instead of ISO date

**Bug Condition:**

After grouping, `fetchStories` stores `group.time = formatTimeAgo(story.createdAt)` (a
human-readable string like `"2h ago"`). The final sort then calls
`new Date(b.time) - new Date(a.time)`, which evaluates `new Date("2h ago")` → `Invalid Date`
(NaN), making the sort order non-deterministic.

```
FUNCTION isBugCondition(input)
  INPUT: input — the array of story groups produced by fetchStories
  OUTPUT: boolean

  RETURN EXISTS group IN input WHERE isNaN(new Date(group.time))
END FUNCTION
```

**Examples:**
- All story groups have `time = "2h ago"` → sort produces random order on every render.
- Newest stories may appear last instead of first.


---

### Bug 1.10 — PostModel schema missing `likes` and `comments` fields

**Bug Condition:**

The `post.controller` calls `post.likes.push(userId)` and `post.comments.push({...})`.
The `PostModel` schema in `post.model.js` **does** define `likes` and `comments` — this
was confirmed by reading the file. Bug 1.10 as originally reported is a **false positive**;
the schema already contains both fields with correct types.

> **Resolution**: No code change required for 1.10. The schema is correct. The bug report
> was based on an outdated snapshot. Testing should confirm the fields persist correctly.

---

### Bug 1.11 — ProtectedRoute may allow food-partner to access user-only pages

**Bug Condition:**

`ProtectedRoute` reads `userData` from `localStorage` to determine the user's role. It
does not re-validate the role against the server. If a food partner's `userData` in
`localStorage` has `role: 'food-partner'` and they navigate to `/user/home`
(`requiredRole="user"`), the guard correctly redirects them. However, if `localStorage`
contains a `userData` object with `role: 'user'` (e.g., left over from a previous user
session that was not fully cleared — see Bug 1.3), a food partner authenticated via cookie
can access user-only pages because the role check reads the stale localStorage value.

```
FUNCTION isBugCondition(input)
  INPUT: input — a navigation attempt to a requiredRole="user" route
  OUTPUT: boolean

  storedData = localStorage.getItem('userData')
  cookieRole = getAuthenticatedRoleFromCookie()
  RETURN storedData IS NOT null
         AND JSON.parse(storedData).role !== cookieRole
         AND JSON.parse(storedData).role === requiredRole
END FUNCTION
```

**Examples:**
- Food partner logs in → `userData` with `role: 'food-partner'` stored → food partner logs out (bug 1.3: localStorage not cleared) → regular user logs in on same browser → `userData` overwritten with `role: 'user'` → food partner's cookie still valid → food partner navigates to `/user/home` → ProtectedRoute reads stale `role: 'user'` → access granted.
- The fix for Bug 1.3 (clearing localStorage on logout) mitigates the primary vector. ProtectedRoute itself is correct given clean localStorage state.

> **Note**: Bug 1.11 is primarily a consequence of Bug 1.3. Fixing 1.3 resolves the main
> attack vector. No additional change to ProtectedRoute is required beyond ensuring logout
> clears localStorage.

---

### Bug 1.12 — `storedUserData` declared inside `try`, not accessible in `catch` in UserHome

**Bug Condition:**

In `fetchCurrentUser`, `storedUserData` is declared with `const` inside the `try` block
(line ~297). The `catch` block references `storedUserData` at line ~344 to decide whether
to redirect. Because `const` is block-scoped, `storedUserData` is not in scope inside
`catch`, causing a `ReferenceError`.

```
FUNCTION isBugCondition(input)
  INPUT: input — an execution of fetchCurrentUser() that throws in the try block
         before the storedUserData assignment completes, OR any catch block execution
  OUTPUT: boolean

  RETURN storedUserData IS referenced IN catch block
         AND storedUserData IS declared WITH const INSIDE try block
END FUNCTION
```

**Examples:**
- `authService.getCurrentUser()` throws a network error → catch block runs → `ReferenceError: storedUserData is not defined` → error handling itself crashes.

---

### Bug 1.13 — Backend `app.js` has corrupted string literal in `sanitizeValue`

**Bug Condition:**

The `sanitizeValue` function contains `key.startsWith('\n')` where the `'\n'` is a raw
newline character embedded directly in the source file (not the escape sequence). This
means the function checks whether a MongoDB operator key starts with a literal newline
character instead of `'$'`, rendering the NoSQL injection sanitization completely
ineffective.

```
FUNCTION isBugCondition(input)
  INPUT: input — the source text of Backend/src/app.js
  OUTPUT: boolean

  line = getLine(input, "key.startsWith(")
  RETURN line CONTAINS raw_newline_character
         AND NOT line CONTAINS '$'
END FUNCTION
```

**Examples:**
- Request body `{ "$where": "malicious" }` → `sanitizeValue` checks `key.startsWith('\n')` → `'$where'.startsWith('\n')` is `false` → key is NOT deleted → NoSQL injection passes through.


---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- 3.1 Valid user login continues to set the `token` cookie and return `id`, `fullName`, `email`, `role`.
- 3.2 Valid food-partner login continues to set the `token` cookie and return the food partner object.
- 3.3 Authenticated regular users navigating to `/user/home` continue to see posts, stories, and categories.
- 3.4 FoodPartnerDashboard continues to fetch and display orders for the authenticated food partner.
- 3.5 StoriesViewer with valid story groups (non-empty media arrays) continues to display stories with progress bars, play/pause, and navigation.
- 3.6 Orders placed with a valid `foodPartnerId` continue to be created, WebSocket-notified, and returned correctly.
- 3.7 NotificationCenter continues to display real-time WebSocket notifications with correct counts.
- 3.8 ProfileManagement continues to fetch and display user profile info and saved addresses.
- 3.9 AdminDashboard continues to fetch and display user stats and the paginated user list.
- 3.10 PaymentModal continues to load Razorpay, create a payment order, and open the checkout dialog.

**Scope:**

All inputs that do NOT trigger any of the 13 bug conditions above must be completely
unaffected by these fixes. This includes all happy-path flows for login, order placement,
story viewing, post liking/commenting, and dashboard navigation.


---

## Hypothesized Root Causes

1. **Copy-paste error in logout modal handlers (1.1, 1.2)**: The `handleLogout` function correctly calls `logoutUser()`, but the inline `onClick` in the confirmation modal was written separately and used the non-existent `logout()` name.

2. **Incomplete logout implementation (1.3)**: `logoutUser()` was implemented to only hit the server endpoint. The localStorage cleanup was added to the dashboard `handleLogout` wrappers but never to the service method itself, creating inconsistency.

3. **Refactored useEffect without removing the old one (1.4)**: The first `useEffect` in `DeliveryDashboard` was a refactored version with named handlers and proper cleanup. The original anonymous-handler version was never removed, leaving both active.

4. **Missing state declaration during copy from DeliveryDashboard (1.5)**: `EditorDashboard` was likely scaffolded by copying `DeliveryDashboard`. The `notifications` state declaration was not copied, but the `setNotifications` call inside the WebSocket handler was.

5. **Overly defensive order creation (1.6)**: The developer added a fallback to avoid 400 errors during development/testing. The fallback was never removed before production.

6. **Status string mismatch between food partner and rating check (1.7)**: The food partner dashboard uses `'completed'` as the terminal status. The `rateOrder` function was written assuming delivery partners always set `'delivered'`, without accounting for food-partner-only fulfillment flows.

7. **Missing null guard in progress timer (1.8)**: `startProgress` was written assuming `currentMedia` is always defined when called. The `useEffect` guard `if (isOpen && currentMedia && isPlaying)` prevents calling `startProgress` with undefined `currentMedia`, but `startProgress` itself captures `currentMedia` in its closure at definition time — if `currentMedia` is undefined when the function is defined, the `currentMedia?.duration` inside will still be `undefined`.

8. **Sorting on display string instead of raw date (1.9)**: `group.time` was set to the formatted string for display purposes. The sort was added later and incorrectly reused `group.time` instead of storing a separate raw ISO date for comparison.

9. **PostModel schema (1.10)**: Confirmed not a bug — schema already has `likes` and `comments`.

10. **ProtectedRoute localStorage dependency (1.11)**: ProtectedRoute was designed to avoid an async server call on every navigation. It relies on localStorage being authoritative, which is only safe if logout properly clears it (Bug 1.3).

11. **Variable scoping oversight (1.12)**: `storedUserData` was declared inside the `try` block for logical grouping but referenced in `catch` without recognizing that `const` is block-scoped.

12. **Source file corruption (1.13)**: The `'$'` character in `key.startsWith('$')` was replaced by a raw newline, likely from a bad editor paste, encoding issue, or automated transformation that mishandled the dollar sign.


---

## Correctness Properties

Property 1: Bug Condition — Logout Modal Uses Correct Method Name

_For any_ click on the logout confirmation button in DeliveryDashboard or EditorDashboard,
the fixed code SHALL call `authService.logoutUser()` (not `authService.logout()`), complete
without throwing a TypeError, and navigate to `/login`.

**Validates: Requirements 2.1**

---

Property 2: Bug Condition — Logout Clears localStorage

_For any_ call to `authService.logoutUser()` or `authService.logoutFoodPartner()`, the
fixed service SHALL remove `userData` and `tempUserData` from `localStorage` so that
`localStorage.getItem('userData')` returns `null` after the call resolves.

**Validates: Requirements 2.2**

---

Property 3: Bug Condition — DeliveryDashboard Registers Each WebSocket Listener Exactly Once

_For any_ mount of DeliveryDashboard with an active socket, the fixed component SHALL
register each of `new_order`, `order_update`, `order_assigned`, and `order_ready` exactly
once, and the cleanup function SHALL remove all registered listeners.

**Validates: Requirements 2.3**

---

Property 4: Bug Condition — EditorDashboard Does Not Reference Undeclared `setNotifications`

_For any_ `new_video_submission` WebSocket event received while EditorDashboard is mounted,
the fixed component SHALL handle the event without throwing a ReferenceError.

**Validates: Requirements 2.4**

---

Property 5: Bug Condition — Order Creation Returns 400 for Unknown foodPartnerId

_For any_ POST `/api/orders` request where `foodPartnerId` does not match any document in
the FoodPartner collection, the fixed controller SHALL return HTTP 400 with message
`"Food partner not found"` and SHALL NOT create any new FoodPartner document.

**Validates: Requirements 2.5**

---

Property 6: Bug Condition — `rateOrder` Accepts Both `'delivered'` and `'completed'` Statuses

_For any_ POST `/api/orders/:orderId/rate` request where `order.status` is either
`'delivered'` or `'completed'`, the fixed controller SHALL allow the rating to be saved
and return HTTP 200.

**Validates: Requirements 2.6**

---

Property 7: Bug Condition — StoriesViewer Guards Against Undefined `currentMedia`

_For any_ render of StoriesViewer where `currentMedia` is `undefined` (empty media array
or out-of-bounds index), the fixed component SHALL NOT call `currentMedia.duration` and
SHALL NOT throw a TypeError.

**Validates: Requirements 2.7**

---

Property 8: Bug Condition — `fetchStories` Sorts by Valid Date

_For any_ call to `fetchStories` that returns at least one story group, the fixed function
SHALL sort groups using a raw ISO date (or timestamp) rather than the formatted display
string, so that `new Date(sortKey)` is a valid (non-NaN) Date for every group.

**Validates: Requirements 2.8**

---

Property 9: Bug Condition — `storedUserData` Is Accessible in `catch` Block

_For any_ execution of `fetchCurrentUser` that throws an error inside the `try` block,
the fixed function SHALL access `storedUserData` without a ReferenceError because it is
declared before the `try` block.

**Validates: Requirements 2.10**

---

Property 10: Bug Condition — `sanitizeValue` Checks for `'$'` Prefix

_For any_ request body containing a key that starts with `'$'` (e.g., `$where`, `$gt`),
the fixed `sanitizeValue` function SHALL delete that key, preventing NoSQL injection.

**Validates: Requirements 2.11**

---

Property 11: Preservation — Valid Orders with Existing foodPartnerId Still Created

_For any_ POST `/api/orders` request where `foodPartnerId` matches an existing FoodPartner
document, the fixed controller SHALL produce the same result as the original: create the
order, notify via WebSocket, and return HTTP 201 with order details.

**Validates: Requirements 3.6**

---

Property 12: Preservation — StoriesViewer with Valid Media Continues to Work

_For any_ render of StoriesViewer where `currentMedia` is defined and `isOpen` is `true`,
the fixed component SHALL produce the same playback behavior as the original (progress
timer, navigation, play/pause).

**Validates: Requirements 3.5**

---

Property 13: Preservation — Logout Does Not Break Login Flow

_For any_ subsequent login after a logout, the fixed auth flow SHALL correctly store new
`userData` in `localStorage` and authenticate the new session, unaffected by the cleanup
added to `logoutUser()`.

**Validates: Requirements 3.1, 3.2**


---

## Fix Implementation

### Changes Required

---

#### Fix 1.1 & 1.2 — Logout modal inline handler

**Files**: `Frontend/src/pages/DeliveryDashboard.jsx`, `Frontend/src/pages/EditorDashboard.jsx`

**Specific Change**: In the logout confirmation modal's `onClick` handler, replace the
inline `authService.logout()` call with a call to the existing `handleLogout` function.

```
// Before (both files):
onClick={async () => { await authService.logout(); navigate('/login'); }}

// After:
onClick={handleLogout}
```

---

#### Fix 1.3 — `authService.logoutUser()` must clear localStorage

**File**: `Frontend/src/services/authService.js`

**Specific Change**: After the API call in `logoutUser()` resolves (in both success and
finally/catch paths), call `this.clearAuthData()` which already removes `userData`,
`tempUserData`, `token`, and `authToken` from localStorage and clears the cookie.

```
async logoutUser() {
  try {
    return await this.makeRequest('/user/logout', { method: 'GET' });
  } finally {
    this.clearAuthData();
  }
}
```

Apply the same pattern to `logoutFoodPartner()`.

---

#### Fix 1.4 — Remove duplicate WebSocket useEffect in DeliveryDashboard

**File**: `Frontend/src/pages/DeliveryDashboard.jsx`

**Specific Change**: Delete the second `useEffect` block (the one with anonymous handlers
and no named references in cleanup). Keep only the first `useEffect` which uses named
handler functions and properly passes them to `socket.off()` in the cleanup.
Add `order_ready` handling to the first effect if needed.

---

#### Fix 1.5 — Declare `notifications` state in EditorDashboard

**File**: `Frontend/src/pages/EditorDashboard.jsx`

**Specific Change**: Add `const [notifications, setNotifications] = useState([]);` to
the state declarations at the top of the `EditorDashboard` component, alongside the
other state variables.

---

#### Fix 1.6 — Return 400 when foodPartnerId not found

**File**: `Backend/src/controllers/order.controller.js`

**Specific Change**: Replace the "create default partner" fallback with an early return:

```javascript
const foodPartner = await FoodPartnerModel.findById(foodPartnerId);
if (!foodPartner) {
  return res.status(400).json({ message: 'Food partner not found' });
}
```

Remove the entire `if (!foodPartner) { ... }` block that creates/finds the default partner.

---

#### Fix 1.7 — Accept `'completed'` status in `rateOrder`

**File**: `Backend/src/controllers/order.controller.js`

**Specific Change**: Change the status guard from:

```javascript
if (order.status !== 'delivered') {
```

to:

```javascript
if (order.status !== 'delivered' && order.status !== 'completed') {
```

---

#### Fix 1.8 — Guard `currentMedia` in StoriesViewer

**File**: `Frontend/src/components/StoriesViewer.jsx`

**Specific Change**: The `useEffect` that calls `startProgress` already has the guard
`if (isOpen && currentMedia && isPlaying)`. The issue is that `startProgress` is
memoized with `currentMedia` in its deps — if `currentMedia` is `undefined`, the
function body still runs if called. Add an explicit early return inside `startProgress`:

```javascript
const startProgress = useCallback(() => {
  if (!currentMedia) return;   // ← add this guard
  clearProgress();
  const duration = currentMedia.duration || 5000;
  // ...
}, [currentMedia, clearProgress, advance]);
```

---

#### Fix 1.9 — Store raw ISO date for sorting in `fetchStories`

**File**: `Frontend/src/pages/UserHome.jsx`

**Specific Change**: Store `createdAt` (the raw ISO string) on each group alongside the
formatted display string. Use `createdAt` for sorting:

```javascript
// When creating a group:
groupedStories[groupKey] = {
  // ...
  time: formatTimeAgo(story.createdAt),
  createdAt: story.createdAt,   // ← store raw date
  // ...
};

// When updating time to most recent:
const storyTime = new Date(story.createdAt);
const currentTime = new Date(groupedStories[groupKey].createdAt);
if (storyTime > currentTime) {
  groupedStories[groupKey].time = formatTimeAgo(story.createdAt);
  groupedStories[groupKey].createdAt = story.createdAt;
}

// Final sort:
const transformedStories = Object.values(finalGroupedStories).sort((a, b) =>
  new Date(b.createdAt) - new Date(a.createdAt)
);
```

---

#### Fix 1.10 — PostModel schema (no change needed)

Confirmed the schema already defines `likes` and `comments`. No code change required.

---

#### Fix 1.11 — ProtectedRoute (no change needed beyond Fix 1.3)

Fixing Bug 1.3 (localStorage cleared on logout) eliminates the stale-role attack vector.
ProtectedRoute itself is correct.

---

#### Fix 1.12 — Move `storedUserData` declaration before `try` block

**File**: `Frontend/src/pages/UserHome.jsx`

**Specific Change**: Declare `storedUserData` with `let` before the `try` block:

```javascript
const fetchCurrentUser = async () => {
  let storedUserData = null;   // ← declare here
  try {
    setUserLoading(true);
    storedUserData = localStorage.getItem('userData');
    // ... rest of try body unchanged
  } catch (error) {
    // storedUserData is now accessible here
    if (... && !storedUserData && !hasRedirected) { ... }
  }
};
```

---

#### Fix 1.13 — Fix corrupted string literal in `sanitizeValue`

**File**: `Backend/src/app.js`

**Specific Change**: Replace the corrupted `key.startsWith('\n')` (raw newline) with
the correct `key.startsWith('$')`:

```javascript
// Before (corrupted — raw newline in source):
if (key.startsWith('
') || key.includes('.')) {

// After:
if (key.startsWith('$') || key.includes('.')) {
```


---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that
demonstrate each bug on unfixed code, then verify the fix works correctly and preserves
existing behavior.

---

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate each bug BEFORE implementing the fix.
Confirm or refute the root cause analysis.

**Test Cases**:

1. **Logout Modal TypeError (1.1, 1.2)**: Render DeliveryDashboard/EditorDashboard with a
   mock `authService`, click the confirmation modal "Logout" button, assert that
   `authService.logout` is called — expect a TypeError on unfixed code.

2. **localStorage Not Cleared (1.3)**: Call `authService.logoutUser()` on unfixed code,
   then assert `localStorage.getItem('userData') === null` — expect assertion to fail.

3. **Duplicate WebSocket Handlers (1.4)**: Mount DeliveryDashboard with a mock socket,
   assert `socket.listeners('new_order').length === 1` — expect `2` on unfixed code.

4. **setNotifications ReferenceError (1.5)**: Mount EditorDashboard with a mock socket
   that emits `new_video_submission`, assert no ReferenceError is thrown — expect crash
   on unfixed code.

5. **Silent Default Restaurant (1.6)**: POST `/api/orders` with a non-existent
   `foodPartnerId`, assert response status is `400` — expect `201` with a default partner
   on unfixed code.

6. **rateOrder Blocks Completed Orders (1.7)**: Create an order with `status: 'completed'`,
   POST to `/api/orders/:id/rate`, assert HTTP 200 — expect `403` on unfixed code.

7. **StoriesViewer Crash on Empty Media (1.8)**: Render StoriesViewer with a story group
   where `media = []`, assert no TypeError is thrown — expect crash on unfixed code.

8. **Invalid Date Sort (1.9)**: Call `fetchStories` with mock data, assert the returned
   groups are sorted newest-first — expect non-deterministic order on unfixed code.

9. **storedUserData ReferenceError (1.12)**: Mock `authService.getCurrentUser()` to throw,
   call `fetchCurrentUser()`, assert no ReferenceError — expect crash on unfixed code.

10. **sanitizeValue NoSQL Bypass (1.13)**: Call `sanitizeValue({ '$where': 'x' })`, assert
    the `$where` key is deleted — expect it to survive on unfixed code.

**Expected Counterexamples**:
- TypeError crashes for 1.1, 1.2, 1.5, 1.8, 1.12.
- Assertion failures for 1.3, 1.4, 1.6, 1.7, 1.9, 1.13.

---

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function
produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedFunction(input)
  ASSERT expectedBehavior(result)
END FOR
```

---

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed
function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalFunction(input) = fixedFunction(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking
because it generates many test cases automatically, catches edge cases, and provides
strong guarantees that behavior is unchanged for all non-buggy inputs.

**Preservation Test Cases**:

1. **Valid Logout Flow**: After fix 1.3, verify that a fresh login correctly stores
   `userData` in localStorage and that `isAuthenticated()` returns `true`.

2. **Valid Order Creation**: After fix 1.6, verify that orders with a valid `foodPartnerId`
   still return HTTP 201 and trigger WebSocket notification.

3. **Delivered Order Rating**: After fix 1.7, verify that orders with `status: 'delivered'`
   can still be rated (the original happy path is preserved).

4. **StoriesViewer with Valid Media**: After fix 1.8, verify that stories with non-empty
   media arrays play correctly with progress bars and navigation.

5. **Stories Sort with Valid Dates**: After fix 1.9, verify that stories with valid
   `createdAt` ISO strings are sorted correctly newest-first.

6. **WebSocket Single Notification**: After fix 1.4, verify that a single `new_order`
   event produces exactly one notification in DeliveryDashboard.

---

### Unit Tests

- Test `authService.logoutUser()` clears localStorage keys after the API call.
- Test `authService.logoutFoodPartner()` clears localStorage keys after the API call.
- Test `createOrder` returns 400 when `foodPartnerId` is not found.
- Test `rateOrder` returns 200 for `status: 'completed'` and `status: 'delivered'`.
- Test `rateOrder` returns 403 for `status: 'pending'` or `status: 'preparing'`.
- Test `sanitizeValue` removes keys starting with `'$'`.
- Test `sanitizeValue` removes keys containing `'.'`.
- Test `sanitizeValue` leaves clean keys untouched.
- Test `fetchCurrentUser` catch block accesses `storedUserData` without ReferenceError.
- Test `fetchStories` sort produces newest-first order with valid ISO dates.

---

### Property-Based Tests

- Generate random `foodPartnerId` strings (valid ObjectIds and invalid strings) and verify
  `createOrder` returns 400 for all non-existent IDs and 201 for all existing IDs.
- Generate random order statuses and verify `rateOrder` allows rating only for
  `'delivered'` and `'completed'`, rejecting all others.
- Generate random request bodies with and without `'$'`-prefixed keys and verify
  `sanitizeValue` removes all dangerous keys while preserving safe ones.
- Generate random story arrays with varying `createdAt` timestamps and verify the sort
  order is always descending by date.
- Generate random sequences of WebSocket events and verify DeliveryDashboard produces
  exactly one notification per event after fix 1.4.

---

### Integration Tests

- Full logout flow: login → navigate to dashboard → click logout in modal → verify
  redirect to `/login`, cookie cleared, localStorage cleared.
- Full order flow: place order with valid partner → verify 201 → place order with invalid
  partner → verify 400.
- Full rating flow: food partner marks order `completed` → user rates order → verify 200.
- Full stories flow: fetch stories with valid data → verify sorted newest-first → open
  StoriesViewer → verify no crash with valid and empty media arrays.
- Backend startup: start Express app → verify no syntax error from `app.js` → send
  request with `$where` key → verify it is sanitized.
