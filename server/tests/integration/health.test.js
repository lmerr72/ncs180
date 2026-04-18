const request = require('supertest');
const { createApp } = require('../../src/app');
const { createMockDataStore } = require('../../src/graphql/mockDataStore');

describe('GET /api/health', () => {
  it('returns a healthy response payload', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });
    const response = await request(app).get('/api/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'server'
    });
  });
});

describe('production client fallback', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('does not throw when the client build is missing', async () => {
    process.env.NODE_ENV = 'production';

    const app = await createApp({
      dataStore: createMockDataStore(),
      clientDistPath: '/tmp/ncs180-missing-client-dist'
    });

    const response = await request(app).get('/');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      error: 'Client app is not built on this server. API routes remain available under /api and /graphql.'
    });
  });
});
