import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, space, type } from '../theme';
import { Card, CategoryTag, MetaRow, Button, IconButton } from './ui';
import { useStore, relativeTime, formatDate } from '../store';

export default function OpportunityCard({ opportunity, onOpen }) {
  const { isSaved, dispatch, planFor } = useStore();
  const saved = isSaved(opportunity.id);
  const plan = planFor(opportunity.id);

  return (
    <Card style={styles.card}>
      <View style={styles.headRow}>
        <View style={styles.headText}>
          <CategoryTag category={opportunity.category} style={{ marginBottom: 8 }} />
          <Text style={styles.title} numberOfLines={2}>
            {opportunity.title}
          </Text>
          <Text style={styles.org}>{opportunity.org}</Text>
        </View>
        <IconButton
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          active={saved}
          onPress={() => dispatch({ type: 'toggleSave', opportunity })}
        />
      </View>

      <View style={styles.metaGrid}>
        <MetaRow icon="location-outline" label={opportunity.location} />
        <MetaRow icon="time-outline" label={`Posted ${relativeTime(opportunity.postedAt)}`} />
        {opportunity.closesAt ? (
          <MetaRow icon="flag-outline" label={`Closes ${formatDate(opportunity.closesAt)}`} tint={colors.coral} />
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          label={saved ? 'Saved' : 'Save'}
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          variant={saved ? 'soft' : 'outline'}
          size="sm"
          style={{ flex: 1 }}
          onPress={() => dispatch({ type: 'toggleSave', opportunity })}
        />
        <Button
          label="View details"
          icon="arrow-forward"
          variant="primary"
          size="sm"
          style={{ flex: 1.4 }}
          onPress={onOpen}
        />
      </View>

      {plan ? (
        <View style={styles.planFlag}>
          <Text style={styles.planFlagText}>Plan in progress · {plan.progress.done}/{plan.progress.total} tasks</Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  headText: { flex: 1 },
  title: { ...type.title, fontSize: 17, lineHeight: 22, marginBottom: 3 },
  org: { fontSize: 13, fontWeight: '700', color: colors.inkMuted },

  metaGrid: { gap: 7 },

  actions: { flexDirection: 'row', gap: space.sm },

  planFlag: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  planFlagText: { fontSize: 11.5, fontWeight: '700', color: colors.lavender },
});
