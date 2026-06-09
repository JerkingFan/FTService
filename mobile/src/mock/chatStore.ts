import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChatMessage, Conversation, Part } from "../types";

const KEY = "ftservice_mock_chat";

type Store = {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  nextConvId: number;
  nextMsgId: number;
};

const DEFAULT: Store = {
  conversations: [],
  messages: {},
  nextConvId: 1,
  nextMsgId: 1,
};

async function load(): Promise<Store> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
}

async function save(store: Store) {
  await AsyncStorage.setItem(KEY, JSON.stringify(store));
}

export const mockChatStore = {
  async listConversations(): Promise<Conversation[]> {
    const s = await load();
    return [...s.conversations].sort(
      (a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
    );
  },

  async unreadCount(): Promise<number> {
    const list = await this.listConversations();
    return list.reduce((n, c) => n + c.unread_count, 0);
  },

  async startConversation(part: Part, buyerId: number, message?: string): Promise<Conversation> {
    const s = await load();
    let conv = s.conversations.find((c) => c.part_id === part.id);
    const now = new Date().toISOString();
    if (!conv) {
      conv = {
        id: s.nextConvId++,
        part_id: part.id,
        part_title: part.title,
        part_image_url: part.image_url,
        peer_name: part.seller,
        peer_id: 99,
        last_message: null,
        last_message_at: now,
        unread_count: 0,
      };
      s.conversations.push(conv);
      s.messages[String(conv.id)] = [];
    }
    if (message?.trim()) {
      const msg: ChatMessage = {
        id: s.nextMsgId++,
        conversation_id: conv.id,
        sender_id: buyerId,
        body: message.trim(),
        created_at: now,
        is_mine: true,
      };
      s.messages[String(conv.id)].push(msg);
      conv.last_message = msg.body;
      conv.last_message_at = now;
    }
    await save(s);
    return conv;
  },

  async getMessages(conversationId: number, userId: number): Promise<ChatMessage[]> {
    const s = await load();
    const conv = s.conversations.find((c) => c.id === conversationId);
    if (conv) conv.unread_count = 0;
    await save(s);
    return (s.messages[String(conversationId)] || []).map((m) => ({
      ...m,
      is_mine: m.sender_id === userId,
    }));
  },

  async sendMessage(conversationId: number, userId: number, body: string): Promise<ChatMessage> {
    const s = await load();
    const conv = s.conversations.find((c) => c.id === conversationId);
    if (!conv) throw new Error("Диалог не найден");
    const now = new Date().toISOString();
    const msg: ChatMessage = {
      id: s.nextMsgId++,
      conversation_id: conversationId,
      sender_id: userId,
      body: body.trim(),
      created_at: now,
      is_mine: true,
    };
    const list = s.messages[String(conversationId)] || [];
    list.push(msg);
    s.messages[String(conversationId)] = list;
    conv.last_message = msg.body;
    conv.last_message_at = now;
    await save(s);
    return msg;
  },
};
