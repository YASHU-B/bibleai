import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { getAssistantReply } from '@/lib/localAssistant';
import { addBookmark, loadBookmarks, Bookmark } from '@/lib/bookmarkStore';
import { createConversation, saveMessage, Conversation } from '@/lib/chatHistoryStore';
import { useNetworkStatus } from '@/lib/networkStatus';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function MobileAssistant() {
  const theme = useTheme();
  const params = useLocalSearchParams();
  const router = useRouter();
  const searchPrompt = params.prompt as string;
  const { isOnline } = useNetworkStatus();

  const [language, setLanguage] = useState<'te' | 'en'>('te');
  const [isForceOffline, setIsForceOffline] = useState(false);
  const isEffectiveOffline = !isOnline || isForceOffline;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: language === 'en'
        ? 'Hello! I am your Bible AI assistant. I can help you understand scripture, pray, and answer spiritual questions.\n\nTry asking:\n* "Explain Psalm 23"\n* "Prayer for exam"'
        : "షాలోం! నేను మీ బైబిల్ AI సహాయకుడిని. మీకు దేవుని వాక్యమును అర్థం చేసుకోవడంలో, ప్రార్థనలు తయారు చేసుకోవడంలో మరియు ఆధ్యాత్మిక ప్రశ్నలకు సమాధానం చెప్పడంలో నేను సహాయపడతాను.\n\nకిందని అడగండి:\n* 'కీర్తన 23 వివరించు'\n* 'పరీక్షల కోసం ప్రార్థన'"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedPrayers, setSavedPrayers] = useState<Bookmark[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [authToken, setAuthToken] = useState<string>("");
  
  const scrollViewRef = useRef<ScrollView>(null);
  const typingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const streamReply = (reply: string) => {
    let position = 0;
    setMessages(prev => [...prev, { role: 'model', content: '' }]);

    typingInterval.current = setInterval(() => {
      position += 2;
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (!last || last.role !== 'model') return next;
        next[next.length - 1] = { ...last, content: reply.slice(0, position) };
        return next;
      });

      if (position >= reply.length) {
        if (typingInterval.current) {
          clearInterval(typingInterval.current);
          typingInterval.current = null;
        }
        setIsLoading(false);
      }
    }, 18);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let reply: string;
      if (isEffectiveOffline) {
        // Fully offline — use local Bible knowledge base directly
        reply = await getAssistantReply(textToSend, [...messages, userMsg], language, '');
      } else {
        reply = await getAssistantReply(textToSend, [...messages, userMsg], language, authToken);
      }
      streamReply(reply);
      
      // Save messages locally (remote database storage is disabled as auth is removed)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (language === 'en' 
        ? 'AI question error. Please try again later.'
        : 'AI ప్రశ్న అపరాధం. దయచేసి తర్వాత ప్రయత్నించండి.');
      
      // Check if it's a quota error
      const isQuotaError = errorMessage.toLowerCase().includes('quota');
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: isQuotaError 
          ? (language === 'en'
            ? 'API quota exceeded. The AI service will be available again tomorrow.\n\nIn the meantime, you can ask spiritual questions and receive local responses based on the Bible.'
            : 'API కోటా ఖాళీ అయిపోయింది. AI సేవ రేపు మళ్లీ అందుబాటులో ఉంటుంది.\n\nఆ వరకు, మీరు ఆధ్యాత్మిక ప్రశ్నలను అడగవచ్చు మరియు బైబిల్ ఆధారంగా స్థానిక ప్రతిస్పందనలను పొందవచ్చు.')
          : `Sorry: ${errorMessage}` 
      }]);
      setIsLoading(false);
      console.warn('Assistant error:', err);
    }
  };

  // Parse URL search parameters on load
  useEffect(() => {
    if (searchPrompt && messages.length === 1) {
      setTimeout(() => {
        handleSend(searchPrompt);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchPrompt]);

  useEffect(() => {
    let isMounted = true;
    if (messages.length === 1 && messages[0].role === 'model') {
      const newContent = language === 'en'
        ? 'Hello! I am your Bible AI assistant. I can help you understand scripture, pray, and answer spiritual questions.\n\nTry asking:\n* "Explain Psalm 23"\n* "Prayer for exam"'
        : "షాలోం! నేను మీ బైబిల్ AI సహాయకుడిని. మీకు దేవుని వాక్యమును అర్థం చేసుకోవడంలో, ప్రార్థనలు తయారు చేసుకోవడంలో మరియు ఆధ్యాత్మిక ప్రశ్నలకు సమాధానం చెప్పడంలో నేను సహాయపడతాను.\n\nకిందని అడగండి:\n* 'కీర్తన 23 వివరించు'\n* 'పరీక్షల కోసం ప్రార్థన'";
      if (messages[0].content !== newContent) {
        const updateMsg = async () => {
          await Promise.resolve();
          if (isMounted) {
            setMessages(prev => [{ ...prev[0], content: newContent }]);
          }
        };
        updateMsg();
      }
    }
    return () => {
      isMounted = false;
    };
  }, [language, messages]);

  useEffect(() => {
    const loadSaved = async () => {
      const stored = await loadBookmarks();
      setSavedPrayers(stored);
    };

    loadSaved();
  }, []);

  // Remote token initialization removed because auth is disabled

  useEffect(() => {
    return () => {
      if (typingInterval.current) {
        clearInterval(typingInterval.current);
        typingInterval.current = null;
      }
    };
  }, []);

  const handleShare = async (text: string) => {
    try {
      await Share.share({ message: text });
    } catch (err) {
      console.log(err);
    }
  };

  const handleSave = async (text: string) => {
    try {
      const updated = await addBookmark(undefined, text);
      setSavedPrayers(updated);
      Alert.alert('Saved', 'Prayer saved to your bookmarks.');
    } catch (err) {
      console.warn('Failed to save bookmark', err);
      Alert.alert('Unable to save', 'Unable to save this prayer right now.');
    }
  };

  const suggestions = language === 'en' ? [
    'Explain Psalm 23',
    'Prayer for exam',
    'Verses for anxiety',
    'Proverbs 3:5-6 meaning',
    'Tell me about prayer',
    'What is the Bible',
    'Who am I',
    'John 3:16'
  ] : [
    "కీర్తన 23 వివరించు",
    "పరీక్షల కోసం ప్రార్థన",
    "ఆందోళనకు వచ్యాలు",
    "ప్రోవరబ్స్ 3:5-6 అర్థం",
    "ప్రార్థన గురించి చెప్పు",
    "పరిశుద్ధ గ్రంథం ఏమిటి",
    "నేను ఎవరు",
    "యోహాను 3:16"
  ];

  return (
    <KeyboardAvoidingView 
      behavior="padding"
      style={[styles.container, { backgroundColor: theme.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
    >
      
      {/* Language & Offline selector */}
      <View style={[styles.langSelector, { borderBottomColor: theme.border, backgroundColor: theme.background }]}> 
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => setLanguage('te')} style={[styles.langBtn, language === 'te' ? styles.langBtnActive : null, { backgroundColor: language === 'te' ? theme.accent : theme.backgroundElement, borderColor: theme.border }]}> 
            <Text style={[styles.langText, language === 'te' && { color: theme.background }]}>{'తెలుగు'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLanguage('en')} style={[styles.langBtn, language === 'en' ? styles.langBtnActive : null, { backgroundColor: language === 'en' ? theme.accent : theme.backgroundElement, borderColor: theme.border }]}> 
            <Text style={[styles.langText, language === 'en' && { color: theme.background }]}>{'EN'}</Text>
          </TouchableOpacity>
        </View>

        {/* Offline AI Assistant Indicator (shown only when offline) */}
        {!isOnline && (
          <View style={[styles.offlineIndicator, { backgroundColor: theme.accentBg, borderColor: theme.accent }]}>
            <Ionicons name="cloud-offline" size={14} color={theme.accent} />
            <Text style={[styles.offlineIndicatorText, { color: theme.accent }]}>
              {language === 'te' ? 'ఆఫ్‌లైన్ AI సహాయకుడు' : 'Offline AI Assistant'}
            </Text>
          </View>
        )}
      </View>

      {/* Offline banner indicating predefined prompts only */}
      {isEffectiveOffline && (
        <View style={[styles.offlineBanner, { backgroundColor: theme.accentBg, borderColor: theme.accent }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.accent} />
          <Text style={[styles.offlineBannerText, { color: theme.text }]}>
            {language === 'te' 
              ? 'ఆఫ్‌లైన్ మోడ్ సక్రియంగా ఉంది. AI ముందే నిర్ణయించిన ప్రశ్నలకు మాత్రమే సమాధానం ఇవ్వగలదు.' 
              : 'Offline Mode is active. AI will respond to predefined prompts only.'}
          </Text>
        </View>
      )}

      {/* Suggestions bar */}
      <View style={[styles.suggestBar, { borderBottomColor: theme.border }]}>
        {isEffectiveOffline && (
          <Text style={[styles.suggestHeader, { color: theme.accent, paddingHorizontal: 16, marginBottom: 4 }]}>
            {language === 'te' ? 'ఆఫ్‌లైన్‌లో అందుబాటులో ఉన్న ప్రశ్నలు:' : 'Available Offline Prompts:'}
          </Text>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestScroll}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={i} style={[styles.suggestChip, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} onPress={() => handleSend(s)}>
              <Text style={[styles.suggestText, { color: theme.text }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView 
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, index) => {
          const isModel = msg.role === 'model';
          return (
            <View 
              key={index}
              style={[styles.msgWrapper, isModel ? styles.msgModelAlign : styles.msgUserAlign]}
            >
              <View style={[styles.msgBubble, isModel ? [styles.msgBubbleModel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }] : styles.msgBubbleUser]}>
                <Text style={[styles.msgText, isModel ? [styles.msgTextModel, { color: theme.text }] : styles.msgTextUser]}>
                  {msg.content}
                </Text>
              </View>

              {isModel && index !== 0 && (
                <View style={styles.msgActions}>
                  <TouchableOpacity style={styles.msgActionBtn} onPress={() => handleShare(msg.content)}>
                    <Ionicons name="share-social-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.msgActionText, { color: theme.textSecondary }]}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.msgActionBtn} onPress={() => handleSave(msg.content)}>
                    <Ionicons name="bookmark-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.msgActionText, { color: theme.textSecondary }]}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {isLoading && (
          <View style={[styles.msgWrapper, styles.msgModelAlign]}>
            <View style={[styles.msgBubble, styles.msgBubbleModel, styles.loadingBubble]}>
              <ActivityIndicator size="small" color="#F59E0B" style={{ marginRight: 6 }} />
              <Text style={styles.loadingText}>ఆలోచిస్తున్నాను (Typing)...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Tray */}
      <View style={[styles.inputTray, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <TextInput 
          placeholder={language === 'en' ? 'Ask a question or request prayer...' : 'ప్రశ్న అడగండి లేదా ప్రార్థన కోరండి...'}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]}
          value={input}
          onChangeText={setInput}
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, { backgroundColor: theme.accent }, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend(input)}
          disabled={!input.trim() || isLoading}
        >
          <Ionicons name="send" size={18} color={theme.background} />
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  suggestBar: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
  },
  suggestScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  suggestText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 16,
  },
  msgWrapper: {
    maxWidth: '80%',
    gap: 4,
  },
  msgModelAlign: {
    alignSelf: 'flex-start',
  },
  msgUserAlign: {
    alignSelf: 'flex-end',
  },
  msgBubble: {
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  msgBubbleModel: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderTopLeftRadius: 4,
  },
  langSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  offlineToggleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  offlineIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  switchTrack: {
    width: 26,
    height: 14,
    borderRadius: 7,
    padding: 1,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  suggestHeader: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  offlineBannerText: {
    fontSize: 11,
    fontWeight: '500',
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  langBtnActive: {
    borderWidth: 1,
  },
  langText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  msgBubbleUser: {
    backgroundColor: '#8B5CF6',
    borderTopRightRadius: 4,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 20,
  },
  msgTextModel: {
    color: '#E2E8F0',
  },
  msgTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  msgActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  msgActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  msgActionText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: 'bold',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  inputTray: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(9, 13, 22, 0.95)',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    color: '#F1F5F9',
    fontSize: 13,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
