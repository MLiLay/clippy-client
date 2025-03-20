<template>
  <div class="flex flex-col items-center space-y-2 ml-2">
    <!-- 网络状态按钮 -->
    <button @click="$emit('openRegisterModal')" class="bg-transparent border-none cursor-pointer rounded-full transition-colors p-1 hover:bg-gray-100" aria-label="网络状态">
      <font-awesome-icon :icon="['fas', 'globe']" class="w-6 h-6" :class="isConnected ? 'text-green-600 hover:text-green-700' : 'text-red-500 hover:text-red-600'" />
    </button>

    <!-- 设置按钮 -->
    <button @click="$emit('toggleSettingsModal')" class="bg-transparent border-none cursor-pointer rounded-full transition-colors p-1 hover:bg-gray-100" aria-label="设置">
      <font-awesome-icon :icon="['fas', 'gear']" class="w-6 h-6 text-gray-500 hover:text-gray-700" />
    </button>

    <!-- 发送图片按钮 -->
    <button @click="$emit('triggerImageUpload')" class="bg-transparent border-none cursor-pointer rounded-full transition-colors p-1 hover:bg-gray-100" aria-label="发送图片">
      <font-awesome-icon :icon="['fas', 'image']" class="w-6 h-6 text-gray-500 hover:text-gray-700" />
    </button>

    <!-- 发送文本按钮组 -->
    <div class="relative flex items-center">
      <!-- 发送文本按钮 -->
      <button @click="$emit('sendText')" class="bg-transparent border-none cursor-pointer rounded-full transition-colors p-1 hover:bg-gray-100" aria-label="发送文本">
        <font-awesome-icon :icon="['fas', 'paper-plane']" class="w-6 h-6 text-blue-500 hover:text-blue-700" />
      </button>
      
      <!-- 下拉按钮 -->
      <div class="relative ml-1">
        <button 
          @click.stop="showDropdown = !showDropdown" 
          class="bg-gray-200 rounded-full p-1 flex items-center justify-center w-[18px] h-[18px] cursor-pointer transition-colors hover:bg-gray-300" 
          aria-label="发送选项"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <div 
          v-if="showDropdown" 
          class="absolute z-10 right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-32 min-w-[120px] max-h-[200px] overflow-y-auto"
        >
          <div class="text-xs text-gray-500 px-4 py-1 border-b border-gray-100">剪切板寄存器</div>
          <div class="grid grid-cols-5 gap-1 p-2">
            <button 
              v-for="i in 5" 
              :key="`reg-${i}`" 
              @click="sendTextToRegister(i-1)" 
              class="flex items-center justify-center p-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              {{ i }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// 定义组件属性
defineProps({
  isConnected: {
    type: Boolean,
    required: true,
  }
});

// 定义组件事件
const emit = defineEmits(['triggerImageUpload', 'sendText', 'toggleSettingsModal', 'openRegisterModal']);

const showDropdown = ref(false);

// 发送文本到指定寄存器
const sendTextToRegister = (registerIndex: number) => {
  emit('sendText', registerIndex);
  showDropdown.value = false;
};

// 点击外部关闭下拉菜单
const closeDropdown = () => {
  showDropdown.value = false;
};

// 生命周期钩子
onMounted(() => document.addEventListener('click', closeDropdown));
onUnmounted(() => document.removeEventListener('click', closeDropdown));
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

.send-button-group {
  display: flex;
  align-items: center;
}

.dropdown-toggle-btn {
  cursor: pointer;
  width: 18px;
  height: 18px;
  transition: background-color 0.3s;
}

.dropdown-toggle-btn:hover {
  background-color: #d1d5db;
}

.dropdown-menu {
  min-width: 120px;
  max-height: 200px;
  overflow-y: auto;
}
</style>

