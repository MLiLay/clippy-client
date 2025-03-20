<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="close-icon" @click="close" aria-label="关闭">
        <font-awesome-icon :icon="['fas', 'xmark']" />
      </button>
      <h2>Connect</h2>
      
      <form @submit.prevent="handleConnect">
        <div class="form-group">
          <input 
            v-model="form.serverAddress" 
            :disabled="isConnected"
            placeholder="Server Address (e.g., example.com)" 
            required
            @keyup.enter="handleConnect"
          />
        </div>
        <div class="form-group">
          <input 
            v-model="form.serverPort" 
            :disabled="isConnected"
            placeholder="Server Port (e.g., 8989)" 
            required
            @keyup.enter="handleConnect"
          />
        </div>
        <div class="form-group">
          <input 
            v-model="form.room" 
            :disabled="isConnected"
            placeholder="Room ID (Only include characters)" 
            required
            pattern="[A-Za-z0-9\-]+"
            @keyup.enter="handleConnect"
          />
        </div>
        <div class="form-group">
          <input 
            v-model="form.userId" 
            :disabled="isConnected"
            placeholder="User ID (Only include characters)" 
            required
            pattern="[A-Za-z0-9\-]+"
            @keyup.enter="handleConnect"
          />
        </div>
        
        <div class="buttons">
          <button
            type="submit"
            :disabled="isConnected"
            :class="['connect-button', { disabled: isConnected }]"
          >
            Connect
          </button>
          <button
            type="button"
            @click="handleDisconnect"
            :disabled="!isConnected"
            :class="['disconnect-button', { disabled: !isConnected, active: isConnected }]"
          >
            Disconnect
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, onMounted } from 'vue';
import { useConnectionStore } from '../stores/useConnectionStore';
import SocketService from '../services/SocketService';
import { Toast } from 'vant';

interface FormState {
  serverAddress: string;
  serverPort: string;
  room: string;
  userId: string;
}

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const connectionStore = useConnectionStore();

const form = reactive<FormState>({
  serverAddress: connectionStore.serverAddress,
  serverPort: connectionStore.serverPort || '8989',
  room: connectionStore.room,
  userId: connectionStore.userId
});

const isConnected = computed(() => connectionStore.isConnected);

const validateForm = (): boolean => {
  const { serverAddress, serverPort, room, userId } = form;
  
  if (!serverAddress.trim() || !serverPort.trim()) {
    Toast.fail('请输入服务器地址和端口');
    return false;
  }

  if (!room.trim() || !userId.trim()) {
    Toast.fail('请输入房间ID和用户ID');
    return false;
  }

  return true;
};

const updateConnectionStore = () => {
  const { serverAddress, serverPort, room, userId } = form;
  connectionStore.setServerAddress(serverAddress.trim());
  connectionStore.setServerPort(serverPort.trim());
  connectionStore.setRoom(room.trim());
  connectionStore.setUserId(userId.trim());
};

const handleConnect = async () => {
  if (!validateForm()) return;
  
  updateConnectionStore();
  
  Toast.loading({
    message: '正在连接服务器...',
    forbidClick: true,
    duration: 0
  });

  try {
    const url = `http://${form.serverAddress.trim()}:${form.serverPort.trim()}`;
    await SocketService.connect(url);
    await SocketService.register(form.room.trim(), form.userId.trim());
  } catch (error) {
    Toast.fail('连接失败，请重试');
    console.error('连接失败:', error);
  }
};

const handleDisconnect = async () => {
  try {
    Toast.loading({
      message: '正在断开连接...',
      forbidClick: true,
      duration: 1000
    });
    await SocketService.disconnect();
  } catch (error) {
    console.error('断开连接失败:', error);
    Toast.fail('断开连接失败，请重试');
  }
};

const close = () => emit('close');

onMounted(() => {
  if (!form.serverPort) {
    form.serverPort = '8989';
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  position: relative;
  background-color: white;
  padding: 2rem;
  border-radius: 1.5rem;
  width: min(400px, 90%);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.close-icon {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #555;
  transition: color 0.3s;
}

.close-icon:hover {
  color: #000;
}

h2 {
  margin: 0 0 1.25rem;
}

.form-group {
  margin-bottom: 1rem;
}

input {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #ccc;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #007bff;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.buttons {
  display: flex;
  gap: 0.625rem;
  margin-top: 1.5rem;
}

button {
  flex: 1;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s;
}

.connect-button {
  background-color: #007bff;
  color: white;
}

.connect-button:hover:not(.disabled) {
  background-color: #0056b3;
}

.disconnect-button {
  background-color: #dc3545;
  color: white;
}

.disconnect-button:hover:not(.disabled) {
  background-color: #c82333;
}

.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>

