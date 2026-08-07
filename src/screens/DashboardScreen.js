import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type, categoryStyleFor, statusStyle } from '../theme';
import { Card, SectionHeader, ProgressBar, StatusTag, EmptyState } from '../components/ui';
import { useStore, relativeTime } from '../store';

const ACTIVITY_ICON = {
  save: { icon: 'bookmark', color: colors.coral, bg: colors.coralSoft },
  plan: { icon: 'clipboard', color: colors.lavender, bg: colors.lavenderSoft },
  task: { icon: 'checkmark', color: colors.sage, bg: colors.sageSoft },
  submit: { icon: 'paper-plane', color: colors.sky, bg: colors.skySoft },
  fit: { icon: 'sparkles', color: colors.amber, bg: colors.amberSoft },
};

function StatTile({ value, label, icon, color, bg }) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function DeadlineRow({ opportunity, plan, onPress }) {
  const tone = plan ? statusStyle[plan.status].fg : colors.lavender;
  const bg = plan ? statusStyle[plan.status].bg : colors.lavenderSoft;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.deadlineRow, pressed && { opacity: 0.7 }]}>
      <View style={[styles.countdown, { backgroundColor: bg }]}>
        <Ionicons name={plan ? 'clipboard' : 'bookmark'} size={18} color={tone} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.deadlineTitle} numberOfLines={1}>
          {opportunity.title}
        </Text>
        <Text style={styles.deadlineMeta} numberOfLines={1}>
          {opportunity.category} · Posted {relativeTime(opportunity.postedAt)}
        </Text>
        {plan ? (
          <View style={{ marginTop: 7, gap: 5 }}>
            <ProgressBar ratio={plan.progress.ratio} color={statusStyle[plan.status].fg} height={5} />
            <Text style={styles.deadlineProgress}>
              {plan.progress.done}/{plan.progress.total} tasks · {plan.status}
            </Text>
          </View>
        ) : (
          <Text style={styles.deadlineNoPlan}>Saved — no plan yet</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
    </Pressable>
  );
}

export default function DashboardScreen({ onOpenOpportunity, onOpenPlan }) {
  const { plans, savedIds, opportunityById, stats, activity, opportunities, jobsLoadedAt } = useStore();

  const deadlines = useMemo(() => {
    const ids = new Set([...plans.filter((p) => !p.submitted).map((p) => p.opportunityId), ...savedIds]);
    return [...ids]
      .map((id) => opportunityById[id])
      .filter(Boolean)
      .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
      .slice(0, 4);
  }, [plans, savedIds, opportunityById]);

  const breakdown = useMemo(() => {
    const ids = new Set([...plans.map((p) => p.opportunityId), ...savedIds]);
    const map = {};
    [...ids].forEach((id) => {
      const o = opportunityById[id];
      if (o) map[o.category] = (map[o.category] || 0) + 1;
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const max = entries.length ? entries[0][1] : 1;
    return { entries, max, total: [...ids].length };
  }, [plans, savedIds, opportunityById]);

  const weekRatio = Math.min(1, stats.tasksThisWeek / stats.weeklyGoal);
  const topSaved = savedIds.map((id) => opportunityById[id]).filter(Boolean).slice(0, 3);

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>YOUR WEEK AT A GLANCE</Text>
        <Text style={type.display}>Dashboard</Text>
        <Text style={styles.sub}>
          {stats.activePlans} active {stats.activePlans === 1 ? 'plan' : 'plans'} · {stats.saved} saved
        </Text>
      </View>

      {/* Saved & in-progress — the headline block */}
      <Card style={styles.deadlineCard} lifted>
        <View style={styles.deadlineHead}>
          <View style={styles.deadlineHeadIcon}>
            <Ionicons name="bookmark" size={16} color={colors.coral} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={type.section}>Saved & in progress</Text>
            <Text style={styles.deadlineHint}>Newest first</Text>
          </View>
        </View>
        {deadlines.length === 0 ? (
          <EmptyState
            icon="telescope-outline"
            title="Nothing saved yet"
            body="Save an opportunity from Discover and it will show up here."
          />
        ) : (
          deadlines.map((o, i) => (
            <View key={o.id}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <DeadlineRow
                opportunity={o}
                plan={plans.find((p) => p.opportunityId === o.id)}
                onPress={() => {
                  const plan = plans.find((p) => p.opportunityId === o.id);
                  if (plan) onOpenPlan(plan.id);
                  else onOpenOpportunity(o.id);
                }}
              />
            </View>
          ))
        )}
      </Card>

      {/* Weekly progress */}
      <Card style={{ marginTop: space.lg, gap: space.md }}>
        <View style={styles.weekTop}>
          <View style={{ flex: 1 }}>
            <Text style={type.section}>Weekly progress</Text>
            <Text style={styles.weekHint}>
              {stats.tasksThisWeek} of {stats.weeklyGoal} tasks finished in the last 7 days
            </Text>
          </View>
          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeText}>{Math.round(weekRatio * 100)}%</Text>
          </View>
        </View>
        <ProgressBar ratio={weekRatio} color={colors.lavender} height={10} />
        <Text style={styles.weekNote}>
          {weekRatio >= 1
            ? 'Goal met — nicely done. Anything extra is a head start on next week.'
            : `${stats.weeklyGoal - stats.tasksThisWeek} more to hit this week's goal.`}
        </Text>
      </Card>

      {/* Stat tiles */}
      <View style={styles.tileGrid}>
        <StatTile
          value={stats.saved}
          label="Saved"
          icon="bookmark"
          color={colors.coral}
          bg={colors.coralSoft}
        />
        <StatTile
          value={stats.activePlans}
          label="Active plans"
          icon="clipboard"
          color={colors.lavender}
          bg={colors.lavenderSoft}
        />
        <StatTile
          value={stats.completedTasks}
          label="Tasks done"
          icon="checkmark-done"
          color={colors.sage}
          bg={colors.sageSoft}
        />
        <StatTile
          value={stats.submitted}
          label="Applied"
          icon="paper-plane"
          color={colors.sky}
          bg={colors.skySoft}
        />
      </View>

      {/* Category breakdown */}
      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Where your attention goes" />
        <Card style={{ gap: space.md }}>
          {breakdown.entries.length === 0 ? (
            <Text style={styles.emptyLine}>Save or plan something to see the breakdown.</Text>
          ) : (
            breakdown.entries.map(([category, count]) => {
              const s = categoryStyleFor(category);
              return (
                <View key={category} style={{ gap: 6 }}>
                  <View style={styles.breakdownTop}>
                    <View style={styles.breakdownLabel}>
                      <View style={[styles.dot, { backgroundColor: s.dot || s.fg }]} />
                      <Text style={styles.breakdownName}>{category}</Text>
                    </View>
                    <Text style={styles.breakdownCount}>{count}</Text>
                  </View>
                  <ProgressBar ratio={count / breakdown.max} color={s.fg} height={6} />
                </View>
              );
            })
          )}
        </Card>
      </View>

      {/* Saved opportunities */}
      <View style={{ marginTop: space.xl }}>
        <SectionHeader title={`Saved opportunities (${stats.saved})`} />
        <Card style={{ gap: 2, paddingVertical: space.sm }}>
          {topSaved.length === 0 ? (
            <Text style={styles.emptyLine}>Nothing saved yet.</Text>
          ) : (
            topSaved.map((o, i) => (
              <Pressable
                key={o.id}
                onPress={() => onOpenOpportunity(o.id)}
                style={({ pressed }) => [styles.savedRow, pressed && { opacity: 0.7 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.savedTitle} numberOfLines={1}>
                    {o.title}
                  </Text>
                  <Text style={styles.savedMeta}>
                    {o.category} · Posted {relativeTime(o.postedAt)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
              </Pressable>
            ))
          )}
          {savedIds.length > 3 ? (
            <Text style={styles.moreLine}>+{savedIds.length - 3} more in Discover</Text>
          ) : null}
        </Card>
      </View>

      {/* Active plans summary */}
      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Active plans" />
        <Card style={{ gap: space.md }}>
          {plans.filter((p) => !p.submitted).length === 0 ? (
            <Text style={styles.emptyLine}>No active plans right now.</Text>
          ) : (
            plans
              .filter((p) => !p.submitted)
              .map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => onOpenPlan(p.id)}
                  style={({ pressed }) => [{ gap: 7 }, pressed && { opacity: 0.7 }]}
                >
                  <View style={styles.breakdownTop}>
                    <Text style={styles.savedTitle} numberOfLines={1}>
                      {p.opportunity.title}
                    </Text>
                    <StatusTag status={p.status} />
                  </View>
                  <ProgressBar ratio={p.progress.ratio} color={statusStyle[p.status].fg} height={6} />
                </Pressable>
              ))
          )}
        </Card>
      </View>

      {/* Recent activity */}
      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Recent activity" />
        <Card style={{ gap: space.md }}>
          {activity.slice(0, 6).map((a) => {
            const meta = ACTIVITY_ICON[a.kind] || ACTIVITY_ICON.task;
            return (
              <View key={a.id} style={styles.activityRow}>
                <View style={[styles.activityIcon, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={12} color={meta.color} />
                </View>
                <Text style={styles.activityText}>{a.text}</Text>
                <Text style={styles.activityTime}>{relativeTime(a.at)}</Text>
              </View>
            );
          })}
        </Card>
      </View>

      <Text style={styles.footer}>
        {opportunities.length} opportunities in your feed
        {jobsLoadedAt ? ` · refreshed ${relativeTime(jobsLoadedAt)}` : ''}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: space.lg, paddingBottom: 130 },
  header: { marginBottom: space.lg },
  eyebrow: { ...type.tiny, marginBottom: 5 },
  sub: { ...type.body, marginTop: 6 },

  deadlineCard: { gap: space.sm, paddingVertical: space.lg },
  deadlineHead: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm },
  deadlineHeadIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadlineHint: { ...type.small, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.borderSoft, marginVertical: 4 },

  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 10 },
  countdown: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadlineTitle: { fontSize: 14, fontWeight: '800', color: colors.ink, marginBottom: 2 },
  deadlineMeta: { fontSize: 12, fontWeight: '600', color: colors.inkMuted },
  deadlineProgress: { fontSize: 11, fontWeight: '700', color: colors.inkMuted },
  deadlineNoPlan: { fontSize: 11.5, fontWeight: '700', color: colors.lavender, marginTop: 6 },

  weekTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  weekHint: { ...type.small, marginTop: 3 },
  weekBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.lavenderSoft,
  },
  weekBadgeText: { fontSize: 14, fontWeight: '800', color: colors.lavender },
  weekNote: { fontSize: 12.5, fontWeight: '600', color: colors.inkSoft, lineHeight: 18 },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.lg },
  tile: {
    flexGrow: 1,
    flexBasis: '44%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: space.md,
    gap: 4,
  },
  tileIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  tileValue: { fontSize: 24, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  tileLabel: { ...type.small },

  breakdownTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  breakdownLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  breakdownName: { fontSize: 13, fontWeight: '700', color: colors.ink },
  breakdownCount: { fontSize: 13, fontWeight: '800', color: colors.inkMuted },

  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  savedTitle: { fontSize: 13.5, fontWeight: '800', color: colors.ink, flex: 1 },
  savedMeta: { fontSize: 11.5, fontWeight: '600', color: colors.inkMuted, marginTop: 2 },
  moreLine: { ...type.small, textAlign: 'center', paddingTop: space.md },

  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  activityIcon: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  activityText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.inkSoft, lineHeight: 19 },
  activityTime: { fontSize: 11, fontWeight: '700', color: colors.inkMuted, marginTop: 3 },

  emptyLine: { ...type.body, textAlign: 'center', paddingVertical: space.sm },
  footer: { ...type.small, textAlign: 'center', marginTop: space.xl, color: colors.inkMuted },
});
