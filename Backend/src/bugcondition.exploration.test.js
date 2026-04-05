/**
 * Bug Condition Exploration Tests — Task 1 (Backend)
 *
 * Property 1: Bug Condition — Multi-Bug Exploration Suite
 *
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms each bug exists. DO NOT fix source code here.
 *
 * Validates: Requirements 1.6, 1.7, 1.13
 *
 * Uses Node.js built-in test runner (node:test) — available in Node 18+
 */

// Load environment variables first
try { require('dotenv').config(); } catch (e) { /* ignore if dotenv not available */ }

const { test, describe, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

// =============================================================================
// Bug 1.13 — sanitizeValue checks raw newline instead of '$'
// =============================================================================
describe('Bug 1.13 — sanitizeValue checks raw newline instead of $', () => {
  /**
   * Extract the sanitizeValue function directly from app.js source.
   * This tests the ACTUAL function in the file, not a copy.
   */
  let sanitizeValue;

  before(() => {
    const src = fs.readFileSync(require.resolve('./app.js'), 'utf8');
    const start = src.indexOf('function sanitizeValue');
    const end = src.indexOf('\nfunction mongoSanitize');
    const fnSrc = src.substring(start, end);

    // Eval the function into local scope
    const fn = new Function(`${fnSrc}; return sanitizeValue;`);
    sanitizeValue = fn();
  });

  test(
    'EXPECTED TO FAIL: sanitizeValue should delete keys starting with "$"',
    () => {
      /**
       * On UNFIXED code:
       *   key.startsWith('\n') — raw newline embedded in source
       *   '$where'.startsWith('\n') === false → key is NOT deleted
       *   Result: { "$where": "malicious" } survives sanitization
       *
       * On FIXED code:
       *   key.startsWith('$') → '$where' is deleted
       *   Result: {} (key removed)
       *
       * Counterexample: sanitizeValue({ "$where": "x" }) returns { "$where": "x" } unchanged
       */
      const obj = { '$where': 'malicious', name: 'ok' };
      sanitizeValue(obj);

      // ASSERTION: the $where key should be deleted
      assert.equal(
        obj.hasOwnProperty('$where'),
        false,
        `Counterexample: sanitizeValue({ "$where": "x" }) returned { "$where": "x" } unchanged. ` +
        `Bug: key.startsWith('\\n') is false for '$where', so the key survives.`
      );
    }
  );
});

// =============================================================================
// Bug 1.6 — createOrder silently creates Default Restaurant
// Bug 1.7 — rateOrder rejects 'completed' status
// =============================================================================
// These tests require a running MongoDB connection.
// We use supertest + the Express app to test the HTTP layer.
// If MongoDB is not available, tests are skipped gracefully.

let request;
let app;
let mongoose;
let OrderModel;
let FoodPartnerModel;
let UserModel;

// Try to load dependencies — skip if not available
try {
  request = require('supertest');
  app = require('./app');
  mongoose = require('mongoose');
  OrderModel = require('./models/order.model');
  FoodPartnerModel = require('./models/foodPartner.model');
  UserModel = require('./models/user.model');
} catch (e) {
  // Dependencies not available — tests will be skipped
}

// Helper: check if MongoDB is reachable
async function connectDB() {
  // Load .env if available
  try {
    require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
  } catch (e) { /* ignore */ }
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/reelzomato_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  }
}

// Helper: create a test user and get auth cookie
async function createTestUserAndLogin() {
  // Create a test user directly in DB
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('testpassword123', 10);
  const user = await UserModel.create({
    fullName: 'Test User',
    email: `testuser_${Date.now()}@test.com`,
    password: hashedPassword,
    role: 'user',
    phoneNumber: '+91 9876543210',
  });

  // Login to get cookie
  const loginRes = await request(app)
    .post('/api/auth/user/login')
    .send({ email: user.email, password: 'testpassword123' });

  return { user, cookie: loginRes.headers['set-cookie'] };
}

// Helper: create a test food partner
async function createTestFoodPartner() {
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('testpassword123', 10);
  return FoodPartnerModel.create({
    businessName: `Test Restaurant ${Date.now()}`,
    name: 'Test Owner',
    email: `testfp_${Date.now()}@test.com`,
    password: hashedPassword,
    address: 'Test Address',
    phoneNumber: '+91 9876543210',
    slogan: 'Test slogan',
    totalCustomers: 0,
    rating: 4.0,
    ratingCount: 0,
  });
}

describe('Bug 1.6 — createOrder silently creates Default Restaurant', () => {
  let testUser;
  let testCookie;
  let nonExistentId;

  before(async () => {
    if (!request || !app || !mongoose) {
      return; // Skip if dependencies not available
    }
    try {
      await connectDB();
      const result = await createTestUserAndLogin();
      testUser = result.user;
      testCookie = result.cookie;
      // A valid ObjectId format that does NOT exist in the DB
      nonExistentId = '000000000000000000000001';
    } catch (e) {
      console.warn('Bug 1.6 setup failed (DB not available?):', e.message);
    }
  });

  after(async () => {
    if (!mongoose || mongoose.connection.readyState === 0) return;
    try {
      if (testUser) await UserModel.deleteOne({ _id: testUser._id });
      // Clean up any default restaurant that may have been created
      await FoodPartnerModel.deleteOne({ email: 'default@restaurant.com' });
    } catch (e) {
      // ignore cleanup errors
    }
  });

  test(
    'EXPECTED TO FAIL: POST /api/orders with non-existent foodPartnerId should return 400',
    async () => {
      /**
       * On UNFIXED code:
       *   FoodPartnerModel.findById(nonExistentId) returns null
       *   Controller creates/finds "Default Restaurant" and assigns order to it
       *   Response: 201 with order details
       *
       * On FIXED code:
       *   Controller returns 400 "Food partner not found"
       *
       * Counterexample: { foodPartnerId: "000000000000000000000001" } → 201 response
       */
      if (!request || !app || !testCookie) {
        // Skip gracefully if DB not available
        console.warn('Skipping Bug 1.6 test: DB not available');
        return;
      }

      // Count FoodPartner documents before
      const countBefore = await FoodPartnerModel.countDocuments();

      const res = await request(app)
        .post('/api/orders/create')
        .set('Cookie', testCookie)
        .send({
          foodPartnerId: nonExistentId,
          customerName: 'Test Customer',
          customerPhone: '+91 9876543210',
          customerAddress: {
            name: 'Test Customer',
            phone: '+91 9876543210',
            address: '123 Test Street',
            city: 'Test City',
            pincode: '123456',
            type: 'Home',
          },
          items: [{ name: 'Test Item', price: 100, quantity: 1 }],
          subtotal: 100,
          deliveryFee: 25,
          tax: 10,
          total: 135,
          paymentMethod: 'cash',
        });

      // Count FoodPartner documents after
      const countAfter = await FoodPartnerModel.countDocuments();

      // ASSERTION: should return 400, not 201
      assert.equal(
        res.status,
        400,
        `Counterexample: foodPartnerId "000000000000000000000001" → status ${res.status} (expected 400). ` +
        `Bug: controller creates "Default Restaurant" instead of returning 400.`
      );

      // ASSERTION: response message should indicate food partner not found
      assert.ok(
        res.body.message && res.body.message.toLowerCase().includes('food partner'),
        `Expected message about food partner not found, got: ${JSON.stringify(res.body.message)}`
      );

      // ASSERTION: no new FoodPartner document should be created
      assert.equal(
        countAfter,
        countBefore,
        `Counterexample: ${countAfter - countBefore} new FoodPartner document(s) created. ` +
        `Bug: "Default Restaurant" was created in the DB.`
      );
    }
  );
});

describe('Bug 1.7 — rateOrder rejects "completed" status', () => {
  let testUser;
  let testCookie;
  let testFoodPartner;
  let testOrder;

  before(async () => {
    if (!request || !app || !mongoose) {
      return;
    }
    try {
      await connectDB();
      const result = await createTestUserAndLogin();
      testUser = result.user;
      testCookie = result.cookie;
      testFoodPartner = await createTestFoodPartner();

      // Create an order with status 'completed'
      testOrder = await OrderModel.create({
        orderId: 'ORD_TEST_' + Date.now(),
        foodPartnerId: testFoodPartner._id,
        customerId: testUser._id,
        customerName: testUser.fullName,
        customerPhone: '+91 9876543210',
        customerAddress: {
          name: testUser.fullName,
          phone: '+91 9876543210',
          address: '123 Test Street',
          city: 'Test City',
          pincode: '123456',
          type: 'Home',
        },
        items: [{ name: 'Test Item', price: 100, quantity: 1 }],
        subtotal: 100,
        deliveryFee: 25,
        tax: 10,
        total: 135,
        paymentMethod: 'cash',
        status: 'completed',
        estimatedTime: 30,
      });
    } catch (e) {
      console.warn('Bug 1.7 setup failed (DB not available?):', e.message);
    }
  });

  after(async () => {
    if (!mongoose || mongoose.connection.readyState === 0) return;
    try {
      if (testOrder) await OrderModel.deleteOne({ _id: testOrder._id });
      if (testFoodPartner) await FoodPartnerModel.deleteOne({ _id: testFoodPartner._id });
      if (testUser) await UserModel.deleteOne({ _id: testUser._id });
    } catch (e) {
      // ignore cleanup errors
    }
  });

  test(
    'EXPECTED TO FAIL: POST /api/orders/:id/rate on a "completed" order should return 200',
    async () => {
      /**
       * On UNFIXED code:
       *   rateOrder checks: if (order.status !== 'delivered')
       *   'completed' !== 'delivered' → true → returns 403
       *   "Can only rate delivered orders"
       *
       * On FIXED code:
       *   rateOrder checks: if (order.status !== 'delivered' && order.status !== 'completed')
       *   'completed' !== 'delivered' && 'completed' !== 'completed' → false → allows rating
       *   Returns 200
       *
       * Counterexample: order with status='completed' returns 403 on rating attempt
       */
      if (!request || !app || !testOrder || !testCookie) {
        console.warn('Skipping Bug 1.7 test: DB not available');
        return;
      }

      const res = await request(app)
        .post(`/api/orders/${testOrder._id}/rate`)
        .set('Cookie', testCookie)
        .send({ rating: 5, review: 'Great food!' });

      // ASSERTION: should return 200, not 403
      assert.equal(
        res.status,
        200,
        `Counterexample: order with status='completed' → status ${res.status} (expected 200). ` +
        `Bug: rateOrder checks status !== 'delivered' but food partner sets status to 'completed'.`
      );
    }
  );
});
