const crypto = require('crypto');

const MICROSOFT_AUTH_BASE_URL = 'https://login.microsoftonline.com';
const MICROSOFT_GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

function getDefaultScopes() {
  return ['offline_access', 'openid', 'profile', 'User.Read', 'Mail.Read'];
}

function createOutlookService({
  clientId = process.env.MICROSOFT_CLIENT_ID ?? '',
  clientSecret = process.env.MICROSOFT_CLIENT_SECRET ?? '',
  redirectUri = process.env.MICROSOFT_REDIRECT_URI ?? '',
  tenantId = process.env.MICROSOFT_TENANT_ID ?? 'common',
  scopes = getDefaultScopes(),
  fetchImpl = global.fetch
} = {}) {
  function isConfigured() {
    return Boolean(clientId && clientSecret && redirectUri);
  }

  function getConfigSummary() {
    return {
      configured: isConfigured(),
      redirectUri,
      scopes,
      tenantId
    };
  }

  function generateState() {
    return crypto.randomBytes(24).toString('hex');
  }

  function buildAuthorizationUrl(state) {
    assertConfigured();

    const url = new URL(`${MICROSOFT_AUTH_BASE_URL}/${tenantId}/oauth2/v2.0/authorize`);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_mode', 'query');
    url.searchParams.set('scope', scopes.join(' '));
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'select_account');
    return url.toString();
  }

  async function exchangeCodeForTokens(code) {
    return requestTokens(new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      scope: scopes.join(' ')
    }));
  }

  async function refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('A Microsoft refresh token is required.');
    }

    return requestTokens(new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      redirect_uri: redirectUri,
      scope: scopes.join(' ')
    }));
  }

  async function getSentMessages({ accessToken, emails, limit = 10, fetchCount = 100 }) {
    assertConfigured();

    if (!accessToken) {
      throw new Error('A Microsoft access token is required.');
    }

    const normalizedEmails = normalizeEmails(emails);
    if (normalizedEmails.length === 0) {
      return {
        messages: [],
        matchedEmails: []
      };
    }

    const url = new URL(`${MICROSOFT_GRAPH_BASE_URL}/me/mailFolders/SentItems/messages`);
    url.searchParams.set('$select', 'id,subject,bodyPreview,sentDateTime,webLink,toRecipients,ccRecipients,bccRecipients');
    url.searchParams.set('$orderby', 'sentDateTime DESC');
    url.searchParams.set('$top', String(normalizeFetchCount(fetchCount)));

    const response = await fetchImpl(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok) {
      throw toMicrosoftApiError(payload, 'Unable to fetch Outlook sent messages.');
    }

    const messages = Array.isArray(payload.value) ? payload.value : [];
    const matchedMessages = messages
      .map((message) => mapOutlookMessage(message, normalizedEmails))
      .filter((message) => message.matchedEmails.length > 0)
      .slice(0, normalizeLimit(limit));

    return {
      messages: matchedMessages,
      matchedEmails: normalizedEmails
    };
  }

  async function requestTokens(body) {
    assertConfigured();

    const response = await fetchImpl(`${MICROSOFT_AUTH_BASE_URL}/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(payload.error_description || payload.error?.message || 'Microsoft token request failed.');
    }

    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresIn: payload.expires_in,
      scope: typeof payload.scope === 'string' && payload.scope.length > 0 ? payload.scope : scopes.join(' ')
    };
  }

  function assertConfigured() {
    if (!isConfigured()) {
      throw new Error('Outlook integration is not configured on the server.');
    }
  }

  return {
    buildAuthorizationUrl,
    exchangeCodeForTokens,
    generateState,
    getConfigSummary,
    getSentMessages,
    isConfigured,
    refreshAccessToken
  };
}

async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text
    };
  }
}

function normalizeLimit(limit) {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed)) {
    return 10;
  }

  return Math.max(1, Math.min(parsed, 25));
}

function normalizeFetchCount(fetchCount) {
  const parsed = Number(fetchCount);
  if (!Number.isFinite(parsed)) {
    return 100;
  }

  return Math.max(10, Math.min(parsed, 200));
}

function normalizeEmails(emails) {
  const values = Array.isArray(emails) ? emails : [emails];

  return Array.from(
    new Set(
      values
        .flatMap((value) => typeof value === 'string' ? value.split(',') : [])
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function mapOutlookMessage(message, filterEmails) {
  const toRecipients = extractRecipientAddresses(message?.toRecipients);
  const ccRecipients = extractRecipientAddresses(message?.ccRecipients);
  const bccRecipients = extractRecipientAddresses(message?.bccRecipients);
  const allRecipients = [...toRecipients, ...ccRecipients, ...bccRecipients];
  const matchedEmails = filterEmails.filter((email) => allRecipients.includes(email));

  return {
    id: String(message?.id || ''),
    subject: typeof message?.subject === 'string' && message.subject.trim().length > 0 ? message.subject : 'No subject',
    bodyPreview: typeof message?.bodyPreview === 'string' ? message.bodyPreview : '',
    sentDateTime: message?.sentDateTime || null,
    webLink: typeof message?.webLink === 'string' ? message.webLink : '',
    toRecipients,
    ccRecipients,
    bccRecipients,
    matchedEmails
  };
}

function extractRecipientAddresses(recipients) {
  if (!Array.isArray(recipients)) {
    return [];
  }

  return recipients
    .map((recipient) => recipient?.emailAddress?.address || '')
    .filter((address) => typeof address === 'string' && address.trim().length > 0)
    .map((address) => address.trim().toLowerCase());
}

function toMicrosoftApiError(payload, fallbackMessage) {
  const graphMessage = payload?.error?.message;
  const errorCode = payload?.error?.code;
  const message = graphMessage || payload?.message || fallbackMessage;

  if (errorCode === 'InvalidAuthenticationToken' || /token/i.test(message)) {
    return new Error('Your Outlook connection has expired. Reconnect Microsoft Outlook and try again.');
  }

  return new Error(message);
}

module.exports = {
  createOutlookService
};
