require('./loadEnv');

const fs = require('fs');
const path = require('path');
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
const { createOutlookService } = require('./outlook/service');
const { createApolloService } = require('./apollo/service');
const { respondWithError } = require('./errorHandling');
const { createLogger, createRequestId, serializeError } = require('./logger');

const LINKEDIN_STATE_COOKIE = 'linkedin_oauth_state';
const LINKEDIN_RETURN_TO_COOKIE = 'linkedin_oauth_return_to';
const LINKEDIN_TOKEN_COOKIE = 'linkedin_access_token';
const LINKEDIN_TOKEN_META_COOKIE = 'linkedin_access_meta';
const OUTLOOK_STATE_COOKIE = 'outlook_oauth_state';
const OUTLOOK_RETURN_TO_COOKIE = 'outlook_oauth_return_to';
const OUTLOOK_TOKEN_COOKIE = 'outlook_access_token';
const OUTLOOK_REFRESH_TOKEN_COOKIE = 'outlook_refresh_token';
const OUTLOOK_TOKEN_META_COOKIE = 'outlook_access_meta';
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
  outlookService = createOutlookService(),
  apolloService = createApolloService(),
  clientDistPath = path.resolve(__dirname, '../../client/dist')
} = {}) {
  const app = express();
  const appLogger = createLogger('app');
  const graphqlLogger = createLogger('graphql');
  const isProduction = process.env.NODE_ENV === 'production';
  const clientDevServerUrl = process.env.CLIENT_DEV_SERVER_URL || 'http://localhost:5173';

  app.use((req, res, next) => {
    req.id = createRequestId();
    res.setHeader('x-request-id', req.id);

    const startedAt = Date.now();
    const shouldLogRequest = req.path.startsWith('/api') || req.path === '/graphql';

    if (shouldLogRequest) {
      appLogger.info('request_started', {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl
      });

      res.on('finish', () => {
        appLogger.info('request_completed', {
          requestId: req.id,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt
        });
      });
    }

    next();
  });

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
      appLogger.error('linkedin_auth_callback_failed', {
        requestId: req.id,
        error
      });
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

      respondWithError({
        req,
        res,
        logger: appLogger,
        event: 'linkedin_company_posts_failed',
        error,
        statusCode,
        fallbackMessage: 'Unable to fetch LinkedIn posts.'
      });
    }
  });

  app.get('/api/outlook/auth/status', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const tokenMeta = readTokenMeta(cookies[OUTLOOK_TOKEN_META_COOKIE]);

    res.json({
      ...outlookService.getConfigSummary(),
      connected: Boolean(cookies[OUTLOOK_TOKEN_COOKIE]),
      expiresAt: tokenMeta?.expiresAt ?? null,
      scope: tokenMeta?.scope ?? null
    });
  });

  app.get('/api/outlook/auth/start', (req, res) => {
    if (!outlookService.isConfigured()) {
      res.status(503).json({
        error: 'Outlook integration is not configured on the server.'
      });
      return;
    }

    const state = outlookService.generateState();
    const returnTo = sanitizeReturnTo(req.query?.returnTo);

    res.setHeader('Set-Cookie', [
      serializeCookie(OUTLOOK_STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: 'Lax',
        maxAge: 60 * 10
      }),
      serializeCookie(OUTLOOK_RETURN_TO_COOKIE, returnTo, {
        httpOnly: true,
        sameSite: 'Lax',
        maxAge: 60 * 10
      })
    ]);
    res.redirect(outlookService.buildAuthorizationUrl(state));
  });

  app.get('/api/outlook/auth/callback', async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const state = typeof req.query?.state === 'string' ? req.query.state : '';
    const code = typeof req.query?.code === 'string' ? req.query.code : '';
    const authError = typeof req.query?.error === 'string' ? req.query.error : '';
    const returnTo = cookies[OUTLOOK_RETURN_TO_COOKIE] || '/';

    if (authError) {
      res.setHeader('Set-Cookie', clearOutlookAuthCookies());
      res.redirect(appendStatusToReturnUrl(returnTo, 'outlook_error', authError));
      return;
    }

    if (!state || state !== cookies[OUTLOOK_STATE_COOKIE] || !code) {
      res.setHeader('Set-Cookie', clearOutlookAuthCookies());
      res.redirect(appendStatusToReturnUrl(returnTo, 'outlook_error', 'invalid_state'));
      return;
    }

    try {
      const token = await outlookService.exchangeCodeForTokens(code);

      res.setHeader('Set-Cookie', buildOutlookTokenCookies(token));
      res.redirect(appendStatusToReturnUrl(returnTo, 'outlook', 'connected'));
    } catch (error) {
      res.setHeader('Set-Cookie', clearOutlookAuthCookies());
      appLogger.error('outlook_auth_callback_failed', {
        requestId: req.id,
        error
      });
      res.redirect(
        appendStatusToReturnUrl(
          returnTo,
          'outlook_error',
          error instanceof Error ? error.message : 'token_exchange_failed'
        )
      );
    }
  });

  app.post('/api/outlook/auth/logout', (_req, res) => {
    res.setHeader('Set-Cookie', clearOutlookAuthCookies());
    res.status(204).send();
  });

  app.get('/api/outlook/sent-messages', async (req, res) => {
    if (!outlookService.isConfigured()) {
      res.status(503).json({
        error: 'Outlook integration is not configured on the server.'
      });
      return;
    }

    const requestedEmails = normalizeEmailQuery(req.query?.email);
    if (requestedEmails.length === 0) {
      res.status(400).json({
        error: 'At least one email query value is required.'
      });
      return;
    }

    const cookies = parseCookies(req.headers.cookie);
    const tokenMeta = readTokenMeta(cookies[OUTLOOK_TOKEN_META_COOKIE]);
    const refreshToken = cookies[OUTLOOK_REFRESH_TOKEN_COOKIE];

    try {
      const tokenState = await getValidOutlookToken({
        accessToken: cookies[OUTLOOK_TOKEN_COOKIE],
        refreshToken,
        tokenMeta,
        outlookService
      });

      if (tokenState.tokenRefreshed) {
        res.setHeader('Set-Cookie', buildOutlookTokenCookies(tokenState.token));
      }

      const payload = await outlookService.getSentMessages({
        accessToken: tokenState.accessToken,
        emails: requestedEmails,
        limit: req.query?.limit
      });

      res.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to fetch Outlook sent messages.';
      const shouldClearAuth = /expired|reconnect|refresh token/i.test(message);

      if (shouldClearAuth) {
        res.setHeader('Set-Cookie', clearOutlookAuthCookies());
      }

      respondWithError({
        req,
        res,
        logger: appLogger,
        event: 'outlook_sent_messages_failed',
        error,
        statusCode: /reconnect|expired/i.test(message) ? 401 : 502,
        fallbackMessage: 'Unable to fetch Outlook sent messages.',
        details: {
          emailCount: requestedEmails.length
        }
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
      respondWithError({
        req,
        res,
        logger: appLogger,
        event: 'apollo_account_snapshot_failed',
        error,
        statusCode: 502,
        fallbackMessage: 'Unable to fetch Apollo account snapshot.'
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
      respondWithError({
        req,
        res,
        logger: appLogger,
        event: 'apollo_seed_client_failed',
        error,
        statusCode: 502,
        fallbackMessage: 'Unable to enrich client from Apollo.',
        details: {
          companyName,
          website
        }
      });
    }
  });

  app.post('/api/apollo/company-contacts', async (req, res) => {
    const companyName = typeof req.body?.companyName === 'string' ? req.body.companyName.trim() : '';
    const website = typeof req.body?.website === 'string' ? req.body.website.trim() : '';

    if (companyName.length < 2) {
      res.status(400).json({
        error: 'companyName must be at least 2 characters long.'
      });
      return;
    }

    try {
      const payload = await apolloService.getCompanyPeople({
        companyName,
        website
      });

      res.json(payload);
    } catch (error) {
      respondWithError({
        req,
        res,
        logger: appLogger,
        event: 'apollo_company_contacts_failed',
        error,
        statusCode: 502,
        fallbackMessage: 'Unable to fetch Apollo company contacts.',
        details: {
          companyName,
          website
        }
      });
    }
  });

  app.post('/api/apollo/contact-health', async (req, res) => {
    const companyName = typeof req.body?.companyName === 'string' ? req.body.companyName.trim() : '';
    const website = typeof req.body?.website === 'string' ? req.body.website.trim() : '';
    const contacts = Array.isArray(req.body?.contacts) ? req.body.contacts : [];

    if (companyName.length < 2) {
      res.status(400).json({
        error: 'companyName must be at least 2 characters long.'
      });
      return;
    }

    try {
      const payload = await apolloService.getContactHealth({
        companyName,
        website,
        contacts
      });

      res.json(payload);
    } catch (error) {
      respondWithError({
        req,
        res,
        logger: appLogger,
        event: 'apollo_contact_health_failed',
        error,
        statusCode: 502,
        fallbackMessage: 'Unable to fetch Apollo contact health.',
        details: {
          companyName,
          website,
          contactCount: contacts.length
        }
      });
    }
  });

  app.post('/api/apollo/territory-opportunities', async (req, res) => {
    const territoryStates = Array.isArray(req.body?.territoryStates)
      ? req.body.territoryStates.filter((state) => typeof state === 'string').map((state) => state.trim()).filter(Boolean)
      : [];
    const excludedCompanyNames = Array.isArray(req.body?.excludedCompanyNames)
      ? req.body.excludedCompanyNames.filter((name) => typeof name === 'string')
      : [];
    const excludedDomains = Array.isArray(req.body?.excludedDomains)
      ? req.body.excludedDomains.filter((domain) => typeof domain === 'string')
      : [];
    const limit = Number(req.body?.limit || 6);

    if (territoryStates.length === 0) {
      res.status(400).json({
        error: 'territoryStates must contain at least one state.'
      });
      return;
    }

    try {
      const payload = await apolloService.getTerritoryOpportunities({
        territoryStates,
        excludedCompanyNames,
        excludedDomains,
        limit: Number.isFinite(limit) ? Math.max(1, Math.min(limit, 12)) : 6
      });

      res.json(payload);
    } catch (error) {
      respondWithError({
        req,
        res,
        logger: appLogger,
        event: 'apollo_territory_opportunities_failed',
        error,
        statusCode: 502,
        fallbackMessage: 'Unable to fetch Apollo territory opportunities.',
        details: {
          territoryStates,
          limit
        }
      });
    }
  });

  app.post('/api/seed-client', async (req, res) => {
    const companyName = req.body?.companyName;
    const city = typeof req.body?.city === 'string' ? req.body.city : '';
    const state = typeof req.body?.state === 'string' ? req.body.state : '';
    appLogger.info('seed_client_request', {
      requestId: req.id,
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
      appLogger.info('seed_client_response', {
        requestId: req.id,
        companyName,
        filledFields: seed.filledFields,
        confidence: seed.confidence,
        searchHitCount: seed.searchHits?.length ?? 0
      });
      res.json(seed);
    } catch (error) {
      respondWithError({
        req,
        res,
        logger: appLogger,
        event: 'seed_client_failed',
        error,
        statusCode: 502,
        fallbackMessage: 'Unable to search for company details.',
        details: {
          companyName,
          city,
          state
        }
      });
    }
  });

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
      {
        async requestDidStart(requestContext) {
          const startedAt = Date.now();
          const requestId = requestContext.request.http?.headers.get('x-request-id') || 'unknown';

          graphqlLogger.info('request_started', {
            requestId,
            operationName: requestContext.request.operationName || null
          });

          return {
            didEncounterErrors(context) {
              context.errors.forEach((error) => {
                error.extensions = {
                  ...error.extensions,
                  requestId
                };
              });

              graphqlLogger.error('request_failed', {
                requestId,
                operationName: context.operationName || context.request.operationName || null,
                errors: context.errors.map((error) => ({
                  message: error.message,
                  path: error.path,
                  extensions: error.extensions,
                  originalError: serializeError(error.originalError)
                }))
              });
            },
            willSendResponse(context) {
              graphqlLogger.info('request_completed', {
                requestId,
                operationName: context.operationName || context.request.operationName || null,
                hasErrors: Boolean(context.errors?.length),
                durationMs: Date.now() - startedAt
              });
            }
          };
        }
      }
    ]
  });

  await apolloServer.start();

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => ({
        currentUserId,
        dataStore,
        requestId: req.id
      })
    })
  );

  if (isProduction) {
    const clientIndexPath = path.join(clientDistPath, 'index.html');

    if (fs.existsSync(clientIndexPath)) {
      app.use(express.static(clientDistPath));

      app.get(/^(?!\/(?:api|graphql)(?:\/|$)).*/, (_req, res) => {
        res.sendFile(clientIndexPath);
      });
    } else {
      appLogger.warn('client_dist_missing', {
        clientIndexPath
      });

      app.get(/^(?!\/(?:api|graphql)(?:\/|$)).*/, (_req, res) => {
        res.status(404).json({
          error: 'Client app is not built on this server. API routes remain available under /api and /graphql.'
        });
      });
    }
  } else {
    app.get(/^(?!\/(?:api|graphql)(?:\/|$)).*/, (req, res) => {
      res.redirect(302, buildClientDevRedirectUrl(clientDevServerUrl, req.originalUrl || '/'));
    });
  }

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

function clearOutlookAuthCookies() {
  return [
    clearCookie(OUTLOOK_STATE_COOKIE, { sameSite: 'Lax' }),
    clearCookie(OUTLOOK_RETURN_TO_COOKIE, { sameSite: 'Lax' }),
    clearCookie(OUTLOOK_TOKEN_COOKIE, { sameSite: 'Lax' }),
    clearCookie(OUTLOOK_REFRESH_TOKEN_COOKIE, { sameSite: 'Lax' }),
    clearCookie(OUTLOOK_TOKEN_META_COOKIE, { sameSite: 'Lax' })
  ];
}

function buildOutlookTokenCookies(token) {
  const maxAge = Number(token?.expiresIn || 0);
  const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();
  const tokenMeta = JSON.stringify({
    expiresAt,
    scope: token?.scope ?? null
  });

  return [
    serializeCookie(OUTLOOK_TOKEN_COOKIE, token.accessToken, {
      httpOnly: true,
      sameSite: 'Lax',
      maxAge
    }),
    serializeCookie(OUTLOOK_TOKEN_META_COOKIE, tokenMeta, {
      httpOnly: true,
      sameSite: 'Lax',
      maxAge
    }),
    token?.refreshToken
      ? serializeCookie(OUTLOOK_REFRESH_TOKEN_COOKIE, token.refreshToken, {
          httpOnly: true,
          sameSite: 'Lax',
          maxAge: 60 * 60 * 24 * 30
        })
      : clearCookie(OUTLOOK_REFRESH_TOKEN_COOKIE, { sameSite: 'Lax' }),
    clearCookie(OUTLOOK_STATE_COOKIE, { sameSite: 'Lax' }),
    clearCookie(OUTLOOK_RETURN_TO_COOKIE, { sameSite: 'Lax' })
  ];
}

async function getValidOutlookToken({
  accessToken,
  refreshToken,
  tokenMeta,
  outlookService
}) {
  const expiresAt = tokenMeta?.expiresAt ? new Date(tokenMeta.expiresAt).getTime() : 0;
  const isStillValid = accessToken && expiresAt && expiresAt - Date.now() > 60 * 1000;

  if (isStillValid) {
    return {
      accessToken,
      tokenRefreshed: false,
      token: null
    };
  }

  if (!refreshToken) {
    throw new Error('Your Outlook connection has expired. Reconnect Microsoft Outlook and try again.');
  }

  const token = await outlookService.refreshAccessToken(refreshToken);

  return {
    accessToken: token.accessToken,
    tokenRefreshed: true,
    token
  };
}

function normalizeEmailQuery(value) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeEmailQuery(entry));
  }

  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
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

function buildClientDevRedirectUrl(baseUrl, requestPath) {
  const url = new URL(requestPath || '/', baseUrl);
  return url.toString();
}

module.exports = {
  createApp
};
