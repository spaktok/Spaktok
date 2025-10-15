const request = require('supertest');
const { app, httpServer } = require('..//server_enhanced');

describe('Health endpoint', () => {
  afterAll((done) => {
    httpServer.close(() => done());
  });

  it('GET /health should return healthy', async () => {
    const res = await request(httpServer).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});
