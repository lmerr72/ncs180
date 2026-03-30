require('./loadEnv');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const { typeDefs, resolvers } = require('./graphql/schema');
const { createPostgresDataStore } = require('./graphql/postgresDataStore');
const { seedCompanyProfile } = require('./seedClientService');
const { DEFAULT_CURRENT_USER_ID } = require('./graphql/seedData');
const { clearCookie, parseCookies, serializeCookie } = require('./linkedin/cookies');
const { createLinkedInService } = require('./linkedin/service');
const { createApolloService } = require('./apollo/service');

const LINKEDIN_STATE_COOKIE = 'linkedin_oauth_state';
const LINKEDIN_RETURN_TO_COOKIE = 'linkedin_oauth_return_to';
const LINKEDIN_TOKEN_COOKIE = 'linkedin_access_token';
const LINKEDIN_TOKEN_META_COOKIE = 'linkedin_access_meta';
const US_STATE_NAMES = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia'
};

async function createApp({
  dataStore = createPostgresDataStore(),
  currentUserId = process.env.CURRENT_USER_ID || DEFAULT_CURRENT_USER_ID,
  linkedInService = createLinkedInService(),
  apolloService = createApolloService()
} = {}) {
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.use(bodyParser.json());

  app.get('/api/linkedin/auth/status', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const tokenMeta = readTokenMeta(cookies[LINKEDIN_TOKEN_META_COOKIE]);

    res.json({
      ...linkedInService.getConfigSummary(),
      connected: Boolean(cookies[LINKEDIN_TOKEN_COOKIE]),
      expiresAt: tokenMeta?.expiresAt ?? null,
      scope: tokenMeta?.scope ?? null
    });
  });

  app.get('/api/linkedin/auth/start', (req, res) => {
    if (!linkedInService.isConfigured()) {
      res.status(503).json({
        error: 'LinkedIn integration is not configured on the server.'
      });
      return;
    }

    const state = linkedInService.generateState();
    const returnTo = sanitizeReturnTo(req.query?.returnTo);

    res.setHeader('Set-Cookie', [
      serializeCookie(LINKEDIN_STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: 'Lax',
        maxAge: 60 * 10
      }),
      serializeCookie(LINKEDIN_RETURN_TO_COOKIE, returnTo, {
        httpOnly: true,
        sameSite: 'Lax',
        maxAge: 60 * 10
      })
    ]);
    res.redirect(linkedInService.buildAuthorizationUrl(state));
  });

  app.get('/api/linkedin/auth/callback', async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const state = typeof req.query?.state === 'string' ? req.query.state : '';
    const code = typeof req.query?.code === 'string' ? req.query.code : '';
    const authError = typeof req.query?.error === 'string' ? req.query.error : '';
    const returnTo = cookies[LINKEDIN_RETURN_TO_COOKIE] || '/';

    if (authError) {
      res.setHeader('Set-Cookie', clearLinkedInAuthCookies());
      res.redirect(appendStatusToReturnUrl(returnTo, 'linkedin_error', authError));
      return;
    }

    if (!state || state !== cookies[LINKEDIN_STATE_COOKIE] || !code) {
      res.setHeader('Set-Cookie', clearLinkedInAuthCookies());
      res.redirect(appendStatusToReturnUrl(returnTo, 'linkedin_error', 'invalid_state'));
      return;
    }

    try {
      const token = await linkedInService.exchangeCodeForAccessToken(code);
      const expiresAt = new Date(Date.now() + Number(token.expiresIn || 0) * 1000).toISOString();
      const tokenMeta = JSON.stringify({
        expiresAt,
        scope: token.scope
      });

      res.setHeader('Set-Cookie', [
        serializeCookie(LINKEDIN_TOKEN_COOKIE, token.accessToken, {
          httpOnly: true,
          sameSite: 'Lax',
          maxAge: Number(token.expiresIn || 0)
        }),
        serializeCookie(LINKEDIN_TOKEN_META_COOKIE, tokenMeta, {
          httpOnly: true,
          sameSite: 'Lax',
          maxAge: Number(token.expiresIn || 0)
        }),
        clearCookie(LINKEDIN_STATE_COOKIE, { sameSite: 'Lax' }),
        clearCookie(LINKEDIN_RETURN_TO_COOKIE, { sameSite: 'Lax' })
      ]);
      res.redirect(appendStatusToReturnUrl(returnTo, 'linkedin', 'connected'));
    } catch (error) {
      res.setHeader('Set-Cookie', clearLinkedInAuthCookies());
      res.redirect(
        appendStatusToReturnUrl(
          returnTo,
          'linkedin_error',
          error instanceof Error ? error.message : 'token_exchange_failed'
        )
      );
    }
  });

  app.post('/api/linkedin/auth/logout', (_req, res) => {
    res.setHeader('Set-Cookie', clearLinkedInAuthCookies());
    res.status(204).send();
  });

  app.get('/api/linkedin/company-posts', async (req, res) => {
    if (!linkedInService.isConfigured()) {
      res.status(503).json({
        error: 'LinkedIn integration is not configured on the server.'
      });
      return;
    }

    const cookies = parseCookies(req.headers.cookie);
    const accessToken = cookies[LINKEDIN_TOKEN_COOKIE];
    const companyLinkedInUrl = typeof req.query?.companyLinkedInUrl === 'string' ? req.query.companyLinkedInUrl : '';
    const count = Number(req.query?.count || 3);

    if (!accessToken) {
      res.status(401).json({
        error: 'Connect LinkedIn before loading company posts.'
      });
      return;
    }

    if (!companyLinkedInUrl) {
      res.status(400).json({
        error: 'companyLinkedInUrl is required.'
      });
      return;
    }

    try {
      const payload = await linkedInService.getCompanyPosts({
        accessToken,
        companyLinkedInUrl,
        count
      });
      res.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to fetch LinkedIn posts.';
      const statusCode = /expired|Connect LinkedIn/i.test(message) ? 401 : /permission/i.test(message) ? 403 : 502;

      res.status(statusCode).json({
        error: message
      });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'server'
    });
  });

  app.get('/api/apollo/account-snapshot', async (req, res) => {
    const companyName = typeof req.query?.companyName === 'string' ? req.query.companyName.trim() : '';
    const website = typeof req.query?.website === 'string' ? req.query.website.trim() : '';

    if (!companyName) {
      res.status(400).json({
        error: 'companyName is required.'
      });
      return;
    }

    try {
      const payload = await apolloService.getAccountSnapshot({
        companyName,
        website
      });

      res.json(payload);
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Unable to fetch Apollo account snapshot.'
      });
    }
  });

  app.post('/api/apollo/seed-client', async (req, res) => {
    const companyName = typeof req.body?.companyName === 'string' ? req.body.companyName.trim() : '';
    const website = typeof req.body?.website === 'string' ? req.body.website.trim() : '';

    if (companyName.length < 2) {
      res.status(400).json({
        error: 'companyName must be at least 2 characters long.'
      });
      return;
    }

    try {
      const snapshot = await apolloService.getAccountSnapshot({
        companyName,
        website
      });

      const organization = snapshot.organization;
      const location = parseApolloLocation(organization?.location || '');
      const filledFields = [
        organization?.website ? 'website' : null,
        organization?.linkedIn ? 'linkedIn' : null,
        location.city ? 'city' : null,
        location.state ? 'state' : null,
        organization?.employeeCount ? 'unitCount' : null
      ].filter(Boolean);

      res.json({
        website: organization?.website || null,
        linkedIn: organization?.linkedIn || null,
        dbas: '',
        city: location.city,
        state: location.state,
        unitCount: organization?.employeeCount ? String(organization.employeeCount) : null,
        confidence: getApolloSeedConfidence(filledFields.length, snapshot.matchedAccount),
        filledFields,
        searchHits: organization?.website
          ? [{
              title: organization.name || companyName,
              url: organization.website,
              domain: organization.domain || undefined
            }]
          : [],
        usedQueries: [companyName],
        warnings: snapshot.warnings
      });
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Unable to enrich client from Apollo.'
      });
    }
  });

  app.post('/api/seed-client', async (req, res) => {
    const companyName = req.body?.companyName;
    const city = typeof req.body?.city === 'string' ? req.body.city : '';
    const state = typeof req.body?.state === 'string' ? req.body.state : '';
    console.info('[seed-client] request', {
      companyName,
      city,
      state
    });

    if (typeof companyName !== 'string' || companyName.trim().length < 2) {
      res.status(400).json({
        error: 'companyName must be at least 2 characters long.'
      });
      return;
    }

    try {
      const seed = await seedCompanyProfile(companyName, { city, state });
      console.info('[seed-client] response', {
        companyName,
        filledFields: seed.filledFields,
        confidence: seed.confidence,
        searchHitCount: seed.searchHits?.length ?? 0
      });
      res.json(seed);
    } catch (error) {
      console.error('[seed-client] error', {
        companyName,
        city,
        state,
        message: error instanceof Error ? error.message : String(error)
      });
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Unable to search for company details.'
      });
    }
  });

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers
  });

  await apolloServer.start();

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async () => ({
        currentUserId,
        dataStore
      })
    })
  );

  app.locals.dataStore = dataStore;

  return app;
}

function clearLinkedInAuthCookies() {
  return [
    clearCookie(LINKEDIN_STATE_COOKIE, { sameSite: 'Lax' }),
    clearCookie(LINKEDIN_RETURN_TO_COOKIE, { sameSite: 'Lax' }),
    clearCookie(LINKEDIN_TOKEN_COOKIE, { sameSite: 'Lax' }),
    clearCookie(LINKEDIN_TOKEN_META_COOKIE, { sameSite: 'Lax' })
  ];
}

function sanitizeReturnTo(returnTo) {
  if (typeof returnTo !== 'string' || !returnTo.startsWith('/')) {
    return '/';
  }

  return returnTo;
}

function parseApolloLocation(location = '') {
  if (!location) {
    return {
      city: null,
      state: null
    };
  }

  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return {
      city: null,
      state: null
    };
  }

  const city = parts[0] || null;
  const rawState = parts[1] || null;
  const normalizedState = rawState && US_STATE_NAMES[rawState.toUpperCase()]
    ? US_STATE_NAMES[rawState.toUpperCase()]
    : rawState;

  return {
    city,
    state: normalizedState
  };
}

function getApolloSeedConfidence(filledFieldCount, matchedAccount) {
  if (matchedAccount && filledFieldCount >= 4) {
    return { label: 'high', score: 0.9 };
  }

  if (matchedAccount || filledFieldCount >= 2) {
    return { label: 'medium', score: 0.66 };
  }

  return { label: 'low', score: 0.33 };
}

function appendStatusToReturnUrl(returnTo, key, value) {
  const url = new URL(returnTo, 'http://localhost');
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

function readTokenMeta(rawTokenMeta) {
  if (!rawTokenMeta) {
    return null;
  }

  try {
    return JSON.parse(rawTokenMeta);
  } catch {
    return null;
  }
}

module.exports = {
  createApp
};
