const request = require('supertest');
const { createApp } = require('../../src/app');
const { createMockDataStore } = require('../../src/graphql/mockDataStore');

function createLinkedInServiceDouble(overrides = {}) {
  return {
    isConfigured: () => true,
    getConfigSummary: () => ({
      configured: true,
      redirectUri: 'http://localhost:3001/api/linkedin/auth/callback',
      scopes: ['r_organization_social', 'rw_organization_admin'],
      apiVersion: '202603'
    }),
    generateState: () => 'test-state',
    buildAuthorizationUrl: () =>
      'https://www.linkedin.com/oauth/v2/authorization?state=test-state',
    exchangeCodeForAccessToken: async () => ({
      accessToken: 'linkedin-token',
      expiresIn: 3600,
      scope: 'r_organization_social rw_organization_admin'
    }),
    getCompanyPosts: async () => ({
      organization: {
        id: '123',
        name: 'Acme Property Group',
        vanityName: 'acme-property-group',
        linkedInUrl: 'https://www.linkedin.com/company/acme-property-group/'
      },
      posts: [
        {
          id: 'urn:li:share:1',
          title: 'Spring portfolio update',
          summary: 'A look at maintenance and occupancy wins.',
          postUrl: 'https://www.linkedin.com/feed/update/urn:li:share:1/',
          publishedLabel: 'Mar 30, 2026'
        }
      ]
    }),
    ...overrides
  };
}

describe('LinkedIn integration routes', () => {
  it('returns connection status for the LinkedIn auth session', async () => {
    const app = await createApp({
      dataStore: createMockDataStore(),
      linkedInService: createLinkedInServiceDouble()
    });

    const response = await request(app).get('/api/linkedin/auth/status');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      configured: true,
      redirectUri: 'http://localhost:3001/api/linkedin/auth/callback',
      scopes: ['r_organization_social', 'rw_organization_admin'],
      apiVersion: '202603',
      connected: false,
      expiresAt: null,
      scope: null
    });
  });

  it('redirects to LinkedIn and sets state cookies when auth starts', async () => {
    const app = await createApp({
      dataStore: createMockDataStore(),
      linkedInService: createLinkedInServiceDouble()
    });

    const response = await request(app)
      .get('/api/linkedin/auth/start')
      .query({
        returnTo: '/contacts/contact-seed-my-1?fromClientId=my-1'
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      'https://www.linkedin.com/oauth/v2/authorization?state=test-state'
    );
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('linkedin_oauth_state=test-state'),
        expect.stringContaining(
          'linkedin_oauth_return_to=%2Fcontacts%2Fcontact-seed-my-1%3FfromClientId%3Dmy-1'
        )
      ])
    );
  });

  it('rejects company post requests when the LinkedIn session is missing', async () => {
    const app = await createApp({
      dataStore: createMockDataStore(),
      linkedInService: createLinkedInServiceDouble()
    });

    const response = await request(app)
      .get('/api/linkedin/company-posts')
      .query({
        companyLinkedInUrl: 'https://www.linkedin.com/company/acme-property-group/'
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({
      error: 'Connect LinkedIn before loading company posts.'
    });
  });

  it('returns company posts when a LinkedIn session cookie is present', async () => {
    const linkedInService = createLinkedInServiceDouble({
      getCompanyPosts: jest.fn(async ({ accessToken, companyLinkedInUrl, count }) => ({
        organization: {
          id: '123',
          name: 'Acme Property Group',
          vanityName: 'acme-property-group',
          linkedInUrl: companyLinkedInUrl
        },
        posts: [
          {
            id: 'urn:li:share:1',
            title: `Requested ${count} post(s)`,
            summary: accessToken,
            postUrl: 'https://www.linkedin.com/feed/update/urn:li:share:1/',
            publishedLabel: 'Mar 30, 2026'
          }
        ]
      }))
    });
    const app = await createApp({
      dataStore: createMockDataStore(),
      linkedInService
    });

    const response = await request(app)
      .get('/api/linkedin/company-posts')
      .set('Cookie', ['linkedin_access_token=linkedin-token'])
      .query({
        companyLinkedInUrl: 'https://www.linkedin.com/company/acme-property-group/',
        count: 2
      });

    expect(response.statusCode).toBe(200);
    expect(linkedInService.getCompanyPosts).toHaveBeenCalledWith({
      accessToken: 'linkedin-token',
      companyLinkedInUrl: 'https://www.linkedin.com/company/acme-property-group/',
      count: 2
    });
    expect(response.body.posts).toEqual([
      {
        id: 'urn:li:share:1',
        title: 'Requested 2 post(s)',
        summary: 'linkedin-token',
        postUrl: 'https://www.linkedin.com/feed/update/urn:li:share:1/',
        publishedLabel: 'Mar 30, 2026'
      }
    ]);
  });
});
