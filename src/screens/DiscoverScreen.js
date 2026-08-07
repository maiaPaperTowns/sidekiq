import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, FlatList, StyleSheet, Pressable, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space, type } from '../theme';
import { FilterChip, EmptyState, Card } from '../components/ui';
import OpportunityCard from '../components/OpportunityCard';
import { useStore } from '../store';

const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'az', label: 'A–Z' },
];

export default function DiscoverScreen({ onOpenOpportunity, onOpenProfile }) {
  const { opportunities, savedIds, isSaved, jobsStatus, jobsError, refreshJobs, profile } = useStore();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState('newest');

  const toggleCategory = (c) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const counts = useMemo(() => {
    const map = {};
    opportunities.forEach((o) => {
      map[o.category] = (map[o.category] || 0) + 1;
    });
    return map;
  }, [opportunities]);

  const allCategories = useMemo(
    () => Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b)),
    [counts]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = opportunities.filter((o) => {
      if (categories.length && !categories.includes(o.category)) return false;
      if (savedOnly && !isSaved(o.id)) return false;
      if (!q) return true;
      const haystack = [o.title, o.org, o.category, o.location].join(' ').toLowerCase();
      return haystack.includes(q);
    });

    list = [...list];
    if (sort === 'newest') list.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [opportunities, query, categories, savedOnly, sort, savedIds]);

  const hasFilters = query || categories.length || savedOnly;

  const postedThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    return opportunities.filter((o) => o.postedAt && new Date(o.postedAt).getTime() >= weekAgo).length;
  }, [opportunities]);

  return (
    <FlatList
      data={results}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <OpportunityCard opportunity={item} onOpen={() => onOpenOpportunity(item.id)} />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.greetRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Discover</Text>
              <Text style={type.display}>Hey {profile.name} 👋</Text>
              <Text style={styles.sub}>
                {jobsStatus === 'loaded'
                  ? `${postedThisWeek} ${postedThisWeek === 1 ? 'role posted' : 'roles posted'} this week.`
                  : ' '}
              </Text>
            </View>
            <Pressable onPress={onOpenProfile} hitSlop={6}>
              {profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={[colors.lavender, colors.coral]}
                  start={{ x: 0.1, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {(profile.name || '?').trim().charAt(0).toUpperCase() || '?'}
                  </Text>
                </LinearGradient>
              )}
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.search}>
              <Ionicons name="search" size={17} color={colors.inkMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search roles, orgs, skills…"
                placeholderTextColor={colors.inkMuted}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={17} color={colors.inkMuted} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {allCategories.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <FilterChip
                label="Saved"
                active={savedOnly}
                count={savedIds.length}
                onPress={() => setSavedOnly((s) => !s)}
              />
              {allCategories.map((c) => (
                <FilterChip
                  key={c}
                  label={c}
                  count={counts[c]}
                  active={categories.includes(c)}
                  onPress={() => toggleCategory(c)}
                />
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.resultBar}>
            <Text style={styles.resultCount}>
              {results.length} {results.length === 1 ? 'opportunity' : 'opportunities'}
            </Text>
            <View style={styles.sortRow}>
              {SORTS.map((s) => (
                <Pressable key={s.key} onPress={() => setSort(s.key)} hitSlop={6}>
                  <Text style={[styles.sortText, sort === s.key && styles.sortActive]}>{s.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {hasFilters ? (
            <Pressable
              onPress={() => {
                setQuery('');
                setCategories([]);
                setSavedOnly(false);
              }}
              style={styles.clearRow}
            >
              <Ionicons name="refresh" size={13} color={colors.coral} />
              <Text style={styles.clearText}>Clear filters</Text>
            </Pressable>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <Card style={{ marginTop: space.sm }}>
          {jobsStatus === 'loading' ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.coral} />
              <Text style={styles.loadingText}>Loading open roles…</Text>
            </View>
          ) : jobsStatus === 'error' ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Couldn't load jobs"
              body={jobsError}
              actionLabel="Retry"
              onAction={refreshJobs}
            />
          ) : (
            <EmptyState
              icon="telescope-outline"
              title="Nothing matches yet"
              body="Try a broader search, or clear a filter or two."
            />
          )}
        </Card>
      }
      ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingBottom: 120 },
  header: { marginBottom: space.lg, gap: space.lg },

  greetRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  eyebrow: { ...type.tiny, textTransform: 'uppercase', marginBottom: 5 },
  sub: { ...type.body, marginTop: 6, maxWidth: 300 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },

  searchRow: { flexDirection: 'row', gap: space.sm },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    outlineStyle: 'none',
  },

  chipRow: { gap: space.sm, paddingRight: space.lg },

  resultBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount: { ...type.small, color: colors.inkSoft },
  sortRow: { flexDirection: 'row', gap: space.md },
  sortText: { fontSize: 12.5, fontWeight: '700', color: colors.inkMuted },
  sortActive: { color: colors.coral, textDecorationLine: 'underline' },

  clearRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -space.sm },
  clearText: { fontSize: 12.5, fontWeight: '700', color: colors.coral },

  loading: { alignItems: 'center', paddingVertical: space.xl, gap: space.md },
  loadingText: { ...type.body },
});
