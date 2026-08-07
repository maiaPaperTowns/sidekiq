import React, { createContext, useContext, useMemo, useReducer, useEffect, useCallback, useState } from 'react';
import { fetchJobs } from './api/greenhouse';
import { fetchUsaJobs } from './api/usajobs';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import {
  GREENHOUSE_BOARD_TOKEN,
  USAJOBS_API_KEY,
  USAJOBS_USER_AGENT,
  USAJOBS_KEYWORD,
  USAJOBS_LOCATION,
} from './config';

/* ---------- date helpers ---------- */

export function relativeTime(iso) {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.round(days / 7)}w ago`;
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ---------- derived plan state ---------- */

export function planProgress(plan) {
  const total = plan.tasks.length;
  const done = plan.tasks.filter((t) => t.done).length;
  return { total, done, ratio: total ? done / total : 0 };
}

export function planStatus(plan) {
  if (plan.submitted) return 'Completed';
  const { ratio } = planProgress(plan);
  return ratio >= 0.6 ? 'On Track' : 'Needs Attention';
}

export function nextTask(plan) {
  return plan.tasks.find((t) => !t.done) || null;
}

/* ---------- seed state ---------- */
// Jobs come from the live Greenhouse board, so there is no seed correspondence
// between demo plans/saves and real job IDs — everything starts empty and is
// built up as the user saves jobs and creates plans against the live feed.

let seq = 100;
const uid = (prefix) => `${prefix}-${++seq}`;

const initialState = {
  jobs: [],
  jobsStatus: 'idle', // idle | loading | loaded | error
  jobsError: null,
  jobsLoadedAt: null,
  savedIds: [],
  fitChecks: {},
  plans: [],
  activity: [],
  profile: { name: 'Maya', avatarUri: null },
};

/* ---------- default task templates ---------- */
// Greenhouse doesn't expose per-job "required materials", so the starter
// checklist is a generic application workflow rather than job-specific.
function starterTasks() {
  const list = [
    'Read through the full posting',
    'Tailor your résumé for this role',
    'Draft a short cover note',
    'Apply on Greenhouse',
    "Follow up in 1–2 weeks if you don't hear back",
  ];
  return list.map((title) => ({ id: uid('task'), title, done: false, completedAt: null }));
}

/* ---------- reducer ---------- */

function logged(state, kind, text) {
  return [{ id: uid('act'), kind, text, at: new Date().toISOString() }, ...state.activity].slice(0, 40);
}

function reducer(state, action) {
  switch (action.type) {
    case 'jobsLoading':
      return { ...state, jobsStatus: 'loading', jobsError: null };

    case 'jobsLoaded':
      return { ...state, jobs: action.jobs, jobsStatus: 'loaded', jobsLoadedAt: new Date().toISOString() };

    case 'jobsFailed':
      return { ...state, jobsStatus: 'error', jobsError: action.error };

    case 'toggleSave': {
      const { opportunity } = action;
      const isSaved = state.savedIds.includes(opportunity.id);
      return {
        ...state,
        savedIds: isSaved
          ? state.savedIds.filter((id) => id !== opportunity.id)
          : [opportunity.id, ...state.savedIds],
        activity: logged(
          state,
          'save',
          isSaved ? `Removed ${opportunity.title} from saved` : `Saved ${opportunity.title}`
        ),
      };
    }

    case 'createPlan': {
      const { opportunity } = action;
      if (state.plans.some((p) => p.opportunityId === opportunity.id)) return state;
      const plan = {
        id: uid('plan'),
        opportunityId: opportunity.id,
        createdAt: new Date().toISOString(),
        submitted: false,
        tasks: starterTasks(),
      };
      return {
        ...state,
        plans: [plan, ...state.plans],
        activity: logged(state, 'plan', `Created a plan for ${opportunity.title}`),
      };
    }

    case 'deletePlan':
      return {
        ...state,
        plans: state.plans.filter((p) => p.id !== action.planId),
        activity: logged(state, 'plan', `Deleted the plan for ${action.title}`),
      };

    case 'addTask':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id === action.planId
            ? { ...p, tasks: [...p.tasks, { id: uid('task'), title: action.title, done: false, completedAt: null }] }
            : p
        ),
      };

    case 'editTask':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id === action.planId
            ? { ...p, tasks: p.tasks.map((t) => (t.id === action.taskId ? { ...t, title: action.title } : t)) }
            : p
        ),
      };

    case 'deleteTask':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id === action.planId ? { ...p, tasks: p.tasks.filter((t) => t.id !== action.taskId) } : p
        ),
      };

    case 'toggleTask': {
      let completedTitle = null;
      let becameDone = false;
      const plans = state.plans.map((p) => {
        if (p.id !== action.planId) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) => {
            if (t.id !== action.taskId) return t;
            becameDone = !t.done;
            completedTitle = t.title;
            return { ...t, done: becameDone, completedAt: becameDone ? new Date().toISOString() : null };
          }),
        };
      });
      return {
        ...state,
        plans,
        activity: becameDone ? logged(state, 'task', `Completed “${completedTitle}”`) : state.activity,
      };
    }

    case 'submitPlan':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id === action.planId
            ? {
                ...p,
                submitted: true,
                submittedAt: new Date().toISOString(),
                tasks: p.tasks.map((t) => ({ ...t, done: true, completedAt: t.completedAt || new Date().toISOString() })),
              }
            : p
        ),
        activity: logged(state, 'submit', `Marked ${action.title} as applied`),
      };

    case 'reopenPlan':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id === action.planId ? { ...p, submitted: false, submittedAt: null } : p
        ),
      };

    case 'saveFitCheck':
      return {
        ...state,
        fitChecks: { ...state.fitChecks, [action.opportunityId]: action.result },
        activity: logged(state, 'fit', `Ran a fit check on ${action.title}`),
      };

    case 'clearFitCheck': {
      const next = { ...state.fitChecks };
      delete next[action.opportunityId];
      return { ...state, fitChecks: next };
    }

    case 'updateProfile':
      return { ...state, profile: { ...state.profile, ...action.updates } };

    default:
      return state;
  }
}

/* ---------- context ---------- */

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refreshJobs = useCallback(async () => {
    const usajobsConfigured = Boolean(USAJOBS_API_KEY && USAJOBS_USER_AGENT);
    if (!GREENHOUSE_BOARD_TOKEN && !usajobsConfigured) {
      dispatch({
        type: 'jobsFailed',
        error: 'No job source configured. Set EXPO_PUBLIC_GREENHOUSE_BOARD_TOKEN and/or EXPO_PUBLIC_USAJOBS_API_KEY in .env.',
      });
      return;
    }

    dispatch({ type: 'jobsLoading' });
    const [gh, usa] = await Promise.allSettled([
      GREENHOUSE_BOARD_TOKEN ? fetchJobs(GREENHOUSE_BOARD_TOKEN) : Promise.resolve([]),
      usajobsConfigured
        ? fetchUsaJobs(USAJOBS_API_KEY, USAJOBS_USER_AGENT, { keyword: USAJOBS_KEYWORD, location: USAJOBS_LOCATION })
        : Promise.resolve([]),
    ]);

    const jobs = [];
    const errors = [];
    if (gh.status === 'fulfilled') jobs.push(...gh.value);
    else if (GREENHOUSE_BOARD_TOKEN) errors.push(`Greenhouse: ${gh.reason.message}`);
    if (usa.status === 'fulfilled') jobs.push(...usa.value);
    else if (usajobsConfigured) errors.push(`USAJOBS: ${usa.reason.message}`);

    if (jobs.length === 0 && errors.length) {
      dispatch({ type: 'jobsFailed', error: errors.join(' · ') });
    } else {
      dispatch({ type: 'jobsLoaded', jobs });
    }
  }, []);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  /* ---------- auth (Supabase, optional) ---------- */

  const [auth, setAuth] = useState({
    status: isSupabaseConfigured ? 'loading' : 'unconfigured',
    session: null,
    error: null,
  });

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setAuth({ status: 'ready', session: data.session, error: null });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth((a) => ({ ...a, status: 'ready', session, error: null }));
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // On sign-in, pull the cloud profile name down (or seed the cloud row from the
  // current local name if this is the first sign-in) — keyed on user id so this
  // only runs on actual sign-in/out transitions, not on every local edit.
  const userId = auth.session?.user?.id || null;
  useEffect(() => {
    if (!supabase || !userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle();
      if (cancelled) return;
      if (data?.name) {
        dispatch({ type: 'updateProfile', updates: { name: data.name } });
      } else {
        await supabase.from('profiles').upsert({ id: userId, name: state.profile.name });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const signUp = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, []);

  // Wraps the local profile update with a cloud upsert when signed in.
  const updateProfile = useCallback(
    (updates) => {
      dispatch({ type: 'updateProfile', updates });
      if (supabase && userId && 'name' in updates) {
        supabase.from('profiles').upsert({ id: userId, name: updates.name }).then(() => {});
      }
    },
    [userId]
  );

  const value = useMemo(() => {
    const byId = Object.fromEntries(state.jobs.map((o) => [o.id, o]));

    const plans = state.plans
      .map((p) => {
        const opportunity = byId[p.opportunityId];
        if (!opportunity) return null;
        return { ...p, opportunity, progress: planProgress(p), status: planStatus(p) };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.submitted !== b.submitted) return a.submitted ? 1 : -1;
        return new Date(b.opportunity.postedAt) - new Date(a.opportunity.postedAt);
      });

    const weekAgo = Date.now() - 7 * 86400000;
    const tasksThisWeek = state.plans.reduce(
      (n, p) => n + p.tasks.filter((t) => t.done && t.completedAt && new Date(t.completedAt) > weekAgo).length,
      0
    );

    return {
      opportunities: Object.values(byId),
      opportunityById: byId,
      savedIds: state.savedIds,
      fitChecks: state.fitChecks,
      activity: state.activity,
      profile: state.profile,
      plans,
      jobsStatus: state.jobsStatus,
      jobsError: state.jobsError,
      jobsLoadedAt: state.jobsLoadedAt,
      refreshJobs,
      stats: {
        saved: state.savedIds.length,
        activePlans: plans.filter((p) => !p.submitted).length,
        completedTasks: state.plans.reduce((n, p) => n + p.tasks.filter((t) => t.done).length, 0),
        submitted: state.plans.filter((p) => p.submitted).length,
        tasksThisWeek,
        weeklyGoal: 8,
      },
      isSaved: (id) => state.savedIds.includes(id),
      planFor: (opportunityId) => plans.find((p) => p.opportunityId === opportunityId) || null,
      dispatch,
      updateProfile,
      auth,
      signUp,
      signIn,
      signOut,
    };
  }, [state, refreshJobs, updateProfile, auth, signUp, signIn, signOut]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
};
