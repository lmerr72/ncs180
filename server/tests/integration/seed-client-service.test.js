const {
  buildSeedPayload,
  extractDba,
  extractLocation,
  extractUnitCount,
  getQueryVariants,
  isDictionaryLikeResult,
  isUsefulSearchName,
  normalizeCompanyName,
  parseBingResults,
  parseDuckDuckGoResults
} = require('../../src/seedClientService');

describe('seedClientService', () => {
  it('parses DuckDuckGo result links and snippets', () => {
    const html = `
      <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com">Example Apartments</a>
      <div class="result__snippet">Denver, CO apartment community with 240 units.</div>
      <a class="result__a" href="https://www.linkedin.com/company/example-apartments/">Example on LinkedIn</a>
    `;

    expect(parseDuckDuckGoResults(html)).toEqual({
      links: [
        { title: 'Example Apartments', url: 'https://example.com' },
        { title: 'Example on LinkedIn', url: 'https://www.linkedin.com/company/example-apartments/' }
      ],
      snippets: ['Denver, CO apartment community with 240 units.']
    });
  });

  it('parses Bing result links and snippets', () => {
    const html = `
      <li class="b_algo">
        <h2><a href="https://example.com">Example Apartments</a></h2>
        <div class="b_caption"><p>Denver, CO apartment community with 240 units.</p></div>
      </li>
      <li class="b_algo">
        <h2><a href="https://www.linkedin.com/company/example-apartments/">Example on LinkedIn</a></h2>
      </li>
    `;

    expect(parseBingResults(html)).toEqual({
      links: [
        { title: 'Example Apartments', url: 'https://example.com' },
        { title: 'Example on LinkedIn', url: 'https://www.linkedin.com/company/example-apartments/' }
      ],
      snippets: ['Denver, CO apartment community with 240 units.']
    });
  });

  it('ignores dictionary-like results', () => {
    expect(
      isDictionaryLikeResult({
        title: 'MG Definition & Meaning',
        url: 'https://www.dictionary.com/browse/mg',
        snippet: 'Definition of MG from Dictionary.com'
      })
    ).toBe(true);
    expect(
      isDictionaryLikeResult({
        title: 'MG Properties',
        url: 'https://mgproperties.com',
        snippet: 'Apartment communities across the West.'
      })
    ).toBe(false);
  });

  it('extracts location, unit count, and dba hints from result text', () => {
    expect(extractLocation('Serving residents in Denver, CO with modern housing.')).toEqual({
      city: 'Denver',
      state: 'CO'
    });
    expect(extractUnitCount('Luxury apartment community offering 240 units near downtown.')).toBe('240');
    expect(extractDba('Also known as Example Residential management group.', 'Example')).toBe(
      'Example Residential management group.'
    );
  });

  it('builds smarter query variants from normalized company names and location', () => {
    expect(normalizeCompanyName('Example Holdings LLC')).toBe('Example');
    expect(isUsefulSearchName('Example')).toBe(true);
    expect(isUsefulSearchName('MG')).toBe(false);
    expect(getQueryVariants('Example Holdings LLC', 'Denver CO')).toContain(
      '"Example" Denver CO'
    );
    expect(getQueryVariants('Example Holdings LLC', 'Denver CO')).toContain(
      '"Example Holdings LLC" Denver CO'
    );
    expect(getQueryVariants('MG Properties', '')).not.toContain('"MG"');
  });

  it('builds a seed payload from merged search data', () => {
    const seed = buildSeedPayload('Example Apartments', {
      links: [
        { title: 'Example Apartments', url: 'https://exampleapartments.com' },
        { title: 'Example Apartments on LinkedIn', url: 'https://www.linkedin.com/company/example-apartments/' }
      ],
      snippets: [
        'Example Apartments is based in Denver, CO and offers 240 units.'
      ]
    });

    expect(seed).toMatchObject({
      website: 'https://exampleapartments.com',
      linkedIn: 'https://www.linkedin.com/company/example-apartments/',
      linkedin: 'https://www.linkedin.com/company/example-apartments/',
      city: 'Denver',
      state: 'CO',
      unitCount: '240',
      confidence: {
        label: 'high',
        score: 0.9
      },
      filledFields: ['website', 'linkedin', 'city', 'state', 'unitCount']
    });
    expect(seed.usedLocationHints).toEqual({
      city: null,
      state: null
    });
  });
});
