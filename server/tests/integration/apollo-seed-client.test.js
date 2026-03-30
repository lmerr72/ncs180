const request = require('supertest');
const { createApp } = require('../../src/app');
const { createMockDataStore } = require('../../src/graphql/mockDataStore');

describe('POST /api/apollo/seed-client', () => {
  it('returns a validation error when companyName is too short', async () => {
    const app = await createApp({
      dataStore: createMockDataStore(),
      apolloService: {
        getAccountSnapshot: jest.fn()
      }
    });

    const response = await request(app)
      .post('/api/apollo/seed-client')
      .send({ companyName: 'A' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: 'companyName must be at least 2 characters long.'
    });
  });

  it('maps Apollo snapshot data into the wizard seed shape', async () => {
    const apolloService = {
      getAccountSnapshot: jest.fn().mockResolvedValue({
        configured: true,
        matchedAccount: true,
        organization: {
          name: 'Acme Property Group',
          domain: 'acme.example',
          website: 'https://acme.example',
          linkedIn: 'https://www.linkedin.com/company/acme',
          industry: 'Real Estate',
          employeeCount: 120,
          annualRevenue: 25000000,
          location: 'Denver, CO, United States',
          keywords: []
        },
        owner: null,
        openDeals: [],
        recentActivity: [],
        warnings: []
      })
    };

    const app = await createApp({
      dataStore: createMockDataStore(),
      apolloService
    });

    const response = await request(app)
      .post('/api/apollo/seed-client')
      .send({
        companyName: 'Acme Property Group',
        website: 'https://acme.example'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      website: 'https://acme.example',
      linkedIn: 'https://www.linkedin.com/company/acme',
      dbas: '',
      city: 'Denver',
      state: 'Colorado',
      unitCount: '120'
    });
    expect(response.body.filledFields).toEqual(
      expect.arrayContaining(['website', 'linkedIn', 'city', 'state', 'unitCount'])
    );
  });
});
