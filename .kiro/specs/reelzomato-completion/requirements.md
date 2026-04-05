# Requirements Document

## Introduction

ReelZomato is a full-stack food delivery and social media platform where food partners upload short-form food reels, editors polish the videos, delivery partners fulfill orders, and customers browse, order, and track deliveries in real time. The project has a partial implementation using React 19 + Vite (frontend) and Node.js/Express 5 + MongoDB (backend). This document captures all requirements needed to complete the platform: fixing critical bugs that break core functionality, and building the missing features required for a production-ready release.

---

## Glossary

- **System**: The ReelZomato platform as a whole (frontend + backend)
- **API**: The Express 5 backend REST API
- **Frontend**: The React 19 + Vite single-page application
- **Auth_Service**: The frontend `authService.js` singleton responsible for authentication state
- **Order_Model**: The Mongoose `Order` schema in `order.model.js`
- **WebSocket_Service**: The backend `websocket.service.js` singleton managing real-time connections
- **WebSocket_Client**: The frontend `websocketService.js` and `useWebSocket.js` hook
- **JWT**: JSON Web Token used for stateless authentication via HTTP-only cookies
- **Route_Guard**: A React Router component that redirects unauthenticated users away from protected pages
- **Food_Partner**: A restaurant or food business registered on the platform
- **Delivery_Partner**: A registered user with `role: 'delivery-partner'` who fulfills orders
- **Editor**: A registered user with `role: 'editor'` who edits food reels
- **User**: A registered customer with `role: 'user'`
- **Admin**: A platform administrator with elevated privileges
- **Razorpay**: The payment gateway used for processing orders
- **ImageKit**: The cloud storage service used for media uploads
- **Reel**: A short-form food video uploaded by a Food_Partner
- **Post**: A static image or text post uploaded by a Food_Partner
- **VideoSubmission**: A raw video submitted by a Food_Partner to an Editor for editing
- **Order_Tracking_Timeline**: The UI component showing real-time order status progression

---

## Requirements

---

### Requirement 1: Fix Duplicate `isAuthenticated` in Auth_Service

**User Story:** As a developer, I want the Auth_Service to have a single, correct `isAuthenticated` implementation, so that authentication checks behave predictably across the frontend.

#### Acceptance Criteria

1. THE Auth_Service SHALL define `isAuthenticated()` exactly once.
2. WHEN `isAuthenticated()` is called, THE Auth_Service SHALL return `true` if a valid HTTP-only cookie token is present OR if `userData` or `tempUserData` exists in `localStorage`.
3. THE Auth_Service SHALL remove the second (overriding) definition of `isAuthenticated()` that checks only `localStorage`.

---

### Requirement 2: Fix Missing `deliveryPartner` Field in Order_Model

**User Story:** As a delivery partner, I want my assignment to be persisted on an order, so that I can retrieve and manage my assigned deliveries.

#### Acceptance Criteria

1. THE Order_Model SHALL include a `deliveryPartner` field of type `mongoose.Schema.Types.ObjectId` referencing the `User` collection.
2. THE Order_Model SHALL include a `pickedUpAt` field of type `Date`.
3. THE Order_Model SHALL include an `onTheWayAt` field of type `Date`.
4. THE Order_Model SHALL include a `deliveredAt` field of type `Date`.
5. THE Order_Model SHALL include `'picked_up'`, `'on_the_way'`, and `'delivered'` as valid values in the `status` enum.
6. WHEN the delivery controller queries `{ deliveryPartner: { $exists: false } }`, THE API SHALL return only orders not yet assigned to any delivery partner.

---

### Requirement 3: Fix Order-User Relationship

**User Story:** As a customer, I want my orders to be linked to my account by user ID, so that I can retrieve my full order history reliably.

#### Acceptance Criteria

1. THE Order_Model SHALL include a `customerId` field of type `mongoose.Schema.Types.ObjectId` referencing the `User` collection.
2. WHEN an order is created, THE API SHALL populate `customerId` from the authenticated user's `_id`.
3. WHEN the order history endpoint is called, THE API SHALL query orders by `customerId` rather than by `customerName` string.
4. THE Order_Model SHALL retain `customerName` and `customerPhone` as denormalized display fields.

---

### Requirement 4: Fix WebSocket JWT Token Missing `userType`

**User Story:** As an authenticated user, I want my WebSocket connection to carry my user type, so that the server can route real-time notifications to the correct role.

#### Acceptance Criteria

1. WHEN a JWT is signed for a `User`, THE API SHALL include `{ id, userType: 'user' }` in the token payload.
2. WHEN a JWT is signed for a `Food_Partner`, THE API SHALL include `{ id, userType: 'food-partner' }` in the token payload.
3. WHEN a JWT is signed for a `Delivery_Partner` (role `delivery-partner`), THE API SHALL include `{ id, userType: 'delivery-partner' }` in the token payload.
4. WHEN a JWT is signed for an `Editor` (role `editor`), THE API SHALL include `{ id, userType: 'editor' }` in the token payload.
5. WHEN the WebSocket_Service logs a new connection, THE WebSocket_Service SHALL log both `user.id` and `user.userType`.

---

### Requirement 5: Fix Route Conflict in Video Submission Routes

**User Story:** As a food partner, I want to retrieve my edited videos without the request being intercepted by a parameterized route, so that the correct endpoint is always reached.

#### Acceptance Criteria

1. THE API SHALL define the `/food-partner/edited-videos` route before the `/food-partner/:submissionId` route in `videoSubmission.routes.js`.
2. WHEN a `GET /food-partner/edited-videos` request is made, THE API SHALL invoke `getEditedVideos` and SHALL NOT treat `edited-videos` as a `submissionId` parameter.

---

### Requirement 6: Add Missing Editor Stats Endpoint

**User Story:** As an editor, I want to see my statistics dashboard, so that I can track my completed projects and earnings.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/video-submissions/editor/stats` endpoint protected by `authUserMiddleware`.
2. WHEN the stats endpoint is called by an authenticated editor, THE API SHALL return `totalProjects`, `completedProjects`, `inProgressProjects`, and `totalEarnings` for that editor.
3. WHEN `getEditorStats()` is called on the frontend, THE Frontend SHALL request `GET /api/video-submissions/editor/stats`.
4. IF no submissions exist for the editor, THEN THE API SHALL return all stat fields as `0`.

---

### Requirement 7: Fix `api.js` Environment Variable for Vite

**User Story:** As a developer, I want the API base URL to be resolved correctly in the Vite build environment, so that the frontend connects to the right backend in all environments.

#### Acceptance Criteria

1. THE Frontend SHALL use `import.meta.env.MODE` instead of `process.env.NODE_ENV` to detect the current environment in `api.js`.
2. THE Frontend SHALL use `import.meta.env.VITE_API_URL` as the production API URL fallback instead of `process.env.REACT_APP_API_URL`.
3. WHEN `import.meta.env.MODE === 'development'`, THE Frontend SHALL resolve the API base URL to `http://localhost:3001` for local access or `http://{hostname}:3001` for network access.

---

### Requirement 8: Fix Hardcoded WebSocket URL

**User Story:** As a developer, I want the WebSocket URL to be configurable via environment variables, so that the frontend can connect to the correct WebSocket server in any environment.

#### Acceptance Criteria

1. THE WebSocket_Client SHALL read the WebSocket server URL from `import.meta.env.VITE_WS_URL` when defined.
2. IF `VITE_WS_URL` is not defined, THEN THE WebSocket_Client SHALL derive the WebSocket URL from `API_BASE_URL` by replacing the `http` scheme with `ws`.
3. THE WebSocket_Client SHALL NOT contain a hardcoded `ws://localhost:3001/ws` URL string.

---

### Requirement 9: Add JWT Expiry

**User Story:** As a security-conscious operator, I want all JWT tokens to expire, so that stolen tokens cannot be used indefinitely.

#### Acceptance Criteria

1. WHEN a JWT is signed for any user type, THE API SHALL include an `expiresIn` option of `'7d'`.
2. THE cookie `maxAge` SHALL match the JWT expiry (7 days = 604800000 ms).
3. WHEN an expired JWT is presented, THE API SHALL return HTTP 401 with message `"Token expired, please login again"`.

---

### Requirement 10: Remove Debug Endpoints from Production Routes

**User Story:** As a security-conscious operator, I want debug endpoints removed from production, so that internal data is not exposed to unauthorized users.

#### Acceptance Criteria

1. THE API SHALL remove or gate the `getAllFoodPartners`, `debugFoodPartnerById`, and `createTestFoodPartner` controller functions from production routes.
2. WHERE `NODE_ENV` is `'development'`, THE API SHALL optionally expose debug routes under a `/api/debug` prefix.
3. WHEN `NODE_ENV` is `'production'`, THE API SHALL return HTTP 404 for any request to debug routes.
4. THE auth middleware SHALL remove all `console.log` debug statements that expose token and database details.

---

### Requirement 11: Implement Protected Routes on Frontend

**User Story:** As a platform operator, I want all dashboard routes to require authentication, so that unauthenticated users cannot access protected pages.

#### Acceptance Criteria

1. THE Frontend SHALL implement a `ProtectedRoute` component that checks authentication state before rendering a route.
2. WHEN an unauthenticated user navigates to `/user/home`, `/food-partner/dashboard`, `/delivery/dashboard`, or `/editor/dashboard`, THE Frontend SHALL redirect the user to `/login`.
3. WHEN an authenticated user navigates to a protected route for a different role (e.g., a `user` accessing `/food-partner/dashboard`), THE Frontend SHALL redirect to the user's appropriate home route.
4. THE `ProtectedRoute` component SHALL accept a `requiredRole` prop to enforce role-based access.
5. WHEN the authentication state is loading, THE Frontend SHALL display a loading indicator rather than redirecting.

---

### Requirement 12: Razorpay Payment Integration

**User Story:** As a customer, I want to pay for my order using Razorpay, so that I can complete purchases securely without leaving the platform.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/orders/create-payment` endpoint that creates a Razorpay order and returns `{ orderId, amount, currency, keyId }`.
2. WHEN a payment order is created, THE API SHALL use the configured `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` environment variables.
3. THE API SHALL expose a `POST /api/orders/verify-payment` endpoint that verifies the Razorpay payment signature using HMAC-SHA256.
4. WHEN payment verification succeeds, THE API SHALL update the order `paymentMethod` to `'razorpay'` and `paymentStatus` to `'paid'`.
5. IF payment verification fails, THEN THE API SHALL return HTTP 400 with message `"Payment verification failed"`.
6. THE Frontend SHALL render a payment modal that loads the Razorpay checkout script and initiates payment using the order details returned by the backend.
7. WHEN payment is successful, THE Frontend SHALL call the verify-payment endpoint and display a success confirmation.
8. THE Order_Model SHALL include a `paymentStatus` field with enum values `['pending', 'paid', 'failed', 'refunded']` and default `'pending'`.
9. THE Order_Model SHALL include a `razorpayOrderId` field of type `String`.

---

### Requirement 13: User Profile and Address Management

**User Story:** As a customer, I want to manage my profile and saved addresses, so that I can check out faster and keep my account information up to date.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/auth/user/me` endpoint that returns the authenticated user's profile.
2. THE API SHALL expose a `PUT /api/auth/user/profile` endpoint that updates `fullName`, `email`, and `phoneNumber`.
3. THE API SHALL expose a `PUT /api/auth/user/password` endpoint that accepts `currentPassword` and `newPassword`, verifies the current password with bcrypt, and saves the new hashed password.
4. IF `currentPassword` does not match, THEN THE API SHALL return HTTP 400 with message `"Current password is incorrect"`.
5. THE API SHALL expose a `POST /api/auth/user/addresses` endpoint that adds a new address to the user's saved addresses array.
6. THE API SHALL expose a `DELETE /api/auth/user/addresses/:addressId` endpoint that removes a saved address.
7. THE User_Model SHALL include a `savedAddresses` array field containing address sub-documents with `name`, `phone`, `address`, `landmark`, `city`, `pincode`, and `type` fields.
8. THE Frontend SHALL render a profile page accessible from the user home that displays and allows editing of profile fields and saved addresses.

---

### Requirement 14: Real-time Order Tracking

**User Story:** As a customer, I want to see my order status update in real time, so that I know exactly where my food is without refreshing the page.

#### Acceptance Criteria

1. WHEN an order status changes, THE WebSocket_Service SHALL send an `order_update` event to the customer identified by `customerId` on the order.
2. THE Frontend Order_Tracking_Timeline SHALL display the following stages in sequence: `pending` → `preparing` → `ready` → `picked_up` → `on_the_way` → `delivered`.
3. WHEN a WebSocket `order_update` event is received, THE Frontend SHALL update the Order_Tracking_Timeline without a page reload.
4. WHEN the order status is `on_the_way`, THE Frontend SHALL display the estimated delivery time from the WebSocket payload.
5. THE WebSocket_Service SHALL use `customerId` (ObjectId) to identify the customer WebSocket connection, not `customerName`.

---

### Requirement 15: Likes and Comments API

**User Story:** As a customer, I want to like and comment on food reels and posts, so that I can engage with food content on the platform.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/food/:foodId/like` endpoint that toggles a like for the authenticated user on a Reel.
2. WHEN a user who has not liked a Reel calls the like endpoint, THE API SHALL add the user's `_id` to the `likes` array and return `{ liked: true, likeCount }`.
3. WHEN a user who has already liked a Reel calls the like endpoint, THE API SHALL remove the user's `_id` from the `likes` array and return `{ liked: false, likeCount }`.
4. THE API SHALL expose a `POST /api/food/:foodId/comment` endpoint that adds a comment with `{ user, text, createdAt }` to the Reel's `comments` array.
5. THE API SHALL expose a `GET /api/food/:foodId/comments` endpoint that returns paginated comments for a Reel.
6. THE API SHALL expose a `POST /api/posts/:postId/like` endpoint with the same toggle behavior for Posts.
7. THE API SHALL expose a `POST /api/posts/:postId/comment` endpoint for Post comments.
8. THE Frontend reel viewer SHALL display the current like count and a filled/unfilled heart icon reflecting the authenticated user's like state.
9. THE Frontend reel viewer SHALL allow authenticated users to submit comments and display the comment list.

---

### Requirement 16: Food Partner Menu Management

**User Story:** As a food partner, I want to manage my menu items independently of reel uploads, so that customers can browse my full menu even without a video.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/food-partner/menu` endpoint that creates a new menu item with `dishName`, `description`, `price`, `category`, and optional `imageUrl`.
2. THE API SHALL expose a `GET /api/food-partner/menu` endpoint that returns all menu items for the authenticated food partner.
3. THE API SHALL expose a `PUT /api/food-partner/menu/:itemId` endpoint that updates a menu item.
4. THE API SHALL expose a `DELETE /api/food-partner/menu/:itemId` endpoint that deletes a menu item.
5. THE Frontend food partner dashboard SHALL include a "Menu Management" tab with a form to add items and a list to edit or delete existing items.
6. THE Food_Model SHALL include a `category` field of type `String` with a default of `'main'`.
7. THE Food_Model SHALL include an `isAvailable` field of type `Boolean` with a default of `true`.
8. WHEN `isAvailable` is `false`, THE API SHALL exclude the item from public menu listings.

---

### Requirement 17: Restaurant Rating System

**User Story:** As a customer, I want to rate a restaurant after my order is delivered, so that other users can make informed decisions.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/orders/:orderId/rate` endpoint that accepts a `rating` (integer 1–5) and optional `review` string.
2. WHEN the rating endpoint is called, THE API SHALL verify that the order `status` is `'delivered'` and that `customerId` matches the authenticated user.
3. IF the order is not delivered or does not belong to the user, THEN THE API SHALL return HTTP 403.
4. WHEN a rating is submitted, THE API SHALL update the `FoodPartner` document's `rating` field as a rolling average.
5. THE FoodPartner_Model SHALL include a `ratingCount` field of type `Number` with default `0` to support rolling average calculation.
6. THE Frontend SHALL display a rating prompt modal after an order reaches `'delivered'` status.
7. WHEN a rating has already been submitted for an order, THE API SHALL return HTTP 409 with message `"Order already rated"`.
8. THE Order_Model SHALL include a `rating` field of type `Number` (1–5) and a `review` field of type `String`.

---

### Requirement 18: Forgot Password / Reset Flow

**User Story:** As a user, I want to reset my password via email, so that I can regain access to my account if I forget my password.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/auth/forgot-password` endpoint that accepts an `email` and sends a password reset link if the email exists.
2. WHEN a reset is requested, THE API SHALL generate a cryptographically random token, store its hash and expiry (1 hour) on the user document, and send an email with the reset link.
3. IF the email does not exist in the database, THEN THE API SHALL return HTTP 200 with a generic message to prevent user enumeration.
4. THE API SHALL expose a `POST /api/auth/reset-password/:token` endpoint that accepts `newPassword` and validates the token against the stored hash and expiry.
5. IF the reset token is expired or invalid, THEN THE API SHALL return HTTP 400 with message `"Reset token is invalid or has expired"`.
6. WHEN the password is successfully reset, THE API SHALL clear the reset token fields and save the new hashed password.
7. THE User_Model SHALL include `passwordResetToken` and `passwordResetExpires` fields.
8. THE Frontend SHALL render a "Forgot Password" page with an email input and a "Reset Password" page with a new password input.

---

### Requirement 19: Backend Search API

**User Story:** As a customer, I want to search for restaurants and dishes by name or category, so that I can quickly find what I want to eat.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/search` endpoint that accepts a `q` query parameter.
2. WHEN a search query is provided, THE API SHALL return matching `FoodPartner` documents (by `businessName`) and matching `Food` documents (by `dishName` or `category`) in a single response.
3. THE API SHALL perform case-insensitive partial matching using MongoDB regex or text indexes.
4. THE API SHALL accept an optional `type` query parameter with values `'restaurant'`, `'dish'`, or `'all'` (default `'all'`).
5. THE API SHALL limit search results to 20 items per type.
6. THE Frontend SHALL render a search bar on the user home page that calls the search endpoint on input change with a 300ms debounce.
7. THE Frontend SHALL display search results grouped by restaurants and dishes.

---

### Requirement 20: Admin Panel

**User Story:** As a platform administrator, I want a basic admin dashboard, so that I can monitor platform activity and manage users.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/admin/stats` endpoint returning total counts of users, food partners, orders, and reels.
2. THE API SHALL expose a `GET /api/admin/users` endpoint returning a paginated list of all users.
3. THE API SHALL expose a `PUT /api/admin/users/:userId/role` endpoint that updates a user's role.
4. THE API SHALL expose a `DELETE /api/admin/users/:userId` endpoint that deactivates (soft-deletes) a user.
5. THE API SHALL protect all `/api/admin/*` routes with a middleware that verifies the authenticated user has `role: 'admin'`.
6. IF a non-admin user calls an admin endpoint, THEN THE API SHALL return HTTP 403 with message `"Admin access required"`.
7. THE User_Model SHALL include `'admin'` as a valid value in the `role` enum.
8. THE Frontend SHALL render an admin dashboard page at `/admin/dashboard` accessible only to users with `role: 'admin'`.

---

### Requirement 21: Security Hardening

**User Story:** As a platform operator, I want the API to be hardened against common attacks, so that user data and platform integrity are protected.

#### Acceptance Criteria

1. THE API SHALL apply rate limiting of 10 requests per 15-minute window on `POST /api/auth/user/login` and `POST /api/auth/foodPartner/login`.
2. THE API SHALL apply rate limiting of 5 requests per hour on `POST /api/auth/forgot-password`.
3. THE API SHALL sanitize all user-supplied string inputs to strip HTML tags and MongoDB operator injection patterns before persisting to the database.
4. THE API SHALL set the `secure` cookie flag to `true` when `NODE_ENV` is `'production'`.
5. THE API SHALL set `sameSite: 'strict'` on authentication cookies in production.
6. THE API SHALL remove all `console.log` statements that output JWT tokens, decoded payloads, or database query results in non-development environments.
7. WHEN a request body exceeds 10MB for non-upload endpoints, THE API SHALL return HTTP 413.
8. THE API SHALL include `helmet` middleware to set secure HTTP headers.
```
