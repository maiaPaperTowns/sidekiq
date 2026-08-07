// Greenhouse Job Board API client.
// Docs: https://developers.greenhouse.io/job-board.html
// Only the "List jobs" and "Retrieve a job" endpoints are used — no Applications,
// Harvest, Ingestion, or Assessment APIs. Applying always redirects to absolute_url.
import { stripHtml } from '../lib/htmlText';
import { GREENHOUSE_ORG_NAME } from '../config';

const BASE_URL = 'https://boards-api.greenhouse.io/v1/boards';

function formatCents(cents, currency) {
  if (cents == null) return null;
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency ? currency + ' ' : ''}${amount.toLocaleString()}`;
  }
}

function mapPayRanges(payInputRanges) {
  if (!Array.isArray(payInputRanges) || !payInputRanges.length) return null;
  return payInputRanges.map((r) => ({
    title: r.title || 'Pay range',
    blurb: r.blurb ? stripHtml(r.blurb) : null,
    label: [formatCents(r.min_cents, r.currency_type), formatCents(r.max_cents, r.currency_type)]
      .filter(Boolean)
      .join(' – '),
  }));
}

function mapJob(job) {
  const departments = (job.departments || []).map((d) => d.name).filter(Boolean);
  return {
    id: String(job.id),
    source: 'greenhouse',
    title: job.title,
    org: GREENHOUSE_ORG_NAME,
    category: departments[0] || 'General',
    departments,
    location: job.location?.name || 'Location not specified',
    postedAt: job.updated_at || null,
    absoluteUrl: job.absolute_url,
    contentText: stripHtml(job.content),
    payRanges: null,
  };
}

export async function fetchJobs(boardToken) {
  const res = await fetch(`${BASE_URL}/${boardToken}/jobs?content=true`);
  if (!res.ok) throw new Error(`Greenhouse jobs request failed (${res.status})`);
  const data = await res.json();
  return (data.jobs || []).map(mapJob);
}

export async function fetchJob(boardToken, jobId) {
  const res = await fetch(`${BASE_URL}/${boardToken}/jobs/${jobId}?pay_transparency=true`);
  if (!res.ok) throw new Error(`Greenhouse job request failed (${res.status})`);
  const data = await res.json();
  return { ...mapJob(data), payRanges: mapPayRanges(data.pay_input_ranges) };
}
