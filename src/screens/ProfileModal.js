import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Image, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, shadow, space, type } from '../theme';
import { Button } from '../components/ui';
import { useStore } from '../store';
import { isSupabaseConfigured } from '../lib/supabase';
import AuthModal from './AuthModal';

export default function ProfileModal({ onClose }) {
  const { profile, updateProfile, stats, auth, signOut } = useStore();
  const [name, setName] = useState(profile.name);
  const [authOpen, setAuthOpen] = useState(false);

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      updateProfile({ avatarUri: result.assets[0].uri });
    }
  };

  const removePhoto = () => updateProfile({ avatarUri: null });

  const commitName = () => {
    const trimmed = name.trim();
    updateProfile({ name: trimmed || profile.name });
    if (!trimmed) setName(profile.name);
  };

  const initial = (profile.name || '?').trim().charAt(0).toUpperCase() || '?';

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

          <View style={styles.body}>
            <Text style={type.display}>Profile</Text>

            <View style={styles.avatarBlock}>
              <Pressable onPress={pickImage} style={styles.avatarTap}>
                {profile.avatarUri ? (
                  <Image source={{ uri: profile.avatarUri }} style={styles.avatarImg} />
                ) : (
                  <LinearGradient
                    colors={[colors.lavender, colors.coral]}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarImg}
                  >
                    <Text style={styles.avatarLetter}>{initial}</Text>
                  </LinearGradient>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={13} color="#FFFFFF" />
                </View>
              </Pressable>

              <View style={styles.photoActions}>
                <Pressable onPress={pickImage} hitSlop={8}>
                  <Text style={styles.changePhoto}>Change photo</Text>
                </Pressable>
                {profile.avatarUri ? (
                  <Pressable onPress={removePhoto} hitSlop={8}>
                    <Text style={styles.removePhoto}>Remove photo</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nickname</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                onBlur={commitName}
                onSubmitEditing={commitName}
                placeholder="Your name"
                placeholderTextColor={colors.inkMuted}
                style={styles.input}
                returnKeyType="done"
              />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{stats.saved}</Text>
                <Text style={styles.statLabel}>Saved</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{stats.activePlans}</Text>
                <Text style={styles.statLabel}>Active plans</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{stats.submitted}</Text>
                <Text style={styles.statLabel}>Applied</Text>
              </View>
            </View>

            {isSupabaseConfigured ? (
              <View style={styles.accountBlock}>
                <Text style={styles.label}>Account</Text>
                {auth.session ? (
                  <View style={styles.accountRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accountEmail} numberOfLines={1}>
                        {auth.session.user.email}
                      </Text>
                      <Text style={styles.accountHint}>Synced to the cloud</Text>
                    </View>
                    <Button label="Sign out" variant="outline" size="sm" onPress={signOut} />
                  </View>
                ) : (
                  <Button
                    label="Sign in to sync"
                    icon="log-in-outline"
                    variant="outline"
                    onPress={() => setAuthOpen(true)}
                  />
                )}
              </View>
            ) : null}

            <Button
              label="Done"
              variant="primary"
              onPress={() => {
                commitName();
                onClose();
              }}
              style={{ marginTop: space.md }}
            />
          </View>
        </View>
      </View>

      {authOpen ? <AuthModal onClose={() => setAuthOpen(false)} /> : null}
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
  body: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xl, gap: space.lg },

  avatarBlock: { alignItems: 'center', gap: 9, marginTop: space.sm },
  avatarTap: { width: 88, height: 88 },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.coral,
    borderWidth: 2,
    borderColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: { flexDirection: 'row', gap: space.lg },
  changePhoto: { fontSize: 13, fontWeight: '800', color: colors.coral },
  removePhoto: { fontSize: 13, fontWeight: '800', color: colors.inkMuted },

  field: { gap: 7 },
  label: { ...type.tiny, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    outlineStyle: 'none',
  },

  accountBlock: { gap: 9 },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: space.md,
    paddingVertical: 11,
  },
  accountEmail: { fontSize: 13.5, fontWeight: '800', color: colors.ink },
  accountHint: { fontSize: 11.5, fontWeight: '600', color: colors.inkMuted, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: space.md },
  statTile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: space.md,
    gap: 3,
  },
  statValue: { fontSize: 19, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: 11, fontWeight: '700', color: colors.inkMuted },
});
