import AsyncStorage from '@react-native-async-storage/async-storage';

const CONVERSATIONS_KEY = 'chat_conversations';
const MESSAGES_PREFIX = 'chat_messages_';

export interface ChatMessage {
  id?: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'model';
  content: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  email: string;
  title: string;
  language: 'te' | 'en';
  created_at: string;
  updated_at: string;
}

/**
 * Create a new conversation for a user
 */
export async function createConversation(
  userId: string,
  email: string,
  language: 'te' | 'en' = 'te'
): Promise<Conversation | null> {
  try {
    const raw = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    const conversations: Conversation[] = raw ? JSON.parse(raw) : [];

    const newConv: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      user_id: userId,
      email: email.toLowerCase(),
      language,
      title: language === 'en' ? 'New Chat' : 'కొత్త చాట్',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    conversations.push(newConv);
    await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    return newConv;
  } catch (err) {
    console.error('createConversation error:', err);
    return null;
  }
}

/**
 * Get recent conversations for a user
 */
export async function getConversations(userId: string, limit = 10): Promise<Conversation[]> {
  try {
    const raw = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const conversations: Conversation[] = JSON.parse(raw);

    // Filter conversations belonging to this user
    const filtered = conversations.filter(
      c => c.user_id === userId || c.email.toLowerCase() === userId.toLowerCase()
    );

    // Sort by updated_at descending
    filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return filtered.slice(0, limit);
  } catch (err) {
    console.error('getConversations error:', err);
    return [];
  }
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  try {
    const key = `${MESSAGES_PREFIX}${conversationId}`;
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('getConversationMessages error:', err);
    return [];
  }
}

/**
 * Save a message to a conversation
 */
export async function saveMessage(
  conversationId: string,
  userId: string,
  role: 'user' | 'model',
  content: string
): Promise<ChatMessage | null> {
  try {
    const key = `${MESSAGES_PREFIX}${conversationId}`;
    const raw = await AsyncStorage.getItem(key);
    const messages: ChatMessage[] = raw ? JSON.parse(raw) : [];

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      created_at: new Date().toISOString(),
    };

    messages.push(newMsg);
    await AsyncStorage.setItem(key, JSON.stringify(messages));

    // Update conversation updated_at timestamp
    const convsRaw = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    if (convsRaw) {
      const conversations: Conversation[] = JSON.parse(convsRaw);
      const index = conversations.findIndex(c => c.id === conversationId);
      if (index !== -1) {
        conversations[index].updated_at = new Date().toISOString();
        await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
      }
    }

    return newMsg;
  } catch (err) {
    console.error('saveMessage error:', err);
    return null;
  }
}

/**
 * Delete a conversation and its messages
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    if (raw) {
      const conversations: Conversation[] = JSON.parse(raw);
      const next = conversations.filter(c => c.id !== conversationId);
      await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(next));
    }

    const msgKey = `${MESSAGES_PREFIX}${conversationId}`;
    await AsyncStorage.removeItem(msgKey);
    return true;
  } catch (err) {
    console.error('deleteConversation error:', err);
    return false;
  }
}

