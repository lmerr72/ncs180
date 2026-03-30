jest.mock('../../src/seedClientService', () => ({
  seedCompanyProfile: jest.fn()
}));

const request = require('supertest');
const { createApp } = require('../../src/app');
const { createMockDataStore } = require('../../src/graphql/mockDataStore');
const { seedCompanyProfile } = require('../../src/seedClientService');

describe('POST /api/seed-client', () => {
  it('returns seeded company fields for a valid company name', async () => {
    seedCompanyProfile.mockResolvedValue({
      website: 'https://example.com',
      linkedIn: 'https://linkedin.com/company/example',
      linkedin: 'https://linkedin.com/company/example',
      dbas: 'Example Residential',
      city: 'Denver',
      state: 'CO',
      unitCount: '240',
      confidence: { label: 'high', score: 0.9 },
      filledFields: ['website', 'linkedin', 'city', 'state', 'unitCount'],
      usedLocationHints: {
        city: 'Denver',
        state: 'CO'
      },
      usedQueries: ['official website Example Co Denver CO'],
      searchHits: [
        {
          title: 'Example',
          url: 'https://example.com',
          domain: 'example.com'
        }
      ]
    });

    const app = await createApp({
      dataStore: createMockDataStore()
    });

    const response = await request(app)
      .post('/api/seed-client')
      .send({ companyName: 'Example Co', city: 'Denver', state: 'CO' });

    expect(response.statusCode).toBe(200);
    expect(seedCompanyProfile).toHaveBeenCalledWith('Example Co', {
      city: 'Denver',
      state: 'CO'
    });
    expect(response.body).toEqual({
      website: 'https://example.com',
      linkedIn: 'https://linkedin.com/company/example',
      linkedin: 'https://linkedin.com/company/example',
      dbas: 'Example Residential',
      city: 'Denver',
      state: 'CO',
      unitCount: '240',
      confidence: { label: 'high', score: 0.9 },
      filledFields: ['website', 'linkedin', 'city', 'state', 'unitCount'],
      usedLocationHints: {
        city: 'Denver',
        state: 'CO'
      },
      usedQueries: ['official website Example Co Denver CO'],
      searchHits: [
        {
          title: 'Example',
          url: 'https://example.com',
          domain: 'example.com'
        }
      ]
    });
  });

  it('validates short company names', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });

    const response = await request(app)
      .post('/api/seed-client')
      .send({ companyName: 'A' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: 'companyName must be at least 2 characters long.'
    });
  });
});
