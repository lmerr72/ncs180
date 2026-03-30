const DEFAULT_BASE_URL = 'https://api.apollo.io';

function createApolloService({
  apiKey = process.env.APOLLO_API_KEY || '',
  baseUrl = process.env.APOLLO_BASE_URL || DEFAULT_BASE_URL,
  fetchImpl = fetch
} = {}) {
  const normalizedBaseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');

  async function request(path, { method = 'GET', query, body } = {}) {
    const url = new URL(`${normalizedBaseUrl}${path.startsWith('/') ? path : `/${path}`}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return;
        }

        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== undefined && item !== null && item !== '') {
              url.searchParams.append(key, String(item));
            }
          });
          return;
        }

        url.searchParams.set(key, String(value));
      });
    }

    const response = await fetchImpl(url, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(text || `Apollo request failed with ${response.status}.`);
      error.statusCode = response.status;
      throw error;
    }

    return response.json();
  }

  async function safeRequest(path, options) {
    try {
      return await request(path, options);
    } catch (error) {
      return null;
    }
  }

  async function firstSuccessfulRequest(candidates) {
    for (const candidate of candidates) {
      const result = await safeRequest(candidate.path, candidate.options);
      if (result) {
        return result;
      }
    }

    return null;
  }

  async function findOrganization({ companyName, domain }) {
    if (domain) {
      const enriched = await safeRequest('/api/v1/organizations/enrich', {
        query: { domain }
      });

      if (enriched) {
        return enriched.organization || enriched.account || enriched;
      }
    }

    if (!companyName) {
      return null;
    }

    const search = await firstSuccessfulRequest([
      {
        path: '/api/v1/mixed_companies/search',
        options: {
          method: 'POST',
          body: {
            q_organization_name: companyName,
            page: 1,
            per_page: 1
          }
        }
      },
      {
        path: '/api/v1/mixed_companies/search',
        options: {
          method: 'POST',
          body: {
            organization_names: [companyName],
            page: 1,
            per_page: 1
          }
        }
      }
    ]);

    return pickFirstRecord(search, ['organizations', 'accounts', 'companies', 'results']);
  }

  async function findAccount({ companyName, domain }) {
    const candidates = [];

    if (domain) {
      candidates.push({
        path: '/api/v1/accounts/search',
        options: {
          method: 'POST',
          body: {
            q_organization_domains: [domain],
            page: 1,
            per_page: 1
          }
        }
      });
      candidates.push({
        path: '/api/v1/accounts/search',
        options: {
          method: 'POST',
          body: {
            q_organization_domains_list: [domain],
            page: 1,
            per_page: 1
          }
        }
      });
    }

    if (companyName) {
      candidates.push({
        path: '/api/v1/accounts/search',
        options: {
          method: 'POST',
          body: {
            q_organization_name: companyName,
            page: 1,
            per_page: 1
          }
        }
      });
    }

    if (candidates.length === 0) {
      return null;
    }

    const search = await firstSuccessfulRequest(candidates);
    return pickFirstRecord(search, ['accounts', 'results']);
  }

  async function findUsers() {
    const users = await safeRequest('/api/v1/users/search');
    return pickRecordList(users, ['users', 'results']);
  }

  async function findDeals({ accountId }) {
    if (!accountId) {
      return [];
    }

    const response = await firstSuccessfulRequest([
      {
        path: '/api/v1/opportunities/search',
        options: {
          query: {
            account_id: accountId,
            per_page: 5
          }
        }
      },
      {
        path: '/api/v1/opportunities/search',
        options: {
          query: {
            account_ids: accountId,
            per_page: 5
          }
        }
      }
    ]);

    return pickRecordList(response, ['opportunities', 'deals', 'results']);
  }

  async function findRecentActivity({ accountId }) {
    if (!accountId) {
      return [];
    }

    const [tasks, calls, emails] = await Promise.all([
      firstSuccessfulRequest([
        {
          path: '/api/v1/tasks/search',
          options: {
            method: 'POST',
            body: {
              account_ids: [accountId],
              page: 1,
              per_page: 3
            }
          }
        },
        {
          path: '/api/v1/tasks/search',
          options: {
            method: 'POST',
            body: {
              q_account_ids: [accountId],
              page: 1,
              per_page: 3
            }
          }
        }
      ]),
      firstSuccessfulRequest([
        {
          path: '/api/v1/phone_calls/search',
          options: {
            query: {
              account_id: accountId,
              per_page: 3
            }
          }
        }
      ]),
      firstSuccessfulRequest([
        {
          path: '/api/v1/emailer_messages/search',
          options: {
            query: {
              account_id: accountId,
              per_page: 3
            }
          }
        }
      ])
    ]);

    return [
      ...pickRecordList(tasks, ['tasks', 'results']),
      ...pickRecordList(calls, ['phone_calls', 'calls', 'results']),
      ...pickRecordList(emails, ['emailer_messages', 'emails', 'results'])
    ];
  }

  return {
    isConfigured() {
      return Boolean(apiKey);
    },

    getConfigSummary() {
      return {
        configured: Boolean(apiKey)
      };
    },

    async getAccountSnapshot({ companyName, website }) {
      if (!apiKey) {
        return {
          configured: false,
          matchedAccount: false,
          organization: null,
          owner: null,
          openDeals: [],
          recentActivity: [],
          warnings: ['Apollo integration is not configured on the server.']
        };
      }

      const domain = extractDomain(website);
      const warnings = [];
      const organization = await findOrganization({ companyName, domain });
      const accountSummary = await findAccount({ companyName, domain });
      const accountId = accountSummary?.id || accountSummary?.account_id || organization?.account_id || null;
      const detailedAccount = accountId
        ? await safeRequest(`/api/v1/accounts/${accountId}`)
        : null;
      const account = detailedAccount?.account || detailedAccount || accountSummary;

      if (!organization && !account) {
        warnings.push('Apollo did not return a matching organization or account for this client.');
      }

      const [users, fetchedDeals, fetchedActivity] = await Promise.all([
        account?.owner_id ? findUsers() : Promise.resolve([]),
        findDeals({ accountId }),
        findRecentActivity({ accountId })
      ]);

      const resolvedDeals = normalizeDeals(account, fetchedDeals);
      const resolvedActivity = normalizeActivity(account, fetchedActivity);

      return {
        configured: true,
        matchedAccount: Boolean(account),
        organization: normalizeOrganization({
          organization,
          account,
          companyName,
          website,
          domain
        }),
        owner: normalizeOwner(account, users),
        openDeals: resolvedDeals,
        recentActivity: resolvedActivity,
        warnings
      };
    }
  };
}

function extractDomain(website) {
  if (!website) {
    return '';
  }

  try {
    const parsed = new URL(website.startsWith('http') ? website : `https://${website}`);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
  }
}

function pickRecordList(payload, keys) {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  return [];
}

function pickFirstRecord(payload, keys) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (payload.account && typeof payload.account === 'object') {
    return payload.account;
  }

  if (payload.organization && typeof payload.organization === 'object') {
    return payload.organization;
  }

  for (const key of keys) {
    if (Array.isArray(payload[key]) && payload[key].length > 0) {
      return payload[key][0];
    }
  }

  return null;
}

function normalizeOrganization({ organization, account, companyName, website, domain }) {
  const source = organization || account || {};
  const location = compactJoin([
    source.city,
    source.state,
    source.country
  ], ', ');

  return {
    name: source.name || source.organization_name || account?.name || companyName || 'Unknown account',
    domain: source.primary_domain || source.domain || account?.domain || domain || '',
    website: source.website_url || source.website || account?.website_url || website || '',
    linkedIn: source.linkedin_url || source.linkedin || source.linkedin_url_cleaned || '',
    industry: source.industry || source.industry_tag || source.sector || '',
    employeeCount: source.estimated_num_employees || source.employee_count || source.number_of_employees || null,
    annualRevenue: source.annual_revenue || source.revenue || null,
    location,
    keywords: Array.isArray(source.keywords)
      ? source.keywords.filter(Boolean).slice(0, 4)
      : []
  };
}

function normalizeOwner(account, users) {
  const directOwner = account?.owner || account?.account_owner || null;

  if (directOwner) {
    return {
      id: directOwner.id || account?.owner_id || '',
      name: compactJoin([directOwner.first_name, directOwner.last_name], ' ') || directOwner.name || 'Assigned owner',
      email: directOwner.email || '',
      title: directOwner.title || ''
    };
  }

  const matchedUser = users.find((user) => user.id === account?.owner_id);
  if (matchedUser) {
    return {
      id: matchedUser.id || '',
      name: compactJoin([matchedUser.first_name, matchedUser.last_name], ' ') || matchedUser.name || 'Assigned owner',
      email: matchedUser.email || '',
      title: matchedUser.title || ''
    };
  }

  if (account?.owner_id) {
    return {
      id: account.owner_id,
      name: account.owner_name || 'Assigned owner',
      email: '',
      title: ''
    };
  }

  return null;
}

function normalizeDeals(account, fetchedDeals) {
  const sourceDeals = [
    ...pickRecordList(account || {}, ['opportunities', 'deals', 'open_deals']),
    ...fetchedDeals
  ];

  const uniqueDeals = dedupeById(sourceDeals).filter((deal) => {
    const stage = `${deal.stage_name || deal.stage || ''}`.toLowerCase();
    return !stage.includes('closed');
  });

  return uniqueDeals.slice(0, 5).map((deal) => ({
    id: deal.id || deal.opportunity_id || deal.name || `${deal.stage_name || 'deal'}-${deal.close_date || ''}`,
    name: deal.name || deal.opportunity_name || 'Untitled deal',
    stage: deal.stage_name || deal.stage || 'Open',
    amount: toNumber(deal.amount || deal.value || deal.amount_in_dollars),
    closeDate: deal.close_date || deal.expected_close_date || null
  }));
}

function normalizeActivity(account, fetchedActivity) {
  const sourceActivity = [
    ...pickRecordList(account || {}, ['activities', 'recent_activities', 'tasks', 'calls', 'emails']),
    ...fetchedActivity
  ];

  const normalized = dedupeById(sourceActivity).map((item) => ({
    id: item.id || item.task_id || item.call_id || item.message_id || `${item.type || 'activity'}-${item.updated_at || item.created_at || ''}`,
    type: inferActivityType(item),
    title: item.subject || item.title || item.name || 'Apollo activity',
    summary: item.note || item.description || item.preview_text || item.disposition || '',
    at: item.completed_at || item.sent_at || item.called_at || item.updated_at || item.created_at || null,
    actor: compactJoin([
      item.owner_first_name || item.user_first_name,
      item.owner_last_name || item.user_last_name
    ], ' ') || item.owner_name || item.user_name || ''
  }));

  return normalized
    .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())
    .slice(0, 6);
}

function inferActivityType(item) {
  const rawType = `${item.type || item.activity_type || ''}`.toLowerCase();
  if (rawType.includes('call')) return 'Call';
  if (rawType.includes('email') || rawType.includes('message')) return 'Email';
  if (rawType.includes('task')) return 'Task';
  return 'Activity';
}

function dedupeById(items) {
  const seen = new Set();
  return items.filter((item) => {
    const id = item?.id || item?.task_id || item?.call_id || item?.message_id;
    if (!id) {
      return true;
    }

    if (seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

function compactJoin(values, separator) {
  return values.filter(Boolean).join(separator);
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

module.exports = {
  createApolloService,
  extractDomain
};
