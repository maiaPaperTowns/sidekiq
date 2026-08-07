// Public Greenhouse Job Board token — the {board_token} segment in
// https://boards.greenhouse.io/{board_token} and the API URLs below.
// Set EXPO_PUBLIC_GREENHOUSE_BOARD_TOKEN in a local .env file (see .env.example).
export const GREENHOUSE_BOARD_TOKEN = process.env.EXPO_PUBLIC_GREENHOUSE_BOARD_TOKEN || '';

// Optional display name for the org, shown next to job titles. Falls back to a
// human-readable version of the board token (e.g. "acme-corp" -> "Acme Corp").
function humanize(token) {
  return token
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

export const GREENHOUSE_ORG_NAME =
  process.env.EXPO_PUBLIC_GREENHOUSE_ORG_NAME || (GREENHOUSE_BOARD_TOKEN ? humanize(GREENHOUSE_BOARD_TOKEN) : '');

// USAJOBS Search API — https://developer.usajobs.gov/. Requires both a key and
// the email it was registered with, sent as headers on every request.
export const USAJOBS_API_KEY = process.env.EXPO_PUBLIC_USAJOBS_API_KEY || '';
export const USAJOBS_USER_AGENT = process.env.EXPO_PUBLIC_USAJOBS_USER_AGENT || '';

// USAJOBS covers the entire federal government, so a keyword and/or location
// scopes results to something relevant instead of every open federal posting.
export const USAJOBS_KEYWORD = process.env.EXPO_PUBLIC_USAJOBS_KEYWORD || '';
export const USAJOBS_LOCATION = process.env.EXPO_PUBLIC_USAJOBS_LOCATION || '';

// Supabase — https://supabase.com/dashboard/project/_/settings/api.
// The anon/public key is safe for client use; never use the service_role key here.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
