import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { AuthProvider } from '@/lib/auth-context';
import { ReadingPlanProvider } from '@/lib/readingPlanContext';
import { initializeOfflineBible, isBibleInitialized } from '@/lib/bibleInitializer';

// Keep the native splash screen visible while we initialize
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);

  useEffect(() => {
    async function checkUpdates() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            'యాప్ అప్‌డేట్ అందుబాటులో ఉంది / App Update Available',
            'అప్‌డేట్‌ను ఇన్‌స్టాల్ చేయడానికి యాప్‌ను రీస్టార్ట్ చేయండి.\nRestart the app to install the update.',
            [
              {
                text: 'రద్దు / Cancel',
                style: 'cancel',
              },
              {
                text: 'అప్‌డేట్ / Update',
                onPress: async () => {
                  await Updates.reloadAsync();
                },
              },
            ],
            { cancelable: true }
          );
        }
      } catch (error) {
        console.warn('Update check failed:', error);
      }
    }
    checkUpdates();
  }, []);

  useEffect(() => {
    const checkInit = async () => {
      try {
        const initialized = await isBibleInitialized();
        if (initialized) {
          setIsInitialized(true);
        } else {
          // Bible not yet initialized — hide splash so our custom loading UI shows
          await SplashScreen.hideAsync();
          setIsInitialized(false);
          // Start initialization immediately
          initializeOfflineBible(p => {
            setProgress({ loaded: p.chaptersLoaded, total: p.totalChapters || 1189 });
            if (p.isComplete) {
              setIsInitialized(true);
            }
          }).catch(error => {
            console.error('Initialization failed', error);
            setIsInitialized(true); // Fall back so app still launches
          });
        }
      } catch (err) {
        setIsInitialized(true);
      }
    };
    checkInit();
  }, []);

  // Once fully initialized, hide the splash screen
  useEffect(() => {
    if (isInitialized === true) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  if (isInitialized === null) {
    // Splash screen is still showing natively — render nothing beneath it
    return null;
  }

  if (isInitialized === false) {
    const pct = progress ? Math.round((progress.loaded / progress.total) * 100) : 0;
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="cover"
        />
        <Text style={styles.titleTe}>బైబిల్ AI</Text>
        <Text style={styles.titleEn}>Bible AI Telugu</Text>

        <View style={styles.progressBox}>
          <Text style={styles.statusText}>
            {pct < 5 ? "డేటాబేస్ సిద్ధమవుతోంది..." : "ఆఫ్‌లైన్ బైబిల్‌ను లోడ్ చేస్తోంది..."}
          </Text>
          <Text style={styles.subStatusText}>
            {progress ? `${progress.loaded} / ${progress.total} అధ్యాయాలు లోడ్ అయ్యాయి` : "ప్రారంభించబడుతోంది..."}
          </Text>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.pctText}>{pct}%</Text>
        </View>

        <ActivityIndicator size="small" color="#F59E0B" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <ReadingPlanProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ReadingPlanProvider>
    </AuthProvider>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#090D16',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 130,
    height: 130,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#F59E0B',
    marginBottom: 24,
  },
  titleTe: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  titleEn: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 40,
  },
  progressBox: {
    width: width * 0.8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 6,
    textAlign: 'center',
  },
  subStatusText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressBarBg: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  pctText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
});
