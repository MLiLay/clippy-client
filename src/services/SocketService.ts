import { io, Socket } from 'socket.io-client';
import { useChatStore, Message } from '../stores/useChatStore';
import { useConnectionStore } from '../stores/useConnectionStore';
import { useSettingsStore } from '../stores/useSettingsStore';
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
      const connectionStore = useConnectionStore();
      connectionStore.setConnectionStatus(true);
      this.isConnecting = false;
      console.log(`Connected with socket ID: ${this.socket?.id}`);

      // 自动发送注册信息
      if (this.room && this.userId) {
        console.log(`Emitting register event with room: ${this.room}, userId: ${this.userId}`);
        this.socket!.emit('register', { room: this.room, userId: this.userId });
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      const connectionStore = useConnectionStore();
      const chatStore = useChatStore();
      connectionStore.setConnectionStatus(false);
      chatStore.clearMessages();
      this.isConnecting = false;
      console.log(`Disconnected from server. Reason: ${reason}`);
    });

    this.socket.on('connect_error', (error: Error) => {
      const connectionStore = useConnectionStore();
      connectionStore.setConnectionStatus(false);
      this.isConnecting = false;
      console.error(`Connection error: ${error.message}`);
    });

    this.socket.on('registrationError', (data: { message: string }) => {
      console.error(`Registration Error: ${data.message}`);
      this.disconnect();
    });

    this.socket.on('sendMessage', async (data: Message) => {
      const chatStore = useChatStore();
      const settingsStore = useSettingsStore();
      const connectionStore = useConnectionStore();
      
      // 处理剪切板寄存器同步消息
      if (data.type === 'text' && data.clipReg !== undefined) {
        try {
          // 导入剪切板寄存器Store
          const { useClipRegStore } = await import('../stores/useClipRegStore');
          const clipRegStore = useClipRegStore();
          
          const registerIndex = data.clipReg;
          
          // 如果寄存器功能已启用，则保存
          if (clipRegStore.enabled && registerIndex >= 0 && registerIndex < 5) {
            clipRegStore.saveToRegister(registerIndex, data.content);
            Toast.success(`收到寄存器${registerIndex + 1}同步内容`);
            console.log(`收到寄存器${registerIndex + 1}同步内容，已保存`);
          } else if (!clipRegStore.enabled) {
            console.log(`收到寄存器${registerIndex + 1}同步内容，但寄存器功能未启用`);
          }
        } catch (error) {
          console.error('处理剪切板寄存器同步消息失败:', error);
        }
      }
      
      chatStore.addMessage(data);
      console.log('Received sendMessage:', data);

      // 根据设置自动复制和非自己发送的消息自动复制
      try {
        if (data.type === 'text' && settingsStore.autoCopyText && data.userId !== connectionStore.userId) {
          await ClipboardService.copyMessage(data);
        } else if (data.type === 'image' && settingsStore.autoCopyImage) {
          await ClipboardService.copyMessage(data);
        }
      } catch (error) {
        console.error('自动复制失败:', error);
      }
    });

    this.socket.on('history', (historyMessages: Message[]) => {
      Toast.clear();
      const chatStore = useChatStore();
      chatStore.clearMessages();
      historyMessages.forEach((message) => {
        chatStore.addMessage(message);
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

  sendMessage(type: 'text' | 'image', content: string, clipReg?: number) {
    if (this.socket && this.socket.connected) {
      const connectionStore = useConnectionStore();
      const message: Message = { 
        type, 
        content, 
        userId: connectionStore.userId, 
        timestamp: new Date().toISOString() 
      };
      
      // 如果指定了clipReg参数且为文本消息，添加到消息中
      if (clipReg !== undefined && type === 'text') {
        message.clipReg = clipReg;
      }
      
      this.socket.emit('sendMessage', message);
      console.log(`发送消息: ${type}`, message);
    } else {
      Toast.fail('未连接到服务器，无法发送消息');
      console.error('未连接到服务器，无法发送消息');
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

