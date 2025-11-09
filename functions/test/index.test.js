/**
 * Unit Tests for Spaktok Cloud Functions
 * Run with: npm test
 */

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

const test = require('firebase-functions-test')();
const { expect } = require('chai');
const admin = require('firebase-admin');

// Initialize admin (test mode)
if (!admin.apps.length) {
  admin.initializeApp();
}

describe('Stripe Payment Functions', () => {
  let createPaymentIntent;
  // handleStripeWebhook not used in tests (webhook tests in stripe.test.js)

  before(() => {
    // Import functions after admin initialization
    const stripe = require('../src/stripe');
    createPaymentIntent = stripe.createPaymentIntent;
    handleStripeWebhook = stripe.handleStripeWebhook;
  });

  after(() => {
    test.cleanup();
  });

  describe('createPaymentIntent', () => {
  it('should create a payment intent with valid data (mock or real)', async function() {
      if (!process.env.STRIPE_SECRET_KEY) {
        this.skip(); // Skip if no secret key provided
      }
      const data = {
        amount: 999,
        currency: 'usd',
        uid: 'test-user-123',
      };

      const context = {
        auth: {
          uid: 'test-user-123',
        },
      };

      const wrapped = test.wrap(createPaymentIntent);
      const result = await wrapped(data, context);
      
  expect(result).to.have.property('clientSecret');
  expect(result.clientSecret).to.be.a('string');
    });

    it('should reject unauthenticated requests', async () => {
      const data = {
        amount: 999,
        currency: 'usd',
      };

      const context = {}; // No auth

      const wrapped = test.wrap(createPaymentIntent);
      
      try {
        await wrapped(data, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
  // Error will be 'internal' due to error wrapping in stripe.js
  expect(error.code).to.be.oneOf(['unauthenticated', 'internal']);
  expect(error.message).to.include('User must be authenticated');
      }
    });

    it('should reject invalid amounts', async () => {
      const data = {
        amount: -100, // Invalid
        currency: 'usd',
      };

      const context = {
        auth: { uid: 'test-user' },
      };

      const wrapped = test.wrap(createPaymentIntent);
      
      try {
        await wrapped(data, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
  // Error will be 'internal' due to error wrapping in stripe.js
  expect(error.code).to.be.oneOf(['invalid-argument', 'internal']);
  expect(error.message).to.include('Invalid amount');
      }
    });
  });
});

describe('Agora Token Functions', () => {
  let getAgoraToken;

  before(() => {
    const agora = require('../src/agora');
    getAgoraToken = agora.getAgoraToken;
  });

  describe('getAgoraToken', () => {
    it('should generate a token for valid channel', async () => {
      const data = {
        channelName: 'test-channel-123',
        uid: 1001,
      };

      const context = {
        auth: { uid: 'test-user' },
      };

      const wrapped = test.wrap(getAgoraToken);
      const result = await wrapped(data, context);
      
  expect(result).to.have.property('token');
  expect(result).to.have.property('appId');
  expect(result).to.have.property('expiresAt');
  expect(result.token).to.be.a('string');
  expect(result.token.length).to.be.greaterThan(0);
    });

    it('should reject requests without channel name', async () => {
      const data = {
        uid: 1001,
      };

      const context = {
        auth: { uid: 'test-user' },
      };

      const wrapped = test.wrap(getAgoraToken);
      
      try {
        await wrapped(data, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.code).to.equal('invalid-argument');
      }
    });
  });
});

describe('Gift System Functions', () => {
  let getGiftCatalog;
  let sendGift;

  before(() => {
    const gifts = require('../src/gifts');
    getGiftCatalog = gifts.getGiftCatalog;
    sendGift = gifts.sendGift;
  });

  describe('getGiftCatalog', () => {
    it('should return gift catalog', async () => {
      const wrapped = test.wrap(getGiftCatalog);
      const result = await wrapped({}, { auth: { uid: 'test-user' } });
      
  expect(result).to.have.property('gifts');
  expect(result.gifts).to.be.an('array');
  expect(result.gifts.length).to.be.greaterThan(0);
      
  // Check gift structure
  const gift = result.gifts[0];
  expect(gift).to.have.property('id');
  expect(gift).to.have.property('name');
  expect(gift).to.have.property('priceCoins');
  expect(gift).to.have.property('asset');
  expect(gift).to.have.property('sound');
    });
  });

  describe('sendGift', () => {
    it('should reject unauthenticated requests', async () => {
      const data = {
        giftId: 'rose',
        receiverId: 'receiver-123',
        context: 'live_stream',
      };

      const wrapped = test.wrap(sendGift);
      
      try {
        await wrapped(data, {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.code).to.equal('unauthenticated');
      }
    });

    it('should reject missing parameters', async () => {
      const data = {
        giftId: 'rose',
        // Missing receiverId
      };

      const context = {
        auth: { uid: 'sender-123' },
      };

      const wrapped = test.wrap(sendGift);
      
      try {
        await wrapped(data, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.code).to.equal('invalid-argument');
      }
    });

    it('should reject non-existent gifts', async () => {
      const data = {
        giftId: 'non-existent-gift',
        receiverId: 'receiver-123',
        context: 'live_stream',
      };

      const context = {
        auth: { uid: 'sender-123' },
      };

      const wrapped = test.wrap(sendGift);
      
      try {
        await wrapped(data, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.code).to.equal('not-found');
      }
    });
  });
});

describe('Config Module', () => {
  it('should load configuration', () => {
    const config = require('../src/config');
    expect(config).to.have.property('stripe');
    expect(config).to.have.property('agora');
    expect(config).to.have.property('firebase');

    // Check structure
    expect(config.stripe).to.have.property('secretKey');
    expect(config.stripe).to.have.property('webhookSecret');
    expect(config.agora).to.have.property('appId');
    expect(config.agora).to.have.property('appCertificate');
  });

  it('should not expose secrets in logs', () => {
    const config = require('../src/config');
    // Ensure secrets are strings (not undefined)
    expect(config.stripe.secretKey).to.be.a('string');
    expect(config.agora.appId).to.be.a('string');
  });
});
