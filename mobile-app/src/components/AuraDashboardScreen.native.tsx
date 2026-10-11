import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * AuraDashboardScreen.native.tsx
 * Production React Native Component adhering to "Obsidian Glass" (Sauce Labs Theme)
 * 
 * SAFE AREA & VIEWPORT FIXES IMPLEMENTED:
 * 1. Top Status Bar Clearance:
 *    - Dynamically queries `insets.top` from `useSafeAreaInsets()`.
 *    - Applies `paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 28 : 20) + 12`.
 *    - Guarantees the system clock, Wi-Fi, battery icons, and camera cutout / notch
 *      never clip the "COMMAND CONSOLE" category tracker or "AIoT Assistive Suite" title.
 * 
 * 2. Bottom Native Gesture Bar Clearance:
 *    - Dynamically queries `insets.bottom`.
 *    - Elevates floating bottom nav pill container with:
 *      `paddingBottom: Math.max(insets.bottom, 18) + 8`.
 *    - Clears native Android pill gesture indicator and iPhone Home Indicator.
 * 
 * 3. ScrollView Content Ergonomics:
 *    - Applies dynamic `contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 115 }}`.
 *    - Ensures the last cards and simulator controls never get hidden behind floating bars.
 */

interface DeviceState {
  id: string;
  name: string;
  type: 'GLASSES' | 'CANE' | 'BAND';
  battery: number;
  status: 'ONLINE' | 'STANDBY';
  telemetry: string;
}

export const AuraDashboardScreen: React.FC = () => {
  // Safe Area insets supplied by react-native-safe-area-context
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'console' | 'spatial' | 'security' | 'config'>('console');
  const [isConnected, setIsConnected] = useState(true);

  // Fallback safe insets to guard against edge-to-edge Android zero-insets
  const safeTopPadding = Math.max(insets.top, Platform.OS === 'android' ? 28 : 20) + 12;
  const safeBottomPadding = Math.max(insets.bottom, 18) + 8;
  const scrollBottomClearance = Math.max(insets.bottom, 20) + 115;

  const devices: DeviceState[] = [
    {
      id: 'dev_1',
      name: 'Smart Glasses',
      type: 'GLASSES',
      battery: 92,
      status: 'ONLINE',
      telemetry: 'FOV: 110° • 60 FPS',
    },
    {
      id: 'dev_2',
      name: 'Smart Cane',
      type: 'CANE',
      battery: 88,
      status: 'ONLINE',
      telemetry: 'Obstacle: 1.4m Ahead',
    },
    {
      id: 'dev_3',
      name: 'Smart Band',
      type: 'BAND',
      battery: 79,
      status: 'ONLINE',
      telemetry: 'HR: 72 bpm • SpO2: 98%',
    },
  ];

  return (
    <View style={styles.rootContainer}>
      {/* 1. Translucent System Status Bar */}
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* 2. Fixed Header with Safe Area Top Inset */}
      {/* SAFE AREA FIX: Dynamic top padding clearance below notch & clock */}
      <View
        style={[
          styles.headerWrapper,
          {
            paddingTop: safeTopPadding,
            paddingLeft: Math.max(insets.left, 20),
            paddingRight: Math.max(insets.right, 20),
          },
        ]}
      >
        <View style={styles.headerLeftCluster}>
          <View style={styles.brandIconBox}>
            <Text style={styles.brandZapGlyph}>⚡</Text>
          </View>
          <View>
            <Text style={styles.categoryEyebrow}>COMMAND CONSOLE</Text>
            <Text style={styles.mainScreenTitle}>AIoT Assistive Suite</Text>
          </View>
        </View>

        <View style={styles.headerRightCluster}>
          {/* Bridge Status Pill */}
          <TouchableOpacity style={styles.bridgeStatusPill} activeOpacity={0.8}>
            <View
              style={[
                styles.livePulseDot,
                { backgroundColor: isConnected ? '#3DDC91' : '#828786' },
              ]}
            />
            <Text style={styles.bridgeStatusText}>
              {isConnected ? 'Bridge Active' : 'Offline'}
            </Text>
          </TouchableOpacity>

          {/* SOS Pill Button */}
          <TouchableOpacity style={styles.sosButtonPill} activeOpacity={0.8}>
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Scrollable Content Area */}
      {/* SAFE AREA FIX: Generous bottom clearance preventing card cut-off */}
      <ScrollView
        style={styles.scrollViewport}
        contentContainerStyle={[
          styles.scrollContentContainer,
          {
            paddingBottom: scrollBottomClearance,
            paddingLeft: Math.max(insets.left, 20),
            paddingRight: Math.max(insets.right, 20),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Floating Telemetry Metric Row */}
        <View style={styles.statsRowGrid}>
          <View style={styles.statColumn}>
            <Text style={styles.statNumericValue}>50 Hz</Text>
            <Text style={styles.statMicroLabel}>TELEMETRY STREAM</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statNumericValue}>256-BIT</Text>
            <Text style={styles.statMicroLabel}>AES-GCM CIPHER</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statNumericValue}>3.0s</Text>
            <Text style={styles.statMicroLabel}>FUSION WINDOW</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statNumericValue}>&lt; 2.1ms</Text>
            <Text style={styles.statMicroLabel}>BROKER LATENCY</Text>
          </View>
        </View>

        {/* Section Header: Connected Devices */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Connected Wearables</Text>
          <Text style={styles.sectionHeaderBadge}>3 of 3 Active</Text>
        </View>

        {/* 3-Device Status Grid (Obsidian Deep Abyss #0E1A19, 20px - 60px radii) */}
        <View style={styles.devicesGrid}>
          {devices.map((device) => (
            <View key={device.id} style={styles.deviceCard}>
              <View style={styles.deviceCardTop}>
                <View style={styles.deviceTypePill}>
                  <Text style={styles.deviceTypePillText}>{device.type}</Text>
                </View>
                <View style={styles.batteryPill}>
                  <Text style={styles.batteryPillText}>{device.battery}%</Text>
                </View>
              </View>

              <Text style={styles.deviceCardName}>{device.name}</Text>
              <Text style={styles.deviceCardTelemetry}>{device.telemetry}</Text>

              <View style={styles.deviceStatusRow}>
                <View style={styles.activeSignalDot} />
                <Text style={styles.activeSignalLabel}>Encrypted Link Active</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section Header: Clinical Vitals */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Real-time Biometrics</Text>
          <Text style={styles.sectionHeaderBadge}>Dual-Sensor Sync</Text>
        </View>

        {/* Signature Mint Frost Light Content Card (#EDF7F5, 60px corner radius) */}
        <View style={styles.mintFrostVitalsCard}>
          <View style={styles.vitalsTopHeader}>
            <View>
              <Text style={styles.vitalsEyebrow}>CLINICAL TELEMETRY</Text>
              <Text style={styles.vitalsMainTitle}>Cardiovascular & Oxygen Matrix</Text>
            </View>
            <View style={styles.vitalsStatusBadge}>
              <Text style={styles.vitalsStatusBadgeText}>Normal Range</Text>
            </View>
          </View>

          <View style={styles.vitalsMetricsGrid}>
            <View style={styles.vitalsMetricBox}>
              <Text style={styles.vitalsMetricLabel}>PULSE RATE</Text>
              <View style={styles.vitalsValueUnitRow}>
                <Text style={styles.vitalsMetricNumber}>72</Text>
                <Text style={styles.vitalsMetricUnit}>BPM</Text>
              </View>
              <Text style={styles.vitalsSubCaption}>Baseline: 60-100 BPM</Text>
            </View>

            <View style={styles.vitalsMetricBox}>
              <Text style={styles.vitalsMetricLabel}>BLOOD OXYGEN</Text>
              <View style={styles.vitalsValueUnitRow}>
                <Text style={styles.vitalsMetricNumber}>98</Text>
                <Text style={styles.vitalsMetricUnit}>%</Text>
              </View>
              <Text style={styles.vitalsSubCaption}>SpO2 Optimal (&gt;95%)</Text>
            </View>
          </View>

          {/* Fall Fusion Status Callout */}
          <View style={styles.fallFusionCallout}>
            <Text style={styles.fallFusionTitle}>Algorithm 2 Fall Detection: ARMED</Text>
            <Text style={styles.fallFusionDescription}>
              Cross-device multi-sensor fusion active across Smart Cane (IMU) and Smart Band (PPG + Barometer).
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 4. Floating Aura AI Voice Assistant Action Button (Neon Pulse #3DDC91) */}
      {/* SAFE AREA FIX: Dynamic bottom elevation above navigation pill track */}
      <TouchableOpacity
        style={[
          styles.floatingMicButton,
          {
            bottom: safeBottomPadding + 68,
            right: Math.max(insets.right, 20),
          },
        ]}
        activeOpacity={0.85}
      >
        <Text style={styles.floatingMicGlyph}>🎙</Text>
      </TouchableOpacity>

      {/* 5. Floating Bottom Navigation Bar */}
      {/* SAFE AREA FIX: Elevated above device native gesture navigation bar */}
      <View
        style={[
          styles.bottomNavContainer,
          {
            paddingBottom: safeBottomPadding,
            paddingLeft: Math.max(insets.left, 16),
            paddingRight: Math.max(insets.right, 16),
          },
        ]}
      >
        <View style={styles.navPillTrack}>
          <TouchableOpacity
            style={[
              styles.navTabButton,
              activeTab === 'console' && styles.navTabButtonActive,
            ]}
            onPress={() => setActiveTab('console')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navTabLabel,
                activeTab === 'console' && styles.navTabLabelActive,
              ]}
            >
              Console
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navTabButton,
              activeTab === 'spatial' && styles.navTabButtonActive,
            ]}
            onPress={() => setActiveTab('spatial')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navTabLabel,
                activeTab === 'spatial' && styles.navTabLabelActive,
              ]}
            >
              3D Radar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navTabButton,
              activeTab === 'security' && styles.navTabButtonActive,
            ]}
            onPress={() => setActiveTab('security')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navTabLabel,
                activeTab === 'security' && styles.navTabLabelActive,
              ]}
            >
              AES Link
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navTabButton,
              activeTab === 'config' && styles.navTabButtonActive,
            ]}
            onPress={() => setActiveTab('config')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navTabLabel,
                activeTab === 'config' && styles.navTabLabelActive,
              ]}
            >
              Config
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#132322', // Obsidian Canvas
  },

  /* Fixed Header with Status Bar Inset */
  headerWrapper: {
    backgroundColor: '#132322',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  headerLeftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0E1A19',
    borderWidth: 1,
    borderColor: 'rgba(61, 220, 145, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandZapGlyph: {
    fontSize: 16,
    color: '#3DDC91',
  },
  categoryEyebrow: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#3DDC91', // Neon Pulse
    textTransform: 'uppercase',
  },
  mainScreenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  headerRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bridgeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0E1A19',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 56,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  bridgeStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3DDC91',
  },
  sosButtonPill: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FFCD48',
    borderRadius: 56,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  sosButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFCD48',
  },

  /* Scrollable Body Viewport */
  scrollViewport: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: 18,
  },

  /* 4-Column Stat Bar */
  statsRowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0E1A19',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statColumn: {
    alignItems: 'center',
  },
  statNumericValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3DDC91',
    letterSpacing: -0.2,
  },
  statMicroLabel: {
    fontSize: 8,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 0.4,
    marginTop: 3,
  },

  /* Section Titles */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  sectionHeaderBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: '#3DDC91',
  },

  /* Wearables Status Grid */
  devicesGrid: {
    gap: 12,
    marginBottom: 24,
  },
  deviceCard: {
    backgroundColor: '#0E1A19',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
  },
  deviceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deviceTypePill: {
    backgroundColor: 'rgba(61, 220, 145, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 56,
  },
  deviceTypePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3DDC91',
    letterSpacing: 0.3,
  },
  batteryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 56,
  },
  batteryPillText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  deviceCardName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  deviceCardTelemetry: {
    fontSize: 13,
    color: '#828786',
    marginTop: 4,
    marginBottom: 12,
  },
  deviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeSignalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3DDC91',
  },
  activeSignalLabel: {
    fontSize: 11,
    color: '#3DDC91',
    fontWeight: '500',
  },

  /* Signature Mint Frost Light Content Card (#EDF7F5, 60px radius) */
  mintFrostVitalsCard: {
    backgroundColor: '#EDF7F5', // Signature Mint Frost
    borderRadius: 56, // Sauce Labs high-end rounded curvature
    padding: 24,
    marginBottom: 20,
  },
  vitalsTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  vitalsEyebrow: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.45,
    color: '#132322',
    textTransform: 'uppercase',
  },
  vitalsMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#132322',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  vitalsStatusBadge: {
    backgroundColor: '#132322',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 56,
  },
  vitalsStatusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3DDC91',
  },
  vitalsMetricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  vitalsMetricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  vitalsMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#828786',
    letterSpacing: 0.3,
  },
  vitalsValueUnitRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 4,
  },
  vitalsMetricNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#132322',
    letterSpacing: -0.5,
  },
  vitalsMetricUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#828786',
  },
  vitalsSubCaption: {
    fontSize: 11,
    color: '#828786',
  },
  fallFusionCallout: {
    backgroundColor: 'rgba(19, 35, 34, 0.05)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(19, 35, 34, 0.08)',
  },
  fallFusionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#132322',
  },
  fallFusionDescription: {
    fontSize: 11,
    color: '#424F4F',
    lineHeight: 16,
    marginTop: 3,
  },

  /* Floating Microphone Button */
  floatingMicButton: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#3DDC91', // Neon Pulse
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#3DDC91',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    zIndex: 250,
  },
  floatingMicGlyph: {
    fontSize: 22,
    color: '#132322',
  },

  /* Floating Bottom Navigation Bar */
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(19, 35, 34, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
    alignItems: 'center',
    zIndex: 200,
  },
  navPillTrack: {
    flexDirection: 'row',
    backgroundColor: '#0E1A19',
    borderRadius: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 4,
    width: '100%',
    maxWidth: 480,
    justifyContent: 'space-between',
  },
  navTabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTabButtonActive: {
    backgroundColor: '#3DDC91', // Neon Pulse
  },
  navTabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#828786',
  },
  navTabLabelActive: {
    fontWeight: '700',
    color: '#132322',
  },
});
