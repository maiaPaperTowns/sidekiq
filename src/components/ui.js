import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, space, type, categoryStyleFor, statusStyle } from '../theme';

/* ---------- surfaces ---------- */

export function Card({ children, style, onPress, lifted }) {
  const body = (
    <View style={[styles.card, lifted ? shadow.lift : shadow.soft, style]}>{children}</View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {body}
    </Pressable>
  );
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={type.section}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------- pills & badges ---------- */

export function Tag({ label, fg, bg, icon, style }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }, style]}>
      {icon ? <Ionicons name={icon} size={11} color={fg} style={{ marginRight: 4 }} /> : null}
      <Text style={[styles.tagText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function CategoryTag({ category, style }) {
  const s = categoryStyleFor(category);
  return <Tag label={category} fg={s.fg} bg={s.bg} style={style} />;
}

export function StatusTag({ status, style }) {
  const s = statusStyle[status] || { fg: colors.inkSoft, bg: colors.creamDeep };
  const icon = status === 'Completed' ? 'checkmark-circle' : status === 'Needs Attention' ? 'time' : 'leaf';
  return <Tag label={status} fg={s.fg} bg={s.bg} icon={icon} style={style} />;
}

export function MetaRow({ icon, label, tint }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={13} color={tint || colors.inkMuted} />
      <Text style={styles.metaText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/* ---------- progress ---------- */

export function ProgressBar({ ratio, color = colors.coral, height = 8, track = colors.creamDeep }) {
  const pct = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
  return (
    <View style={[styles.track, { height, borderRadius: height, backgroundColor: track }]}>
      <View style={{ width: pct, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

/* ---------- buttons ---------- */

export function Button({ label, onPress, icon, variant = 'primary', size = 'md', style, disabled }) {
  const v = buttonVariants[variant];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSm,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && !disabled && styles.pressed,
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={size === 'sm' ? 13 : 15} color={v.fg} style={{ marginRight: 6 }} />
      ) : null}
      <Text style={[styles.buttonText, { color: v.fg }, size === 'sm' && { fontSize: 13 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const buttonVariants = {
  primary: { bg: colors.coral, fg: '#FFFFFF', border: colors.coral },
  soft: { bg: colors.coralSoft, fg: colors.coralDeep, border: colors.coralSoft },
  outline: { bg: colors.surface, fg: colors.ink, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.inkSoft, border: 'transparent' },
  lavender: { bg: colors.lavenderSoft, fg: colors.lavender, border: colors.lavenderSoft },
  sage: { bg: colors.sageSoft, fg: colors.sage, border: colors.sageSoft },
  danger: { bg: colors.surface, fg: colors.coralDeep, border: colors.coralSoft },
};

export function IconButton({ icon, onPress, active, activeColor = colors.coral, size = 18, style }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        active && { backgroundColor: colors.coralSoft, borderColor: colors.coralSoft },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={active ? activeColor : colors.inkMuted} />
    </Pressable>
  );
}

export function FilterChip({ label, active, onPress, count }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      {count != null ? (
        <Text style={[styles.chipCount, active && styles.chipCountActive]}>{count}</Text>
      ) : null}
    </Pressable>
  );
}

/* ---------- misc ---------- */

export function EmptyState({ icon, title, body, actionLabel, onAction }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={24} color={colors.coral} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {actionLabel ? (
        <Button label={actionLabel} onPress={onAction} variant="soft" size="sm" style={{ marginTop: space.md }} />
      ) : null}
    </View>
  );
}

export function BulletList({ items, icon = 'ellipse', tint = colors.coral }) {
  return (
    <View style={{ gap: 9 }}>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <Ionicons name={icon} size={icon === 'ellipse' ? 6 : 14} color={tint} style={styles.bulletIcon} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.2,
    borderColor: colors.border,
    padding: space.lg,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  sectionAction: { fontSize: 13, fontWeight: '700', color: colors.coral },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  tagText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.1 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  metaText: { fontSize: 12.5, fontWeight: '600', color: colors.inkSoft, flexShrink: 1 },

  track: { width: '100%', overflow: 'hidden' },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  buttonSm: { paddingVertical: 8, paddingHorizontal: 13 },
  buttonText: { fontSize: 14, fontWeight: '800', letterSpacing: -0.1 },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSolid,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.coral, borderColor: colors.coral },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.inkSoft },
  chipTextActive: { color: '#FFFFFF' },
  chipCount: { fontSize: 11, fontWeight: '800', color: colors.inkMuted },
  chipCountActive: { color: '#FFFFFF', opacity: 0.8 },

  empty: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.xl },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  emptyTitle: { ...type.title, fontSize: 16, marginBottom: 6 },
  emptyBody: { ...type.body, textAlign: 'center', maxWidth: 280 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  bulletIcon: { marginTop: 6 },
  bulletText: { ...type.body, flex: 1, color: colors.inkSoft },
});
