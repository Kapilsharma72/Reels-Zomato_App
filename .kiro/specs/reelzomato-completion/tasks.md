# Implementation Plan: ReelZomato Completion

## Overview

Incremental implementation plan covering critical bug fixes first (to restore core functionality), followed by new features. Each task builds on the previous, ending with full integration. All code is JavaScript (Node.js/Express backend, React frontend).

## Tasks

- [x] 1. Fix critical backend model bugs
  - [x] 1.1 Update `order.model.js` to add missing fields
    - Add `customerId` field (`ObjectId`, ref `User`)
    - Add `deliveryPartner` field (`ObjectId`, ref `User`)
    - Add `pickedUpAt`, `onTheWayAt`, `deliveredAt` date fields
    - Extend `status` enum to include `'picked_up'`, `'on_the_way'`, `'delivered'`
    - Add `paymentStatus` enum `['pending','paid','failed','refunded']`, default `'pending'`
    - Add `razorpayOrderId` String field
    - Add `rating` Number (1–5) and `review` String fields
    - _Requirements: 2.1–2.6, 3.1, 12.8, 12.9, 17.8_

  - [x] 1.2 Update `user.model.js` to add missing fields
    - Add `'admin'` to `role` enum
    - Add `savedAddresses` array sub-document with `name`, `phone`, `address`, `landmark`, `city`, `pincode`, `type` fields
    - Add `passwordResetToken` and `passwordResetExpires` fields
    - _Requirements: 13.7, 18.7, 20.7_

  - [x] 1.3 Update `foodPartner.model.js` to add `ratingCount` field
    - Add `ratingCount` Number field, default `0`
    - _Requirements: 17.5_

  - [x] 1.4 Update `food.model.js` to add menu management fields
    - Add `category` String field, default `'main'`
    - Add `isAvailable` Boolean field, default `true`
    - _Requirements: 16.6, 16.7_

- [x] 2. Fix JWT signing and auth middleware
  - [x] 2.1 Update `auth.controller.js` to include `userType` and `expiresIn` in all JWT sign calls
    - Add `userType: 'user'` to user JWT payload (register + login)
    - Add `userType: 'food-partner'` to food partner JWT payload (register + login)
    - Add `expiresIn: '7d'` option to all `jwt.sign()` calls
    - Update cookie `maxAge` to `604800000` (7 days) on all `res.cookie()` calls
    - _Requirements: 4.1, 4.2, 9.1, 9.2_

  - [x] 2.2 Update `auth.middleware.js` to handle JWT expiry and remove debug logs
    - In `authUserMiddleware` catch block, check `err.name === 'TokenExpiredError'` and return HTTP 401 `"Token expired, please login again"`
    - In `authFoodPartnerMiddleware` catch block, same expiry handling
    - Remove all `console.log` statements that expose token/decoded payload/DB query results
    - Add `adminMiddleware` that checks `req.user.role === 'admin'`, returns HTTP 403 if not
    - _Requirements: 9.3, 10.4, 20.5, 20.6_

  - [x] 2.3 Update delivery partner JWT to include `userType: 'delivery-partner'` and editor JWT to include `userType: 'editor'`
    - In `registerUser`/`loginUser`, derive `userType` from `user.role` and include in token payload
    - _Requirements: 4.3, 4.4_

- [x] 3. Fix frontend config bugs
  - [x] 3.1 Fix `Frontend/src/config/api.js` to use Vite env vars
    - Replace `process.env.NODE_ENV` with `import.meta.env.MODE`
    - Replace `process.env.REACT_APP_API_URL` with `import.meta.env.VITE_API_URL`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 3.2 Fix `Frontend/src/services/websocketService.js` hardcoded URL
    - Read WS URL from `import.meta.env.VITE_WS_URL` when defined
    - Fall back to deriving from `API_BASE_URL` by replacing `http` with `ws`
    - Remove hardcoded `ws://localhost:3001/ws` string
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 3.3 Fix duplicate `isAuthenticated` in `Frontend/src/services/authService.js`
    - Remove the second overriding `isAuthenticated()` definition (the one that checks only localStorage)
    - Keep the first definition that checks both `document.cookie` token and localStorage `userData`/`tempUserData`
    - Remove all `console.log` debug statements from `makeRequest` and `isAuthenticated`
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Fix backend route and controller bugs
  - [x] 4.1 Fix route conflict in `videoSubmission.routes.js`
    - Move `GET /food-partner/edited-videos` route definition before `GET /food-partner/:submissionId`
    - _Requirements: 5.1, 5.2_

  - [x] 4.2 Add missing editor stats endpoint to `videoSubmission.controller.js` and routes
    - Implement `getEditorStats` controller: aggregate `VideoSubmission` by `editorId` to return `totalProjects`, `completedProjects`, `inProgressProjects`, `totalEarnings`; return all zeros if no submissions
    - Register `GET /editor/stats` route protected by `authUserMiddleware` in `videoSubmission.routes.js`
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 4.3 Fix `order.controller.js` to use `customerId` and update WebSocket calls to use ObjectId
    - In `createOrder`, set `customerId: req.user._id` (requires `authUserMiddleware` on the route)
    - In `getOrdersByUserId`, query by `customerId` instead of `customerName`/`customerPhone` regex
    - In `updateOrderStatus`, pass `order.customerId` (ObjectId) instead of `order.customerName` to WebSocket notify calls
    - Extend `validStatuses` to include `'picked_up'`, `'on_the_way'`, `'delivered'`
    - _Requirements: 3.2, 3.3, 14.1, 14.5_

  - [x] 4.4 Gate debug endpoints in `auth.controller.js` and routes
    - Wrap `getAllFoodPartners`, `debugFoodPartnerById`, `createTestFoodPartner` routes so they only mount when `NODE_ENV === 'development'`
    - Move them under `/api/debug` prefix in `auth.routes.js`
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 5. Implement frontend ProtectedRoute and route guards
  - [x] 5.1 Create `Frontend/src/components/ProtectedRoute.jsx`
    - Accept `requiredRole` prop
    - Call `authService.isAuthenticated()` and read role from localStorage `userData`
    - Show loading spinner while auth state resolves
    - Redirect unauthenticated users to `/login`
    - Redirect wrong-role users to their appropriate home route
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 5.2 Wrap protected routes in `Frontend/src/App.jsx` with `ProtectedRoute`
    - Wrap `/user/home` with `requiredRole="user"`
    - Wrap `/food-partner/dashboard` with `requiredRole="food-partner"`
    - Wrap `/delivery/dashboard` with `requiredRole="delivery-partner"`
    - Wrap `/editor/dashboard` with `requiredRole="editor"`
    - Wrap `/admin/dashboard` with `requiredRole="admin"`
    - _Requirements: 11.2, 11.3_

- [x] 6. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Razorpay payment integration
  - [x] 7.1 Install `razorpay` package and add payment controller functions
    - Run `npm install razorpay` in `Backend/`
    - Create `Backend/src/controllers/payment.controller.js` with `createPaymentOrder` and `verifyPayment` functions
    - `createPaymentOrder`: create Razorpay order using `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`, return `{ orderId, amount, currency, keyId }`
    - `verifyPayment`: verify HMAC-SHA256 signature; on success update order `paymentMethod: 'razorpay'`, `paymentStatus: 'paid'`; on failure return HTTP 400 `"Payment verification failed"`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 7.2 Register payment routes in `order.routes.js`
    - Add `POST /create-payment` and `POST /verify-payment` routes protected by `authUserMiddleware`
    - _Requirements: 12.1, 12.3_

  - [x] 7.3 Create `Frontend/src/components/PaymentModal.jsx`
    - Dynamically load Razorpay checkout script
    - Call `POST /api/orders/create-payment` to get order details
    - Open Razorpay checkout with returned `orderId`, `amount`, `currency`, `keyId`
    - On payment success, call `POST /api/orders/verify-payment` and display confirmation
    - _Requirements: 12.6, 12.7_

  - [x] 7.4 Update `Frontend/src/services/orderService.js` to add `createPayment` and `verifyPayment` methods
    - _Requirements: 12.6, 12.7_

- [x] 8. Implement user profile and address management
  - [x] 8.1 Add profile and address controller functions to `auth.controller.js`
    - `getUserProfile`: return authenticated user's profile (`GET /api/auth/user/me`)
    - `updateUserProfile`: update `fullName`, `email`, `phoneNumber` (`PUT /api/auth/user/profile`)
    - `updateUserPassword`: verify `currentPassword` with bcrypt, save new hashed password; return HTTP 400 if mismatch (`PUT /api/auth/user/password`)
    - `addAddress`: push new address sub-document to `savedAddresses` (`POST /api/auth/user/addresses`)
    - `deleteAddress`: pull address by `addressId` from `savedAddresses` (`DELETE /api/auth/user/addresses/:addressId`)
    - _Requirements: 13.1–13.6_

  - [x] 8.2 Register user profile routes in `auth.routes.js`
    - All routes protected by `authUserMiddleware`
    - _Requirements: 13.1–13.6_

  - [x] 8.3 Update `Frontend/src/components/ProfileManagement.jsx` to wire profile and address API calls
    - Fetch and display profile fields; allow editing `fullName`, `email`, `phoneNumber`
    - Display saved addresses list with delete button
    - Add address form with `name`, `phone`, `address`, `landmark`, `city`, `pincode`, `type` fields
    - Change password section with `currentPassword` and `newPassword` inputs
    - _Requirements: 13.8_

- [x] 9. Fix real-time order tracking
  - [x] 9.1 Update `websocket.service.js` to use `customerId` ObjectId for customer notifications
    - In `notifyOrderUpdate`, `notifyOrderPreparing`, `notifyOrderReady`, `notifyOrderPickedUp`, `notifyOrderOnTheWay`, `notifyOrderDelivered` — replace `customerName` string parameter with `customerId` ObjectId string
    - Log both `user.id` and `user.userType` on new connection
    - _Requirements: 14.1, 14.5, 4.5_

  - [x] 9.2 Update `Frontend/src/components/OrderTracking.jsx` to handle all status stages
    - Display timeline stages: `pending` → `preparing` → `ready` → `picked_up` → `on_the_way` → `delivered`
    - Subscribe to `order_update` WebSocket events and update timeline without page reload
    - Show estimated delivery time when status is `on_the_way`
    - _Requirements: 14.2, 14.3, 14.4_

- [x] 10. Implement likes and comments API
  - [x] 10.1 Add like/comment controller functions to `food.controller.js`
    - `toggleLike`: toggle user `_id` in `food.likes` array; return `{ liked, likeCount }`
    - `addComment`: push `{ user: req.user._id, text, createdAt }` to `food.comments`
    - `getComments`: return paginated comments (query param `page`, `limit=10`)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 10.2 Register food like/comment routes in `food.routes.js`
    - `POST /:foodId/like` — `authUserMiddleware`
    - `POST /:foodId/comment` — `authUserMiddleware`
    - `GET /:foodId/comments` — public
    - _Requirements: 15.1, 15.4, 15.5_

  - [x] 10.3 Add like/comment controller functions to `post.controller.js`
    - `togglePostLike` and `addPostComment` with same logic as food
    - Register `POST /:postId/like` and `POST /:postId/comment` in `post.routes.js`
    - _Requirements: 15.6, 15.7_

  - [x] 10.4 Update reel viewer UI in `Frontend/src/general/home.jsx` to show like count, heart icon, and comment section
    - Call `POST /api/food/:foodId/like` on heart click; update icon state and count
    - Fetch and display comments; allow authenticated users to submit new comments
    - _Requirements: 15.8, 15.9_

- [x] 11. Implement food partner menu management
  - [x] 11.1 Create `Backend/src/controllers/menu.controller.js`
    - `createMenuItem`: create food doc with `dishName`, `description`, `price`, `category`, `imageUrl`, `foodPartner`, `isAvailable: true`; no `video` required (make video optional or use empty string)
    - `getMenuItems`: return all items for authenticated food partner where `isAvailable: true`
    - `updateMenuItem`: update item by `itemId` owned by food partner
    - `deleteMenuItem`: delete item by `itemId` owned by food partner
    - _Requirements: 16.1–16.5, 16.8_

  - [x] 11.2 Register menu routes under `/api/food-partner/menu` in a new or existing route file
    - All routes protected by `authFoodPartnerMiddleware`
    - _Requirements: 16.1–16.4_

  - [x] 11.3 Add "Menu Management" tab to `Frontend/src/pages/FoodPartnerDashboard.jsx`
    - Form to add menu items; list existing items with edit/delete actions
    - Call menu API endpoints via a new `menuService.js` or inline fetch calls
    - _Requirements: 16.5_

- [x] 12. Implement restaurant rating system
  - [x] 12.1 Add `rateOrder` controller function to `order.controller.js`
    - Verify order `status === 'delivered'` and `customerId` matches `req.user._id`; return HTTP 403 otherwise
    - Return HTTP 409 if `order.rating` already set
    - Save `rating` and `review` on order
    - Update `FoodPartner.rating` as rolling average using `ratingCount`
    - _Requirements: 17.1–17.5, 17.7_

  - [x] 12.2 Register `POST /api/orders/:orderId/rate` route protected by `authUserMiddleware`
    - _Requirements: 17.1_

  - [x] 12.3 Add rating prompt modal to `Frontend/src/components/OrderTracking.jsx`
    - Show modal when order status reaches `'delivered'`
    - Star rating input (1–5) and optional review text
    - Call `POST /api/orders/:orderId/rate` on submit
    - _Requirements: 17.6_

- [x] 13. Implement forgot/reset password flow
  - [x] 13.1 Install `nodemailer` and add forgot/reset password controller functions to `auth.controller.js`
    - Run `npm install nodemailer` in `Backend/`
    - `forgotPassword`: find user by email; generate `crypto.randomBytes(32).toString('hex')` token; store hash (`crypto.createHash('sha256')`) and expiry (1 hour) on user; send reset email via nodemailer; always return HTTP 200 with generic message
    - `resetPassword`: hash incoming token, find user where `passwordResetToken` matches and `passwordResetExpires > Date.now()`; return HTTP 400 if not found; save new hashed password and clear reset fields
    - _Requirements: 18.1–18.6_

  - [x] 13.2 Register `POST /api/auth/forgot-password` and `POST /api/auth/reset-password/:token` routes (public, no auth middleware)
    - _Requirements: 18.1, 18.4_

  - [x] 13.3 Create `Frontend/src/pages/ForgotPassword.jsx` and `Frontend/src/pages/ResetPassword.jsx`
    - `ForgotPassword`: email input form, calls `POST /api/auth/forgot-password`, shows success message
    - `ResetPassword`: new password input form, reads token from URL params, calls `POST /api/auth/reset-password/:token`
    - Register both routes in `App.jsx` as public routes
    - _Requirements: 18.8_

- [x] 14. Implement backend search API
  - [x] 14.1 Create `Backend/src/controllers/search.controller.js`
    - `search`: accept `q` and optional `type` (`'restaurant'|'dish'|'all'`, default `'all'`) query params
    - Case-insensitive regex search: `FoodPartner` by `businessName`; `Food` by `dishName` or `category`
    - Limit 20 results per type; return `{ restaurants: [...], dishes: [...] }`
    - _Requirements: 19.1–19.5_

  - [x] 14.2 Register `GET /api/search` route (public) in `app.js`
    - _Requirements: 19.1_

  - [x] 14.3 Add search bar to `Frontend/src/general/home.jsx`
    - Debounce input 300ms before calling `GET /api/search?q=...`
    - Display results grouped by restaurants and dishes below the search bar
    - _Requirements: 19.6, 19.7_

- [x] 15. Implement admin panel
  - [x] 15.1 Create `Backend/src/controllers/admin.controller.js`
    - `getStats`: return `{ users, foodPartners, orders, reels }` counts
    - `getUsers`: paginated list of all users (query params `page`, `limit`)
    - `updateUserRole`: update `user.role` by `userId`
    - `deactivateUser`: soft-delete by setting `user.isActive = false` (add `isActive` Boolean field to User model, default `true`)
    - _Requirements: 20.1–20.4_

  - [x] 15.2 Register `/api/admin/*` routes protected by `authUserMiddleware` + `adminMiddleware`
    - `GET /api/admin/stats`, `GET /api/admin/users`, `PUT /api/admin/users/:userId/role`, `DELETE /api/admin/users/:userId`
    - _Requirements: 20.1–20.6_

  - [x] 15.3 Create `Frontend/src/pages/AdminDashboard.jsx`
    - Display platform stats (user count, food partner count, order count, reel count)
    - Paginated user list with role update and deactivate actions
    - Route at `/admin/dashboard` wrapped with `ProtectedRoute requiredRole="admin"`
    - _Requirements: 20.8_

- [x] 16. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 17. Implement security hardening
  - [x] 17.1 Install security packages and apply to `app.js`
    - Run `npm install helmet express-rate-limit express-mongo-sanitize` in `Backend/`
    - Apply `helmet()` middleware globally in `app.js`
    - Apply `mongoSanitize()` middleware globally in `app.js`
    - Reduce JSON body limit from `50mb` to `10mb` for non-upload routes (or add a separate limit for upload routes)
    - Update CORS `origin` to read from `process.env.ALLOWED_ORIGINS` in production
    - _Requirements: 21.3, 21.7, 21.8_

  - [x] 17.2 Apply rate limiting to auth and forgot-password routes in `auth.routes.js`
    - `POST /api/auth/user/login` and `POST /api/auth/foodPartner/login`: 10 requests per 15 minutes
    - `POST /api/auth/forgot-password`: 5 requests per hour
    - _Requirements: 21.1, 21.2_

  - [x] 17.3 Harden cookie settings in `auth.controller.js`
    - Set `secure: process.env.NODE_ENV === 'production'` (already done — verify)
    - Set `sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'` on all `res.cookie()` calls
    - _Requirements: 21.4, 21.5_

  - [x] 17.4 Remove remaining `console.log` statements that expose sensitive data across all backend files
    - Remove logs in `auth.middleware.js`, `auth.controller.js`, `order.controller.js` that output tokens, decoded payloads, or full DB documents
    - Gate any remaining debug logs with `if (process.env.NODE_ENV === 'development')`
    - _Requirements: 21.6, 10.4_

- [x] 18. Update `Frontend/src/services/videoSubmissionService.js` to call correct editor stats endpoint
  - Update `getEditorStats()` to call `GET /api/video-submissions/editor/stats`
  - _Requirements: 6.3_

- [x] 19. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Install backend packages before implementing features that depend on them: `razorpay`, `nodemailer`, `helmet`, `express-rate-limit`, `express-mongo-sanitize`
