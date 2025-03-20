<template>
  <div class="message-input-container flex flex-col space-y-4">
    <!-- 输入区域 -->
    <div class="input-area flex-1 flex">
      <textarea
        v-model="message"
        placeholder="Type your message here..."
        @keypress.enter.prevent="handleSend"
        @keypress.shift.enter="addLine"
        class="w-full p-4 rounded-lg resize-none focus:outline-none bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-white border-0"
      ></textarea>
      <!-- 按钮面板 -->
      <ButtonsPanel 
        @triggerImageUpload="triggerImageUpload" 
        @sendText="sendText" 
        @toggleSettingsModal="toggleSettingsModal" 
        @openRegisterModal="openRegisterModal" 
        :isConnected="isConnected"
      />
    </div>
    <!-- 文件上传（隐藏的） -->
    <input
      type="file"
      id="imageInput"
      accept="image/*"
      @change="sendImage"
      ref="imageInput"
      style="display: none;"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { sendTextMessage, sendImageMessage } from '../services/SendingService';
import { useChatStore } from '../stores/useChatStore';
import ButtonsPanel from './ButtonsPanel.vue';

export default defineComponent({
  name: 'MessageInput',
  components: {
    ButtonsPanel,
  },
  emits: ['toggleSettingsModal', 'openRegisterModal'],
  setup(_, { emit }) {
    const message = ref('');
    const store = useChatStore();

    const handleSend = () => {
      sendText();
    };

    const addLine = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === 'Enter') {
        message.value += '\n';
      }
    };

    const sendText = async (clipRegIndex?: number) => {
      const content = message.value.trim();
      if (!content) return;
      
      try {
        // 根据是否有剪切板寄存器索引选择不同的消息发送方式
        if (clipRegIndex !== undefined) {
          // 发送到剪切板寄存器
          console.log(`发送内容到剪切板寄存器${clipRegIndex+1}`); 
          await sendTextMessage(content, clipRegIndex);
        } else {
          // 普通发送
          await sendTextMessage(content);
        }
        message.value = ''; // 清空输入框
      } catch (error) {
        console.log('消息发送失败:', error);
      }
    };

    const sendImage = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        try {
          await sendImageMessage(file);
        } catch (error) {
          console.error('图片发送失败:', error);
        }
      }
    };

    const imageInput = ref<HTMLInputElement | null>(null);

    const triggerImageUpload = () => {
      imageInput.value?.click();
    };

    // 网络连接状态
    const isConnected = computed(() => store.isConnected);

    // 打开设置模态框
    const toggleSettingsModal = () => {
      emit('toggleSettingsModal');
    };

    // 打开 Register 模态框
    const openRegisterModal = () => {
      emit('openRegisterModal');
    };

    return {
      message,
      sendText,
      sendImage,
      handleSend,
      addLine,
      triggerImageUpload,
      imageInput,
      isConnected,
      toggleSettingsModal,
      openRegisterModal,
    };
  },
});
</script>

<style scoped>
.input-area {
  display: flex;
  flex: 1;
}

.input-area textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: 0.75rem;
  resize: none;
  font-size: 14px;
  font-family: Arial, sans-serif;
  outline: none;
  background-color: #f0f0f0;
  color: #333;
}

.progress-bar {
  height: 100%;
  background-color: #007bff;
  transition: width 0.5s ease;
}

@media (max-width: 600px) {
  .input-toolbar {
    gap: 8px;
  }

  .input-area textarea {
    height: 40px;
    padding: 10px 14px;
    font-size: 12px;
  }
}
</style>

