interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * HM Land Registry Price Paid Data (UK) MCP.
 *
 * England & Wales residential property *sale prices* recorded by HM Land Registry,
 * covering every reported sale since 1995. Served by the keyless Linked Data API
 * (Elda / linked-data-api) at landregistry.data.gov.uk — no API key required.
 *
 * Data scope & conventions:
 * - Geography: England and Wales only (Scotland and Northern Ireland keep separate registries).
 * - Postcodes are UK-format, UPPERCASE, with a space, e.g. "SW1A 1AA", "WA2 8SN".
 * - pricePaid is in whole GBP (£). transactionDate is the date of sale (YYYY-MM-DD).
 * - Each record carries propertyType (detached/semi-detached/terraced/flat-maisonette/other),
 *   estateType (Freehold/Leasehold — i.e. tenure), and newBuild (boolean).
 *
 * Elda filter / range / sort syntax (verified against the live API):
 * - Exact match:   field=value                       e.g. propertyAddress.town=WARRINGTON
 * - Nested fields: dot notation                       e.g. propertyAddress.postcode=WA2 8SN
 * - Range (NOTE the PREFIX form, not a suffix):
 *       min-field=value  /  max-field=value           e.g. min-pricePaid=400000, max-transactionDate=2020-12-31
 *   (The suffix form `field-min` returns HTTP 400 "unrecognised parameter prefix".)
 * - Sort:          _sort=field (ascending) / _sort=-field (descending)
 * - Paging:        _pageSize=N (max ~500) & _page=P (0-indexed)
 * Responses are { result: { items: [...], page, itemsPerPage, startIndex, next, ... } }.
 */


const BASE = 'https://landregistry.data.gov.uk/data/ppi';
const UA = 'pipeworx-mcp-landregistry-uk/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_transactions',
    description:
      'Search HM Land Registry Price Paid records — individual residential property sales in England & Wales since 1995. ' +
      'Filter by postcode, town, district, county, price range and sale-date range; sort and page through results. ' +
      'Each record returns price paid (£GBP), sale date, full address, property type, tenure (freehold/leasehold) and new-build flag. ' +
      'Postcodes must be UPPERCASE with a space (e.g. "SW1A 1AA").',
    inputSchema: {
      type: 'object',
      properties: {
        postcode: { type: 'string', description: 'UK postcode, UPPERCASE with a space, e.g. "WA2 8SN". Exact match.' },
        town: { type: 'string', description: 'Post town, exact match (case-insensitive in practice), e.g. "WARRINGTON".' },
        district: { type: 'string', description: 'Local district, exact match, e.g. "MANCHESTER".' },
        county: { type: 'string', description: 'County, exact match, e.g. "GREATER MANCHESTER".' },
        minPrice: { type: 'number', description: 'Minimum price paid in whole GBP (inclusive).' },
        maxPrice: { type: 'number', description: 'Maximum price paid in whole GBP (inclusive).' },
        minDate: { type: 'string', description: 'Earliest sale date, YYYY-MM-DD (inclusive). Data starts 1995.' },
        maxDate: { type: 'string', description: 'Latest sale date, YYYY-MM-DD (inclusive).' },
        date: { type: 'string', description: 'Exact sale date, YYYY-MM-DD. Overrides minDate/maxDate.' },
        sort: {
          type: 'string',
          description:
            'Sort field. Prefix with "-" for descending. Common: "-transactionDate" (newest first), "transactionDate", "-pricePaid", "pricePaid". Default newest first.',
        },
        pageSize: { type: 'number', description: 'Results per page, 1-500. Default 25.' },
        page: { type: 'number', description: '0-indexed page number. Default 0.' },
      },
    },
  },
  {
    name: 'lookup_postcode',
    description:
      'Convenience: list the most recent HM Land Registry property sales for a single UK postcode (England & Wales). ' +
      'Returns sale price (£GBP), date, address, property type, tenure and new-build flag, newest sale first. ' +
      'Postcode must be UPPERCASE with a space, e.g. "SW1A 1AA".',
    inputSchema: {
      type: 'object',
      properties: {
        postcode: { type: 'string', description: 'UK postcode, UPPERCASE with a space, e.g. "WA2 8SN".' },
        limit: { type: 'number', description: 'Max records to return, 1-500. Default 25.' },
      },
      required: ['postcode'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_transactions': {
      const q = new URLSearchParams();
      q.set('_pageSize', String(clampPage(args.pageSize, 25)));
      q.set('_page', String(Math.max(0, intArg(args.page, 0))));
      q.set('_sort', strArg(args.sort) ?? '-transactionDate');

      const postcode = strArg(args.postcode);
      if (postcode) q.set('propertyAddress.postcode', postcode);
      const town = strArg(args.town);
      if (town) q.set('propertyAddress.town', town);
      const district = strArg(args.district);
      if (district) q.set('propertyAddress.district', district);
      const county = strArg(args.county);
      if (county) q.set('propertyAddress.county', county);

      if (typeof args.minPrice === 'number') q.set('min-pricePaid', String(args.minPrice));
      if (typeof args.maxPrice === 'number') q.set('max-pricePaid', String(args.maxPrice));

      const date = strArg(args.date);
      if (date) {
        q.set('transactionDate', date);
      } else {
        const minDate = strArg(args.minDate);
        if (minDate) q.set('min-transactionDate', minDate);
        const maxDate = strArg(args.maxDate);
        if (maxDate) q.set('max-transactionDate', maxDate);
      }

      return ppiGet(`/transaction-record.json?${q.toString()}`);
    }
    case 'lookup_postcode': {
      const postcode = reqStr(args, 'postcode', '"SW1A 1AA"');
      const q = new URLSearchParams();
      q.set('_pageSize', String(clampPage(args.limit, 25)));
      q.set('_page', '0');
      q.set('_sort', '-transactionDate');
      q.set('propertyAddress.postcode', postcode);
      return ppiGet(`/transaction-record.json?${q.toString()}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function ppiGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Land Registry: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function strArg(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function intArg(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : fallback;
}

function clampPage(v: unknown, fallback: number): number {
  const n = intArg(v, fallback);
  return Math.min(500, Math.max(1, n));
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v.trim();
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
