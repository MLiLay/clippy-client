import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Message {
  type: 'text' | 'image';
  content: string;
  userId: string;
  timestamp: string;
  clipReg?: number;  // 剪切板寄存器索引，范围0-4，仅text类型可能有值
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

