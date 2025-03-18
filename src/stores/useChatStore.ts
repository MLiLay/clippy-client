import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Message {
  type: 'text' | 'image';
  content: string;
  userId: string;
  timestamp: string;
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([]);
  const isConnected = ref(false);
  const room = ref('');
  const userId = ref('');
  const serverAddress = ref('');
  const serverPort = ref('8989');

  // 自动复制
  const autoCopyText = ref(true); // 默认开启
  const autoCopyImage = ref(false); // 默认关闭

  // 热键状态
  const hotkeySendText = ref('Control+Alt+J'); // 发送文本热键
  const hotkeyScreenshot = ref('Control+Alt+K'); // 截图热键

  const selectedMonitor = ref(0); // 新增: 选中的显示器编号

  // 添加消息
  const addMessage = (message: Message) => {
    messages.value.push(message);
  };

  // 清空消息
  const clearMessages = () => {
    messages.value = [];
  };

  // 设置连接状态
  const setConnectionStatus = (status: boolean) => {
    isConnected.value = status;
  };

  // 设置房间号
  const setRoom = (newRoom: string) => {
    room.value = newRoom;
  };

  // 设置用户ID
  const setUserId = (newUserId: string) => {
    userId.value = newUserId;
  };

  // 设置自动复制文本消息
  const setAutoCopyText = (value: boolean) => {
    autoCopyText.value = value;
  };

  // 设置自动复制图片消息
  const setAutoCopyImage = (value: boolean) => {
    autoCopyImage.value = value;
  };

  // 设置发送文本热键
  const setHotkeySendText = (newHotkey: string) => {
    hotkeySendText.value = newHotkey;
  };

  // 设置截图热键
  const setHotkeyScreenshot = (newHotkey: string) => {
    hotkeyScreenshot.value = newHotkey;
  };

  // 设置服务器地址
  const setServerAddress = (address: string) => {
    serverAddress.value = address;
  };

  // 设置服务器端口
  const setServerPort = (port: string) => {
    serverPort.value = port;
  };

  // 新增: 设置选中的显示器
  const setSelectedMonitor = (index: number) => {
    selectedMonitor.value = index;
  };

  return {
    messages,
    isConnected,
    room,
    userId,
    autoCopyText,
    autoCopyImage,
    hotkeySendText,
    hotkeyScreenshot,
    addMessage,
    clearMessages,
    setConnectionStatus,
    setRoom,
    setUserId,
    setAutoCopyText,
    setAutoCopyImage,
    setHotkeySendText,
    setHotkeyScreenshot,
    serverAddress,
    serverPort,
    setServerAddress,
    setServerPort,
    selectedMonitor,
    setSelectedMonitor,
  };
});

