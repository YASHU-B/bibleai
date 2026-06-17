import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { languagePreferenceService } from '@/lib/languagePreferenceService';
import { notificationService } from '@/lib/notificationService';

// Curated verses for Verse of the Day
const BEAUTIFUL_VERSES = [
  {
    ref_te: "మత్తయి 6:33",
    ref_en: "Matthew 6:33",
    text_te: "మీరు ఆయన రాజ్యమును నీతిని మొదట వెదకుడి; అప్పుడు అవన్నియు మీకు అనుగ్రహింపబడును.",
    text_en: "But seek first the kingdom of God and His righteousness, and all these things shall be added to you."
  },
  {
    ref_te: "యోహాను 3:16",
    ref_en: "John 3:16",
    text_te: "దేవుడు లోకమును ఎంతో ప్రేమించెను; కాగా ఆయన తన ఏకైక కాపరిగా పుట్టిన వానియందు విశ్వాసముంచు ప్రతివాడును నశింపక నిత్యజీవము పొందునట్లు ఆయనను అనుగ్రహించెను.",
    text_en: "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life."
  },
  {
    ref_te: "కీర్తనలు 23:1",
    ref_en: "Psalm 23:1",
    text_te: "యెహోవా నా కాపరి; నాకు లేమి కలుగదు.",
    text_en: "The Lord is my shepherd; I shall not want."
  },
  {
    ref_te: "యెషయా 41:10",
    ref_en: "Isaiah 41:10",
    text_te: "నీవు భయపడకుము నేను నీకు తోడైయున్నాను; కలవరపడకుము నేను నీ దేవుడనైయున్నాను; నేను నిన్ను బలపరతును నిన్ను ఆదుకొందును.",
    text_en: "Fear not, for I am with you; be not dismayed, for I am your God. I will strengthen you, yes, I will help you."
  },
  {
    ref_te: "సామెతలు 3:5-6",
    ref_en: "Proverbs 3:5-6",
    text_te: "నీ స్వబుద్ధిని ఆధారము చేసికొనక నీ పూర్ణహృదయముతో యెహోవాయందు నమ్మకముంచుము; నీ ప్రవర్తన అంతటియందు ఆయన అధికారమును ఒప్పుకొనుము అప్పుడు ఆయన నీ త్రోవలను సరాళము చేయును.",
    text_en: "Trust in the Lord with all your heart, and lean not on your own understanding; in all your ways acknowledge Him, and He shall direct your paths."
  },
  {
    ref_te: "రోమీయులకు 8:28",
    ref_en: "Romans 8:28",
    text_te: "దేవుని ప్రేమించువారికి, అనగా ఆయన సంకల్పముచొప్పున పిలువబడినవారికి, మేలుకలుగుటకై సమస్తమును సమకూడి జరుగుచున్నవని యెరుగుదుము.",
    text_en: "And we know that all things work together for good to those who love God, to those who are the called according to His purpose."
  },
  {
    ref_te: "ఫిలిప్పీయులకు 4:13",
    ref_en: "Philippians 4:13",
    text_te: "నన్ను బలపరచువానియందే నేను సమస్తమును చేయగలను.",
    text_en: "I can do all things through Christ who strengthens me."
  },
  {
    ref_te: "కీర్తనలు 121:1-2",
    ref_en: "Psalm 121:1-2",
    text_te: "కొండలతట్టు నా కన్నులెత్తుచున్నాను; నాకు సహాయము ఎక్కడనుండి వచ్చును? యెహోవావలననే నాకు సహాయము కలుగును.",
    text_en: "I will lift up my eyes to the hills—from whence comes my help? My help comes from the Lord, who made heaven and earth."
  }
];

// Dynamic UI Translations
const TRANSLATIONS = {
  en: {
    verseOfDay: "Verse of the Day",
    features: "Features",
    bibleReader: "Bible Reader",
    readInEnglish: "Read in English & Telugu",
    aiAssistant: "AI Assistant",
    askSpiritual: "Ask spiritual questions",
    audioBible: "Audio Bible",
    listenChapters: "Listen to chapters",
    readingPlans: "Reading Plans",
    plansDesc: "30-90 day plans",
    listenTitle: "Listen to any book chapter",
    listenDesc: "Access the complete Bible audio chapters bundled in the app for offline listening.",
    tapToListen: "★ Tap to Listen"
  },
  te: {
    verseOfDay: "నేటి వాగ్దానం",
    features: "ఫీచర్స్",
    bibleReader: "బైబిల్ రీడర్",
    readInEnglish: "తెలుగు & ఇంగ్లీష్ చదవండి",
    aiAssistant: "AI సహాయకుడు",
    askSpiritual: "ఆధ్యాత్మిక ప్రశ్నలు అడగండి",
    audioBible: "ఆడియో బైబిల్",
    listenChapters: "అధ్యాయాలు వినండి",
    readingPlans: "పఠన ప్రణాళికలు",
    plansDesc: "30-90 రోజుల ప్రణాళికలు",
    listenTitle: "ఏదైనా పుస్తక అధ్యాయాన్ని వినండి",
    listenDesc: "ఆఫ్‌లైన్ శ్రవణం కోసం యాప్‌లో బండిల్ చేయబడిన పూర్తి బైబిల్ ఆడియో అధ్యాయాలను యాక్సెస్ చేయండి.",
    tapToListen: "★ వినడానికి నొక్కండి"
  }
};
// Standalone helper to calculate daily verse index (rolls over at 6:00 AM)
function getVerseIndexForToday() {
  const now = new Date();
  const adjusted = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const year = adjusted.getFullYear();
  const month = adjusted.getMonth() + 1;
  const day = adjusted.getDate();
  const hash = (year * 10000 + month * 100 + day);
  return hash % BEAUTIFUL_VERSES.length;
}

export default function MobileHome() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [lang, setLang] = useState<'en' | 'te'>('te');
  const [currentVerseIndex] = useState(getVerseIndexForToday);
  const [verseLang, setVerseLang] = useState<'te' | 'en'>('te');
  const t = TRANSLATIONS[lang];
  const isInitializingRef = React.useRef(false);

  useEffect(() => {
    const initLanguage = async () => {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;
      
      try {
        const savedLang = await languagePreferenceService.getLanguage();
        setLang(savedLang);
        setVerseLang(savedLang); // Sync initial verse language with user preference

        const isFirstLaunch = await languagePreferenceService.checkFirstTimeLaunch();
        if (isFirstLaunch) {
          const handleFirstLaunchSetup = async (selectedLang: 'te' | 'en') => {
            await languagePreferenceService.setLanguage(selectedLang);
            setLang(selectedLang);
            setVerseLang(selectedLang);
            
            // Request notification permission and trigger welcome notification
            setTimeout(async () => {
              try {
                const granted = await notificationService.requestPermissions();
                if (granted) {
                  await notificationService.triggerWelcomeNotification();
                }
              } catch (err) {
                console.warn('Welcome notification setup failed:', err);
              }
            }, 600);
          };

          Alert.alert(
            'భాషను ఎంచుకోండి / Select Language',
            'యాప్ కోసం మీ భాషను ఎంచుకోండి:\nChoose your app language:',
            [
              {
                text: 'తెలుగు (Telugu)',
                onPress: () => handleFirstLaunchSetup('te'),
              },
              {
                text: 'English',
                onPress: () => handleFirstLaunchSetup('en'),
              },
            ],
            { cancelable: false }
          );
        }
      } finally {
        isInitializingRef.current = false;
      }
    };

    // Load language preference whenever home screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      initLanguage();
    });

    initLanguage();
    return unsubscribe;
  }, [navigation]);

  const activeVerse = BEAUTIFUL_VERSES[currentVerseIndex] || BEAUTIFUL_VERSES[0];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.contentContainer}>
      
      {/* Verse of the Day Card */}
      <View style={[styles.verseCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.verseHeader}>
          <View style={styles.verseTitleRow}>
            <Ionicons name="bookmark" size={16} color={theme.accent} />
            <Text style={[styles.verseTitle, { color: theme.text }]}>{t.verseOfDay}</Text>
          </View>
          
          <View style={styles.verseActions}>
            {/* Local Verse Language Toggle */}
            <View style={[styles.verseToggle, { borderColor: theme.border }]}>
              <TouchableOpacity 
                onPress={() => setVerseLang('te')} 
                style={[styles.verseToggleBtn, verseLang === 'te' && { backgroundColor: theme.accent }]}
              >
                <Text style={[styles.verseToggleText, { color: verseLang === 'te' ? theme.background : theme.textSecondary }]}>తెలుగు</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setVerseLang('en')} 
                style={[styles.verseToggleBtn, verseLang === 'en' && { backgroundColor: theme.accent }]}
              >
                <Text style={[styles.verseToggleText, { color: verseLang === 'en' ? theme.background : theme.textSecondary }]}>EN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={[styles.verseContent, { color: theme.text }]}>
          {verseLang === 'te' ? activeVerse.text_te : activeVerse.text_en}
        </Text>
        <Text style={[styles.verseRef, { color: theme.accent }]}>
          — {verseLang === 'te' ? activeVerse.ref_te : activeVerse.ref_en}
        </Text>
      </View>
      {/* 2. Quick Navigation Grid */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.features}</Text>
      
      <View style={styles.navGrid}>
        <TouchableOpacity style={[styles.gridCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} onPress={() => router.push('/(tabs)/reader')}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <Ionicons name="book" size={28} color="#F59E0B" />
          </View>
          <Text style={[styles.gridTitle, { color: theme.text }]}>{t.bibleReader}</Text>
          <Text style={[styles.gridDesc, { color: theme.textSecondary }]}>{t.readInEnglish}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.gridCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} onPress={() => router.push('/(tabs)/assistant')}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
            <Ionicons name="sparkles" size={28} color="#8B5CF6" />
          </View>
          <Text style={[styles.gridTitle, { color: theme.text }]}>{t.aiAssistant}</Text>
          <Text style={[styles.gridDesc, { color: theme.textSecondary }]}>{t.askSpiritual}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navGrid}>
        <TouchableOpacity style={[styles.gridCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} onPress={() => router.push('/(tabs)/audio')}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}> 
            <Ionicons name="play-circle" size={28} color="#22C55E" />
          </View>
          <Text style={[styles.gridTitle, { color: theme.text }]}>{t.audioBible}</Text>
          <Text style={[styles.gridDesc, { color: theme.textSecondary }]}>{t.listenChapters}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.gridCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} onPress={() => router.push('/(tabs)/plans')}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
            <Ionicons name="list" size={28} color="#22C55E" />
          </View>
          <Text style={[styles.gridTitle, { color: theme.text }]}>{t.readingPlans}</Text>
          <Text style={[styles.gridDesc, { color: theme.textSecondary }]}>{t.plansDesc}</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Daily Motivational Quote / Matthew 6:33 shortcut */}
      <View style={[styles.quoteStrip, { backgroundColor: theme.accentBg, borderLeftColor: theme.accent }]}>
        <Ionicons name="chatbubble-ellipses" size={24} color={theme.accent} style={styles.quoteIcon} />
        {lang === 'te' ? (
          <Text style={[styles.quoteTe, { color: theme.accent }]}>{`"మీరు ఆయన రాజ్యమును నీతిని మొదట వెదకుడి..." — మత్తయి 6:33`}</Text>
        ) : (
          <Text style={[styles.quoteEn, { color: theme.textSecondary }]}>{`"Seek first the kingdom of God and His righteousness..." — Matthew 6:33`}</Text>
        )}
      </View>

      {/* 5. Audio Bible Shortcut */}
      <TouchableOpacity 
        style={[styles.featuredDev, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        onPress={() => router.push('/(tabs)/audio')}
      >
        <Text style={[styles.devTag, { color: theme.accent }]}>{t.audioBible}</Text>
        <Text style={[styles.devTitle, { color: theme.text }]}>{t.listenTitle}</Text>
        <Text style={[styles.devDesc, { color: theme.textSecondary }]} numberOfLines={2}>
          {t.listenDesc}
        </Text>
        <View style={styles.devFooter}>
          <Text style={[styles.devReadTime, { color: theme.accent }]}>{t.tapToListen}</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.accent} />
        </View>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  langToggleContainer: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 24,
    gap: 8,
  },
  langToggleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  langOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  langOptionText: {
    fontSize: 13,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  navGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  gridCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconBg: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  gridTitle: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gridDesc: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  quoteStrip: {
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  quoteIcon: {
    opacity: 0.2,
    marginBottom: -10,
  },
  quoteTe: {
    fontSize: 13,
    fontWeight: 'bold',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  quoteEn: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  featuredDev: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  devTag: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  devTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  devDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  devFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 12,
  },
  devReadTime: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  verseCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  verseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verseTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  verseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verseToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  verseToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseToggleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  shuffleBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseContent: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 12,
    fontWeight: '500',
  },
  verseRef: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
});
