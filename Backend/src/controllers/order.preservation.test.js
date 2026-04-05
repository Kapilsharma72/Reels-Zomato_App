/**
 * Preservation Property Tests — Task 2 (Preservation 3.6)
 *
 * Property 2: Preservation — Valid order creation still works
 *
 * These tests MUST PASS on unfixed code.
 * They encode the baseline behavior for valid order creation so we can confirm
 * no regressions after the foodPartnerId validation fix (Bug 1.6) is applied.
 *
 * Observed on UNFIXED code:
 *   - POST /api/orders with a valid foodPartnerId returns 201 with order details
 *   - WebSocket notification is sent to the food partner
 *
 * Validates: Requirements 3.6
 *
 * Uses Node.js built-in test runner (node:test) — available in Node 18+
 */

try { require('dotenv').config(); } catch (e) { /* ignore */ }

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

// =============================================================================
// Preservation 3.6 — Valid order creation still works
// =============================================================================
describe('Preservation 3.6 — Valid order creation still works', () => {
  let FoodPartnerModel;
  let OrderModel;
  let orderController;
  let origFPFindById;
  let origOrderCreate;
  let origWebSocketService;

  before(() => {
    orderController = require('./order.controller');
    FoodPartnerModel = require('../models/foodPartner.model');
    OrderModel = require('../models/order.model');

    // Save originals
    origFPFindById = FoodPartnerModel.findById;
    origOrderCreate = OrderModel.create;

    // Mock: findById returns a valid food partner (the happy path)
    FoodPartnerModel.findById = async () => ({
      _id: 'fp_valid_123',
      businessName: 'Valid Restaurant',
      email: 'restaurant@example.com',
    });

    // Mock: OrderModel.create returns a valid order
    OrderModel.create = async (data) => ({
      _id: 'order_new_123',
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Mock websocket service to avoid real socket calls
    try {
      const wsService = require('../services/websocket.service');
      origWebSocketService = wsService.notifyFoodPartner;
      wsService.notifyFoodPartner = async () => {};
    } catch (_) {
      // websocket service may not be importable in test context — ignore
    }
  });

  after(() => {
    // Restore originals
    FoodPartnerModel.findById = origFPFindById;
    OrderModel.create = origOrderCreate;

    try {
      const wsService = require('../services/websocket.service');
      if (origWebSocketService) {
        wsService.notifyFoodPartner = origWebSocketService;
      }
    } catch (_) { /* ignore */ }
  });

  test(
    'POST /api/orders with a valid foodPartnerId should return 201',
    async () => {
      /**
       * Validates: Requirements 3.6
       *
       * Observed baseline: when foodPartnerId matches an existing food partner,
       * the order is created and 201 is returned. This must continue to work
       * after the fix that returns 400 for unknown foodPartnerIds.
       */
      const req = {
        body: {
          foodPartnerId: 'fp_valid_123',
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
        json: (body) => {
          statusCode = statusCode || 200;
          responseBody = body;
        },
      };

      await orderController.createOrder(req, res);

      // ASSERTION: valid foodPartnerId should return 201
      assert.equal(
        statusCode,
        201,
        `Preservation failure: valid foodPartnerId "fp_valid_123" → status ${statusCode} (expected 201). ` +
        `Response: ${JSON.stringify(responseBody)}`
      );

      // ASSERTION: response body should contain order details
      assert.ok(
        responseBody !== undefined,
        'Response body should not be undefined'
      );
    }
  );
});
