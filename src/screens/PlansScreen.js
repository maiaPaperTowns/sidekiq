import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type, statusStyle } from '../theme';
import { Card, FilterChip, ProgressBar, StatusTag, EmptyState, MetaRow } from '../components/ui';
import PlanDetail from './PlanDetail';
import { useStore, relativeTime } from '../store';

const FILTERS = ['All', 'On Track', 'Needs Attention', 'Completed'];

function PlanCard({ plan, onPress }) {
  const { done, total, ratio } = plan.progress;
  const tone = statusStyle[plan.status];
  const next = plan.tasks.find((t) => !t.done);

  return (
    <Card onPress={onPress} style={styles.planCard}>
      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {plan.opportunity.title}
          </Text>
          <Text style={styles.org}>{plan.opportunity.org}</Text>
        </View>
        <StatusTag status={plan.status} />
      </View>

      <MetaRow
        icon="briefcase-outline"
        label={`${plan.opportunity.category} · Posted ${relativeTime(plan.opportunity.postedAt)}`}
      />

      <View style={{ gap: 7 }}>
        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>
            {done} of {total} tasks
          </Text>
          <Text style={[styles.progressPct, { color: tone.fg }]}>{Math.round(ratio * 100)}%</Text>
        </View>
        <ProgressBar ratio={ratio} color={tone.fg} />
      </View>

      <View style={styles.nextBlock}>
        <Ionicons
          name={next ? 'arrow-forward-circle' : 'checkmark-done-circle'}
          size={15}
          color={next ? colors.coral : colors.sky}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.nextLabel}>{next ? 'Next up' : 'All tasks done'}</Text>
          <Text style={styles.nextText} numberOfLines={1}>
            {next ? next.title : plan.submitted ? 'Application submitted' : 'Ready to submit'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
      </View>
    </Card>
  );
}

export default function PlansScreen({ onOpenOpportunity, selectedPlanId, setSelectedPlanId }) {
  const { plans } = useStore();
  const [filter, setFilter] = useState('All');

  const selected = plans.find((p) => p.id === selectedPlanId);

  const counts = useMemo(() => {
    const map = { All: plans.length };
    plans.forEach((p) => {
      map[p.status] = (map[p.status] || 0) + 1;
    });
    return map;
  }, [plans]);

  const visible = filter === 'All' ? plans : plans.filter((p) => p.status === filter);

  if (selected) {
    return (
      <PlanDetail
        plan={selected}
        onBack={() => setSelectedPlanId(null)}
        onOpenOpportunity={onOpenOpportunity}
      />
    );
  }

  return (
    <FlatList
      data={visible}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => <PlanCard plan={item} onPress={() => setSelectedPlanId(item.id)} />}
      ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR APPLICATIONS</Text>
            <Text style={type.display}>My Plans</Text>
            <Text style={styles.sub}>
              {counts['Needs Attention'] || 0} need attention · {counts['On Track'] || 0} on track
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {FILTERS.map((f) => (
              <FilterChip
                key={f}
                label={f}
                count={counts[f] || 0}
                active={filter === f}
                onPress={() => setFilter(f)}
              />
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        <Card>
          <EmptyState
            icon="clipboard-outline"
            title={filter === 'All' ? 'No plans yet' : `Nothing ${filter.toLowerCase()}`}
            body={
              filter === 'All'
                ? 'Open an opportunity from Discover and tap “Create plan” to break it into tasks.'
                : 'Switch filters to see the rest of your applications.'
            }
          />
        </Card>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingBottom: 120 },
  header: { marginBottom: space.lg, gap: space.lg },
  eyebrow: { ...type.tiny, marginBottom: 5 },
  sub: { ...type.body, marginTop: 6 },
  chipRow: { gap: space.sm, paddingRight: space.lg },

  planCard: { gap: space.md },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  title: { ...type.title, fontSize: 16.5, lineHeight: 21, marginBottom: 3 },
  org: { fontSize: 12.5, fontWeight: '700', color: colors.inkMuted },

  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12.5, fontWeight: '700', color: colors.inkSoft },
  progressPct: { fontSize: 12.5, fontWeight: '800' },

  nextBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: space.md,
    paddingVertical: 11,
  },
  nextLabel: { ...type.tiny, marginBottom: 2 },
  nextText: { fontSize: 13, fontWeight: '700', color: colors.ink },
});
