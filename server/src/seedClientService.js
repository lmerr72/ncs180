const STATE_ABBREVIATIONS = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
]);

const COMMON_ENTITY_MAP = {
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' '
};

function logSeedDebug(event, details) {
  console.info(`[seed-client] ${event}`, details);
}

function decodeHtml(text = '') {
  return text
    .replace(/&(amp|quot|#39|apos|lt|gt|nbsp);/g, (entity) => COMMON_ENTITY_MAP[entity] || entity)
    .replace(/&#(\d+);/g, (_, value) => String.fromCharCode(Number(value)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCharCode(parseInt(value, 16)));
}

function stripHtml(text = '') {
  return decodeHtml(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unwrapDuckDuckGoUrl(url = '') {
  try {
    if (url.startsWith('//')) {
      url = `https:${url}`;
    }

    const parsed = new URL(url);
    const redirectTarget = parsed.searchParams.get('uddg');
    return redirectTarget ? decodeURIComponent(redirectTarget) : parsed.toString();
  } catch {
    return url;
  }
}

function normalizeDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function isDictionaryLikeResult({ title = '', url = '', snippet = '' }) {
  const domain = normalizeDomain(url);
  const text = `${title} ${snippet}`.toLowerCase();
  const dictionaryDomains = [
    'dictionary.com',
    'merriam-webster.com',
    'collinsdictionary.com',
    'cambridge.org',
    'vocabulary.com',
    'thesaurus.com',
    'definitions.net',
    'wordnik.com',
    'wiktionary.org'
  ];

  return (
    dictionaryDomains.some((entry) => domain.endsWith(entry)) ||
    text.includes('definition of ') ||
    text.includes('meaning of ') ||
    text.includes('dictionary') ||
    text.includes('thesaurus')
  );
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeCompanyName(companyName = '') {
  return companyName
    .replace(/\b(incorporated|inc|llc|l\.l\.c\.|lp|l\.p\.|ltd|limited|corp|corporation|co|company|holdings?|group|management|mgmt|properties|property|apartments|apartment homes)\b/gi, ' ')
    .replace(/[,&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isUsefulSearchName(value = '') {
  const tokens = value.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return false;
  }

  if (tokens.length === 1) {
    return tokens[0].length >= 4;
  }

  return tokens.some((token) => token.length >= 3);
}

function getQueryVariants(companyName, locationText = '') {
  const variants = new Set();
  const trimmedName = companyName.trim();
  const normalizedName = normalizeCompanyName(trimmedName);
  const locationSuffix = locationText ? ` ${locationText}` : '';

  variants.add(trimmedName);
  if (
    normalizedName &&
    normalizedName.toLowerCase() !== trimmedName.toLowerCase() &&
    isUsefulSearchName(normalizedName)
  ) {
    variants.add(normalizedName);
  }

  return Array.from(variants).flatMap((name) => [
    `"${name}"${locationSuffix}`,
    `"${name}" linkedin company${locationSuffix}`,
    `"${name}" units${locationSuffix}`,
    `"${name}"${locationSuffix}`
  ]);
}

function getConfidence(foundFieldsCount) {
  if (foundFieldsCount >= 5) {
    return { label: 'high', score: 0.9 };
  }

  if (foundFieldsCount >= 3) {
    return { label: 'medium', score: 0.66 };
  }

  return { label: 'low', score: 0.33 };
}

function isLinkedInCompanyUrl(url = '') {
  return /^https?:\/\/([a-z0-9-]+\.)?linkedin\.com\/company\//i.test(url);
}

function isSearchEngineDomain(domain = '') {
  return [
    'duckduckgo.com',
    'www.duckduckgo.com',
    'google.com',
    'www.google.com',
    'bing.com',
    'www.bing.com',
    'search.yahoo.com'
  ].includes(domain);
}

function scoreOfficialWebsite(url, companyName) {
  const domain = normalizeDomain(url);
  if (!domain || isSearchEngineDomain(domain) || isLinkedInCompanyUrl(url)) {
    return -1;
  }

  const tokens = companyName.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  const domainText = domain.replace(/\.(com|net|org|co|io|biz|us)$/, '').replace(/[^a-z0-9]+/g, '');
  const matched = tokens.filter((token) => domainText.includes(token)).length;

  return matched;
}

function scoreLocationMatch(text = '', city = '', state = '') {
  let score = 0;
  if (city && new RegExp(`\\b${escapeRegex(city)}\\b`, 'i').test(text)) {
    score += 2;
  }
  if (state && new RegExp(`\\b${escapeRegex(state)}\\b`, 'i').test(text)) {
    score += 1;
  }
  return score;
}

function extractLocation(text = '') {
  const match = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b/);
  if (!match) {
    return null;
  }

  const [, city, state] = match;
  if (!STATE_ABBREVIATIONS.has(state)) {
    return null;
  }

  return {
    city,
    state
  };
}

function extractUnitCount(text = '') {
  const match = text.match(/\b(\d{2,6})\s+(?:units|unit|apartments|apartment homes|homes|doors|beds)\b/i);
  return match ? match[1] : null;
}

function extractDba(text = '', companyName = '') {
  const patterns = [
    /\b(?:dba|doing business as|also known as|aka)\s+([A-Z][A-Za-z0-9&'.,\- ]{2,80})/i,
    /\b([A-Z][A-Za-z0-9&'.,\- ]{2,80})\s+\(dba\)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value && value.toLowerCase() !== companyName.trim().toLowerCase()) {
      return value.replace(/\s{2,}/g, ' ');
    }
  }

  return '';
}

function parseDuckDuckGoResults(html = '') {
  const anchorPattern = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetPattern = /<(?:a|div)[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|div)>/gi;
  const links = [];
  const snippets = [];

  let match;
  while ((match = anchorPattern.exec(html))) {
    const url = unwrapDuckDuckGoUrl(decodeHtml(match[1]));
    const link = {
      title: stripHtml(match[2]),
      url
    };

    if (!isDictionaryLikeResult(link)) {
      links.push(link);
    }
  }

  while ((match = snippetPattern.exec(html))) {
    const snippet = stripHtml(match[1]);
    if (snippet) {
      snippets.push(snippet);
    }
  }

  return {
    links,
    snippets
  };
}

function parseBingResults(html = '') {
  const itemPattern = /<li[^>]*class="[^"]*b_algo[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  const titlePattern = /<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/i;
  const snippetPattern = /<p[^>]*>([\s\S]*?)<\/p>/i;
  const links = [];
  const snippets = [];

  let match;
  while ((match = itemPattern.exec(html))) {
    const block = match[1];
    const titleMatch = block.match(titlePattern);
    if (!titleMatch) {
      continue;
    }

    const url = decodeHtml(titleMatch[1]);
    const title = stripHtml(titleMatch[2]);
    const snippetMatch = block.match(snippetPattern);
    const snippet = stripHtml(snippetMatch?.[1] || '');
    const link = { title, url, snippet };

    if (!isDictionaryLikeResult(link)) {
      links.push({ title, url });
    }

    if (snippet && !isDictionaryLikeResult(link)) {
      snippets.push(snippet);
    }
  }

  return {
    links,
    snippets
  };
}

function previewHtml(html = '') {
  return html
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

async function runSearch(query) {
  const duckDuckGoResult = await runProviderSearch({
    provider: 'duckduckgo',
    query,
    url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    parser: parseDuckDuckGoResults
  });

  if (
    duckDuckGoResult.parsed.links.length > 0 ||
    duckDuckGoResult.parsed.snippets.length > 0 ||
    duckDuckGoResult.status !== 202
  ) {
    return duckDuckGoResult.parsed;
  }

  logSeedDebug('search:fallback', {
    query,
    from: 'duckduckgo',
    to: 'bing'
  });

  const bingResult = await runProviderSearch({
    provider: 'bing',
    query,
    url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
    parser: parseBingResults
  });

  return bingResult.parsed;
}

async function runProviderSearch({ provider, query, url, parser }) {
  logSeedDebug('search:start', { provider, query });
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; NCS180SeedBot/1.0)'
    }
  });

  if (!response.ok) {
    throw new Error(`Search request failed with status ${response.status}`);
  }

  const html = await response.text();
  const parsed = parser(html);
  const contentType = response.headers.get('content-type');

  logSeedDebug('search:done', {
    provider,
    query,
    status: response.status,
    contentType,
    linkCount: parsed.links.length,
    snippetCount: parsed.snippets.length,
    topHits: parsed.links.slice(0, 3).map((link) => link.url)
  });

  if (parsed.links.length === 0 && parsed.snippets.length === 0) {
    logSeedDebug('search:empty-preview', {
      provider,
      query,
      status: response.status,
      contentType,
      htmlPreview: previewHtml(html)
    });
  }

  return {
    provider,
    status: response.status,
    contentType,
    parsed
  };
}

function mergeSearchData(searches) {
  return searches.reduce(
    (accumulator, search) => ({
      links: accumulator.links.concat(search.links),
      snippets: accumulator.snippets.concat(search.snippets)
    }),
    { links: [], snippets: [] }
  );
}

function buildSeedPayload(companyName, searchData, locationHints = {}) {
  const locationText = searchData.snippets.concat(searchData.links.map((link) => `${link.title} ${link.url}`)).join(' ');
  const officialWebsite = searchData.links
    .map((link) => ({
      ...link,
      score:
        scoreOfficialWebsite(link.url, companyName) +
        scoreLocationMatch(`${link.title} ${link.url}`, locationHints.city, locationHints.state)
    }))
    .filter((link) => link.score >= 0)
    .sort((left, right) => right.score - left.score)[0]?.url ?? null;

  const linkedIn = searchData.links
    .filter((link) => isLinkedInCompanyUrl(link.url))
    .sort(
      (left, right) =>
        scoreLocationMatch(`${right.title} ${right.url}`, locationHints.city, locationHints.state) -
        scoreLocationMatch(`${left.title} ${left.url}`, locationHints.city, locationHints.state)
    )[0]?.url ?? null;
  const corpus = locationText;
  const location = extractLocation(corpus);
  const unitCount = extractUnitCount(corpus);
  const dba = extractDba(corpus, companyName);
  const filledFields = [
    officialWebsite ? 'website' : null,
    linkedIn ? 'linkedin' : null,
    dba ? 'dbas' : null,
    location?.city ? 'city' : null,
    location?.state ? 'state' : null,
    unitCount ? 'unitCount' : null
  ].filter(Boolean);
  const confidence = getConfidence(filledFields.length);

  return {
    website: officialWebsite,
    linkedIn,
    linkedin: linkedIn,
    dbas: dba,
    city: location?.city ?? null,
    state: location?.state ?? null,
    unitCount,
    confidence,
    filledFields,
    usedLocationHints: {
      city: locationHints.city || null,
      state: locationHints.state || null
    },
    searchHits: searchData.links.slice(0, 5).map((link) => ({
      title: link.title,
      url: link.url,
      domain: normalizeDomain(link.url)
    }))
  };
}

async function seedCompanyProfile(companyName, options = {}) {
  const trimmedName = companyName.trim();
  if (trimmedName.length < 2) {
    throw new Error('Company name must be at least 2 characters long.');
  }

  const city = typeof options.city === 'string' ? options.city.trim() : '';
  const state = typeof options.state === 'string' ? options.state.trim().toUpperCase() : '';
  const locationText = [city, state].filter(Boolean).join(' ');
  const queries = getQueryVariants(trimmedName, locationText);
  logSeedDebug('seed:start', {
    companyName: trimmedName,
    city,
    state,
    queries
  });
  const searches = await Promise.all(queries.map((query) => runSearch(query)));

  const payload = {
    ...buildSeedPayload(trimmedName, mergeSearchData(searches), { city, state }),
    usedQueries: queries
  };

  logSeedDebug('seed:result', {
    companyName: trimmedName,
    filledFields: payload.filledFields,
    confidence: payload.confidence,
    website: payload.website,
    linkedIn: payload.linkedIn,
    city: payload.city,
    state: payload.state,
    unitCount: payload.unitCount,
    searchHitCount: payload.searchHits.length
  });

  return payload;
}

module.exports = {
  buildSeedPayload,
  extractDba,
  extractLocation,
  extractUnitCount,
  getQueryVariants,
  isUsefulSearchName,
  isDictionaryLikeResult,
  normalizeCompanyName,
  parseBingResults,
  parseDuckDuckGoResults,
  scoreLocationMatch,
  seedCompanyProfile
};
