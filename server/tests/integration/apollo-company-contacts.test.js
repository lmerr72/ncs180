const request = require('supertest');
const { createApp } = require('../../src/app');
const { createMockDataStore } = require('../../src/graphql/mockDataStore');

describe('POST /api/apollo/company-contacts', () => {
  it('returns a validation error when companyName is too short', async () => {
    const app = await createApp({
      dataStore: createMockDataStore(),
      apolloService: {
        getCompanyPeople: jest.fn()
      }
    });

    const response = await request(app)
      .post('/api/apollo/company-contacts')
      .send({ companyName: 'A' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: 'companyName must be at least 2 characters long.'
    });
  });

  it('returns normalized Apollo contacts', async () => {
    const apolloService = {
      getCompanyPeople: jest.fn().mockResolvedValue({
        configured: true,
        contacts: [
          {
            id: 'person-1',
            firstName: 'Jordan',
            lastName: 'Smith',
            title: 'VP Sales',
            email: 'jordan@example.com',
            phone: '',
            linkedIn: 'https://www.linkedin.com/in/jordansmith',
            city: 'Denver',
            state: 'Colorado',
            seniority: 'vp'
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
      .post('/api/apollo/company-contacts')
      .send({
        companyName: 'Acme Property Group',
        website: 'https://acme.example'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.contacts).toHaveLength(1);
    expect(response.body.contacts[0]).toMatchObject({
      firstName: 'Jordan',
      lastName: 'Smith',
      title: 'VP Sales',
      email: 'jordan@example.com'
    });
  });
});
