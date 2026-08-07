import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

// Soft blurred gradient-mesh backdrop: a diagonal base gradient plus a few
// oversized, heavily blurred color blobs for the glassmorphic look. Sits
// behind every screen; cards on top use a translucent "glass" fill so this
// shows through softly.
export default function GradientMeshBackground({ children, style }) {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={[colors.meshBlue, colors.meshLavender, colors.meshPeach, colors.meshGold]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[styles.blob, styles.blobA]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobB]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobC]} />
      <View style={styles.contentLayer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.meshLavender, overflow: 'hidden' },
  contentLayer: { flex: 1 },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.5,
    // eslint-disable-next-line react-native/no-unused-styles
    filter: 'blur(64px)',
  },
  blobA: { width: 300, height: 300, backgroundColor: colors.meshPeach, top: -70, right: -70 },
  blobB: { width: 260, height: 260, backgroundColor: colors.lavender, bottom: 40, left: -90 },
  blobC: { width: 220, height: 220, backgroundColor: colors.sky, bottom: -90, right: 20 },
});
