<template>
  <div class="flex items-center space-x-3">
    <!-- 网络状态按钮 -->
    <button @click="$emit('openRegisterModal')" class="bg-transparent border-none cursor-pointer rounded-full transition-colors p-0.5 hover:bg-gray-100" aria-label="网络状态">
      <font-awesome-icon :icon="['fas', 'globe']" class="w-4 h-4" :class="isConnected ? 'text-green-600 hover:text-green-700' : 'text-red-500 hover:text-red-600'" />
    </button>

    <!-- 设置按钮 -->
    <button @click="$emit('toggleSettingsModal')" class="bg-transparent border-none cursor-pointer rounded-full transition-colors p-0.5 hover:bg-gray-100" aria-label="设置">
      <font-awesome-icon :icon="['fas', 'gear']" class="w-4 h-4 text-gray-500 hover:text-gray-700" />
    </button>

    <!-- 发送图片按钮 -->
    <button @click="$emit('triggerImageUpload')" class="bg-transparent border-none cursor-pointer rounded-full transition-colors p-0.5 hover:bg-gray-100" aria-label="发送图片">
      <font-awesome-icon :icon="['fas', 'image']" class="w-4 h-4 text-gray-500 hover:text-gray-700" />
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps({
  isConnected: {
    type: Boolean,
    required: true,
  }
});

defineEmits(['triggerImageUpload', 'toggleSettingsModal', 'openRegisterModal']);
</script>

<style scoped>
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

