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

  async function findPeople({ companyName, domain, organizationId }) {
    const candidates = [];

    if (organizationId) {
      candidates.push({
        path: '/api/v1/mixed_people/search',
        options: {
          method: 'POST',
          body: {
            organization_ids: [organizationId],
            page: 1,
            per_page: 10
          }
        }
      });
      candidates.push({
        path: '/api/v1/mixed_people/search',
        options: {
          method: 'POST',
          body: {
            q_organization_ids: [organizationId],
            page: 1,
            per_page: 10
          }
        }
      });
      candidates.push({
        path: '/api/v1/mixed_people/api_search',
        options: {
          method: 'POST',
          body: {
            organization_ids: [organizationId],
            page: 1,
            per_page: 10
          }
        }
      });
    }

    if (domain) {
      candidates.push({
        path: '/api/v1/mixed_people/search',
        options: {
          method: 'POST',
          body: {
            q_organization_domains: [domain],
            page: 1,
            per_page: 10
          }
        }
      });
      candidates.push({
        path: '/api/v1/mixed_people/api_search',
        options: {
          method: 'POST',
          body: {
            q_organization_domains: [domain],
            page: 1,
            per_page: 10
          }
        }
      });
    }

    if (companyName) {
      candidates.push({
        path: '/api/v1/mixed_people/search',
        options: {
          method: 'POST',
          body: {
            q_organization_name: companyName,
            page: 1,
            per_page: 10
          }
        }
      });
      candidates.push({
        path: '/api/v1/mixed_people/api_search',
        options: {
          method: 'POST',
          body: {
            q_organization_name: companyName,
            page: 1,
            per_page: 10
          }
        }
      });
    }

    const response = await firstSuccessfulRequest(candidates);
    return pickRecordList(response, ['people', 'contacts', 'results']);
  }

  async function enrichPeople(people, domain) {
    if (!Array.isArray(people) || people.length === 0) {
      return [];
    }

    const details = people
      .slice(0, 10)
      .map((person) => ({
        id: person.id || person.person_id || undefined,
        first_name: person.first_name || person.firstName || undefined,
        last_name: person.last_name || person.lastName || undefined,
        name: compactJoin([
          person.first_name || person.firstName,
          person.last_name || person.lastName
        ], ' ') || undefined,
        organization_name: person.organization_name || person.company || undefined,
        domain: domain || undefined,
        linkedin_url: person.linkedin_url || person.linkedin_profile_url || person.linkedin || undefined,
        reveal_personal_emails: false
      }))
      .filter((detail) => detail.id || detail.linkedin_url || (detail.first_name && (detail.last_name || detail.name)));

    if (details.length === 0) {
      return [];
    }

    const response = await firstSuccessfulRequest([
      {
        path: '/api/v1/people/bulk_match',
        options: {
          method: 'POST',
          body: { details }
        }
      },
      {
        path: '/api/v1/people/bulk_match',
        options: {
          method: 'POST',
          body: { people: details }
        }
      }
    ]);

    return pickRecordList(response, ['matches', 'people', 'results']);
  }

  async function searchOrganizationsByTerritory({ territoryStates = [], limit = 6 }) {
    const opportunities = [];

    for (const state of territoryStates) {
      if (opportunities.length >= limit) {
        break;
      }

      const response = await firstSuccessfulRequest([
        {
          path: '/api/v1/mixed_companies/search',
          options: {
            method: 'POST',
            body: {
              q_organization_locations: [state],
              page: 1,
              per_page: Math.max(limit * 2, 10)
            }
          }
        },
        {
          path: '/api/v1/mixed_companies/search',
          options: {
            method: 'POST',
            body: {
              organization_locations: [state],
              page: 1,
              per_page: Math.max(limit * 2, 10)
            }
          }
        },
        {
          path: '/api/v1/mixed_companies/search',
          options: {
            method: 'POST',
            body: {
              q_state: state,
              page: 1,
              per_page: Math.max(limit * 2, 10)
            }
          }
        }
      ]);

      opportunities.push(...pickRecordList(response, ['organizations', 'accounts', 'companies', 'results']));
    }

    return opportunities;
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
    },

    async getCompanyPeople({ companyName, website }) {
      if (!apiKey) {
        return {
          configured: false,
          contacts: [],
          warnings: ['Apollo integration is not configured on the server.']
        };
      }

      const domain = extractDomain(website);
      const organization = await findOrganization({ companyName, domain });
      const accountSummary = await findAccount({ companyName, domain });
      const organizationId = organization?.id || accountSummary?.organization_id || accountSummary?.id || null;
      const people = await findPeople({
        companyName,
        domain,
        organizationId
      });
      const enrichedPeople = await enrichPeople(people, domain);

      return {
        configured: true,
        contacts: normalizePeople(people, enrichedPeople),
        warnings: people.length === 0
          ? ['Apollo did not return people for this company. People API Search may require a master API key.']
          : enrichedPeople.length === 0
            ? ['Apollo returned people, but enrichment did not expose additional email details for these matches.']
          : []
      };
    },

    async getContactHealth({ companyName, website, contacts = [] }) {
      if (!apiKey) {
        return {
          configured: false,
          contacts: [],
          warnings: ['Apollo integration is not configured on the server.']
        };
      }

      const domain = extractDomain(website);
      const preparedContacts = contacts
        .filter(Boolean)
        .map((contact) => ({
          first_name: contact.firstName || contact.first_name || '',
          last_name: contact.lastName || contact.last_name || '',
          firstName: contact.firstName || contact.first_name || '',
          lastName: contact.lastName || contact.last_name || '',
          title: contact.title || '',
          email: contact.email || '',
          phone: contact.phone || '',
          linkedIn: contact.linkedIn || contact.linkedin || '',
          linkedin: contact.linkedIn || contact.linkedin || '',
          linkedin_url: contact.linkedIn || contact.linkedin || '',
          organization_name: companyName || '',
          company: companyName || ''
        }))
        .filter((contact) => contact.firstName || contact.lastName || contact.email || contact.linkedIn);

      const enrichedPeople = await enrichPeople(preparedContacts, domain);
      const contactsWithHealth = preparedContacts.map((contact) => {
        const matchKey = buildContactHealthKey(contact, companyName);
        const enriched = enrichedPeople.find((person) => buildContactHealthKey(person, companyName) === matchKey) || null;
        const apolloEmail = enriched?.email || enriched?.email_address || '';
        const apolloPhone = enriched?.phone || enriched?.mobile_phone || enriched?.phone_number || '';
        const apolloLinkedIn =
          enriched?.linkedin_url ||
          enriched?.linkedin ||
          enriched?.linkedin_profile_url ||
          '';

        return {
          firstName: contact.firstName,
          lastName: contact.lastName,
          title: contact.title || '',
          currentEmail: contact.email || '',
          currentPhone: contact.phone || '',
          currentLinkedIn: contact.linkedIn || '',
          apolloEmail,
          apolloPhone,
          apolloLinkedIn,
          canImproveEmail: !contact.email && Boolean(apolloEmail),
          canImprovePhone: !contact.phone && Boolean(apolloPhone),
          canImproveLinkedIn: !contact.linkedIn && Boolean(apolloLinkedIn)
        };
      });

      return {
        configured: true,
        contacts: contactsWithHealth,
        warnings: contactsWithHealth.length === 0
          ? ['No existing contacts were available to score for contact health.']
          : enrichedPeople.length === 0
            ? ['Apollo did not expose additional enrichment details for these contacts.']
            : []
      };
    },

    async getTerritoryOpportunities({ territoryStates = [], excludedCompanyNames = [], excludedDomains = [], limit = 6 }) {
      if (!apiKey) {
        return {
          configured: false,
          territoryStates,
          opportunities: [],
          warnings: ['Apollo integration is not configured on the server.']
        };
      }

      const normalizedStates = territoryStates
        .filter((state) => typeof state === 'string')
        .map((state) => state.trim())
        .filter(Boolean);

      if (normalizedStates.length === 0) {
        return {
          configured: true,
          territoryStates: [],
          opportunities: [],
          warnings: ['No territory states were provided for Apollo opportunity search.']
        };
      }

      const excludedNameSet = new Set(
        excludedCompanyNames
          .filter((name) => typeof name === 'string')
          .map((name) => name.trim().toLowerCase())
          .filter(Boolean)
      );
      const excludedDomainSet = new Set(
        excludedDomains
          .filter((domain) => typeof domain === 'string')
          .map((domain) => extractDomain(domain))
          .filter(Boolean)
      );

      const records = await searchOrganizationsByTerritory({
        territoryStates: normalizedStates,
        limit
      });

      const opportunities = dedupeOrganizations(records)
        .map((record) => normalizeOpportunity(record))
        .filter((opportunity) => {
          const nameKey = opportunity.name.trim().toLowerCase();
          const domainKey = extractDomain(opportunity.website || opportunity.domain || '');
          return !excludedNameSet.has(nameKey) && !excludedDomainSet.has(domainKey);
        })
        .filter((opportunity) => {
          if (!opportunity.state) {
            return true;
          }

          return normalizedStates.some((state) => state.toLowerCase() === opportunity.state.toLowerCase());
        })
        .slice(0, limit);

      return {
        configured: true,
        territoryStates: normalizedStates,
        opportunities,
        warnings: opportunities.length === 0
          ? ['Apollo did not return new organizations for the selected territory states. Organization search filters can vary by Apollo plan.']
          : []
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

function normalizePeople(people, enrichedPeople = []) {
  const enrichedByKey = new Map(
    enrichedPeople
      .filter(Boolean)
      .map((person) => [buildPersonMatchKey(person), person])
      .filter(([key]) => key)
  );

  return dedupeById(
    people
      .filter(Boolean)
      .map((person) => {
        const enriched = enrichedByKey.get(buildPersonMatchKey(person)) || null;
        const email = enriched?.email || enriched?.email_address || person.email || person.email_address || '';
        const phone = enriched?.phone || enriched?.mobile_phone || enriched?.phone_number || person.phone || person.mobile_phone || person.phone_number || '';

        return {
          id: person.id || person.person_id || person.contact_id || null,
          firstName: person.first_name || person.firstName || enriched?.first_name || enriched?.firstName || '',
          lastName: person.last_name || person.lastName || enriched?.last_name || enriched?.lastName || '',
          title: person.title || person.job_title || enriched?.title || enriched?.job_title || '',
          email,
          phone,
          linkedIn:
            person.linkedin_url ||
            person.linkedin ||
            person.linkedin_profile_url ||
            enriched?.linkedin_url ||
            enriched?.linkedin ||
            enriched?.linkedin_profile_url ||
            '',
          city: person.city || enriched?.city || '',
          state: person.state || enriched?.state || '',
          seniority: person.seniority || enriched?.seniority || '',
          emailStatus: email ? (enriched ? 'enriched' : 'available') : 'missing'
        };
      })
      .filter((person) => person.firstName || person.lastName)
  ).slice(0, 10);
}

function normalizeOpportunity(organization) {
  const location = compactJoin([
    organization.city,
    organization.state,
    organization.country
  ], ', ');

  return {
    id: organization.id || organization.account_id || organization.organization_id || organization.primary_domain || organization.name || '',
    name: organization.name || organization.organization_name || 'Unknown company',
    website: organization.website_url || organization.website || '',
    linkedIn: organization.linkedin_url || organization.linkedin || organization.linkedin_url_cleaned || '',
    domain: organization.primary_domain || organization.domain || '',
    state: organization.state || '',
    city: organization.city || '',
    location,
    industry: organization.industry || organization.industry_tag || organization.sector || '',
    employeeCount: toNumber(organization.estimated_num_employees || organization.employee_count || organization.number_of_employees)
  };
}

function buildPersonMatchKey(person) {
  if (!person) {
    return '';
  }

  return (
    person.id ||
    person.person_id ||
    person.contact_id ||
    person.linkedin_url ||
    person.linkedin_profile_url ||
    compactJoin([
      person.first_name || person.firstName,
      person.last_name || person.lastName,
      person.organization_name || person.company
    ], '|')
  );
}

function buildContactHealthKey(person, companyName = '') {
  if (!person) {
    return '';
  }

  return (
    person.email ||
    person.email_address ||
    person.linkedin_url ||
    person.linkedin_profile_url ||
    person.linkedin ||
    compactJoin([
      person.first_name || person.firstName,
      person.last_name || person.lastName,
      person.organization_name || person.company || companyName
    ], '|').toLowerCase()
  );
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

function dedupeOrganizations(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = [
      item?.id || item?.account_id || item?.organization_id || '',
      item?.primary_domain || item?.domain || '',
      item?.name || item?.organization_name || ''
    ]
      .filter(Boolean)
      .join('|')
      .toLowerCase();

    if (!key) {
      return true;
    }

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
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
