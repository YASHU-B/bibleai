import React, { useEffect, useMemo, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { books, verses, Book, Verse } from '@/lib/bibleData';
import { useTheme } from '@/hooks/use-theme';
import { useReadingPlan } from '@/lib/readingPlanContext';
import { addBookmark } from '@/lib/bookmarkStore';
import { verseShareService, BilingualShareVerseData } from '@/lib/verseShareService';
import { loadReaderPosition, saveReaderPosition } from '@/lib/readerStateStore';
import { useNetworkStatus } from '@/lib/networkStatus';
import { 
  loadOfflineBibleChapter, 
  saveOfflineBibleChapter 
} from '@/lib/offlineBibleData';
import { useBibleInitStatus } from '@/hooks/useBibleInitStatus';

const { height } = Dimensions.get('window');

// Strip a leading verse number (e.g. "1 " or "12 ") from Telugu text
// because the CSV already embeds the number at the start of the string.
function cleanTeluguText(text: string): string {
  return text.replace(/^\s*\d+\s*/, '');
}

function SearchBar({ value, onChangeText, theme }: { value: string; onChangeText: (t: string) => void; theme: ReturnType<typeof useTheme> }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={[
      styles.searchBar,
      { backgroundColor: theme.backgroundElement, borderColor: focused ? theme.accent : theme.border },
      focused && styles.searchBarFocused,
    ]}>
      <Ionicons name="search" size={16} color={focused ? theme.accent : theme.textSecondary} />
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        placeholder="వచనాలు వెతకండి / Search verses..."
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity style={styles.searchClearBtn} onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function MobileReader() {
  const theme = useTheme();
  const { activePlan, markDayComplete, getPlanDetails } = useReadingPlan();
  const { isOnline } = useNetworkStatus();
  const bibleInitStatus = useBibleInitStatus();
  const [selectedBook, setSelectedBook] = useState<Book>(books[0]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [viewMode, setViewMode] = useState<'both' | 'te' | 'en'>('both');
  const [fontSize, setFontSize] = useState(16);
  const [activeVerse, setActiveVerse] = useState<Verse | null>(null);
  const [filteredVerses, setFilteredVerses] = useState<Verse[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [englishVoice, setEnglishVoice] = useState<string | null>(null);
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);
  const [resumeLoaded, setResumeLoaded] = useState(false);
  // Track explicit user-driven navigation so we don't overwrite saved position
  // on the first render right after resume load completes.
  const userNavigatedRef = React.useRef(false);
  const todayPlanReading = useMemo(() => {
    if (!activePlan) return null;
    const planDetails = getPlanDetails(activePlan.planId);
    return planDetails?.readings[activePlan.currentDay] ?? null;
  }, [activePlan, getPlanDetails]);
  const isCurrentDayReading = useMemo(() => {
    if (!todayPlanReading) return false;
    return selectedBook.id === todayPlanReading.book_id && selectedChapter === todayPlanReading.chapter;
  }, [selectedBook.id, selectedChapter, todayPlanReading]);
  
  // Selection modals
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [selectedTestament, setSelectedTestament] = useState<'Old' | 'New'>('Old');
  const [chapterModalVisible, setChapterModalVisible] = useState(false);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        const availableVoices = await Speech.getAvailableVoicesAsync();
        const candidate = availableVoices.find(v => v.language?.startsWith('en')) || availableVoices[0];
        setEnglishVoice(candidate?.identifier ?? null);
      } catch (err) {
        console.warn('Failed to load speech voices', err);
      }
    };

    loadVoices();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadChapter = async () => {
      setOfflineMode(false);

      try {
        // Always try offline/cached chapters first (fast file read after initialization)
        const offlineVerses = await loadOfflineBibleChapter(
          selectedBook.id,
          selectedChapter,
          [] // no bundled fallback needed since we handle it below
        );

        if (offlineVerses.length > 0) {
          if (isMounted) {
            setFilteredVerses(offlineVerses);
            setOfflineMode(true);
          }
          return;
        }
      } catch (err) {
        console.warn('Failed to load offline Bible chapter:', err);
      }

      // Fallback: filter from bundled verses (needed on very first launch before init completes)
      const staticVerses = verses.filter(
        v => v.book_id === selectedBook.id && v.chapter === selectedChapter
      );
      if (isMounted) {
        setFilteredVerses(staticVerses);
      }
    };

    loadChapter();

    return () => {
      isMounted = false;
    };
  }, [selectedBook.id, selectedChapter, isOnline]);

  useEffect(() => {
    const loadResumePosition = async () => {
      const emailKey = 'guest';
      try {
        const position = await loadReaderPosition(emailKey);
        if (!position) {
          setResumeMessage(null);
          return;
        }

        const savedBook = books.find(b => b.id === position.bookId);
        if (!savedBook) {
          setResumeMessage(null);
          return;
        }

        setSelectedBook(savedBook);
        setSelectedChapter(position.chapter);
        if (position.verse != null) {
          const savedVerse = verses.find(
            v => v.book_id === position.bookId && v.chapter === position.chapter && v.verse === position.verse
          );
          if (savedVerse) {
            setActiveVerse(savedVerse);
          }
        }

        setResumeMessage(
          `↩ Resumed: ${savedBook.name_te} (${savedBook.name_en}) ${position.chapter}:${position.verse ?? 1}`,
        );
      } catch (err) {
        console.warn('Failed to load reader resume position:', err);
      } finally {
        setResumeLoaded(true);
      }
    };

    loadResumePosition();
  }, []);

  useEffect(() => {
    const savePosition = async () => {
      // Wait until resume has finished loading AND the user has explicitly navigated
      // to avoid overwriting the saved position the moment it's loaded.
      if (!resumeLoaded) return;
      if (!userNavigatedRef.current) return;
      const emailKey = 'guest';

      try {
        await saveReaderPosition(emailKey, {
          bookId: selectedBook.id,
          chapter: selectedChapter,
          verse: activeVerse?.verse,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Failed to save reader position:', err);
      }
    };

    savePosition();
  }, [selectedBook.id, selectedChapter, activeVerse?.verse, resumeLoaded]);

  const displayedVerses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return filteredVerses;

    // Search within the currently loaded chapter's verses
    return filteredVerses.filter(v => {
      const verseText = `${v.text_te ?? ''} ${v.text_en ?? ''}`.toLowerCase();
      return (
        `${v.verse}`.includes(query) ||
        verseText.includes(query)
      );
    });
  }, [filteredVerses, searchQuery]);

  // reader state and book list are handled internally; no debug logs


  const handlePlayTts = async (v: Verse, lang: 'te' | 'en') => {
    try {
      await Speech.stop();
      const text = lang === 'te' ? cleanTeluguText(v.text_te) : (v.text_en?.trim() ? v.text_en : cleanTeluguText(v.text_te));
      await Speech.speak(text, {
        language: lang === 'te' ? 'te-IN' : 'en-US',
        voice: lang === 'en' ? englishVoice ?? undefined : undefined,
        rate: lang === 'te' ? 1 : 0.9,
        pitch: 1.05,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleMarkDayComplete = async () => {
    if (!activePlan || !todayPlanReading) {
      Alert.alert('No Active Plan', 'Start a reading plan first to mark progress.');
      return;
    }

    try {
      await markDayComplete(activePlan.id, activePlan.currentDay + 1);
      Alert.alert(
        '✅ Day Complete!',
        `Great job! You've completed Day ${activePlan.currentDay + 1}. Keep up the momentum!`
      );
    } catch {
      Alert.alert('Error', 'Failed to mark day complete');
    }
  };

  const handleShareVerse = async (v: Verse) => {
    try {
      const textEn = v.text_en?.trim() ? v.text_en : v.text_te;
      await verseShareService.shareBilingualVerse({
        bookName: selectedBook.name_en,
        chapter: v.chapter,
        verse: v.verse,
        text_te: v.text_te,
        text_en: textEn,
      } as BilingualShareVerseData);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSaveVerse = async (v: Verse) => {
    try {
      const updated = await addBookmark(undefined, `${selectedBook.name_en} ${v.chapter}:${v.verse} - ${v.text_te}`, v.book_id, v.chapter, v.verse);
      Alert.alert('Saved', 'Verse saved to your bookmarks.');
    } catch (error) {
      console.warn('Failed to save bookmark', error);
      Alert.alert('Save Failed', 'Could not save the verse. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* 0. Reading Plan Progress Banner */}
      {activePlan && (
        <View style={[styles.planBanner, { backgroundColor: isCurrentDayReading ? theme.accentBg : theme.backgroundElement, borderColor: theme.accent }]}>
          <View style={styles.planBannerTop}>
            <View style={styles.planInfo}>
              <Text style={[styles.planDay, { color: theme.accent }]}>
                📖 Day {activePlan.currentDay + 1}
              </Text>
              <Text style={[styles.planTitle, { color: theme.text }]}>
                {getPlanDetails(activePlan.planId)?.name_en}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.markCompleteBtn, { backgroundColor: theme.accent }]}
              onPress={handleMarkDayComplete}
            >
              <Ionicons name="checkmark-circle" size={18} color="white" />
              <Text style={styles.markCompleteBtnText}>Mark Complete</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.planProgressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.planProgressFill,
                {
                  backgroundColor: theme.accent,
                  width: `${(activePlan.completedDays / (getPlanDetails(activePlan.planId)?.durationDays || 1)) * 100}%`,
                },
              ]}
            />
          </View>

          <View style={styles.planProgressText}>
            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
              {activePlan.completedDays} / {getPlanDetails(activePlan.planId)?.durationDays} days complete
            </Text>
            <Text style={[styles.progressPercent, { color: theme.accent }]}>
              {Math.round((activePlan.completedDays / (getPlanDetails(activePlan.planId)?.durationDays || 1)) * 100)}%
            </Text>
          </View>
        </View>
      )}
      
      {/* 1. Sub-header Navigation selectors */}
      <View style={[styles.selectorBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.selectBtn, { flex: 2, backgroundColor: theme.backgroundElement, borderColor: theme.border }]} 
          onPress={() => setBookModalVisible(true)}
        >
          <Ionicons name="book-outline" size={15} color={theme.accent} />
          <Text style={[styles.selectBtnText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
            {selectedBook.name_te} ({selectedBook.name_en})
          </Text>
          <Ionicons name="chevron-down" size={12} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.selectBtn, { flex: 1, backgroundColor: theme.backgroundElement, borderColor: theme.border }]} 
          onPress={() => setChapterModalVisible(true)}
        >
          <Text style={[styles.selectBtnText, { color: theme.text }]} numberOfLines={1}>Ch {selectedChapter}</Text>
          <Ionicons name="chevron-down" size={12} color={theme.textSecondary} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => {
            const prev = Math.max(1, selectedChapter - 1);
            userNavigatedRef.current = true;
            setSelectedChapter(prev);
            setActiveVerse(null);
          }} style={[styles.smallBtn, { backgroundColor: theme.backgroundElement }] }>
            <Text style={[styles.smallBtnText, { color: theme.text }]}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            const next = Math.min(selectedBook.chaptersCount, selectedChapter + 1);
            userNavigatedRef.current = true;
            setSelectedChapter(next);
            setActiveVerse(null);
          }} style={[styles.smallBtn, { backgroundColor: theme.backgroundElement }] }>
            <Text style={[styles.smallBtnText, { color: theme.text }]}>›</Text>
          </TouchableOpacity>
          {!isOnline && (
            <View style={[styles.offlineBadge, { backgroundColor: theme.accent }]}>
              <Ionicons name="cloud-offline" size={12} color={theme.background} />
              <Text style={[styles.offlineBadgeText, { color: theme.background }]}>Offline</Text>
            </View>
          )}

        </View>
      </View>

      {/* 2. Format Controls Bar */}
      <View style={[styles.controlsBar, { borderBottomColor: theme.border }]}>
        <View style={[styles.toggleGroup, { backgroundColor: theme.backgroundElement }]}>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'both' && { backgroundColor: theme.accent }]}
            onPress={() => setViewMode('both')}
          >
            <Text style={[styles.toggleText, { color: theme.textSecondary }, viewMode === 'both' && { color: theme.background }]}>Dual</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'te' && { backgroundColor: theme.accent }]}
            onPress={() => setViewMode('te')}
          >
            <Text style={[styles.toggleText, { color: theme.textSecondary }, viewMode === 'te' && { color: theme.background }]}>తెలుగు</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'en' && { backgroundColor: theme.accent }]}
            onPress={() => setViewMode('en')}
          >
            <Text style={[styles.toggleText, { color: theme.textSecondary }, viewMode === 'en' && { color: theme.background }]}>EN</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sizeGroup}>
          <TouchableOpacity onPress={() => setFontSize(prev => Math.max(12, prev - 2))} style={[styles.sizeBtn, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.sizeBtnText, { color: theme.text }]}>A-</Text>
          </TouchableOpacity>
          <Text style={[styles.sizeLabel, { color: theme.textSecondary }]}>{fontSize}px</Text>
          <TouchableOpacity onPress={() => setFontSize(prev => Math.min(26, prev + 2))} style={[styles.sizeBtn, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.sizeBtnText, { color: theme.text }]}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        theme={theme}
      />

      {!bibleInitStatus.initialized && bibleInitStatus.isLoading && bibleInitStatus.error === null && (
        <View style={[styles.initBanner, { backgroundColor: theme.accentSecondary || theme.accent }]}>
          <Ionicons name="download-outline" size={14} color={theme.background} />
          <Text style={[styles.initBannerText, { color: theme.background }]}>
            Complete Bible is loading for offline access...
          </Text>
        </View>
      )}

      {bibleInitStatus.error && (
        <View style={[styles.initBanner, styles.initBannerError, { backgroundColor: '#EF4444' }]}>
          <Ionicons name="alert-circle-outline" size={14} color="#FFFFFF" />
          <Text style={[styles.initBannerText, { color: '#FFFFFF' }]}>
            Bible initialization failed, using bundled verses
          </Text>
        </View>
      )}

      {resumeMessage && (
        <TouchableOpacity 
          onPress={() => setResumeMessage(null)}
          style={[styles.resumeBanner, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          onLayout={() => {
            // Auto-dismiss after 3 seconds
            setTimeout(() => setResumeMessage(null), 3000);
          }}
        >
          <Ionicons name="return-up-back-outline" size={13} color={theme.accent} />
          <Text style={[styles.resumeText, { color: theme.textSecondary, flex: 1 }]}>{resumeMessage}</Text>
          <Ionicons name="close" size={13} color={theme.textSecondary} />
        </TouchableOpacity>
      )}


      {/* 3. Verse scrolling panel */}
      <ScrollView style={styles.versesContainer} contentContainerStyle={styles.versesContent}>
        {displayedVerses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}> {`${selectedBook.name_te} (${selectedBook.name_en}) అధ్యాయం ${selectedChapter} కు వచనాలు ఇంకా అందుబాటులో లేవు. దయచేసి పుస్తకం లేదా అధ్యాయాన్ని మార్చి చూడండి.`}</Text>
          </View>
        ) : (
          displayedVerses.map(v => {
            const isActive = activeVerse?.verse === v.verse;
            return (
              <TouchableOpacity 
                key={v.verse}
              style={[styles.verseRow, { borderBottomColor: theme.border }, isActive && { backgroundColor: theme.accentBg }]}
              onPress={() => setActiveVerse(v)}
              activeOpacity={0.8}
            >
              <View style={styles.verseGrid}>
                {/* Telugu Column */}
                {(viewMode === 'both' || viewMode === 'te') && (
                  <View style={styles.langColumn}>
                    <Text style={[styles.verseNumberTe, { color: theme.accentSecondary }]}>{searchQuery.trim() ? `${v.chapter}:${v.verse}` : `${v.verse}`}</Text>
                    <Text style={[styles.verseTextTe, { fontSize: fontSize, color: theme.text, lineHeight: fontSize * 1.8 }]}>{cleanTeluguText(v.text_te)}</Text>
                  </View>
                )}

                {/* English Column */}
                {(viewMode === 'both' || viewMode === 'en') && (
                  <View style={[styles.langColumn, viewMode === 'both' && styles.langColumnBoth]}>
                    <Text style={[styles.verseNumberEn, { color: theme.accentSecondary }]}>{searchQuery.trim() ? `${v.chapter}:${v.verse}` : `${v.verse}`}</Text>
                    <Text style={[styles.verseTextEn, { fontSize: fontSize - 2, color: theme.textSecondary, lineHeight: (fontSize - 2) * 1.7 }]}>{v.text_en?.trim() ? v.text_en : v.text_te}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }))}
      </ScrollView>
      {/* 4. Context Bottom Actions toolbar */}
      {activeVerse && (
        <View style={styles.actionBar}>
          <Text style={styles.activeLabel}>
            {selectedBook.name_en} {activeVerse.chapter}:{activeVerse.verse}
          </Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => handlePlayTts(activeVerse, 'te')}
            >
              <Ionicons name="volume-medium" size={16} color="#090D16" />
              <Text style={styles.actionBtnText}>ఆడియో</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
              onPress={() => handlePlayTts(activeVerse, 'en')}
            >
              <Ionicons name="volume-medium" size={16} color="#FFFFFF" />
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Voice EN</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.actionBtnOutline]}
              onPress={() => handleShareVerse(activeVerse)}
            >
              <Ionicons name="share-social" size={16} color="#FFFFFF" />
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
              onPress={() => handleSaveVerse(activeVerse)}
            >
              <Ionicons name="bookmark" size={16} color="#FFFFFF" />
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeBtn}
              onPress={() => setActiveVerse(null)}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Book Picker Bottom Sheet ─────────────────────────────────── */}
      <Modal animationType="slide" transparent={true} visible={bookModalVisible} onRequestClose={() => setBookModalVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setBookModalVisible(false)} />
        <View style={[styles.sheet, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {/* Drag handle */}
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

          <Text style={[styles.sheetTitle, { color: theme.accent }]}>📖 పుస్తకము ఎంచుకోండి</Text>
          <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>Select Book</Text>

          {/* Old / New Testament selector tabs */}
          <View style={[styles.testamentToggleContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <TouchableOpacity 
              style={[styles.testamentTab, selectedTestament === 'Old' && { backgroundColor: theme.accent }]}
              onPress={() => setSelectedTestament('Old')}
            >
              <Text style={[styles.testamentTabText, selectedTestament === 'Old' ? { color: '#000', fontWeight: 'bold' } : { color: theme.textSecondary }]}>
                పాత నిబంధన (Old Testament)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.testamentTab, selectedTestament === 'New' && { backgroundColor: theme.accent }]}
              onPress={() => setSelectedTestament('New')}
            >
              <Text style={[styles.testamentTabText, selectedTestament === 'New' ? { color: '#000', fontWeight: 'bold' } : { color: theme.textSecondary }]}>
                నూతన నిబంధన (New Testament)
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {books.filter(b => b.testament === selectedTestament).map(b => {
              const isSelected = selectedBook.id === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.sheetItem,
                    { borderBottomColor: theme.border },
                    isSelected && { backgroundColor: theme.accentBg },
                  ]}
                  onPress={() => {
                    userNavigatedRef.current = true;
                    setSelectedBook(b);
                    setSelectedChapter(1);
                    setBookModalVisible(false);
                    setActiveVerse(null);
                  }}
                >
                  <View style={styles.sheetItemInner}>
                    <Text style={[styles.sheetItemTe, { color: isSelected ? theme.accent : theme.text }]}>{b.name_te}</Text>
                    <Text style={[styles.sheetItemEn, { color: isSelected ? theme.accentSecondary : theme.textSecondary }]}>{b.name_en}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.sheetCloseBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
            onPress={() => setBookModalVisible(false)}
          >
            <Text style={[styles.sheetCloseBtnText, { color: theme.text }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Chapter Picker Bottom Sheet ──────────────────────────────── */}
      <Modal animationType="slide" transparent={true} visible={chapterModalVisible} onRequestClose={() => setChapterModalVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setChapterModalVisible(false)} />
        <View style={[styles.sheet, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {/* Drag handle */}
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

          <Text style={[styles.sheetTitle, { color: theme.accent }]}>📄 అధ్యాయము ఎంచుకోండి</Text>
          <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
            {selectedBook.name_en} · {selectedBook.chaptersCount} Chapters
          </Text>

          <ScrollView
            style={styles.sheetScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.chapterGridSheet}
          >
            {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map(num => {
              const isSelected = selectedChapter === num;
              return (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.chapterItem,
                    {
                      backgroundColor: isSelected ? theme.accent : theme.background,
                      borderColor: isSelected ? theme.accent : theme.border,
                    },
                  ]}
                  onPress={() => {
                    userNavigatedRef.current = true;
                    setSelectedChapter(num);
                    setChapterModalVisible(false);
                    setActiveVerse(null);
                  }}
                >
                  <Text style={[styles.chapterText, { color: isSelected ? '#000' : theme.textSecondary }]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.sheetCloseBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
            onPress={() => setChapterModalVisible(false)}
          >
            <Text style={[styles.sheetCloseBtnText, { color: theme.text }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  planBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    gap: 8,
  },
  planBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planDay: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  markCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  markCompleteBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  planProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  planProgressFill: {
    height: '100%',
  },
  planProgressText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectorBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  selectBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  selectBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#F59E0B',
  },
  toggleText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: '#090D16',
  },
  sizeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sizeBtn: {
    width: 28,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sizeLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  versesContainer: {
    flex: 1,
  },
  versesContent: {
    paddingVertical: 12,
  },
  verseRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  verseRowActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  verseGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchBarFocused: {
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: 34,
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 2,
  },
  langColumn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  langColumnBoth: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
  },
  englishBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    paddingLeft: 12,
  },
  verseNumberTe: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  verseNumberEn: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  verseTextTe: {
    color: '#F8FAFC',
    lineHeight: 28,
    flex: 1,
  },
  verseTextEn: {
    color: '#CBD5E1',
    lineHeight: 24,
    flex: 1,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#090D16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.3)',
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  activeLabel: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    height: 38,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnOutline: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionBtnText: {
    color: '#090D16',
    fontSize: 11,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // ── Unified bottom-sheet styles (Book & Chapter pickers)
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 20,
    paddingBottom: 32,
    maxHeight: height * 0.75,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
  },
  sheetSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  sheetScroll: {
    marginBottom: 12,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderRadius: 10,
    marginBottom: 2,
  },
  sheetItemInner: {
    flex: 1,
    gap: 2,
  },
  sheetItemTe: {
    fontSize: 15,
    fontWeight: '700',
  },
  sheetItemEn: {
    fontSize: 12,
  },
  sheetCloseBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  sheetCloseBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  chapterGridSheet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  chapterItem: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chapterItemActive: {
    backgroundColor: '#F59E0B',
  },
  chapterText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chapterTextActive: {
    color: '#090D16',
  },
  smallBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  infoBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  resumeBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resumeText: {
    fontSize: 11,
    lineHeight: 16,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  initBanner: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  initBannerError: {
    backgroundColor: '#EF4444',
  },
  initBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  testamentToggleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
    gap: 6,
  },
  testamentTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testamentTabText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
