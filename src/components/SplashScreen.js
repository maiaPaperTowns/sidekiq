import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme';
import GradientMeshBackground from './GradientMeshBackground';

function Dot({ delay }) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounce, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(360),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay]);

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  return <Animated.View style={[styles.dot, { transform: [{ translateY }] }]} />;
}

export default function SplashScreen({ onFinish }) {
  const markScale = useRef(new Animated.Value(0.3)).current;
  const markOpacity = useRef(new Animated.Value(0)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordTranslate = useRef(new Animated.Value(12)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(markScale, { toValue: 1, friction: 4.5, tension: 60, useNativeDriver: true }),
        Animated.timing(markOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(wordTranslate, { toValue: 0, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(screenOpacity, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start(() => onFinish && onFinish());
  }, []);

  return (
    <Animated.View style={[styles.fill, { opacity: screenOpacity }]}>
      <GradientMeshBackground style={styles.fill}>
        <View style={styles.center}>
          <Animated.View style={{ transform: [{ scale: markScale }], opacity: markOpacity }}>
            <LinearGradient
              colors={[colors.meshLavender, colors.coral]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mark}
            />
          </Animated.View>

          <Animated.Text
            style={[styles.brand, { opacity: wordOpacity, transform: [{ translateY: wordTranslate }] }]}
          >
            Sidekiq<Text style={{ color: colors.coral }}>.</Text>
          </Animated.Text>

          <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
            Find it, plan it, finish it.
          </Animated.Text>

          <View style={styles.dotsRow}>
            <Dot delay={0} />
            <Dot delay={120} />
            <Dot delay={240} />
          </View>
        </View>
      </GradientMeshBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 64, height: 64, borderRadius: radius.lg, ...shadow.lift },
  brand: { fontSize: 34, fontWeight: '800', color: colors.ink, letterSpacing: -1.1, marginTop: 20 },
  tagline: { fontSize: 14, fontWeight: '600', color: colors.inkSoft, marginTop: 8 },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 26 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.coral },
});
