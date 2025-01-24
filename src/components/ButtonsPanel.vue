<template>
  <div class="buttons-panel flex flex-col items-center space-y-2 ml-2">
    <!-- 网络状态按钮 -->
    <button @click="openRegisterModal" class="icon-button" aria-label="网络状态">
      <font-awesome-icon :icon="['fas', 'globe']" :class="['w-6 h-6', isConnected ? 'text-green-600 hover:text-green-700' : 'text-red-500 hover:text-red-600']" />
    </button>

    <!-- 设置按钮 -->
    <button @click="toggleSettingsModal" class="icon-button" aria-label="设置">
      <font-awesome-icon :icon="['fas', 'gear']" class="w-6 h-6 text-gray-500 hover:text-gray-700" />
    </button>

    <!-- 发送图片按钮 -->
    <button @click="triggerImageUpload" class="icon-button" aria-label="发送图片">
      <font-awesome-icon :icon="['fas', 'image']" class="w-6 h-6 text-gray-500 hover:text-gray-700" />
    </button>

    <!-- 发送文本按钮 -->
    <button @click="sendText" class="icon-button" aria-label="发送文本">
      <font-awesome-icon :icon="['fas', 'paper-plane']" class="w-6 h-6 text-blue-500 hover:text-blue-700" />
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ButtonsPanel',
  props: {
    isConnected: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['triggerImageUpload', 'sendText', 'toggleSettingsModal', 'openRegisterModal'],
  setup(_, { emit }) {
    const triggerImageUpload = () => {
      emit('triggerImageUpload');
    };

    const sendText = () => {
      emit('sendText');
    };

    const toggleSettingsModal = () => {
      emit('toggleSettingsModal');
    };

    const openRegisterModal = () => {
      emit('openRegisterModal');
    };

    return {
      triggerImageUpload,
      sendText,
      toggleSettingsModal,
      openRegisterModal,
    };
  },
});
</script>

<style scoped>
.buttons-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 8px;
}

.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.3s, color 0.3s;
  font-size: 12px;
  color: #555;
}

.icon-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>

