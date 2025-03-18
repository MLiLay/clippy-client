<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="close-icon" @click="close" aria-label="关闭">
        <font-awesome-icon :icon="['fas', 'xmark']" class="w-5 h-5 text-gray-700 hover:text-gray-900" />
      </button>
      <h2>Connect</h2>
      <input 
        v-model="serverAddress" 
        :disabled="isConnected"
        placeholder="Server Address (e.g., example.com)" 
      />
      <input 
        v-model="serverPort" 
        :disabled="isConnected"
        placeholder="Server Port (e.g., 8989)" 
      />
      <input 
        v-model="room" 
        :disabled="isConnected"
        placeholder="Room ID (Only include characters)" 
      />
      <input 
        v-model="userId" 
        :disabled="isConnected"
        placeholder="User ID (Only include characters)" 
      />
      <div class="buttons">
        <button
          @click="handleConnect"
          :disabled="isConnected"
          :class="['connect-button', { disabled: isConnected }]"
          :aria-disabled="isConnected"
        >
          Connect
        </button>
        <button
          @click="handleDisconnect"
          :disabled="!isConnected"
          :class="['disconnect-button', { disabled: !isConnected }]"
          :aria-disabled="!isConnected"
        >
          Disconnect
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted } from 'vue';
import { useChatStore } from '../stores/useChatStore';
import SocketService from '../services/SocketService';
import { Toast } from 'vant';

export default defineComponent({
  name: 'Register',
  emits: ['close'],
  setup(_, { emit }) {
    const store = useChatStore();

    const serverAddress = computed({
      get: () => store.serverAddress,
      set: (value: string) => store.setServerAddress(value),
    });

    const serverPort = computed({
      get: () => store.serverPort,
      set: (value: string) => store.setServerPort(value),
    });

    const room = computed({
      get: () => store.room,
      set: (value: string) => store.setRoom(value),
    });

    const userId = computed({
      get: () => store.userId,
      set: (value: string) => store.setUserId(value),
    });

    const isConnected = computed(() => store.isConnected);

    const handleConnect = () => {
      const address = serverAddress.value.trim();
      const port = serverPort.value.trim();

      if (!address || !port) {
        Toast.fail('Please enter both Server Address and Server Port.');
        return;
      }

      if (store.room.trim() && store.userId.trim()) {
        Toast.loading({
          message: 'Connecting to server...',
          forbidClick: true,
          duration: 0
        });
        const url = `http://${address}:${port}`;
        SocketService.connect(url);
        SocketService.register(store.room, store.userId);
      } else {
        Toast.fail('Please enter both Room ID and User ID.');
      }
    };

    const handleDisconnect = () => {
      SocketService.disconnect();
    };

    const close = () => {
      emit('close');
    };

    onMounted(() => {
      // 如果store中没有端口，设置默认端口
      if (!store.serverPort) {
        store.setServerPort('8989');
      }
    });

    return {
      serverAddress,
      serverPort,
      room,
      userId,
      isConnected,
      handleConnect,
      handleDisconnect,
      close,
    };
  },
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  position: relative; /* 为绝对定位的关闭按钮提供参照 */
  background-color: white;
  padding: 30px;
  border-radius: 1.5rem;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.close-icon {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  cursor: pointer;
  color: #555;
  transition: color 0.3s;
}

.close-icon:hover {
  color: #000;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
}

.modal-content input {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 0.75rem;
  font-size: 14px;
}

.modal-content input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.connect-button {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 0.75rem;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
  background-color: #007bff;
  color: white;
}

.connect-button:hover:not(.disabled) {
  background-color: #0056b3;
}

.disconnect-button {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 0.75rem;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
  background-color: #dc3545;
  color: white;
}

.disconnect-button:hover:not(.disabled) {
  background-color: #c82333;
}

.connect-button.disabled,
.disconnect-button.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>

