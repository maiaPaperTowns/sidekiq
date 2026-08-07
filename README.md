# Sidekiq

Your student opportunity sidekick — find it, plan it, finish it.

Sidekiq is a job/internship discovery app aimed at students and early-career applicants. It pulls live listings from real job boards, lets you save the ones worth a shot, turns any saved listing into an application plan with a task checklist, and tracks your progress on a dashboard. Built with [Expo](https://expo.dev) and React Native, it runs on iOS, Android, and the web from one codebase.

## Features

- **Discover** — search and filter live job postings by keyword, org, or category, sorted newest-first or A–Z.
- **Fit check** — a quick self-assessment (timing, materials on hand, genuine interest) attached to each listing, so "should I even bother with this one?" has an actual answer instead of a gut feeling.
- **Plans** — turn a saved listing into an application plan with a starter task checklist (tailor résumé, draft cover note, apply, follow up), editable per plan.
- **Dashboard** — weekly task completion against a goal, saved/active/submitted counts, and a recent-activity feed.
- **Profile** — editable display name and photo (via the device photo library), optionally synced across devices through Supabase auth.
- **Responsive by default** — the same screens adapt from a full-bleed phone layout, to a centered column on tablets and mid-size windows, to a "phone on a desk" preview frame on a wide desktop browser.

## Where the data comes from

Job listings are pulled live at runtime from two sources — no seed data, no mock jobs:

- [Greenhouse Job Board API](https://developer.greenhouse.io/job-board.html) — set `EXPO_PUBLIC_GREENHOUSE_BOARD_TOKEN` to any public Greenhouse board token.
- [USAJOBS Search API](https://developer.usajobs.gov/) — covers the whole U.S. federal government; scoped down with a keyword and/or location so it's not every open federal posting at once.

Either source works on its own — set up just one if you don't need both.

Saved listings, plans, and profile data are local-first (in-memory/AsyncStorage) and optionally synced to [Supabase](https://supabase.com) if you configure auth — sign in on one device, and your profile name follows you to the next.

## Tech stack

| | |
|---|---|
| Framework | [Expo SDK 54](https://docs.expo.dev/) / React Native 0.81 |
| Language | JavaScript |
| Navigation | Custom tab state (no router dependency) |
| Styling | `StyleSheet` + a small shared design-token module (`src/theme.js`) |
| Backend (optional) | [Supabase](https://supabase.com) — auth + a `profiles` table |
| Icons | `@expo/vector-icons` (Ionicons) |
| Web target | `react-native-web`, bundled with Metro |

## Getting started

**Prerequisites:** Node.js, npm, and either [Expo Go](https://expo.dev/go) on your phone or an iOS/Android simulator.

```bash
git clone https://github.com/maiaPaperTowns/sidekiq-app.git
cd sidekiq-app
npm install
```

Copy `.env.example` to `.env` and fill in whichever sources you want live (see [`.env.example`](.env.example) for where to get each value):

```bash
cp .env.example .env
```

Then start the dev server:

```bash
npm start          # Metro bundler + QR code for Expo Go
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # browser at localhost:8081
```

Without any `.env` values set, the app still runs — Discover just shows a "no job source configured" state until you add at least one of the two job APIs.

## Project structure

```
App.js                   # Root component: splash screen, responsive shell, tab state
src/
  api/                    # Greenhouse + USAJOBS fetch/normalize logic
  components/              # Shared UI primitives (Card, Button, Tag, ...) and the
                            # gradient-mesh background used behind every screen
  data/fitQuestions.js     # Fit-check questionnaire content
  lib/supabase.js          # Supabase client + auth session wiring
  screens/                 # Discover, Plans, Dashboard, and the modal screens
  config.js                 # Reads all EXPO_PUBLIC_* env vars in one place
  store.js                  # App state: reducer + Supabase-backed auth/profile sync
  theme.js                  # Colors, spacing, radius, type scale — the design tokens
```

## Deployment

Pushes to `main` automatically build the web target and deploy it to GitHub Pages via the workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## License

No license file yet — all rights reserved by default until one is added.
