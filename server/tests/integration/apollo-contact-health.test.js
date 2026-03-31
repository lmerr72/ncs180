const request = require('supertest');
const { createApp } = require('../../src/app');
const { createMockDataStore } = require('../../src/graphql/mockDataStore');

describe('POST /api/apollo/contact-health', () => {
  it('returns a validation error when companyName is too short', async () => {
    const app = await createApp({
      dataStore: createMockDataStore(),
      apolloService: {
        getContactHealth: jest.fn()
      }
    });

    const response = await request(app)
      .post('/api/apollo/contact-health')
      .send({ companyName: 'A', contacts: [] });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: 'companyName must be at least 2 characters long.'
    });
  });

  it('returns Apollo contact health payload', async () => {
    const apolloService = {
      getContactHealth: jest.fn().mockResolvedValue({
        configured: true,
        contacts: [
          {
            firstName: 'Jordan',
            lastName: 'Smith',
            title: 'VP Sales',
            currentEmail: '',
            currentPhone: '',
            currentLinkedIn: '',
            apolloEmail: 'jordan@example.com',
            apolloPhone: '303-555-0101',
            apolloLinkedIn: 'https://www.linkedin.com/in/jordansmith',
            canImproveEmail: true,
            canImprovePhone: true,
            canImproveLinkedIn: true
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
      .post('/api/apollo/contact-health')
      .send({
        companyName: 'Acme Property Group',
        website: 'https://acme.example',
        contacts: [
          {
            firstName: 'Jordan',
            lastName: 'Smith',
            title: 'VP Sales'
          }
        ]
      });

    expect(response.statusCode).toBe(200);
    expect(apolloService.getContactHealth).toHaveBeenCalledWith({
      companyName: 'Acme Property Group',
      website: 'https://acme.example',
      contacts: [
        {
          firstName: 'Jordan',
          lastName: 'Smith',
          title: 'VP Sales'
        }
      ]
    });
    expect(response.body.contacts[0]).toMatchObject({
      firstName: 'Jordan',
      canImproveEmail: true,
      canImprovePhone: true,
      canImproveLinkedIn: true
    });
  });
});
