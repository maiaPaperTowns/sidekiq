import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, space, type } from '../theme';
import { Button } from '../components/ui';
import { useStore } from '../store';

export default function AuthModal({ onClose }) {
  const { signIn, signUp } = useStore();
  const [mode, setMode] = useState('signIn'); // signIn | signUp
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | sent
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter an email and password.');
      return;
    }
    setStatus('loading');
    try {
      if (mode === 'signUp') {
        await signUp(email.trim(), password);
        setStatus('sent');
      } else {
        await signIn(email.trim(), password);
        onClose();
      }
    } catch (e) {
      setStatus('idle');
      setError(e.message || 'Something went wrong.');
    }
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

          <View style={styles.body}>
            <Text style={type.display}>{mode === 'signUp' ? 'Create account' : 'Sign in'}</Text>
            <Text style={styles.sub}>Sync your profile across devices.</Text>

            {status === 'sent' ? (
              <View style={styles.sentBox}>
                <Ionicons name="mail-outline" size={22} color={colors.sage} />
                <Text style={styles.sentTitle}>Check your email</Text>
                <Text style={styles.sentBody}>
                  We sent a confirmation link to {email.trim()}. Confirm it, then sign in.
                </Text>
                <Button
                  label="Back to sign in"
                  variant="outline"
                  onPress={() => {
                    setMode('signIn');
                    setStatus('idle');
                  }}
                  style={{ marginTop: space.md }}
                />
              </View>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.inkMuted}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor={colors.inkMuted}
                    style={styles.input}
                    secureTextEntry
                  />
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                {status === 'loading' ? (
                  <ActivityIndicator color={colors.coral} style={{ marginTop: space.md }} />
                ) : (
                  <Button
                    label={mode === 'signUp' ? 'Create account' : 'Sign in'}
                    variant="primary"
                    onPress={submit}
                    style={{ marginTop: space.sm }}
                  />
                )}

                <Pressable
                  onPress={() => {
                    setMode((m) => (m === 'signUp' ? 'signIn' : 'signUp'));
                    setError(null);
                  }}
                  hitSlop={8}
                  style={{ alignItems: 'center', marginTop: space.md }}
                >
                  <Text style={styles.switchText}>
                    {mode === 'signUp' ? 'Already have an account? Sign in' : "New here? Create an account"}
                  </Text>
                </Pressable>
              </>
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
  sheetTop: { paddingTop: space.md, paddingBottom: space.sm, alignItems: 'center', justifyContent: 'center' },
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
  body: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xl, gap: space.md },
  sub: { ...type.body, marginTop: -6 },

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
  error: { fontSize: 12.5, fontWeight: '700', color: colors.coralDeep },
  switchText: { fontSize: 13, fontWeight: '700', color: colors.coral },

  sentBox: { alignItems: 'center', gap: 8, paddingVertical: space.lg },
  sentTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  sentBody: { ...type.body, textAlign: 'center' },
});
