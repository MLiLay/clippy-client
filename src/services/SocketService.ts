import { io, Socket } from 'socket.io-client';
import { useChatStore, Message } from '../stores/useChatStore';
import ClipboardService from './ClipboardService';
import { Toast } from 'vant'; // 导入 Vant 的 Toast 组件

class SocketService {
  private socket: Socket | null = null;
  private room: string = '';
  private userId: string = '';
  private isConnecting: boolean = false;

  connect(url: string) {
    if (this.socket && this.socket.connected) {
      console.warn('Socket is already connected.');
      return;
    }

    if (this.isConnecting) {
      console.warn('Socket is already attempting to connect.');
      return;
    }

    this.socket = io(url, {
      autoConnect: false,
      transports: ['websocket'], // 强制使用 WebSocket，避免长轮询
      reconnectionAttempts: 5, // 重连次数
      reconnectionDelay: 3000, // 重连延迟
    });

    this.isConnecting = true;

    this.socket.on('connect', () => {
      const store = useChatStore();
      store.setConnectionStatus(true);
      this.isConnecting = false;
      console.log(`Connected with socket ID: ${this.socket?.id}`);

      // 自动发送注册信息
      if (this.room && this.userId) {
        console.log(`Emitting register event with room: ${this.room}, userId: ${this.userId}`);
        this.socket!.emit('register', { room: this.room, userId: this.userId });
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      const store = useChatStore();
      store.setConnectionStatus(false);
      store.clearMessages();
      this.isConnecting = false;
      console.log(`Disconnected from server. Reason: ${reason}`);
    });

    this.socket.on('connect_error', (error: Error) => {
      const store = useChatStore();
      store.setConnectionStatus(false);
      this.isConnecting = false;
      console.error(`Connection error: ${error.message}`);
    });

    this.socket.on('registrationError', (data: { message: string }) => {
      console.error(`Registration Error: ${data.message}`);
      this.disconnect();
    });

    this.socket.on('sendMessage', async (data: Message) => {
      const store = useChatStore();
      store.addMessage(data);
      console.log('Received sendMessage:', data);

      // 根据设置自动复制和非自己发送的消息自动复制
      try {
        if (data.type === 'text' && store.autoCopyText && data.userId !== store.userId) {
          await ClipboardService.copyMessage(data);
        } else if (data.type === 'image' && store.autoCopyImage) {
          await ClipboardService.copyMessage(data);
        }
      } catch (error) {
        console.error('自动复制失败:', error);
      }
    });

    this.socket.on('history', (historyMessages: Message[]) => {
      Toast.clear();
      const store = useChatStore();
      store.clearMessages();
      historyMessages.forEach((message) => {
        store.addMessage(message);
      });
      console.log('Received history:', historyMessages);
    });

    this.socket.on('historyError', (data: { message: string }) => {
      Toast.clear();
      Toast.fail(`获取历史记录失败: ${data.message}`);
      console.error(`History Error: ${data.message}`);
    });

    // 监听重连事件
    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`Attempting to reconnect... (${attemptNumber})`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed.');
    });

    this.socket.connect();
  }

  register(room: string, userId: string) {
    this.room = room;
    this.userId = userId;

    if (this.socket && this.socket.connected) {
      console.log(`Emitting register event with room: ${room}, userId: ${userId}`);
      this.socket.emit('register', { room, userId });
    }
  }

  sendMessage(type: 'text' | 'image', content: string) {
    if (this.socket && this.socket.connected) {
      const store = useChatStore();
      const message: Message = { type, content, userId: store.userId, timestamp: new Date().toISOString() };
      this.socket.emit('sendMessage', message);
      console.log(`Emitting sendMessage event with type: ${type}, message:`, message);
    } else {
      Toast.fail('Cannot send message because socket is not connected.');
      console.error('Cannot send message because socket is not connected.');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.room = '';
      this.userId = '';
      this.isConnecting = false;
      console.log('Socket has been disconnected.');
    }
  }
}

export default new SocketService();

