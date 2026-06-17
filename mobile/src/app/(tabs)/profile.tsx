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
import { useTheme } from '@/hooks/use-theme';
import { Bookmark, loadBookmarks, removeBookmark } from '@/lib/bookmarkStore';
import { languagePreferenceService } from '@/lib/languagePreferenceService';

export default function MobileProfile() {
  const theme = useTheme();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [lang, setLang] = useState<'te' | 'en'>('te');

  const handleToggleLanguage = async () => {
    const nextLang = lang === 'te' ? 'en' : 'te';
    await languagePreferenceService.setLanguage(nextLang);
    setLang(nextLang);
    Alert.alert(
      nextLang === 'te' ? 'భాష మార్చబడింది' : 'Language Updated',
      nextLang === 'te' ? 'యాప్ భాష తెలుగులోకి మార్చబడింది.' : 'App language set to English.'
    );
  };

  useEffect(() => {
    const loadSavedBookmarks = async () => {
      const storedBookmarks = await loadBookmarks();
      setBookmarks(storedBookmarks);
    };

    const loadLang = async () => {
      const currentLang = await languagePreferenceService.getLanguage();
      setLang(currentLang);
    };

    loadSavedBookmarks();
    loadLang();
  }, []);

  const handleRemoveBookmark = async (bookmarkId: string) => {
    const updatedBookmarks = await removeBookmark(bookmarkId);
    setBookmarks(updatedBookmarks);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      
      {/* Saved Bookmarks list */}
      <View style={[styles.section, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text, borderBottomColor: theme.border }]}>
          <Ionicons name="bookmark" size={16} color={theme.accent} /> సేవ్‌ చేసిన వాక్యాలు (Saved Bookmarks)
        </Text>
        
        {bookmarks.length > 0 ? (
            bookmarks.map((bookmark) => (
              <View key={bookmark.id} style={[styles.bookmarkRow, { backgroundColor: theme.background, borderColor: theme.border }]}> 
                <View style={styles.bookmarkRowContent}>
                  <Text style={[styles.bookmarkText, { color: theme.textSecondary }]} numberOfLines={3}>{bookmark.content}</Text>
                  <Text style={[styles.bookmarkMeta, { color: theme.textSecondary }]}>Saved {new Date(bookmark.createdAt).toLocaleDateString()}</Text>
                  {(bookmark.bookId || bookmark.chapter || bookmark.verse) && (
                    <Text style={[styles.bookmarkMeta, { color: theme.textSecondary }]}>Verse: {bookmark.bookId ?? '-'}:{bookmark.chapter ?? '-'}:{bookmark.verse ?? '-'}</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveBookmark(bookmark.id)}>
                  <Ionicons name="trash" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>You have no saved bookmarks yet. Save a verse or prayer in the Assistant tab.</Text>
          )}
      </View>

      {/* Settings panel */}
      <View style={[styles.section, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text, borderBottomColor: theme.border }]}>
          <Ionicons name="settings" size={16} color="#3B82F6" /> యాప్ సెట్టింగ్స్ (App Settings)
        </Text>
        
        {/* Language setting toggle option */}
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: 'transparent' }]}
          onPress={handleToggleLanguage}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="language" size={20} color={theme.accent} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>భాష / Language</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.settingValue, { color: theme.accent }]}>
              {lang === 'te' ? 'తెలుగు (Telugu)' : 'English'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* 4. Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>Bible AI | Version 1.0.0</Text>
        <Text style={[styles.footerSubText, { color: theme.textSecondary, opacity: 0.6 }]}>com.bibleai.app</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
    gap: 20,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#090D16',
    fontSize: 22,
    fontWeight: 'bold',
  },
  bio: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  email: {
    color: '#94A3B8',
    fontSize: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
    gap: 4,
  },
  bookmarkRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  bookmarkRowContent: {
    flex: 1,
    gap: 6,
  },
  bookmarkText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  bookmarkMeta: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 8,
  },
  removeButton: {
    padding: 6,
    alignSelf: 'flex-start',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  prayerRequestInputRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flexWrap: 'wrap',
  },
  prayerRequestInput: {
    flex: 1,
    minHeight: 48,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    color: '#E2E8F0',
    fontSize: 12,
  },
  prayerRequestButton: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prayerRequestButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  prayerRequestItem: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  prayerRequestText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#E2E8F0',
  },
  prayerRequestMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  prayerRequestMeta: {
    color: '#94A3B8',
    fontSize: 11,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
  settingValue: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  footerText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  footerSubText: {
    color: '#475569',
    fontSize: 9,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    marginTop: 16,
  },
  quickButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
