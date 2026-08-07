import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, space, type } from '../theme';
import { Button, CategoryTag, MetaRow, BulletList, ProgressBar } from '../components/ui';
import { useStore, relativeTime, formatDate } from '../store';
import { FIT_QUESTIONS } from '../data/fitQuestions';
import { fetchJob } from '../api/greenhouse';
import { GREENHOUSE_BOARD_TOKEN } from '../config';

/* ---------- fit check ---------- */

function verdictFor(score) {
  if (score >= 5)
    return {
      label: 'Strong fit',
      tone: colors.sage,
      bg: colors.sageSoft,
      icon: 'checkmark-circle',
      note: 'Timing works and you are most of the way there on materials. This is worth making a plan for today.',
    };
  if (score >= 3)
    return {
      label: 'Worth a shot',
      tone: colors.amber,
      bg: colors.amberSoft,
      icon: 'trending-up',
      note: 'A real contender, but block out time early — the gaps you flagged tend to be what runs the clock out.',
    };
  return {
    label: 'Park this one',
    tone: colors.sky,
    bg: colors.skySoft,
    icon: 'bookmark',
    note: 'Not the right week for this. Save it, and Sidekiq will resurface it if your schedule opens up.',
  };
}

function FitCheck({ opportunity }) {
  const { fitChecks, dispatch } = useStore();
  const saved = fitChecks[opportunity.id];
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    setAnswers({});
  }, [opportunity.id]);

  if (saved) {
    const v = verdictFor(saved.score);
    return (
      <View style={[styles.fitResult, { backgroundColor: v.bg }]}>
        <View style={styles.fitResultHead}>
          <Ionicons name={v.icon} size={18} color={v.tone} />
          <Text style={[styles.fitResultLabel, { color: v.tone }]}>{v.label}</Text>
          <Text style={[styles.fitScore, { color: v.tone }]}>{saved.score}/6</Text>
        </View>
        <ProgressBar ratio={saved.score / 6} color={v.tone} height={6} track="rgba(255,255,255,0.6)" />
        <Text style={styles.fitResultNote}>{v.note}</Text>
        <Pressable
          onPress={() => dispatch({ type: 'clearFitCheck', opportunityId: opportunity.id })}
          hitSlop={8}
        >
          <Text style={[styles.fitRetake, { color: v.tone }]}>Retake fit check</Text>
        </Pressable>
      </View>
    );
  }

  const answered = Object.keys(answers).length;
  const complete = answered === FIT_QUESTIONS.length;

  return (
    <View style={styles.fitBox}>
      <View style={styles.fitHead}>
        <Ionicons name="pulse" size={15} color={colors.coral} />
        <Text style={styles.fitTitle}>Quick fit check</Text>
        <Text style={styles.fitStep}>
          {answered}/{FIT_QUESTIONS.length}
        </Text>
      </View>
      <Text style={styles.fitIntro}>Three questions. Honest answers give a better read.</Text>

      {FIT_QUESTIONS.map((q) => (
        <View key={q.id} style={{ gap: 8 }}>
          <Text style={styles.fitPrompt}>{q.prompt}</Text>
          <View style={styles.fitOptions}>
            {q.options.map((o) => {
              const active = answers[q.id] === o.value;
              return (
                <Pressable
                  key={o.label}
                  onPress={() => setAnswers((a) => ({ ...a, [q.id]: o.value }))}
                  style={({ pressed }) => [
                    styles.fitOption,
                    active && styles.fitOptionActive,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Text style={[styles.fitOptionText, active && styles.fitOptionTextActive]}>
                    {o.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Button
        label={complete ? 'See my fit' : `Answer ${FIT_QUESTIONS.length - answered} more`}
        icon="sparkles"
        variant="primary"
        size="sm"
        disabled={!complete}
        onPress={() =>
          dispatch({
            type: 'saveFitCheck',
            opportunityId: opportunity.id,
            title: opportunity.title,
            result: { answers, score: Object.values(answers).reduce((a, b) => a + b, 0) },
          })
        }
      />
    </View>
  );
}

/* ---------- modal ---------- */

function Section({ title, icon, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={14} color={colors.inkMuted} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function OpportunityModal({ opportunityId, onClose, onOpenPlan }) {
  const { opportunityById, isSaved, dispatch, planFor } = useStore();
  const summary = opportunityId ? opportunityById[opportunityId] : null;

  const [detail, setDetail] = useState(null);
  const [detailStatus, setDetailStatus] = useState('idle');

  useEffect(() => {
    // Only Greenhouse needs a follow-up detail call (for pay_transparency) —
    // USAJOBS search results already include full content and pay ranges.
    if (!opportunityId || !GREENHOUSE_BOARD_TOKEN || summary?.source !== 'greenhouse') return;
    let cancelled = false;
    setDetail(null);
    setDetailStatus('loading');
    fetchJob(GREENHOUSE_BOARD_TOKEN, opportunityId)
      .then((d) => {
        if (!cancelled) {
          setDetail(d);
          setDetailStatus('loaded');
        }
      })
      .catch(() => {
        if (!cancelled) setDetailStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [opportunityId, summary?.source]);

  if (!summary) return null;
  const opportunity = detail ? { ...summary, ...detail } : summary;

  const saved = isSaved(opportunity.id);
  const plan = planFor(opportunity.id);

  const apply = () => {
    if (opportunity.absoluteUrl) Linking.openURL(opportunity.absoluteUrl);
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetTop}>
            <View style={styles.handle} />
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.inkSoft} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
            <CategoryTag category={opportunity.category} />
            <Text style={styles.title}>{opportunity.title}</Text>
            <Text style={styles.org}>{opportunity.org}</Text>

            <View style={styles.metaCard}>
              <MetaRow icon="location-outline" label={opportunity.location} />
              <MetaRow icon="time-outline" label={`Posted ${relativeTime(opportunity.postedAt)}`} />
              {opportunity.closesAt ? (
                <MetaRow icon="flag-outline" label={`Closes ${formatDate(opportunity.closesAt)}`} tint={colors.coral} />
              ) : null}
            </View>

            <Button
              label="Apply on Greenhouse"
              icon="open-outline"
              variant="primary"
              onPress={apply}
              style={{ marginTop: space.md }}
            />

            <FitCheck opportunity={opportunity} />

            {detailStatus === 'loading' ? (
              <View style={styles.detailLoading}>
                <ActivityIndicator color={colors.coral} />
                <Text style={styles.detailLoadingText}>Loading full posting…</Text>
              </View>
            ) : null}

            {opportunity.payRanges?.length ? (
              <Section title="Compensation" icon="cash-outline">
                <BulletList
                  items={opportunity.payRanges.map((r) => `${r.title}: ${r.label}`)}
                  icon="checkmark-circle"
                  tint={colors.sage}
                />
              </Section>
            ) : null}

            {opportunity.contentText ? (
              <Section title="About this role" icon="document-text-outline">
                <Text style={styles.body}>{opportunity.contentText}</Text>
              </Section>
            ) : null}

            <View style={{ height: space.lg }} />
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={saved ? 'Saved' : 'Save'}
              icon={saved ? 'bookmark' : 'bookmark-outline'}
              variant={saved ? 'soft' : 'outline'}
              style={{ flex: 1 }}
              onPress={() => dispatch({ type: 'toggleSave', opportunity })}
            />
            {plan ? (
              <Button
                label="Open plan"
                icon="clipboard-outline"
                variant="lavender"
                style={{ flex: 1.5 }}
                onPress={() => {
                  onClose();
                  onOpenPlan(plan.id);
                }}
              />
            ) : (
              <Button
                label="Create plan"
                icon="add-circle-outline"
                variant="primary"
                style={{ flex: 1.5 }}
                onPress={() => {
                  dispatch({ type: 'createPlan', opportunity });
                  onClose();
                }}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(47, 42, 38, 0.35)', justifyContent: 'flex-end' },
  backdropTap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '94%',
    overflow: 'hidden',
    ...shadow.lift,
  },
  sheetTop: {
    paddingTop: space.md,
    paddingBottom: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: { width: 40, height: 4.5, borderRadius: 3, backgroundColor: colors.border },
  closeBtn: {
    position: 'absolute',
    right: space.lg,
    top: space.md,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.lg },

  title: { ...type.display, fontSize: 22, lineHeight: 28, marginTop: space.md },
  org: { fontSize: 14, fontWeight: '700', color: colors.inkMuted, marginTop: 4 },

  metaCard: {
    marginTop: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: space.md,
    gap: 9,
  },

  detailLoading: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.lg },
  detailLoadingText: { ...type.small },

  fitBox: {
    marginTop: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: space.lg,
    gap: space.md,
  },
  fitHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  fitTitle: { fontSize: 14, fontWeight: '800', color: colors.ink, flex: 1 },
  fitStep: { ...type.small },
  fitIntro: { ...type.body, marginTop: -6 },
  fitPrompt: { fontSize: 13, fontWeight: '700', color: colors.ink },
  fitOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  fitOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cream,
  },
  fitOptionActive: { backgroundColor: colors.coralSoft, borderColor: colors.coral },
  fitOptionText: { fontSize: 12.5, fontWeight: '700', color: colors.inkSoft },
  fitOptionTextActive: { color: colors.coralDeep },

  fitResult: { marginTop: space.lg, borderRadius: radius.xl, padding: space.lg, gap: space.md },
  fitResultHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fitResultLabel: { fontSize: 15, fontWeight: '800', flex: 1 },
  fitScore: { fontSize: 13, fontWeight: '800' },
  fitResultNote: { fontSize: 13, fontWeight: '600', color: colors.ink, lineHeight: 20, opacity: 0.8 },
  fitRetake: { fontSize: 12.5, fontWeight: '800', textDecorationLine: 'underline' },

  section: { marginTop: space.xl, gap: space.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { ...type.tiny, textTransform: 'uppercase', color: colors.inkMuted },
  body: { ...type.body, lineHeight: 22 },

  footer: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.lg,
    paddingTop: space.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
});
