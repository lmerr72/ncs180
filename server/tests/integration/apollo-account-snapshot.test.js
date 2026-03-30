const request = require('supertest');
const { createApp } = require('../../src/app');
const { createMockDataStore } = require('../../src/graphql/mockDataStore');

describe('GET /api/apollo/account-snapshot', () => {
  it('returns a validation error when companyName is missing', async () => {
    const app = await createApp({
      dataStore: createMockDataStore(),
      apolloService: {
        getAccountSnapshot: jest.fn()
      }
    });

    const response = await request(app).get('/api/apollo/account-snapshot');

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: 'companyName is required.'
    });
  });

  it('returns the Apollo snapshot payload', async () => {
    const apolloService = {
      getAccountSnapshot: jest.fn().mockResolvedValue({
        configured: true,
        matchedAccount: true,
        organization: {
          name: 'Acme Property Group',
          domain: 'acme.example',
          website: 'https://acme.example',
          industry: 'Real Estate',
          employeeCount: 120,
          annualRevenue: 25000000,
          location: 'Denver, Colorado, United States',
          keywords: ['multifamily']
        },
        owner: {
          id: 'rep-1',
          name: 'Jordan Smith',
          email: 'jordan@acme.example',
          title: 'Account Executive'
        },
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
      .get('/api/apollo/account-snapshot')
      .query({
        companyName: 'Acme Property Group',
        website: 'https://acme.example'
      });

    expect(response.statusCode).toBe(200);
    expect(apolloService.getAccountSnapshot).toHaveBeenCalledWith({
      companyName: 'Acme Property Group',
      website: 'https://acme.example'
    });
    expect(response.body.organization.name).toBe('Acme Property Group');
    expect(response.body.owner.name).toBe('Jordan Smith');
  });
});
