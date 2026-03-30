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
