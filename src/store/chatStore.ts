import { create } from 'zustand';
import { Message, Conversation } from '@/types/messages';

interface ChatStore {
  // Conversations
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;

  // Messages
  messages: Map<string, Message[]>; // ConversationId -> Messages
  getMessages: (conversationId: string) => Message[];
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  removeMessage: (conversationId: string, messageId: string) => void;

  // Typing Indicators
  typingUsers: Set<string>; // User IDs currently typing
  setTypingUsers: (userIds: Set<string>) => void;
  addTypingUser: (userId: string) => void;
  removeTypingUser: (userId: string) => void;

  // Search
  searchQuery: string;
  searchResults: Message[];
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Message[]) => void;

  // UI State
  showOnlineStatus: boolean;
  setShowOnlineStatus: (show: boolean) => void;
  isLoadingMessages: boolean;
  setIsLoadingMessages: (loading: boolean) => void;

  // Notifications
  unreadCount: number;
  updateUnreadCount: (delta: number) => void;
  resetUnreadCount: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Conversations
  conversations: [],
  activeConversation: null,
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (conversation) => set({ activeConversation: conversation }),
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),
  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
      activeConversation:
        state.activeConversation?.id === id
          ? { ...state.activeConversation, ...updates }
          : state.activeConversation,
    })),
  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversation: state.activeConversation?.id === id ? null : state.activeConversation,
    })),

  // Messages
  messages: new Map(),
  getMessages: (conversationId) => {
    const messages = get().messages.get(conversationId);
    return messages || [];
  },
  setMessages: (conversationId, messages) =>
    set((state) => {
      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, messages);
      return { messages: newMessages };
    }),
  addMessage: (conversationId, message) =>
    set((state) => {
      const messages = state.messages.get(conversationId) || [];
      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, [...messages, message]);

      // Update conversation last message
      return {
        messages: newMessages,
        conversations: state.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: message,
                lastMessageAt: new Date(),
              }
            : c
        ),
      };
    }),
  updateMessage: (conversationId, messageId, updates) =>
    set((state) => {
      const messages = state.messages.get(conversationId) || [];
      const newMessages = new Map(state.messages);
      newMessages.set(
        conversationId,
        messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m))
      );
      return { messages: newMessages };
    }),
  removeMessage: (conversationId, messageId) =>
    set((state) => {
      const messages = state.messages.get(conversationId) || [];
      const newMessages = new Map(state.messages);
      newMessages.set(
        conversationId,
        messages.filter((m) => m.id !== messageId)
      );
      return { messages: newMessages };
    }),

  // Typing Indicators
  typingUsers: new Set(),
  setTypingUsers: (userIds) => set({ typingUsers: userIds }),
  addTypingUser: (userId) =>
    set((state) => {
      const newTypingUsers = new Set(state.typingUsers);
      newTypingUsers.add(userId);
      return { typingUsers: newTypingUsers };
    }),
  removeTypingUser: (userId) =>
    set((state) => {
      const newTypingUsers = new Set(state.typingUsers);
      newTypingUsers.delete(userId);
      return { typingUsers: newTypingUsers };
    }),

  // Search
  searchQuery: '',
  searchResults: [],
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),

  // UI State
  showOnlineStatus: true,
  setShowOnlineStatus: (show) => set({ showOnlineStatus: show }),
  isLoadingMessages: false,
  setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

  // Notifications
  unreadCount: 0,
  updateUnreadCount: (delta) =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount + delta),
    })),
  resetUnreadCount: () => set({ unreadCount: 0 }),
}));
