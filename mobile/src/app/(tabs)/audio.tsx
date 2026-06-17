import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTheme } from '@/hooks/use-theme';
import { books as bibleBooks, verses as bibleVerses, Book, Verse } from '@/lib/bibleData';

const { width: SCREEN_W } = Dimensions.get('window');



export default function AudioBible() {
  const theme = useTheme();

  const [selectedBook, setSelectedBook] = useState<Book>(bibleBooks[0]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [showBookList, setShowBookList] = useState(false);
  const [audioLang, setAudioLang] = useState<'te' | 'en'>('te');
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [selectedTestament, setSelectedTestament] = useState<'Old' | 'New'>('Old');

  const audioLangRef = useRef<'te' | 'en'>('te');
  const verseIndexRef = useRef(0);
  const playingRef = useRef(false);
  const chapterVerses = useRef<Verse[]>([]);
  const selectedBookRef = useRef<Book>(bibleBooks[0]);
  const selectedChapterRef = useRef(1);

  useEffect(() => {
    audioLangRef.current = audioLang;
  }, [audioLang]);

  // Keep refs in sync with state so callbacks never have stale values
  useEffect(() => { selectedBookRef.current = selectedBook; }, [selectedBook]);
  useEffect(() => { selectedChapterRef.current = selectedChapter; }, [selectedChapter]);

  // Animated waveform bars
  const bars = useMemo(() => Array.from({ length: 30 }, () => new Animated.Value(0.25)), []);
  const waveAnim = useRef<Animated.CompositeAnimation | null>(null);

  // Pulse animation for album art
  const pulseAnim = useMemo(() => new Animated.Value(1), []);

  const startWave = () => {
    waveAnim.current?.stop();
    const animations = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 35),
          Animated.timing(bar, {
            toValue: 0.25 + Math.random() * 0.75,
            duration: 250 + Math.random() * 300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.1 + Math.random() * 0.35,
            duration: 250 + Math.random() * 300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );
    waveAnim.current = Animated.parallel(animations);
    waveAnim.current.start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.07, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  };

  const stopWave = () => {
    waveAnim.current?.stop();
    bars.forEach(b => Animated.timing(b, { toValue: 0.25, duration: 200, useNativeDriver: true }).start());
    Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const pausePlayback = async () => {
    playingRef.current = false;
    setIsPlaying(false);
    try { await Speech.stop(); } catch { /* ignore */ }
  };

  const stopPlayback = async () => {
    playingRef.current = false;
    setIsPlaying(false);
    setCurrentVerseIndex(0);
    verseIndexRef.current = 0;
    try { await Speech.stop(); } catch { /* ignore */ }
  };

  const handleLangChange = async (lang: 'te' | 'en') => {
    setAudioLang(lang);
    if (playingRef.current) {
      try { await Speech.stop(); } catch { /* ignore */ }
      setTimeout(() => {
        const verses = chapterVerses.current.length > 0 ? chapterVerses.current : getChapterVerses();
        speakVerse(verses, verseIndexRef.current);
      }, 80);
    }
  };

  useEffect(() => {
    if (isPlaying) startWave(); else stopWave();
  }, [isPlaying]);

  // Stop speech when user manually changes chapter (not auto-advance)
  const userChangedChapterRef = useRef(false);
  useEffect(() => {
    if (!userChangedChapterRef.current) return;
    userChangedChapterRef.current = false;
    let isMounted = true;
    const performStop = async () => {
      await Promise.resolve();
      if (isMounted) stopPlayback();
    };
    performStop();
    return () => { isMounted = false; };
  }, [selectedBook.id, selectedChapter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playingRef.current = false;
      Speech.stop();
    };
  }, []);

  const getChapterVerses = useCallback(() => {
    return bibleVerses.filter(
      v => v.book_id === selectedBook.id && v.chapter === selectedChapter
    );
  }, [selectedBook.id, selectedChapter]);

  const speakVerseRef = useRef<(verses: Verse[], index: number) => void>(() => {});

  const advanceToNextChapterRef = useRef<() => void>(() => {});

  const speakVerse = useCallback((verses: Verse[], index: number) => {
    if (!playingRef.current) {
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    // Chapter finished — auto-advance to next chapter
    if (index >= verses.length) {
      setCurrentVerseIndex(0);
      verseIndexRef.current = 0;
      // Small pause before next chapter
      setTimeout(() => {
        if (playingRef.current) {
          advanceToNextChapterRef.current();
        }
      }, 600);
      return;
    }

    const verse = verses[index];
    verseIndexRef.current = index;
    setCurrentVerseIndex(index);

    const isEn = audioLangRef.current === 'en';
    const text = isEn ? verse.text_en : verse.text_te;
    const speechLang = isEn ? 'en-US' : 'te-IN';

    Speech.speak(text, {
      language: speechLang,
      rate: isEn ? 0.95 : 0.85,
      pitch: 1.0,
      onDone: () => {
        if (playingRef.current) {
          speakVerseRef.current(verses, index + 1);
        }
      },
      onError: () => {
        if (playingRef.current) {
          speakVerseRef.current(verses, index + 1);
        }
      },
    });
  }, []);

  useEffect(() => {
    speakVerseRef.current = speakVerse;
  }, [speakVerse]);

  // advanceToNextChapter: load next chapter (or next book) and continue playing
  useEffect(() => {
    advanceToNextChapterRef.current = () => {
      const book = selectedBookRef.current;
      const chapter = selectedChapterRef.current;

      if (chapter < book.chaptersCount) {
        // Next chapter in same book
        const nextChapter = chapter + 1;
        selectedChapterRef.current = nextChapter;
        setSelectedChapter(nextChapter);
        const nextVerses = bibleVerses.filter(
          v => v.book_id === book.id && v.chapter === nextChapter
        );
        chapterVerses.current = nextVerses;
        verseIndexRef.current = 0;
        setCurrentVerseIndex(0);
        speakVerseRef.current(nextVerses, 0);
      } else {
        // Move to next book
        const currentBookIndex = bibleBooks.findIndex(b => b.id === book.id);
        if (currentBookIndex < bibleBooks.length - 1) {
          const nextBook = bibleBooks[currentBookIndex + 1];
          selectedBookRef.current = nextBook;
          selectedChapterRef.current = 1;
          setSelectedBook(nextBook);
          setSelectedChapter(1);
          const nextVerses = bibleVerses.filter(
            v => v.book_id === nextBook.id && v.chapter === 1
          );
          chapterVerses.current = nextVerses;
          verseIndexRef.current = 0;
          setCurrentVerseIndex(0);
          speakVerseRef.current(nextVerses, 0);
        } else {
          // Reached end of Bible
          playingRef.current = false;
          setIsPlaying(false);
        }
      }
    };
  }, []);

  const startPlayback = async () => {
    setIsLoading(true);
    try {
      await Speech.stop();
    } catch { /* ignore */ }

    const verses = getChapterVerses();
    chapterVerses.current = verses;

    if (verses.length === 0) {
      setIsLoading(false);
      return;
    }

    playingRef.current = true;
    setIsPlaying(true);
    setIsLoading(false);

    const startIndex = verseIndexRef.current < verses.length ? verseIndexRef.current : 0;
    speakVerse(verses, startIndex);
  };


  const skipVerse = async (dir: 1 | -1) => {
    const verses = chapterVerses.current.length > 0 ? chapterVerses.current : getChapterVerses();
    chapterVerses.current = verses;
    const next = Math.max(0, Math.min(verses.length - 1, verseIndexRef.current + dir));
    verseIndexRef.current = next;
    setCurrentVerseIndex(next);
    if (isPlaying) {
      try { await Speech.stop(); } catch { /* ignore */ }
      speakVerse(verses, next);
    }
  };

  const jumpToVerse = async (index: number) => {
    const verses = chapterVerses.current.length > 0 ? chapterVerses.current : getChapterVerses();
    chapterVerses.current = verses;
    verseIndexRef.current = index;
    setCurrentVerseIndex(index);
    if (isPlaying) {
      try { await Speech.stop(); } catch { /* ignore */ }
      speakVerse(verses, index);
    }
  };

  const displayVerses = getChapterVerses();
  const currentVerse = displayVerses[currentVerseIndex];
  const progress = displayVerses.length > 0 ? (currentVerseIndex + 1) / displayVerses.length : 0;

  const chapters = Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Compact Hero Player Card ──────────────────────────────── */}
        <View style={[styles.playerCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={[styles.accentStrip, { backgroundColor: theme.accent }]} />

          {/* Header Row: Book Icon/Cover + Book Name/Chapter + Language Switcher */}
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.bookInfoContainer} 
              onPress={() => setBookModalVisible(true)}
            >
              <Animated.View style={[styles.compactAlbumArt, { backgroundColor: theme.accentBg, borderColor: theme.accent, transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="book" size={20} color={theme.accent} />
              </Animated.View>
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitleCompact, { color: theme.text }]} numberOfLines={1}>
                  {selectedBook.name_te} {selectedChapter} <Ionicons name="chevron-down" size={12} color={theme.accent} />
                </Text>
                <Text style={[styles.trackSubCompact, { color: theme.textSecondary }]} numberOfLines={1}>
                  {selectedBook.name_en} · Ch {selectedChapter} of {selectedBook.chaptersCount}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Compact Language Toggle */}
            <View style={[styles.compactLangToggle, { backgroundColor: theme.border }]}>
              <TouchableOpacity
                style={[
                  styles.compactLangOption,
                  audioLang === 'te' && { backgroundColor: theme.backgroundElement }
                ]}
                onPress={() => handleLangChange('te')}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.compactLangText,
                  { color: audioLang === 'te' ? theme.accent : theme.textSecondary }
                ]}>
                  TE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.compactLangOption,
                  audioLang === 'en' && { backgroundColor: theme.backgroundElement }
                ]}
                onPress={() => handleLangChange('en')}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.compactLangText,
                  { color: audioLang === 'en' ? theme.accent : theme.textSecondary }
                ]}>
                  EN
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Selectors Row */}
          <View style={styles.compactSelectorsRow}>
            <TouchableOpacity 
              style={[styles.compactSelectorBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => setBookModalVisible(true)}
            >
              <Ionicons name="book-outline" size={12} color={theme.accent} />
              <Text style={[styles.compactSelectorBtnText, { color: theme.text }]} numberOfLines={1}>
                {selectedBook.name_en}
              </Text>
              <Ionicons name="chevron-down" size={10} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.compactSelectorBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => setChapterModalVisible(true)}
            >
              <Ionicons name="list" size={12} color={theme.accent} />
              <Text style={[styles.compactSelectorBtnText, { color: theme.text }]}>
                Ch {selectedChapter}
              </Text>
              <Ionicons name="chevron-down" size={10} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Current verse preview (highly compact, max 2 lines) */}
          {currentVerse && (
            <View style={[styles.compactVersePreview, { backgroundColor: theme.accentBg, borderColor: theme.accent }]}>
              <Text style={[styles.compactVerseText, { color: theme.text }]} numberOfLines={2}>
                <Text style={[styles.compactVerseNum, { color: theme.accent }]}>{currentVerse.chapter}:{currentVerse.verse} </Text>
                {audioLang === 'en' ? currentVerse.text_en : currentVerse.text_te}
              </Text>
            </View>
          )}

          {/* Progress & Waveform Combined Row */}
          <View style={styles.progressWaveformRow}>
            {/* Waveform on the left */}
            <View style={styles.compactWaveform}>
              {bars.slice(0, 16).map((bar, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.compactWaveBar,
                    {
                      backgroundColor: isPlaying ? theme.accent : theme.border,
                      transform: [{ scaleY: bar }],
                    },
                  ]}
                />
              ))}
            </View>

            {/* Progress Bar */}
            <View style={styles.compactProgressContainer}>
              <Text style={[styles.compactProgressLabel, { color: theme.textSecondary }]}>
                {currentVerseIndex + 1}/{displayVerses.length}
              </Text>
              <View style={[styles.compactProgressTrack, { backgroundColor: theme.border }]}>
                <View style={[styles.compactProgressFill, { width: `${progress * 100}%`, backgroundColor: theme.accent }]} />
              </View>
            </View>
          </View>

          {/* Controls: Prev, Stop, Play/Pause, Next */}
          <View style={styles.compactControls}>
            <TouchableOpacity style={[styles.compactIconBtn, { borderColor: theme.border }]} onPress={() => skipVerse(-1)}>
              <Ionicons name="play-skip-back" size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.compactIconBtn, { borderColor: theme.border }]} onPress={stopPlayback}>
              <Ionicons name="stop" size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            {isLoading ? (
              <View style={[styles.compactPlayBtn, { backgroundColor: theme.accent }]}>
                <ActivityIndicator color="#000" size="small" />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.compactPlayBtn, { backgroundColor: theme.accent }]}
                onPress={isPlaying ? pausePlayback : startPlayback}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#000" />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.compactIconBtn, { borderColor: theme.border }]} onPress={() => skipVerse(1)}>
              <Ionicons name="play-skip-forward" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* TTS notice */}
          <View style={styles.ttsNotice}>
            <Ionicons name="volume-medium" size={13} color={theme.textSecondary} />
            <Text style={[styles.ttsNoticeText, { color: theme.textSecondary }]}>
              Telugu Text-to-Speech · {displayVerses.length} verses
            </Text>
          </View>
        </View>

        {/* ── Book Selector Sheet ───────────────────────────────────── */}
        <Modal animationType="slide" transparent={true} visible={bookModalVisible} onRequestClose={() => setBookModalVisible(false)}>
          <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setBookModalVisible(false)} />
          <View style={[styles.sheet, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle, { color: theme.accent }]}>📖 పుస్తకము ఎంచుకోండి</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>Select Book</Text>

            <View style={[styles.testamentToggleContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <TouchableOpacity 
                style={[styles.testamentTab, selectedTestament === 'Old' && { backgroundColor: theme.accent }]}
                onPress={() => setSelectedTestament('Old')}
              >
                <Text style={[styles.testamentTabText, selectedTestament === 'Old' ? { color: '#000', fontWeight: 'bold' } : { color: theme.textSecondary }]}>
                  పాత నిబంధన (Old)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.testamentTab, selectedTestament === 'New' && { backgroundColor: theme.accent }]}
                onPress={() => setSelectedTestament('New')}
              >
                <Text style={[styles.testamentTabText, selectedTestament === 'New' ? { color: '#000', fontWeight: 'bold' } : { color: theme.textSecondary }]}>
                  నూతన నిబంధన (New)
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {bibleBooks.filter(b => b.testament === selectedTestament).map(b => {
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
                      userChangedChapterRef.current = true;
                      setSelectedBook(b);
                      setSelectedChapter(1);
                      setBookModalVisible(false);
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

            <TouchableOpacity style={[styles.sheetCloseBtn, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={() => setBookModalVisible(false)}>
              <Text style={[styles.sheetCloseBtnText, { color: theme.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* ── Chapter Selector Sheet ────────────────────────────────── */}
        <Modal animationType="slide" transparent={true} visible={chapterModalVisible} onRequestClose={() => setChapterModalVisible(false)}>
          <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setChapterModalVisible(false)} />
          <View style={[styles.sheet, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle, { color: theme.accent }]}>📑 అధ్యాయము ఎంచుకోండి</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>Select Chapter</Text>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.chapterGrid}>
                {chapters.map(ch => (
                  <TouchableOpacity
                    key={ch}
                    style={[
                      styles.chapterBtn,
                      {
                        backgroundColor: selectedChapter === ch ? theme.accent : theme.background,
                        borderColor: selectedChapter === ch ? theme.accent : theme.border,
                      },
                    ]}
                    onPress={() => {
                      userChangedChapterRef.current = true;
                      setSelectedChapter(ch);
                      setChapterModalVisible(false);
                    }}
                  >
                    <Text style={[styles.chapterBtnText, { color: selectedChapter === ch ? '#000' : theme.textSecondary }]}>
                      {ch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.sheetCloseBtn, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={() => setChapterModalVisible(false)}>
              <Text style={[styles.sheetCloseBtnText, { color: theme.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* ── Verse list ────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary, paddingHorizontal: 4 }]}>VERSES</Text>
        <View style={[styles.pickerCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {displayVerses.map((v, i) => (
            <TouchableOpacity
              key={v.verse}
              style={[
                styles.verseRow,
                { borderBottomColor: theme.border },
                i === currentVerseIndex && { backgroundColor: theme.accentBg },
              ]}
              onPress={() => jumpToVerse(i)}
            >
              <Text style={[styles.verseRowNum, { color: theme.accent }]}>{v.verse}</Text>
              <Text style={[styles.verseRowText, { color: i === currentVerseIndex ? theme.text : theme.textSecondary }]} numberOfLines={2}>
                {audioLang === 'en' ? v.text_en : v.text_te}
              </Text>
              {i === currentVerseIndex && isPlaying && (
                <Ionicons name="volume-medium" size={14} color={theme.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 48, gap: 14 },

  // ── Player card
  playerCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 8,
  },
  accentStrip: { height: 4, width: '100%', marginBottom: 6 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 6,
  },
  bookInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  compactAlbumArt: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  trackTitleCompact: {
    fontSize: 15,
    fontWeight: '800',
  },
  trackSubCompact: {
    fontSize: 11,
    marginTop: -2,
  },
  compactLangToggle: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 2,
    width: 80,
  },
  compactLangOption: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactLangText: {
    fontSize: 10,
    fontWeight: '800',
  },
  compactSelectorsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  compactSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  compactSelectorBtnText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  compactVersePreview: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  compactVerseText: {
    fontSize: 12,
    lineHeight: 18,
  },
  compactVerseNum: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressWaveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  compactWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 2,
  },
  compactWaveBar: {
    width: 2,
    height: 20,
    borderRadius: 1,
  },
  compactProgressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactProgressLabel: {
    fontSize: 10,
    minWidth: 28,
    textAlign: 'center',
  },
  compactProgressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  compactControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  compactPlayBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  compactIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  ttsNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  ttsNoticeText: { fontSize: 11 },

  // ── Pickers
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  pickerCard: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 8 },

  bookChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  bookChipText: { fontSize: 12, fontWeight: '600' },

  chapterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chapterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterBtnText: { fontSize: 13, fontWeight: '600' },

  // ── Verse list
  verseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  verseRowNum: { fontSize: 11, fontWeight: '700', width: 24, textAlign: 'right' },
  verseRowText: { flex: 1, fontSize: 13, lineHeight: 19 },
  selectorButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
    width: '90%',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  selectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  selectorBtnText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
  },
  sheetSubtitle: {
    fontSize: 11,
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
    fontSize: 14,
    fontWeight: '700',
  },
  sheetItemEn: {
    fontSize: 11,
  },
  sheetCloseBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCloseBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  testamentToggleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    gap: 6,
  },
  testamentTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testamentTabText: {
    fontSize: 11,
    textAlign: 'center',
  },
});
