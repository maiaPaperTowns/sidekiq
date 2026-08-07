// USAJOBS Search API client.
// Docs: https://developer.usajobs.gov/api-reference/get-api-search
import { stripHtml } from '../lib/htmlText';

const BASE_URL = 'https://data.usajobs.gov/api/search';

const RATE_INTERVAL_LABEL = {
  PA: '/ year',
  PH: '/ hour',
  BW: '/ biweekly',
  MO: '/ month',
  WK: '/ week',
  DA: '/ day',
};

function formatUsd(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

function mapPayRanges(remuneration) {
  if (!Array.isArray(remuneration) || !remuneration.length) return null;
  return remuneration.map((r) => {
    const interval = RATE_INTERVAL_LABEL[r.RateIntervalCode] || '';
    const label = [formatUsd(r.MinimumRange), formatUsd(r.MaximumRange)].filter(Boolean).join(' – ');
    return { title: r.Description || 'Salary', label: interval ? `${label} ${interval}` : label, blurb: null };
  });
}

function mapJob(item) {
  const d = item.MatchedObjectDescriptor || {};
  const categories = (d.JobCategory || []).map((c) => c.Name).filter(Boolean);
  const details = d.UserArea?.Details || {};

  const parts = [];
  if (details.JobSummary) parts.push(stripHtml(details.JobSummary));
  if (Array.isArray(details.MajorDuties) && details.MajorDuties.length) {
    parts.push('Duties:\n' + details.MajorDuties.map((x) => `• ${stripHtml(x)}`).join('\n'));
  }

  return {
    id: `usajobs:${item.MatchedObjectId}`,
    source: 'usajobs',
    title: d.PositionTitle,
    org: d.OrganizationName || d.DepartmentName || 'US Government',
    category: categories[0] || 'General',
    departments: categories,
    location: d.PositionLocationDisplay || d.PositionLocation?.[0]?.LocationName || 'Location not specified',
    postedAt: d.PublicationStartDate || null,
    closesAt: d.ApplicationCloseDate || null,
    absoluteUrl: d.PositionURI,
    contentText: parts.join('\n\n'),
    payRanges: mapPayRanges(d.PositionRemuneration),
  };
}

export async function fetchUsaJobs(apiKey, userAgent, { keyword, location, resultsPerPage = 250 } = {}) {
  const params = new URLSearchParams({ ResultsPerPage: String(resultsPerPage) });
  if (keyword) params.set('Keyword', keyword);
  if (location) params.set('LocationName', location);

  const res = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: {
      'Authorization-Key': apiKey,
      'User-Agent': userAgent,
    },
  });
  if (!res.ok) throw new Error(`USAJOBS request failed (${res.status})`);
  const data = await res.json();
  return (data.SearchResult?.SearchResultItems || []).map(mapJob);
}
