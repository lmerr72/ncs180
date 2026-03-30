const crypto = require('crypto');

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_ACCESS_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_BASE_URL = 'https://api.linkedin.com/rest';

function getDefaultScopes() {
  return ['r_organization_social', 'rw_organization_admin'];
}

function createLinkedInService({
  clientId = process.env.LINKEDIN_CLIENT_ID ?? '',
  clientSecret = process.env.LINKEDIN_CLIENT_SECRET ?? '',
  redirectUri = process.env.LINKEDIN_REDIRECT_URI ?? '',
  apiVersion = process.env.LINKEDIN_API_VERSION ?? '202603',
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
      apiVersion
    };
  }

  function generateState() {
    return crypto.randomBytes(24).toString('hex');
  }

  function buildAuthorizationUrl(state) {
    const url = new URL(LINKEDIN_AUTH_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('scope', scopes.join(' '));
    return url.toString();
  }

  async function exchangeCodeForAccessToken(code) {
    assertConfigured();

    const response = await fetchImpl(LINKEDIN_ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      })
    });

    const payload = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(payload.error_description || payload.message || 'LinkedIn token exchange failed.');
    }

    return {
      accessToken: payload.access_token,
      expiresIn: payload.expires_in,
      scope: typeof payload.scope === 'string' && payload.scope.length > 0 ? payload.scope : scopes.join(' ')
    };
  }

  async function getCompanyPosts({ accessToken, companyLinkedInUrl, count = 3 }) {
    assertConfigured();

    if (!accessToken) {
      throw new Error('A LinkedIn access token is required.');
    }

    const vanityName = extractCompanyVanityName(companyLinkedInUrl);
    if (!vanityName) {
      throw new Error('This LinkedIn URL is not a supported company page URL.');
    }

    const organization = await lookupOrganizationByVanityName(accessToken, vanityName);
    const organizationUrn = `urn:li:organization:${organization.id}`;
    const postsUrl = new URL(`${LINKEDIN_API_BASE_URL}/posts`);
    postsUrl.searchParams.set('q', 'author');
    postsUrl.searchParams.set('author', organizationUrn);
    postsUrl.searchParams.set('count', String(normalizeCount(count)));

    const postsResponse = await fetchImpl(postsUrl, {
      headers: buildApiHeaders(accessToken, apiVersion)
    });
    const postsPayload = await parseJsonResponse(postsResponse);

    if (!postsResponse.ok) {
      throw toLinkedInApiError(postsPayload, postsResponse.status, organization.localizedName || vanityName);
    }

    const rawPosts = Array.isArray(postsPayload.elements) ? postsPayload.elements : [];

    return {
      organization: {
        id: String(organization.id),
        name: organization.localizedName || organization.name?.localized?.en_US || vanityName,
        vanityName: organization.vanityName || vanityName,
        linkedInUrl: normalizeCompanyLinkedInUrl(companyLinkedInUrl, organization.vanityName || vanityName)
      },
      posts: rawPosts
        .filter(post => post && typeof post === 'object')
        .slice(0, count)
        .map(post => mapLinkedInPost(post, organization.vanityName || vanityName))
    };
  }

  async function lookupOrganizationByVanityName(accessToken, vanityName) {
    const url = new URL(`${LINKEDIN_API_BASE_URL}/organizations`);
    url.searchParams.set('q', 'vanityName');
    url.searchParams.set('vanityName', vanityName);

    const response = await fetchImpl(url, {
      headers: buildApiHeaders(accessToken, apiVersion)
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(payload.message || 'LinkedIn organization lookup failed.');
    }

    const elements = Array.isArray(payload.elements) ? payload.elements : [];
    const organization = elements.find(entry => entry && String(entry.vanityName || '').toLowerCase() === vanityName.toLowerCase()) || elements[0];

    if (!organization?.id) {
      throw new Error(`No LinkedIn company page was found for "${vanityName}".`);
    }

    return organization;
  }

  function assertConfigured() {
    if (!isConfigured()) {
      throw new Error('LinkedIn integration is not configured on the server.');
    }
  }

  return {
    buildAuthorizationUrl,
    exchangeCodeForAccessToken,
    generateState,
    getCompanyPosts,
    getConfigSummary,
    isConfigured
  };
}

function buildApiHeaders(accessToken, apiVersion) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'X-Restli-Protocol-Version': '2.0.0',
    'Linkedin-Version': apiVersion
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

function extractCompanyVanityName(linkedInUrl) {
  if (!linkedInUrl) {
    return '';
  }

  try {
    const parsed = new URL(linkedInUrl.trim());
    const parts = parsed.pathname.split('/').filter(Boolean);

    if (parts[0]?.toLowerCase() !== 'company' || !parts[1]) {
      return '';
    }

    return sanitizeVanityName(parts[1]);
  } catch {
    return '';
  }
}

function sanitizeVanityName(value) {
  return value.trim().replace(/\/+$/, '').replace(/^@/, '');
}

function normalizeCompanyLinkedInUrl(companyLinkedInUrl, vanityName) {
  if (companyLinkedInUrl) {
    return companyLinkedInUrl;
  }

  return `https://www.linkedin.com/company/${vanityName}/`;
}

function normalizeCount(count) {
  const numericCount = Number(count);
  if (!Number.isFinite(numericCount)) {
    return 3;
  }

  return Math.max(1, Math.min(Math.trunc(numericCount), 10));
}

function mapLinkedInPost(post, vanityName) {
  const commentary = typeof post.commentary === 'string' ? post.commentary.trim() : '';
  const articleTitle = post.content?.article?.title;
  const mediaTitle = post.content?.media?.title;
  const id = String(post.id || post.urn || crypto.randomUUID());
  const postUrl = buildPostUrl(post.id || post.urn, vanityName);
  const publishedAt = post.publishedAt || post.createdAt || post.lastModifiedAt || null;

  return {
    id,
    title: pickPostTitle({ commentary, articleTitle, mediaTitle }),
    summary: commentary || undefined,
    postUrl,
    publishedLabel: formatPublishedLabel(publishedAt),
    embedUrl: postUrl.includes('/feed/update/') ? postUrl.replace('/feed/update/', '/embed/feed/update/') : undefined
  };
}

function pickPostTitle({ commentary, articleTitle, mediaTitle }) {
  if (typeof articleTitle === 'string' && articleTitle.trim()) {
    return articleTitle.trim();
  }

  if (typeof mediaTitle === 'string' && mediaTitle.trim()) {
    return mediaTitle.trim();
  }

  if (commentary) {
    const normalized = commentary.replace(/\s+/g, ' ').trim();
    return normalized.length > 72 ? `${normalized.slice(0, 69).trimEnd()}...` : normalized;
  }

  return 'LinkedIn post';
}

function buildPostUrl(postId, vanityName) {
  if (typeof postId === 'string' && postId.startsWith('urn:li:')) {
    return `https://www.linkedin.com/feed/update/${postId}/`;
  }

  return `https://www.linkedin.com/company/${vanityName}/posts/`;
}

function formatPublishedLabel(timestamp) {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) {
    return 'Recent LinkedIn post';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function toLinkedInApiError(payload, status, organizationName) {
  const message = payload.message || payload.error_description || 'LinkedIn request failed.';

  if (status === 401) {
    return new Error('Your LinkedIn session has expired. Reconnect LinkedIn and try again.');
  }

  if (status === 403) {
    return new Error(
      `The connected LinkedIn member does not have permission to read posts for ${organizationName}. They must be an approved page admin, content admin, or direct sponsored content poster.`
    );
  }

  if (status === 404) {
    return new Error(`LinkedIn could not find the requested company page for ${organizationName}.`);
  }

  return new Error(message);
}

module.exports = {
  createLinkedInService,
  extractCompanyVanityName
};
