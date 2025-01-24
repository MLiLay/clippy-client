<template>
  <div id="app" class="flex flex-col h-screen bg-gray-100 dark:bg-gray-800">
    <!-- 模态框 -->
    <Register v-if="showRegisterModal" @close="toggleRegisterModal" />
    <Settings v-if="showSettingsModal" @close="toggleSettingsModal" />

    <!-- 聊天区域 -->
    <div class="flex flex-col flex-1 p-4 space-y-4 overflow-hidden">
      <!-- MessagesList 卡片，固定在上方，可滚动 -->
      <div class="flex-1 overflow-auto rounded-lg bg-white dark:bg-gray-700 shadow-lg p-4">
        <MessagesList />
      </div>
      <!-- MessageInput 卡片，固定在下方 -->
      <div class="rounded-lg bg-white dark:bg-gray-700 shadow-lg p-4">
        <MessageInput 
          @toggleSettingsModal="toggleSettingsModal" 
          @openRegisterModal="toggleRegisterModal" 
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Register from './components/Register.vue';
import Settings from './components/Settings.vue';
import MessagesList from './components/MessagesList.vue';
import MessageInput from './components/MessageInput.vue';

export default defineComponent({
  name: 'App',
  components: {
    Register,
    Settings,
    MessagesList,
    MessageInput,
  },
  setup() {
    const showRegisterModal = ref(false);
    const showSettingsModal = ref(false);

    const toggleRegisterModal = () => {
      showRegisterModal.value = !showRegisterModal.value;
    };

    const toggleSettingsModal = () => {
      showSettingsModal.value = !showSettingsModal.value;
    };

    return {
      showRegisterModal,
      showSettingsModal,
      toggleRegisterModal,
      toggleSettingsModal,
    };
  },
});
</script>

<style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}
</style>

