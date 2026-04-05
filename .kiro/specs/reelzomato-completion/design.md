# Design Document: ReelZomato Completion

## Overview

ReelZomato is a full-stack food delivery and social media platform. The existing codebase has a working skeleton: authentication for users and food partners, food reel uploads, video submission/editing workflow, order creation, delivery partner assignment, and real-time WebSocket notifications. This design covers all changes needed to complete the platform to a production-ready state, organized into bug fixes and new features.

The backend is Node.js/Express 5 with MongoDB/Mongoose. The frontend is React 19 + Vite with React Router v7. Real-time communication uses the `ws` package. Payments use Razorpay. Email uses Nodemailer with configurable SMTP.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React 19 Frontend                    │
│  React Router v7 · Vite · Tailwind/CSS Modules          │
│                                                          │
│  ProtectedRoute  PaymentModal  UserProfile  SearchBar   │
│  AdminDashboard  RatingModal   OrderTracking            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (fetch, credentials:include)
                         │ WebSocket (ws://)
┌────────────────────────▼────────────────────────────────┐
│                  Express 5 Backend                       │
│  helmet · express-rate-limit · express-mongo-sanitize   │
│                                                          │
│  /api/auth   /api/orders   /api/food   /api/search      │
│  /api/admin  /api/food-partner/menu   /api/video-subs   │
└────────────────────────┬────────────────────────────────┘
                         │ Mongoose ODM
┌────────────────────────▼────────────────────────────────┐
│                     MongoDB Atlas                        │
│  User · FoodPartner · Food · Order · VideoSubmission    │
└─────────────────────────────────────────────────────────┘
```

All authentication uses JWT stored in HTTP-only cookies (`token`). The JWT payload carries `{ id, userType }`. WebSocket connections are authenticated by reading the same cookie during the `verifyClient` handshake.

---


## Components and Interfaces

### New Backend Files to Create

```
Backend/src/
  controllers/
    payment.controller.js       # Razorpay create-order + verify-payment
    search.controller.js        # GET /api/search
    admin.controller.js         # Admin stats, user management
    rating.controller.js        # POST /api/orders/:orderId/rate
    menu.controller.js          # Food partner menu CRUD
    passwordReset.controller.js # Forgot/reset password
  routes/
    payment.routes.js
    search.routes.js
    admin.routes.js
    menu.routes.js
  services/
    email.service.js            # Nodemailer wrapper
    razorpay.service.js         # Razorpay SDK wrapper
  middlewares/
    admin.middleware.js         # Verifies role === 'admin'
    rateLimiter.middleware.js   # express-rate-limit configs
```

### Existing Backend Files to Modify

```
Backend/src/
  models/
    user.model.js               # Add savedAddresses, passwordReset fields, admin role
    order.model.js              # Add customerId, deliveryPartner, timestamps, paymentStatus, razorpayOrderId, rating, review
    foodPartner.model.js        # Add ratingCount field
    food.model.js               # Add category, isAvailable fields
  controllers/
    auth.controller.js          # Add userType to JWT, add profile/password/address endpoints, remove debug fns
    order.controller.js         # Use customerId, add payment endpoints, fix status enum
    delivery.controller.js      # Fix unassigned query to use deliveryPartner field
    videoSubmission.controller.js # Add getEditorStats
  routes/
    auth.routes.js              # Add profile, password, address, forgot/reset routes
    order.routes.js             # Add payment routes, protect createOrder with authUserMiddleware
    videoSubmission.routes.js   # Fix route ordering (edited-videos before :submissionId)
  services/
    websocket.service.js        # Use customerId for customer notifications
  app.js                        # Add helmet, mongo-sanitize, search/admin/menu routes
```

### New Frontend Files to Create

```
Frontend/src/
  components/
    ProtectedRoute.jsx          # Route guard with role check
    PaymentModal.jsx            # Razorpay checkout modal
    RatingModal.jsx             # Post-delivery rating prompt
    SearchBar.jsx               # Debounced search with results dropdown
  pages/
    UserProfile.jsx             # Profile + address management
    AdminDashboard.jsx          # Admin stats + user management
    ForgotPassword.jsx          # Email input for reset
    ResetPassword.jsx           # New password input (reads token from URL)
  services/
    paymentService.js           # create-payment + verify-payment API calls
    searchService.js            # GET /api/search wrapper
    adminService.js             # Admin API calls
```

### Existing Frontend Files to Modify

```
Frontend/src/
  config/api.js                 # Replace process.env with import.meta.env
  services/
    authService.js              # Remove duplicate isAuthenticated, add profile/address methods
    websocketService.js         # Replace hardcoded WS URL with env-derived URL
    orderService.js             # Add customerId to order creation payload
  routes/appRoutes.jsx          # Wrap protected routes with ProtectedRoute
  pages/UserHome.jsx            # Add SearchBar, link to UserProfile
  pages/FoodPartnerDashboard.jsx # Add Menu Management tab
  hooks/useWebSocket.js         # Handle order_update events with customerId routing
```

---


## Data Models

### User Model — modify `Backend/src/models/user.model.js`

Add to the existing schema:

```js
role: { type: String, enum: ['user', 'delivery-partner', 'editor', 'admin'], default: 'user' },
savedAddresses: [{
  name:     { type: String, required: true },
  phone:    { type: String, required: true },
  address:  { type: String, required: true },
  landmark: { type: String, default: '' },
  city:     { type: String, required: true },
  pincode:  { type: String, required: true },
  type:     { type: String, default: 'Home' }
}],
passwordResetToken:   { type: String },
passwordResetExpires: { type: Date },
isActive: { type: Boolean, default: true }
```

### Order Model — modify `Backend/src/models/order.model.js`

Add to the existing schema and extend the status enum:

```js
customerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
pickedUpAt:      { type: Date },
onTheWayAt:      { type: Date },
deliveredAt:     { type: Date },
paymentStatus:   { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
razorpayOrderId: { type: String },
rating:          { type: Number, min: 1, max: 5 },
review:          { type: String },
// status enum extended to include:
// 'picked_up', 'on_the_way', 'delivered'
// (retain existing: 'pending','preparing','ready','completed','cancelled','rejected')
```

### FoodPartner Model — modify `Backend/src/models/foodPartner.model.js`

```js
ratingCount: { type: Number, default: 0 }
```

### Food Model — modify `Backend/src/models/food.model.js`

```js
category:    { type: String, default: 'main' },
isAvailable: { type: Boolean, default: true }
```

---

## API Endpoints

### Bug Fix: Auth JWT — modify `auth.controller.js`

All `jwt.sign` calls must include `userType` and `expiresIn`:

```js
// User login/register
jwt.sign({ id: user._id, userType: user.role === 'delivery-partner' ? 'delivery-partner'
           : user.role === 'editor' ? 'editor' : 'user' },
  process.env.JWT_SECRET, { expiresIn: '7d' })

// Food partner login/register
jwt.sign({ id: foodPartner._id, userType: 'food-partner' },
  process.env.JWT_SECRET, { expiresIn: '7d' })

// Cookie maxAge: 7 * 24 * 60 * 60 * 1000  (604800000 ms)
```

### Bug Fix: Auth Middleware — modify `auth.middleware.js`

Handle expired token error code separately:

```js
} catch (err) {
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired, please login again' });
  }
  return res.status(401).json({ message: 'Invalid token' });
}
```

### New: User Profile Endpoints — add to `auth.routes.js` + `auth.controller.js`

```
GET  /api/auth/user/me                  → getCurrentUser (already exists, keep)
PUT  /api/auth/user/profile             → updateUserProfile(fullName, email, phoneNumber)
PUT  /api/auth/user/password            → changePassword(currentPassword, newPassword)
POST /api/auth/user/addresses           → addAddress(name, phone, address, landmark, city, pincode, type)
DELETE /api/auth/user/addresses/:addressId → removeAddress
```

Request/Response shapes:

```
PUT /api/auth/user/profile
  Body: { fullName, email, phoneNumber }
  200: { message, user: { id, fullName, email, phoneNumber } }
  400: { message: "Email already in use" }

PUT /api/auth/user/password
  Body: { currentPassword, newPassword }
  200: { message: "Password updated successfully" }
  400: { message: "Current password is incorrect" }

POST /api/auth/user/addresses
  Body: { name, phone, address, landmark, city, pincode, type }
  201: { message, address: { _id, name, phone, address, city, pincode, type } }

DELETE /api/auth/user/addresses/:addressId
  200: { message: "Address removed" }
  404: { message: "Address not found" }
```

### New: Forgot/Reset Password — add to `auth.routes.js` + `passwordReset.controller.js`

```
POST /api/auth/forgot-password          → forgotPassword(email)
POST /api/auth/reset-password/:token    → resetPassword(newPassword)
```

```
POST /api/auth/forgot-password
  Body: { email }
  200: { message: "If that email exists, a reset link has been sent" }
  (always 200 to prevent enumeration)

POST /api/auth/reset-password/:token
  Body: { newPassword }
  200: { message: "Password reset successfully" }
  400: { message: "Reset token is invalid or has expired" }
```

Implementation notes for `passwordReset.controller.js`:
- `forgotPassword`: generate `crypto.randomBytes(32).toString('hex')`, store `sha256(token)` in `passwordResetToken`, set `passwordResetExpires = Date.now() + 3600000`, send email via `email.service.js`
- `resetPassword`: hash the URL token, find user where `passwordResetToken === hash && passwordResetExpires > Date.now()`, bcrypt the new password, clear reset fields

### New: Payment Endpoints — new `payment.routes.js` + `payment.controller.js`

```
POST /api/orders/create-payment         → createPaymentOrder (authUserMiddleware)
POST /api/orders/verify-payment         → verifyPayment (authUserMiddleware)
```

```
POST /api/orders/create-payment
  Body: { amount, currency?, orderId }
  200: { orderId: razorpayOrderId, amount, currency: "INR", keyId: RAZORPAY_KEY_ID }
  500: { message: "Failed to create payment order" }

POST /api/orders/verify-payment
  Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
  200: { message: "Payment verified", order: { id, paymentStatus: 'paid' } }
  400: { message: "Payment verification failed" }
```

Razorpay signature verification (in `razorpay.service.js`):

```js
const crypto = require('crypto');
const body = razorpay_order_id + '|' + razorpay_payment_id;
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(body)
  .digest('hex');
return expectedSignature === razorpay_signature;
```

### New: Search Endpoint — new `search.routes.js` + `search.controller.js`

```
GET /api/search?q=<query>&type=<all|restaurant|dish>
```

```
200: {
  restaurants: [{ id, businessName, address, rating, logo }],  // max 20
  dishes: [{ id, dishName, description, price, category, foodPartner: { id, businessName } }]  // max 20
}
```

MongoDB queries use case-insensitive regex: `{ businessName: { $regex: q, $options: 'i' } }`. When `isAvailable: false`, dishes are excluded.

### New: Menu Management — new `menu.routes.js` + `menu.controller.js`

All routes protected by `authFoodPartnerMiddleware`.

```
POST   /api/food-partner/menu           → createMenuItem
GET    /api/food-partner/menu           → getMenuItems
PUT    /api/food-partner/menu/:itemId   → updateMenuItem
DELETE /api/food-partner/menu/:itemId   → deleteMenuItem
```

```
POST /api/food-partner/menu
  Body: { dishName, description, price, category, imageUrl? }
  201: { message, item: { id, dishName, description, price, category, isAvailable } }

GET /api/food-partner/menu
  200: { items: [...] }  // only isAvailable:true for public; all for food partner

PUT /api/food-partner/menu/:itemId
  Body: { dishName?, description?, price?, category?, isAvailable? }
  200: { message, item }

DELETE /api/food-partner/menu/:itemId
  200: { message: "Item deleted" }
  404: { message: "Item not found" }
```

Note: these reuse the existing `Food` model. The `foodPartner` field is set from `req.foodPartner._id`.

### New: Rating Endpoint — add to `order.routes.js` + `rating.controller.js`

```
POST /api/orders/:orderId/rate          → rateOrder (authUserMiddleware)
```

```
POST /api/orders/:orderId/rate
  Body: { rating: 1-5, review?: string }
  200: { message: "Rating submitted", newPartnerRating }
  400: { message: "Rating must be between 1 and 5" }
  403: { message: "Not authorized to rate this order" }
  409: { message: "Order already rated" }
```

Rolling average update in `rating.controller.js`:

```js
const partner = await FoodPartnerModel.findById(order.foodPartnerId);
const newRating = ((partner.rating * partner.ratingCount) + rating) / (partner.ratingCount + 1);
await FoodPartnerModel.findByIdAndUpdate(order.foodPartnerId, {
  rating: newRating,
  $inc: { ratingCount: 1 }
});
```

### New: Admin Endpoints — new `admin.routes.js` + `admin.controller.js`

All routes protected by `adminMiddleware` (checks `req.user.role === 'admin'`).

```
GET    /api/admin/stats                 → getStats
GET    /api/admin/users?page=1&limit=20 → getUsers
PUT    /api/admin/users/:userId/role    → updateUserRole
DELETE /api/admin/users/:userId         → deactivateUser (soft delete: isActive=false)
```

```
GET /api/admin/stats
  200: { users, foodPartners, orders, reels }

GET /api/admin/users
  200: { users: [...], total, page, pages }

PUT /api/admin/users/:userId/role
  Body: { role: 'user'|'delivery-partner'|'editor'|'admin' }
  200: { message, user: { id, role } }
  403: { message: "Admin access required" }

DELETE /api/admin/users/:userId
  200: { message: "User deactivated" }
```

### Bug Fix: Editor Stats — add to `videoSubmission.controller.js`

```
GET /api/video-submissions/editor/stats  → getEditorStats (authUserMiddleware)
```

```
200: {
  totalProjects: number,
  completedProjects: number,
  inProgressProjects: number,
  totalEarnings: number
}
```

### Bug Fix: Order History — modify `order.controller.js`

`getOrdersByUserId` must query by `customerId` (ObjectId), not by `customerName` string:

```js
const orders = await OrderModel.find({ customerId: userId })
  .populate('foodPartnerId', 'businessName')
  .sort({ orderTime: -1 })
  .limit(50);
```

### Bug Fix: Likes and Comments — add to `food.routes.js`

```
POST /api/food/:foodId/like             → toggleLike (authUserMiddleware)
POST /api/food/:foodId/comment          → addComment (authUserMiddleware)
GET  /api/food/:foodId/comments?page=1  → getComments (public)
POST /api/posts/:postId/like            → togglePostLike (authUserMiddleware)
POST /api/posts/:postId/comment         → addPostComment (authUserMiddleware)
```

```
POST /api/food/:foodId/like
  200: { liked: true|false, likeCount: number }

POST /api/food/:foodId/comment
  Body: { text }
  201: { comment: { _id, user: { id, fullName }, text, createdAt } }

GET /api/food/:foodId/comments?page=1&limit=10
  200: { comments: [...], total, page, pages }
```

---


## WebSocket Flow Changes

### JWT Payload Change

Currently `jwt.sign({ id })`. After this change: `jwt.sign({ id, userType })`.

The `verifyClient` in `websocket.service.js` already reads `decoded.id` and `decoded.userType`. No change needed there. The `clients` Map key remains `user.id` (the MongoDB ObjectId string).

### Customer Notification Routing

**Problem**: `notifyOrderPreparing`, `notifyOrderReady`, `notifyOrderDelivered` currently pass `order.customerName` (a string) as the `customerId` argument to `sendToClient`. `sendToClient` looks up `this.clients.get(userId)` — a string name will never match an ObjectId key.

**Fix**: The `Order` document now has `customerId` (ObjectId). All order status change handlers in `order.controller.js` must pass `order.customerId.toString()` to the WebSocket notify methods.

```js
// In updateOrderStatus (order.controller.js)
websocketService.notifyOrderPreparing(
  order._id,
  order.foodPartnerId,
  order.customerId.toString(),  // ← was order.customerName
  order.estimatedTime
);
```

### WebSocket Message Flow Diagram

```
Customer places order
  → POST /api/orders/create-payment  (creates Razorpay order)
  → Razorpay checkout (frontend)
  → POST /api/orders/verify-payment  (verifies, sets paymentStatus='paid')
  → POST /api/orders/create          (creates Order doc with customerId)
  → WS: notifyNewOrder → food partner client

Food partner accepts
  → PUT /api/orders/:id/status { status: 'preparing' }
  → WS: notifyOrderPreparing → clients.get(order.customerId.toString())

Delivery partner picks up
  → PUT /api/delivery/orders/:id/pickup
  → Order.pickedUpAt = now, status = 'picked_up'
  → WS: notifyOrderPickedUp → customer + food partner

Delivery partner on the way
  → PUT /api/delivery/orders/:id/on-the-way
  → Order.onTheWayAt = now, status = 'on_the_way'
  → WS: notifyOrderOnTheWay → customer (with estimatedDeliveryTime)

Delivery partner delivers
  → PUT /api/delivery/orders/:id/delivered
  → Order.deliveredAt = now, status = 'delivered'
  → WS: notifyOrderDelivered → customer + food partner
  → Frontend: show RatingModal
```

### Frontend WebSocket URL Fix — modify `websocketService.js`

```js
import { API_BASE_URL } from '../config/api.js';

const wsUrl = import.meta.env.VITE_WS_URL ||
  API_BASE_URL.replace(/^http/, 'ws') + '/ws';
```

---

## Razorpay Integration Flow

### Environment Variables (add to `Backend/.env`)

```
RAZORPAY_KEY_ID=rzp_test_SVrmvAZANvH3i9
RAZORPAY_KEY_SECRET=SiSytZ7XfwdIHvDgFloFrFf6
```

### Backend: `razorpay.service.js`

```js
const Razorpay = require('razorpay');
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
module.exports = instance;
```

### Backend: `payment.controller.js`

```js
// createPaymentOrder
const razorpay = require('../services/razorpay.service');
const options = {
  amount: Math.round(total * 100),  // paise
  currency: 'INR',
  receipt: `receipt_${Date.now()}`
};
const razorpayOrder = await razorpay.orders.create(options);
// Store razorpayOrderId on the Order document
await OrderModel.findByIdAndUpdate(orderId, { razorpayOrderId: razorpayOrder.id });
res.json({ orderId: razorpayOrder.id, amount: razorpayOrder.amount,
           currency: razorpayOrder.currency, keyId: process.env.RAZORPAY_KEY_ID });

// verifyPayment
const isValid = razorpayService.verifySignature(
  razorpay_order_id, razorpay_payment_id, razorpay_signature);
if (!isValid) return res.status(400).json({ message: 'Payment verification failed' });
await OrderModel.findByIdAndUpdate(orderId, { paymentStatus: 'paid' });
```

### Frontend: `PaymentModal.jsx`

```jsx
// Load Razorpay script dynamically
const script = document.createElement('script');
script.src = 'https://checkout.razorpay.com/v1/checkout.js';
document.body.appendChild(script);

// After create-payment response:
const options = {
  key: keyId,
  amount,
  currency,
  order_id: orderId,
  handler: async (response) => {
    await paymentService.verifyPayment({
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
      orderId: localOrderId
    });
    onSuccess();
  }
};
const rzp = new window.Razorpay(options);
rzp.open();
```

### Frontend: `paymentService.js`

```js
export async function createPayment(amount, orderId) {
  const res = await fetch(`${API_BASE_URL}/api/orders/create-payment`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, orderId })
  });
  return res.json();
}

export async function verifyPayment(payload) {
  const res = await fetch(`${API_BASE_URL}/api/orders/verify-payment`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}
```

---

## Frontend Component Architecture

### `ProtectedRoute.jsx`

```jsx
// Props: requiredRole (string or array), children
// 1. Call authService.getCurrentUser() on mount
// 2. While loading: show <LoadingSpinner />
// 3. If not authenticated: <Navigate to="/login" />
// 4. If role mismatch: <Navigate to={roleHomeMap[user.role]} />
// 5. Otherwise: render children

const roleHomeMap = {
  'user': '/user/home',
  'food-partner': '/food-partner/dashboard',
  'delivery-partner': '/delivery/dashboard',
  'editor': '/editor/dashboard',
  'admin': '/admin/dashboard'
};
```

Usage in `appRoutes.jsx`:

```jsx
<Route path="/user/home"
  element={<ProtectedRoute requiredRole="user"><UserHome /></ProtectedRoute>} />
<Route path="/food-partner/dashboard"
  element={<ProtectedRoute requiredRole="food-partner"><FoodPartnerDashboard /></ProtectedRoute>} />
<Route path="/delivery/dashboard"
  element={<ProtectedRoute requiredRole="delivery-partner"><DeliveryDashboard /></ProtectedRoute>} />
<Route path="/editor/dashboard"
  element={<ProtectedRoute requiredRole="editor"><EditorDashboard /></ProtectedRoute>} />
<Route path="/admin/dashboard"
  element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
<Route path="/user/profile"
  element={<ProtectedRoute requiredRole="user"><UserProfile /></ProtectedRoute>} />
```

### `SearchBar.jsx`

```jsx
// State: query (string), results ({ restaurants, dishes }), isOpen (bool)
// Debounce: 300ms using useEffect + setTimeout
// On query change: GET /api/search?q={query}&type=all
// Renders: input + dropdown with two sections (Restaurants / Dishes)
// On result click: navigate to /food-partner/:id or open food item modal
```

### `RatingModal.jsx`

```jsx
// Props: orderId, foodPartnerName, onClose, onSubmit
// State: rating (1-5), review (string)
// Renders: star selector (1-5), optional text area, submit button
// On submit: POST /api/orders/:orderId/rate { rating, review }
// Triggered from OrderTracking when status becomes 'delivered'
```

### `UserProfile.jsx`

```jsx
// Sections:
//   1. Profile Info: fullName, email, phoneNumber (editable, PUT /api/auth/user/profile)
//   2. Change Password: currentPassword, newPassword (PUT /api/auth/user/password)
//   3. Saved Addresses: list with delete button + add form (POST/DELETE /api/auth/user/addresses)
```

### `AdminDashboard.jsx`

```jsx
// Sections:
//   1. Stats cards: users, food partners, orders, reels (GET /api/admin/stats)
//   2. Users table: paginated list with role badge + role change dropdown + deactivate button
//      (GET /api/admin/users, PUT /api/admin/users/:id/role, DELETE /api/admin/users/:id)
```

### `FoodPartnerDashboard.jsx` — add Menu Management tab

Add a new tab "Menu" that renders a form to create items and a list to edit/delete existing items. Uses the menu endpoints.

---

## Security Hardening

### `app.js` changes

```js
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { authLimiter, forgotPasswordLimiter } = require('./middlewares/rateLimiter.middleware');

app.use(helmet());
app.use(mongoSanitize());

// Apply rate limiters in auth.routes.js (not app.js)
```

### `rateLimiter.middleware.js`

```js
const rateLimit = require('express-rate-limit');

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts, please try again later' }
});

exports.forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,
  message: { message: 'Too many reset requests, please try again later' }
});
```

Apply in `auth.routes.js`:

```js
router.post('/user/login', authLimiter, authController.loginUser);
router.post('/foodPartner/login', authLimiter, authController.loginFoodPartner);
router.post('/forgot-password', forgotPasswordLimiter, passwordResetController.forgotPassword);
```

### `admin.middleware.js`

```js
module.exports = async function adminMiddleware(req, res, next) {
  // Reuse authUserMiddleware logic, then check role
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
```

### Debug Endpoint Removal

In `auth.routes.js`, gate debug routes:

```js
if (process.env.NODE_ENV === 'development') {
  router.get('/foodPartner/all', authController.getAllFoodPartners);
  router.get('/foodPartner/debug/:id', authController.debugFoodPartnerById);
  router.post('/foodPartner/create-test', authController.createTestFoodPartner);
}
```

### `api.js` Fix

```js
const getApiBaseUrl = () => {
  if (import.meta.env.MODE === 'development') {
    const hostname = window.location.hostname;
    return (hostname === 'localhost' || hostname === '127.0.0.1')
      ? 'http://localhost:3001'
      : `http://${hostname}:3001`;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};
```

### New Backend Packages to Install

```bash
cd Backend && npm install razorpay nodemailer helmet express-rate-limit express-mongo-sanitize
```

---
