import { register, unregister, isRegistered, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import { sendTextMessage } from './SendingService';
import SocketService from './SocketService';
import { useChatStore } from '../stores/useChatStore';
import { Toast } from 'vant';
import { invoke, isTauri } from '@tauri-apps/api/core'; // 用于调用 Tauri 命令

class HotkeyService {
  private currentShortcut: string;
  private store: ReturnType<typeof useChatStore>;
  private isInitialized: boolean = false;
  private isTauriEnv: boolean = false;

  constructor(store: ReturnType<typeof useChatStore>) {
    this.store = store;
    this.currentShortcut = this.store.hotkeySendText;
    console.log('HotkeyService 实例化');

    // 检测是否在Tauri环境中
    this.checkTauriEnv();
  }

  private async checkTauriEnv() {
    try {
      this.isTauriEnv = await isTauri();
      console.log(`当前环境: ${this.isTauriEnv ? 'Tauri' : 'Web'}`);
      
      // 只在Tauri环境中初始化热键
      if (this.isTauriEnv) {
        this.initialize();
      } else {
        console.log('非Tauri环境，跳过热键初始化');
      }
    } catch (error) {
      console.error('检测Tauri环境失败:', error);
      this.isTauriEnv = false;
    }
  }

  // 获取当前环境是否为Tauri
  public isInTauriEnv(): boolean {
    return this.isTauriEnv;
  }

  private async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const success = await this.setHotkey(this.currentShortcut);
    if (!success) {
      Toast.fail(`发送文本热键 "${this.currentShortcut}" 注册失败，请重启软件。`);
    }

    const successScreenshot = await this.setScreenshotHotkey(this.store.hotkeyScreenshot);
    if (!successScreenshot) {
      Toast.fail(`截图发送热键 "${this.store.hotkeyScreenshot}" 注册失败，请重启软件。`);
    }
  }

  private async registerShortcut(
    newShortcut: string,
    callback: (event: any) => Promise<void>,
    oldShortcut?: string
  ): Promise<boolean> {
    // 非Tauri环境不注册热键
    if (!this.isTauriEnv) {
      return false;
    }

    try {
      const alreadyRegistered = await isRegistered(newShortcut);
      if (alreadyRegistered) {
        Toast.fail(`热键 "${newShortcut}" 已被其他应用占用。`);
        return false;
      }
      await register(newShortcut, callback);
      if (oldShortcut && oldShortcut !== newShortcut) {
        await unregister(oldShortcut);
      }
      return true;
    } catch (error) {
      console.error(`注册热键失败 (${newShortcut}):`, error);
      return false;
    }
  }

  async setHotkey(newShortcut: string): Promise<boolean> {
    // 非Tauri环境不设置热键
    if (!this.isTauriEnv) {
      return false;
    }

    const success = await this.registerShortcut(newShortcut, async (event) => {
      if (event.state === 'Pressed') {
        const clipboardText = await readText();
        if (clipboardText) {
          sendTextMessage(clipboardText);
        }
      }
    }, this.currentShortcut);
    if (success) {
      this.currentShortcut = newShortcut;
      this.store.setHotkeySendText(newShortcut);
    }
    return success;
  }

  async setScreenshotHotkey(newShortcut: string): Promise<boolean> {
    // 非Tauri环境不设置热键
    if (!this.isTauriEnv) {
      return false;
    }

    const success = await this.registerShortcut(newShortcut, async (event) => {
      if (event.state === 'Pressed') {
        try {
          const base64 = await invoke<string>('screenshot', {
            monitorIndex: this.store.selectedMonitor
          });
          if (base64) {
            SocketService.sendMessage('image', base64);
          }
        } catch (err) {
          console.error('截图失败:', err);
        }
      }
    }, this.store.hotkeyScreenshot);
    if (success) {
      this.store.setHotkeyScreenshot(newShortcut);
    }
    return success;
  }

  // 注销当前热键
  async unregisterCurrentHotkey(): Promise<void> {
    if (!this.isTauriEnv) return;

    try {
      await unregister(this.currentShortcut);
      console.log(`已注销全局热键: ${this.currentShortcut}`);
    } catch (error) {
      console.error(`注销热键失败 (${this.currentShortcut}):`, error);
    }
  }

  // 注销所有热键（在应用关闭时调用）
  async unregisterAll(): Promise<void> {
    if (!this.isTauriEnv) return;

    try {
      await unregisterAll();
      console.log('已注销所有全局热键。');
    } catch (error) {
      console.error('注销所有热键失败:', error);
    }
  }
}

// Singleton 实例管理
let hotkeyServiceInstance: HotkeyService | null = null;

export function initializeHotkeyService(store: ReturnType<typeof useChatStore>) {
  if (!hotkeyServiceInstance) {
    hotkeyServiceInstance = new HotkeyService(store);
  }
  return hotkeyServiceInstance;
}

export function getHotkeyService(): HotkeyService {
  if (!hotkeyServiceInstance) {
    throw new Error('HotkeyService 未初始化。请先调用 initializeHotkeyService。');
  }
  return hotkeyServiceInstance;
}

