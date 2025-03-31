import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Message {
  id?: number;
  type: 'text' | 'image';
  content: string;
  userId: string;
  timestamp: string;
  clipReg?: number;
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([]);

  const addMessage = (message: Message) => {
    messages.value.push(message);
  };

  const clearMessages = () => {
    messages.value = [];
  };

  return {
    messages,
    addMessage,
    clearMessages,
  };
});

