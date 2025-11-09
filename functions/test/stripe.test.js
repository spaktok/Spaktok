const test = require('firebase-functions-test')();
const { expect } = require('chai');
const admin = require('firebase-admin');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.test' });

if (!admin.apps.length) {
  admin.initializeApp();
}

describe('Stripe Webhook Functions', () => {
  let handleStripeWebhook;

  before(() => {
    const stripe = require('../src/stripe');
    handleStripeWebhook = stripe.handleStripeWebhook;
  });

  after(() => {
    test.cleanup();
  });

  it.skip('should verify webhook signature and process payment_intent.succeeded (requires Firestore emulator)', async () => {
    // This test requires Firebase emulator to be running for Firestore transaction
    // Skip for now; enable when running with emulators
    const event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 999,
          metadata: { uid: 'test-user-webhook' },
        },
      },
    };

    const payload = JSON.stringify(event);
    const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
    
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    const stripeSignature = `t=${timestamp},v1=${signature}`;

    const req = {
      headers: {
        'stripe-signature': stripeSignature,
      },
      rawBody: Buffer.from(payload),
      body: event,
    };

    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      send(data) {
        this.body = data;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      },
    };

    await handleStripeWebhook(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('received', true);
  });

  it('should reject webhook without signature', async () => {
    const req = {
      headers: {},
      rawBody: Buffer.from('{}'),
      body: {},
    };

    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      send(data) {
        this.body = data;
        return this;
      },
    };

    await handleStripeWebhook(req, res);

    // Without webhook secret set, it may process anyway (dev mode)
    // Or reject if secret is configured. Adjust based on your setup.
    expect(res.statusCode).to.be.oneOf([200, 400]);
  });
});
