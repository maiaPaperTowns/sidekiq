import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, space } from './src/theme';
import { StoreProvider } from './src/store';
import GradientMeshBackground from './src/components/GradientMeshBackground';
import SplashScreen from './src/components/SplashScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import PlansScreen from './src/screens/PlansScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import OpportunityModal from './src/screens/OpportunityModal';
import ProfileModal from './src/screens/ProfileModal';

const TABS = [
  { key: 'discover', label: 'Discover', icon: 'compass', iconOff: 'compass-outline' },
  { key: 'plans', label: 'My Plans', icon: 'clipboard', iconOff: 'clipboard-outline' },
  { key: 'dashboard', label: 'Dashboard', icon: 'stats-chart', iconOff: 'stats-chart-outline' },
];

function TabBar({ active, onChange }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((t) => {
        const on = active === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.tabIcon, on && styles.tabIconActive]}>
              <Ionicons
                name={on ? t.icon : t.iconOff}
                size={19}
                color={on ? '#FFFFFF' : colors.inkMuted}
              />
            </View>
            <Text style={[styles.tabLabel, on && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AppBody() {
  const [tab, setTab] = useState('discover');
  const [modalId, setModalId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const openPlan = (planId) => {
    setSelectedPlanId(planId);
    setTab('plans');
  };

  return (
    <GradientMeshBackground style={styles.screen}>
      <View style={{ flex: 1 }}>
        {tab === 'discover' ? (
          <DiscoverScreen onOpenOpportunity={setModalId} onOpenProfile={() => setProfileOpen(true)} />
        ) : null}
        {tab === 'plans' ? (
          <PlansScreen
            onOpenOpportunity={setModalId}
            selectedPlanId={selectedPlanId}
            setSelectedPlanId={setSelectedPlanId}
          />
        ) : null}
        {tab === 'dashboard' ? (
          <DashboardScreen onOpenOpportunity={setModalId} onOpenPlan={openPlan} />
        ) : null}
      </View>

      <TabBar active={tab} onChange={setTab} />

      {modalId ? (
        <OpportunityModal
          opportunityId={modalId}
          onClose={() => setModalId(null)}
          onOpenPlan={openPlan}
        />
      ) : null}

      {profileOpen ? <ProfileModal onClose={() => setProfileOpen(false)} /> : null}
    </GradientMeshBackground>
  );
}

// Below this width the app fills the screen edge-to-edge, the same on a
// phone browser tab as in the native app. Above it, content gets centered
// so lines of text and rows of controls don't stretch to an unreadable width.
const TABLET_BREAKPOINT = 700;
// Only a full desktop browser window gets the "phone on a desk" marketing
// frame — a native app on a wide tablet should still just look like itself.
const DESKTOP_BREAKPOINT = 1024;

export default function App() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const sizeClass =
    width < TABLET_BREAKPOINT ? 'phone' : width < DESKTOP_BREAKPOINT ? 'tablet' : 'desktop';
  const showDesktopFrame = isWeb && sizeClass === 'desktop';
  const showTabletColumn = sizeClass !== 'phone' && !showDesktopFrame;
  const [showSplash, setShowSplash] = useState(true);

  return (
    <StoreProvider>
      <StatusBar style="dark" />
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : showDesktopFrame ? (
        <View style={styles.stage}>
          <View style={styles.stageIntro}>
            <LinearGradient
              colors={[colors.meshLavender, colors.coral]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.stageMark}
            />
            <Text style={styles.brand}>
              Sidekiq<Text style={{ color: colors.coral }}>.</Text>
            </Text>
            <Text style={styles.brandSub}>
              Your student opportunity sidekick — find it, plan it, finish it.
            </Text>
          </View>
          <View style={styles.phone}>
            <View style={styles.phoneNotch} />
            <AppBody />
          </View>
        </View>
      ) : showTabletColumn ? (
        <View style={styles.tabletStage}>
          <View style={styles.tabletColumn}>
            <AppBody />
          </View>
        </View>
      ) : (
        <SafeAreaView style={styles.safe}>
          <AppBody />
        </SafeAreaView>
      )}
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.meshLavender },

  stage: {
    flex: 1,
    backgroundColor: '#EDEAF7',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 64,
    padding: 40,
  },
  stageIntro: { maxWidth: 320 },
  stageMark: { width: 44, height: 44, borderRadius: 14, marginBottom: 18 },
  brand: { fontSize: 46, fontWeight: '800', color: colors.ink, letterSpacing: -1.6 },
  brandSub: { fontSize: 16, fontWeight: '600', color: colors.inkSoft, lineHeight: 25, marginTop: 12 },

  phone: {
    width: 414,
    height: 858,
    maxHeight: '96%',
    borderRadius: 44,
    backgroundColor: colors.meshLavender,
    borderWidth: 10,
    borderColor: '#211D2E',
    overflow: 'hidden',
    ...shadow.lift,
  },
  phoneNotch: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: 132,
    height: 24,
    backgroundColor: '#211D2E',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 10,
  },

  // Tablet / mid-width layout: no fake device chrome, just a centered column
  // so text and controls stay a comfortable width on an iPad or a resized
  // browser window.
  tabletStage: {
    flex: 1,
    backgroundColor: '#EDEAF7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  tabletColumn: {
    width: '100%',
    maxWidth: 560,
    height: '100%',
    maxHeight: 900,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.lift,
  },

  tabBar: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: Platform.OS === 'web' ? space.lg : space.xl,
    flexDirection: 'row',
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 9,
    ...shadow.lift,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 3 },
  tabIcon: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  tabIconActive: { backgroundColor: colors.lavender },
  tabLabel: { fontSize: 10.5, fontWeight: '700', color: colors.inkMuted },
  tabLabelActive: { color: colors.lavender },
});
