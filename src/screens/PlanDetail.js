import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type, statusStyle } from '../theme';
import { Card, Button, ProgressBar, StatusTag, CategoryTag, SectionHeader, MetaRow } from '../components/ui';
import { useStore, relativeTime } from '../store';

function TaskRow({ planId, task, onToggle, locked }) {
  const { dispatch } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  const commit = () => {
    const title = draft.trim();
    if (title) dispatch({ type: 'editTask', planId, taskId: task.id, title });
    else setDraft(task.title);
    setEditing(false);
  };

  return (
    <View style={styles.taskRow}>
      <Pressable
        onPress={locked ? undefined : onToggle}
        hitSlop={6}
        style={[styles.checkbox, task.done && styles.checkboxDone]}
      >
        {task.done ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </Pressable>

      {editing ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          autoFocus
          style={styles.taskInput}
          placeholderTextColor={colors.inkMuted}
        />
      ) : (
        <Pressable style={{ flex: 1 }} onPress={locked ? undefined : onToggle}>
          <Text style={[styles.taskText, task.done && styles.taskTextDone]}>{task.title}</Text>
        </Pressable>
      )}

      {!locked ? (
        <View style={styles.taskActions}>
          <Pressable onPress={() => (editing ? commit() : setEditing(true))} hitSlop={8}>
            <Ionicons
              name={editing ? 'checkmark-circle-outline' : 'create-outline'}
              size={17}
              color={editing ? colors.sage : colors.inkMuted}
            />
          </Pressable>
          <Pressable onPress={() => dispatch({ type: 'deleteTask', planId, taskId: task.id })} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={colors.inkMuted} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function PlanDetail({ plan, onBack, onOpenOpportunity }) {
  const { dispatch } = useStore();
  const [newTask, setNewTask] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const opp = plan.opportunity;
  const { done, total, ratio } = plan.progress;
  const tone = statusStyle[plan.status];

  const addTask = () => {
    const title = newTask.trim();
    if (!title) return;
    dispatch({ type: 'addTask', planId: plan.id, title });
    setNewTask('');
  };

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} style={styles.backRow} hitSlop={8}>
        <Ionicons name="chevron-back" size={18} color={colors.coral} />
        <Text style={styles.backText}>All plans</Text>
      </Pressable>

      <Card style={{ gap: space.md }}>
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <CategoryTag category={opp.category} style={{ marginBottom: 8 }} />
            <Text style={styles.title}>{opp.title}</Text>
            <Text style={styles.org}>{opp.org}</Text>
          </View>
          <StatusTag status={plan.status} />
        </View>

        <View style={{ gap: 7 }}>
          <MetaRow icon="location-outline" label={opp.location} />
          <MetaRow icon="time-outline" label={`Posted ${relativeTime(opp.postedAt)}`} />
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>Application progress</Text>
            <Text style={[styles.progressPct, { color: tone.fg }]}>
              {done} of {total}
            </Text>
          </View>
          <ProgressBar ratio={ratio} color={tone.fg} height={9} />
        </View>

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button
            label="View listing"
            icon="document-text-outline"
            variant="outline"
            size="sm"
            style={{ flex: 1 }}
            onPress={() => onOpenOpportunity(opp.id)}
          />
          <Button
            label="Apply on Greenhouse"
            icon="open-outline"
            variant="lavender"
            size="sm"
            style={{ flex: 1.3 }}
            onPress={() => opp.absoluteUrl && Linking.openURL(opp.absoluteUrl)}
          />
        </View>
        {plan.submitted ? (
          <Button
            label="Reopen plan"
            icon="refresh"
            variant="soft"
            size="sm"
            onPress={() => dispatch({ type: 'reopenPlan', planId: plan.id })}
          />
        ) : (
          <Button
            label="Mark as applied"
            icon="checkmark-circle-outline"
            variant="primary"
            size="sm"
            onPress={() => dispatch({ type: 'submitPlan', planId: plan.id, title: opp.title })}
          />
        )}
      </Card>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title={`Tasks (${done}/${total})`} />
        <Card style={{ gap: 2, paddingVertical: space.sm }}>
          {plan.tasks.length === 0 ? (
            <Text style={styles.noTasks}>No tasks yet. Add the first step below.</Text>
          ) : (
            plan.tasks.map((t) => (
              <TaskRow
                key={t.id}
                planId={plan.id}
                task={t}
                locked={plan.submitted}
                onToggle={() => dispatch({ type: 'toggleTask', planId: plan.id, taskId: t.id })}
              />
            ))
          )}
        </Card>

        {!plan.submitted ? (
          <View style={styles.addRow}>
            <View style={styles.addInputWrap}>
              <Ionicons name="add" size={17} color={colors.coral} />
              <TextInput
                value={newTask}
                onChangeText={setNewTask}
                onSubmitEditing={addTask}
                placeholder="Add a task…"
                placeholderTextColor={colors.inkMuted}
                style={styles.addInput}
                returnKeyType="done"
              />
            </View>
            <Button label="Add" variant="primary" size="sm" onPress={addTask} disabled={!newTask.trim()} />
          </View>
        ) : (
          <View style={styles.submittedNote}>
            <Ionicons name="checkmark-circle" size={15} color={colors.sky} />
            <Text style={styles.submittedText}>
              Marked as applied. Reopen the plan if you need to make changes.
            </Text>
          </View>
        )}
      </View>

      <View style={{ marginTop: space.xl }}>
        {confirmDelete ? (
          <Card style={{ gap: space.md, borderColor: colors.coralSoft }}>
            <Text style={styles.confirmText}>
              Delete this plan? Your tasks for {opp.title} will be removed.
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button
                label="Keep it"
                variant="outline"
                size="sm"
                style={{ flex: 1 }}
                onPress={() => setConfirmDelete(false)}
              />
              <Button
                label="Delete plan"
                icon="trash-outline"
                variant="danger"
                size="sm"
                style={{ flex: 1 }}
                onPress={() => {
                  dispatch({ type: 'deletePlan', planId: plan.id, title: opp.title });
                  onBack();
                }}
              />
            </View>
          </Card>
        ) : (
          <Button
            label="Delete plan"
            icon="trash-outline"
            variant="ghost"
            size="sm"
            onPress={() => setConfirmDelete(true)}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: space.lg, paddingBottom: 130 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: space.md },
  backText: { fontSize: 14, fontWeight: '800', color: colors.coral },

  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  title: { ...type.title, fontSize: 18, lineHeight: 23, marginBottom: 3 },
  org: { fontSize: 13, fontWeight: '700', color: colors.inkMuted },

  progressBlock: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: space.md,
    gap: 9,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12.5, fontWeight: '700', color: colors.inkSoft },
  progressPct: { fontSize: 12.5, fontWeight: '800' },

  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 11,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.6,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxDone: { backgroundColor: colors.sage, borderColor: colors.sage },
  taskText: { fontSize: 14, fontWeight: '600', color: colors.ink, lineHeight: 20 },
  taskTextDone: { color: colors.inkMuted, textDecorationLine: 'line-through', fontWeight: '500' },
  taskInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.coral,
    paddingVertical: 2,
    outlineStyle: 'none',
  },
  taskActions: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  noTasks: { ...type.body, textAlign: 'center', paddingVertical: space.lg },

  addRow: { flexDirection: 'row', gap: space.sm, marginTop: space.md, alignItems: 'center' },
  addInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addInput: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink, outlineStyle: 'none' },

  submittedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: space.md,
    paddingHorizontal: space.md,
  },
  submittedText: { fontSize: 12.5, fontWeight: '600', color: colors.inkSoft, flex: 1 },

  confirmText: { ...type.body, color: colors.ink, fontWeight: '600' },
});
