import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useConnectionStore = defineStore('connection', () => {
  const isConnected = ref(false);
  const room = ref('');
  const userId = ref('');
  const serverAddress = ref('');
  const serverPort = ref('8989');

  const setConnectionStatus = (status: boolean) => {
    isConnected.value = status;
  };

  const setRoom = (newRoom: string) => {
    room.value = newRoom;
  };

  const setUserId = (newUserId: string) => {
    userId.value = newUserId;
  };

  const setServerAddress = (address: string) => {
    serverAddress.value = address;
  };

  const setServerPort = (port: string) => {
    serverPort.value = port;
  };

  return {
    isConnected,
    room,
    userId,
    serverAddress,
    serverPort,
    setConnectionStatus,
    setRoom,
    setUserId,
    setServerAddress,
    setServerPort,
  };
}); 