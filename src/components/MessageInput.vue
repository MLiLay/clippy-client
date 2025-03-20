<template>
  <div class="message-input-container flex flex-col space-y-4">
    <div class="input-area flex">
      <textarea
        v-model="message"
        placeholder="Type your message here..."
        @keydown.enter="(event) => {
          if (!event.shiftKey) {
            event.preventDefault();
            sendText();
          }
        }"
        class="w-full p-4 rounded-lg resize-none focus:outline-none bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-white border-0"
      ></textarea>
      
      <ButtonsPanel 
        @triggerImageUpload="imageInput?.click()" 
        @sendText="sendText" 
        @toggleSettingsModal="$emit('toggleSettingsModal')" 
        @openRegisterModal="$emit('openRegisterModal')" 
        :isConnected="connectionStore.isConnected"
      />
    </div>
    
    <input
      type="file"
      ref="imageInput"
      accept="image/*"
      @change="sendImage"
      class="hidden"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SendingService from '../services/SendingService';
import { useConnectionStore } from '../stores/useConnectionStore';
import ButtonsPanel from './ButtonsPanel.vue';

// 定义组件事件
defineEmits(['toggleSettingsModal', 'openRegisterModal']);

// 状态和存储
const message = ref('');
const imageInput = ref<HTMLInputElement | null>(null);
const connectionStore = useConnectionStore();

// 发送文本消息
const sendText = async (clipRegIndex?: number) => {
  const content = message.value.trim();
  if (!content) return;
  
  try {
    await SendingService.sendTextMessage(content, clipRegIndex);
    message.value = '';
  } catch (error) {
    console.error('消息发送失败:', error);
  }
};

// 发送图片消息
const sendImage = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  try {
    await SendingService.sendImageMessage(file);
    (event.target as HTMLInputElement).value = '';
  } catch (error) {
    console.error('图片发送失败:', error);
  }
};
</script>

<style scoped>
.input-area {
  flex: 1;
}

.input-area textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: 0.75rem;
  resize: none;
  font-size: 14px;
  outline: none;
  background-color: #f0f0f0;
  color: #333;
}

@media (max-width: 600px) {
  .input-area textarea {
    height: 40px;
    padding: 10px 14px;
    font-size: 12px;
  }
}
</style>

