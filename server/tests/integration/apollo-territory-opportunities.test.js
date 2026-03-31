const request = require('supertest');
const { createApp } = require('../../src/app');
const { createMockDataStore } = require('../../src/graphql/mockDataStore');

describe('POST /api/apollo/territory-opportunities', () => {
  it('returns a validation error when no territory states are provided', async () => {
    const app = await createApp({
      dataStore: createMockDataStore(),
      apolloService: {
        getTerritoryOpportunities: jest.fn()
      }
    });

    const response = await request(app)
      .post('/api/apollo/territory-opportunities')
      .send({ territoryStates: [] });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: 'territoryStates must contain at least one state.'
    });
  });

  it('returns Apollo territory opportunities', async () => {
    const apolloService = {
      getTerritoryOpportunities: jest.fn().mockResolvedValue({
        configured: true,
        territoryStates: ['Texas', 'Oklahoma'],
        opportunities: [
          {
            id: 'org-1',
            name: 'Frontier Communities',
            website: 'https://frontier.example',
            linkedIn: 'https://www.linkedin.com/company/frontier',
            domain: 'frontier.example',
            state: 'Texas',
            city: 'Austin',
            location: 'Austin, Texas, United States',
            industry: 'Real Estate',
            employeeCount: 220
          }
        ],
        warnings: []
      })
    };

    const app = await createApp({
      dataStore: createMockDataStore(),
      apolloService
    });

    const response = await request(app)
      .post('/api/apollo/territory-opportunities')
      .send({
        territoryStates: ['Texas', 'Oklahoma'],
        excludedCompanyNames: ['Acme'],
        excludedDomains: ['acme.example'],
        limit: 5
      });

    expect(response.statusCode).toBe(200);
    expect(apolloService.getTerritoryOpportunities).toHaveBeenCalledWith({
      territoryStates: ['Texas', 'Oklahoma'],
      excludedCompanyNames: ['Acme'],
      excludedDomains: ['acme.example'],
      limit: 5
    });
    expect(response.body.opportunities[0]).toMatchObject({
      name: 'Frontier Communities',
      state: 'Texas',
      employeeCount: 220
    });
  });
});
