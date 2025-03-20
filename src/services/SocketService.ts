import { io, Socket } from 'socket.io-client';
import { useChatStore, Message } from '../stores/useChatStore';
import { useConnectionStore } from '../stores/useConnectionStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import ClipboardService from './ClipboardService';
import { Toast } from 'vant';

// 类型定义
enum MessageType {
  TEXT = 'text',
  IMAGE = 'image'
}

enum EventType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',
  REGISTRATION_ERROR = 'registrationError',
  SEND_MESSAGE = 'sendMessage',
  HISTORY = 'history',
  HISTORY_ERROR = 'historyError',
  RECONNECT_ATTEMPT = 'reconnect_attempt',
  RECONNECT_FAILED = 'reconnect_failed',
  REGISTER = 'register'
}

// 常量配置
const SOCKET_CONFIG = {
  autoConnect: false,
  transports: ['websocket'], 
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
};

const MAX_CLIP_REG_INDEX = 4;

class SocketService {
  private socket: Socket | null = null;
  private room: string = '';
  private userId: string = '';
  private isConnecting: boolean = false;

  /**
   * 建立WebSocket连接
   * @param url 服务器URL
   */
  connect(url: string): void {
    if (this.socket?.connected || this.isConnecting) {
      console.warn(`Socket${this.isConnecting ? '正在连接中' : '已连接'}`);
      return;
    }

    this.socket = io(url, SOCKET_CONFIG);
    this.isConnecting = true;
    
    this.setupSocketListeners();
    this.socket.connect();
  }

  /**
   * 设置Socket事件监听器
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;
    
    // 连接相关事件
    this.socket.on(EventType.CONNECT, () => {
      this.updateConnectionStatus(true);
      this.registerIfNeeded();
    });
    
    this.socket.on(EventType.DISCONNECT, (reason: string) => {
      this.updateConnectionStatus(false);
      console.log(`断开连接，原因: ${reason}`);
    });
    
    this.socket.on(EventType.CONNECT_ERROR, (error: Error) => {
      this.updateConnectionStatus(false);
      console.error(`连接错误: ${error.message}`);
    });
    
    // 业务事件
    this.socket.on(EventType.REGISTRATION_ERROR, (data: { message: string }) => {
      console.error(`注册错误: ${data.message}`);
      this.disconnect();
    });
    
    this.socket.on(EventType.SEND_MESSAGE, this.handleIncomingMessage.bind(this));
    this.socket.on(EventType.HISTORY, this.handleHistory.bind(this));
    this.socket.on(EventType.HISTORY_ERROR, (data: { message: string }) => {
      Toast.clear();
      Toast.fail(`获取历史记录失败: ${data.message}`);
      console.error(`历史记录错误: ${data.message}`);
    });
    
    // 重连事件
    this.socket.on(EventType.RECONNECT_ATTEMPT, (attemptNumber: number) => {
      console.log(`正在尝试重连... (${attemptNumber})`);
    });
    
    this.socket.on(EventType.RECONNECT_FAILED, () => {
      console.error('重连失败');
    });
  }

  /**
   * 更新连接状态
   */
  private updateConnectionStatus(isConnected: boolean): void {
    const connectionStore = useConnectionStore();
    connectionStore.setConnectionStatus(isConnected);
    
    this.isConnecting = false;
    
    if (isConnected) {
      console.log(`已连接，Socket ID: ${this.socket?.id}`);
    } else {
      const chatStore = useChatStore();
      chatStore.clearMessages();
    }
  }

  /**
   * 如果已有房间和用户ID，自动注册
   */
  private registerIfNeeded(): void {
    if (this.room && this.userId && this.socket?.connected) {
      console.log(`自动注册：房间 ${this.room}, 用户ID ${this.userId}`);
      this.socket.emit(EventType.REGISTER, { room: this.room, userId: this.userId });
    }
  }

  /**
   * 处理接收到的消息
   */
  private async handleIncomingMessage(data: Message): Promise<void> {
    try {
      // 处理剪切板寄存器同步消息
      await this.handleClipRegMessage(data);
      
      // 添加消息到聊天记录
      const chatStore = useChatStore();
      chatStore.addMessage(data);
      
      // 根据设置自动复制
      await this.tryAutoCopy(data);
      
      console.log('收到消息:', data);
    } catch (error) {
      console.error('处理接收消息错误:', error);
    }
  }

  /**
   * 处理剪切板寄存器同步消息
   */
  private async handleClipRegMessage(data: Message): Promise<void> {
    if (data.type !== MessageType.TEXT || data.clipReg === undefined) return;
    
    try {
      const { useClipRegStore } = await import('../stores/useClipRegStore');
      const clipRegStore = useClipRegStore();
      
      const registerIndex = data.clipReg;
      
      if (!clipRegStore.enabled) {
        console.log(`收到寄存器${registerIndex + 1}同步内容，但寄存器功能未启用`);
        return;
      }
      
      if (registerIndex >= 0 && registerIndex <= MAX_CLIP_REG_INDEX) {
        clipRegStore.saveToRegister(registerIndex, data.content);
        Toast.success(`收到寄存器${registerIndex + 1}同步内容`);
        console.log(`收到寄存器${registerIndex + 1}同步内容，已保存`);
      }
    } catch (error) {
      console.error('处理剪切板寄存器同步消息失败:', error);
    }
  }

  /**
   * 尝试自动复制消息到剪贴板
   */
  private async tryAutoCopy(data: Message): Promise<void> {
    try {
      const settingsStore = useSettingsStore();
      const connectionStore = useConnectionStore();
      
      const isOwnMessage = data.userId === connectionStore.userId;
      const shouldCopyText = data.type === MessageType.TEXT && settingsStore.autoCopyText && !isOwnMessage;
      const shouldCopyImage = data.type === MessageType.IMAGE && settingsStore.autoCopyImage;
      
      if (shouldCopyText || shouldCopyImage) {
        await ClipboardService.copyMessage(data);
      }
    } catch (error) {
      console.error('自动复制失败:', error);
    }
  }

  /**
   * 处理历史消息
   */
  private handleHistory(historyMessages: Message[]): void {
    try {
      Toast.clear();
      const chatStore = useChatStore();
      chatStore.clearMessages();
      
      // 批量添加所有历史消息
      historyMessages.forEach(message => {
        chatStore.addMessage(message);
      });
      
      console.log(`收到历史消息: ${historyMessages.length}条`);
    } catch (error) {
      console.error('处理历史消息错误:', error);
      Toast.fail('加载历史消息失败');
    }
  }

  /**
   * 注册到房间
   */
  register(room: string, userId: string): void {
    this.room = room;
    this.userId = userId;

    if (this.socket?.connected) {
      console.log(`发送注册请求：房间 ${room}, 用户ID ${userId}`);
      this.socket.emit(EventType.REGISTER, { room, userId });
    }
  }

  /**
   * 发送消息
   */
  sendMessage(type: MessageType | string, content: string, clipReg?: number): void {
    if (!this.socket?.connected) {
      Toast.fail('未连接到服务器，无法发送消息');
      console.error('未连接到服务器，无法发送消息');
      return;
    }

    const connectionStore = useConnectionStore();
    const message: Message = { 
      type: type as 'text' | 'image', 
      content, 
      userId: connectionStore.userId, 
      timestamp: new Date().toISOString() 
    };
    
    // 文本消息才能添加剪切板寄存器索引
    if (clipReg !== undefined && type === MessageType.TEXT) {
      message.clipReg = clipReg;
    }
    
    this.socket.emit(EventType.SEND_MESSAGE, message);
    console.log(`发送消息: ${type}`, message);
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('开始断开连接，当前Socket状态:', this.socket ? 'Socket已连接' : 'Socket未连接');
    
    if (!this.socket) {
      console.log('Socket为空，无需断开连接');
      this.updateConnectionStatus(false);
      return;
    }
    
    try {
      // 移除所有事件监听器
      this.socket.removeAllListeners();
      console.log('已移除所有事件监听器');
      
      // 断开连接
      this.socket.disconnect();
      console.log('已调用socket.disconnect()');
      
      // 清除状态
      this.socket = null;
      this.room = '';
      this.userId = '';
      this.isConnecting = false;
      
      // 更新连接状态
      this.updateConnectionStatus(false);
      
      console.log('Socket已成功断开连接');
    } catch (error) {
      console.error('断开连接时出错:', error);
      // 即便出错也尝试更新状态
      this.updateConnectionStatus(false);
      this.socket = null;
    }
  }
}

export default new SocketService();

