const test = require('firebase-functions-test')();
const { expect } = require('chai');
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.test' });

if (!admin.apps.length) {
  admin.initializeApp();
}

describe('Agora Chat Functions', () => {
  let getAgoraChatAppToken;
  let getAgoraChatUserToken;

  before(() => {
    // Force mock if secrets are missing
    if (!process.env.CHAT_CLIENT_ID || !process.env.CHAT_CLIENT_SECRET) {
      process.env.USE_CHAT_MOCK = 'true';
    }
    const chat = require('../src/chat');
    getAgoraChatAppToken = chat.getAgoraChatAppToken;
    getAgoraChatUserToken = chat.getAgoraChatUserToken;
  });

  after(() => {
    test.cleanup();
    delete process.env.USE_CHAT_MOCK;
  });

  it('should return a chat app token (mock or real)', async function () {
    const wrapped = test.wrap(getAgoraChatAppToken);
    const res = await wrapped({}, { auth: { uid: 'user-1' } });
    expect(res).to.have.property('token');
    expect(res).to.have.property('expiresAt');
  });

  it('should return a per-user chat token (mock or real)', async function () {
    const wrapped = test.wrap(getAgoraChatUserToken);
    const res = await wrapped({}, { auth: { uid: 'test-user-123' } });
    expect(res).to.have.property('token');
    expect(res).to.have.property('expiresAt');
    expect(res).to.have.property('chatUserId', 'test-user-123');
  });

  it('should reject user token request without auth', async function () {
    const wrapped = test.wrap(getAgoraChatUserToken);
    try {
      await wrapped({}, {});
      expect.fail('Should have thrown unauthenticated error');
    } catch (error) {
      // Error wrapping makes it 'internal' with message containing 'unauthenticated'
      expect(error.code).to.be.oneOf(['unauthenticated', 'internal']);
      expect(error.message).to.include('User must be authenticated');
    }
  });
});
