# Bugfix Requirements Document

## Introduction

A comprehensive audit of the ReelZomato full-stack application (React/Vite frontend + Node.js/Express/MongoDB backend) revealed multiple bugs introduced or exposed after recent UI updates. These bugs span authentication flows, logout handlers, WebSocket event listener duplication, order creation validation, story viewer media handling, and several UI rendering issues. This document captures all defects, their expected correct behavior, and the existing behavior that must be preserved.

---

## Bug Analysis

### Current Behavior (Defect)

**Authentication / Logout**

1.1 WHEN a user clicks "Logout" in the DeliveryDashboard logout confirmation modal THEN the system calls `authService.logout()` which does not exist (the method is `logoutUser()`), causing an uncaught TypeError crash

1.2 WHEN a user clicks "Logout" in the EditorDashboard logout confirmation modal THEN the system calls `authService.logout()` which does not exist, causing an uncaught TypeError crash

1.3 WHEN `authService.logoutUser()` is called THEN the system sends a GET request to `/api/auth/user/logout` but does NOT clear `localStorage` items (`userData`, `tempUserData`), leaving stale auth data that causes the app to behave as if the user is still logged in after logout

**WebSocket / Event Listeners**

1.4 WHEN the DeliveryDashboard mounts with an active socket THEN the system registers `new_order`, `order_update`, and `order_assigned` listeners twice (once in the first `useEffect` and again in the second `useEffect`), causing every WebSocket event to fire duplicate handlers and duplicate notifications

1.5 WHEN the EditorDashboard mounts THEN the system references `setNotifications` inside a `useEffect` but `notifications` state is never declared in `EditorDashboard`, causing a ReferenceError crash when a WebSocket event arrives

**Order Creation**

1.6 WHEN a user places an order and the `foodPartnerId` in the request does not match any existing food partner THEN the system silently creates a "Default Restaurant" food partner and assigns the order to it, so the real restaurant never receives the order

1.7 WHEN `updateOrderStatus` is called with `status = 'completed'` THEN the system sets `completedTime` using `undefined` for non-completed statuses via `completedTime: status === 'completed' ? new Date() : undefined`, which in MongoDB `$set` with `undefined` is a no-op but can cause inconsistency; more critically, the `rateOrder` controller checks `order.status !== 'delivered'` but the food partner sets status to `'completed'`, so users can never rate their orders

**Stories Viewer**

1.8 WHEN the StoriesViewer progress timer fires and `currentMedia` is `undefined` (e.g., story group has zero media items) THEN the system calls `currentMedia.duration` on `undefined`, throwing a TypeError and crashing the viewer

1.9 WHEN `fetchStories` in UserHome groups stories and calls `new Date(group.time)` for sorting THEN `group.time` is a human-readable string like "2h ago" (not an ISO date), so `new Date("2h ago")` returns `Invalid Date` and the sort produces incorrect ordering

**Post Model / Like Feature**

1.10 WHEN `togglePostLike` or `addPostComment` is called THEN the system references `post.likes` and `post.comments` arrays, but the `PostModel` schema does not define `likes` or `comments` fields, causing Mongoose to silently ignore pushes and the feature to never persist

**ProtectedRoute**

1.11 WHEN a logged-in food-partner user navigates to `/user/home` (which requires `requiredRole="user"`) THEN the system behavior depends on `ProtectedRoute` implementation — if it only checks `localStorage` role without verifying the cookie, a food partner can access user-only pages

**UserHome — `storedUserData` variable scope**

1.12 WHEN `fetchCurrentUser` catches an error and checks `!storedUserData` in the catch block THEN `storedUserData` is declared with `const` inside the `try` block and is not accessible in the `catch` block, causing a ReferenceError

**Backend app.js — Corrupted mongoSanitize function**

1.13 WHEN the backend starts THEN `app.js` contains a corrupted string literal in the `sanitizeValue` function (`key.startsWith('\n')` with a raw newline embedded in source), which may cause a syntax error or incorrect sanitization behavior depending on the JS engine

---

### Expected Behavior (Correct)

**Authentication / Logout**

2.1 WHEN a user clicks "Logout" in the DeliveryDashboard or EditorDashboard confirmation modal THEN the system SHALL call `authService.logoutUser()` (the correct method name) without throwing a TypeError

2.2 WHEN `authService.logoutUser()` or `authService.logoutFoodPartner()` completes THEN the system SHALL also clear `localStorage` keys `userData` and `tempUserData` so no stale session data remains

**WebSocket / Event Listeners**

2.3 WHEN the DeliveryDashboard mounts THEN the system SHALL register each WebSocket event listener (`new_order`, `order_update`, `order_assigned`, `order_ready`) exactly once, and the cleanup function SHALL remove all registered listeners

2.4 WHEN the EditorDashboard mounts THEN the system SHALL have `notifications` state declared (or remove the reference) so that WebSocket event handlers do not throw a ReferenceError

**Order Creation**

2.5 WHEN a user places an order with a `foodPartnerId` that does not exist in the database THEN the system SHALL return a `400` error with a clear message ("Food partner not found") instead of silently creating a default partner

2.6 WHEN a food partner marks an order as `'completed'` THEN the system SHALL also accept `'completed'` as a valid status for the `rateOrder` eligibility check (in addition to `'delivered'`), so users can rate their orders

**Stories Viewer**

2.7 WHEN the StoriesViewer progress timer fires THEN the system SHALL guard against `currentMedia` being `undefined` before accessing `currentMedia.duration`, preventing a TypeError crash

2.8 WHEN `fetchStories` sorts story groups THEN the system SHALL store and sort by the raw ISO date string (or a `Date` object) rather than the formatted "X ago" string, so sorting produces correct chronological order

**Post Model / Like Feature**

2.9 WHEN `togglePostLike` or `addPostComment` is called THEN the system SHALL have `likes` (Array of ObjectId refs to User) and `comments` (Array of subdocuments with `user`, `text`, `createdAt`) defined in the `PostModel` schema so that operations persist correctly

**UserHome — variable scope**

2.10 WHEN `fetchCurrentUser` encounters an API error THEN the system SHALL access `storedUserData` from a scope that is visible in the `catch` block (declared before the `try` block), preventing a ReferenceError

**Backend app.js**

2.11 WHEN the backend starts THEN the `sanitizeValue` function in `app.js` SHALL use a proper string literal `'$'` (checking `key.startsWith('$')`) instead of a corrupted newline character, ensuring correct NoSQL injection sanitization

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a valid user logs in with correct credentials THEN the system SHALL CONTINUE TO set the `token` cookie and return the user object with `id`, `fullName`, `email`, and `role`

3.2 WHEN a food partner logs in with correct credentials THEN the system SHALL CONTINUE TO set the `token` cookie and return the food partner object

3.3 WHEN a user navigates to `/user/home` while authenticated as a regular user THEN the system SHALL CONTINUE TO render the UserHome page with posts, stories, and categories

3.4 WHEN the FoodPartnerDashboard fetches orders THEN the system SHALL CONTINUE TO retrieve and display orders belonging to the authenticated food partner

3.5 WHEN the StoriesViewer is opened with valid story groups containing media THEN the system SHALL CONTINUE TO display stories with progress bars, play/pause, and navigation working correctly

3.6 WHEN a user places an order with a valid `foodPartnerId` THEN the system SHALL CONTINUE TO create the order, notify the food partner via WebSocket, and return the order details

3.7 WHEN the NotificationCenter receives WebSocket order events THEN the system SHALL CONTINUE TO display real-time notifications with correct counts and types

3.8 WHEN the ProfileManagement component loads THEN the system SHALL CONTINUE TO fetch and display the user's profile info and saved addresses

3.9 WHEN the AdminDashboard loads THEN the system SHALL CONTINUE TO fetch and display user stats and the paginated user list

3.10 WHEN the PaymentModal initiates a Razorpay payment THEN the system SHALL CONTINUE TO load the Razorpay script, create a payment order, and open the checkout dialog
