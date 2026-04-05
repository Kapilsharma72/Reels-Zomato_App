/**
 * Bug Condition Exploration Tests — Bugs 1.6 & 1.7
 *
 * Property 1: Bug Condition — createOrder silently creates Default Restaurant
 *                           & rateOrder rejects 'completed' status
 *
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms each bug exists. DO NOT fix source code here.
 *
 * Validates: Requirements 1.6, 1.7
 *
 * Uses Node.js built-in test runner (node:test) — available in Node 18+
 * These tests mock the models directly to avoid requiring a live MongoDB connection.
 */

try { require('dotenv').config(); } catch (e) { /* ignore */ }

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

// =============================================================================
// Bug 1.6 — createOrder silently creates Default Restaurant
// =============================================================================
describe('Bug 1.6 — createOrder silently creates Default Restaurant', () => {
  let FoodPartnerModel;
  let orderController;
  let origFindById;
  let origFindOne;
  let origCreate;
  let defaultPartnerCreated;

  before(() => {
    orderController = require('./order.controller');
    FoodPartnerModel = require('../models/foodPartner.model');

    // Save originals
    origFindById = FoodPartnerModel.findById;
    origFindOne = FoodPartnerModel.findOne;
    origCreate = FoodPartnerModel.create;

    // Mock: findById returns null (food partner not found)
    FoodPartnerModel.findById = async () => null;

    // Mock: findOne returns null (no default partner exists yet)
    FoodPartnerModel.findOne = async () => null;

    // Mock: create records that a default partner was created
    defaultPartnerCreated = false;
    FoodPartnerModel.create = async (data) => {
      defaultPartnerCreated = true;
      return { _id: 'default_id', ...data };
    };
  });

  after(() => {
    // Restore originals
    FoodPartnerModel.findById = origFindById;
    FoodPartnerModel.findOne = origFindOne;
    FoodPartnerModel.create = origCreate;
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
      const req = {
        body: {
          foodPartnerId: '000000000000000000000001',
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
        },
        user: { _id: 'user1' },
      };

      let statusCode;
      let responseBody;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (body) => { responseBody = body; } };
        },
        json: (body) => { responseBody = body; },
      };

      await orderController.createOrder(req, res);

      // ASSERTION: should return 400, not 201
      assert.equal(
        statusCode,
        400,
        `Counterexample: foodPartnerId "000000000000000000000001" → status ${statusCode} (expected 400). ` +
        `Bug: controller creates "Default Restaurant" instead of returning 400. ` +
        `Response: ${JSON.stringify(responseBody)}`
      );

      // ASSERTION: no new FoodPartner document should be created
      assert.equal(
        defaultPartnerCreated,
        false,
        `Counterexample: FoodPartnerModel.create was called. ` +
        `Bug: "Default Restaurant" was created in the DB.`
      );
    }
  );
});

// =============================================================================
// Bug 1.7 — rateOrder rejects 'completed' status
// =============================================================================
describe('Bug 1.7 — rateOrder rejects "completed" status', () => {
  let FoodPartnerModel;
  let OrderModel;
  let orderController;
  let origOrderFindById;
  let origFPFindById;
  let origFPFindByIdAndUpdate;

  before(() => {
    orderController = require('./order.controller');
    OrderModel = require('../models/order.model');
    FoodPartnerModel = require('../models/foodPartner.model');

    origOrderFindById = OrderModel.findById;
    origFPFindById = FoodPartnerModel.findById;
    origFPFindByIdAndUpdate = FoodPartnerModel.findByIdAndUpdate;

    // Mock: order with status 'completed'
    const mockOrder = {
      _id: 'order1',
      status: 'completed',
      customerId: { toString: () => 'user1' },
      foodPartnerId: 'fp1',
      rating: null,
      review: null,
      save: async function() { return this; },
    };
    OrderModel.findById = async () => mockOrder;

    // Mock: food partner for rating update
    FoodPartnerModel.findById = async () => ({
      _id: 'fp1',
      rating: 4.0,
      ratingCount: 10,
    });
    FoodPartnerModel.findByIdAndUpdate = async () => ({});
  });

  after(() => {
    OrderModel.findById = origOrderFindById;
    FoodPartnerModel.findById = origFPFindById;
    FoodPartnerModel.findByIdAndUpdate = origFPFindByIdAndUpdate;
  });

  test(
    'EXPECTED TO FAIL: rateOrder on a "completed" order should return 200',
    async () => {
      /**
       * On UNFIXED code:
       *   rateOrder checks: if (order.status !== 'delivered')
       *   'completed' !== 'delivered' → true → returns 403
       *   "Can only rate delivered orders"
       *
       * On FIXED code:
       *   rateOrder checks: if (order.status !== 'delivered' && order.status !== 'completed')
       *   Returns 200
       *
       * Counterexample: order with status='completed' returns 403 on rating attempt
       */
      const req = {
        params: { orderId: 'order1' },
        body: { rating: 5, review: 'Great food!' },
        user: { _id: 'user1' },
      };

      let statusCode;
      let responseBody;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (body) => { responseBody = body; } };
        },
        json: (body) => { statusCode = statusCode || 200; responseBody = body; },
      };

      await orderController.rateOrder(req, res);

      // ASSERTION: should return 200, not 403
      assert.equal(
        statusCode,
        200,
        `Counterexample: order with status='completed' → status ${statusCode} (expected 200). ` +
        `Bug: rateOrder checks status !== 'delivered' but food partner sets status to 'completed'. ` +
        `Response: ${JSON.stringify(responseBody)}`
      );
    }
  );
});
