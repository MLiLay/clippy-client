import { register, unregister, isRegistered, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import SendingService from './SendingService';
import SocketService from './SocketService';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useClipRegStore } from '../stores/useClipRegStore';
import { Toast } from 'vant';
import { invoke, isTauri } from '@tauri-apps/api/core';

// 热键回调函数类型
type HotkeyCallback = (event: any) => Promise<void>;

// 寄存器操作类型
enum RegisterOperation {
  PASTE, // 粘贴操作
  SAVE,  // 保存操作
  TYPE   // 模拟输入操作
}

// 寄存器配置接口
interface RegisterConfig {
  shortcut: string;
  operation: RegisterOperation;
  index: number;
}

class HotkeyService {
  private currentShortcut: string;
  private settingsStore: ReturnType<typeof useSettingsStore>;
  private clipRegStore: ReturnType<typeof useClipRegStore>;
  private isInitialized: boolean = false;
  private isTauriEnv: boolean = false;
  
  // 寄存器配置
  private readonly REGISTER_COUNT = 5;
  private readonly SAVE_KEYS = ['6', '7', '8', '9', '0'];
  private registeredShortcuts: Set<string> = new Set();

  constructor() {
    this.settingsStore = useSettingsStore();
    this.clipRegStore = useClipRegStore();
    this.currentShortcut = this.settingsStore.hotkeySendText;
    this.isTauriEnv = isTauri();
    
    if (this.isTauriEnv) {
      this.initialize().catch(err => {
        console.error('初始化热键服务失败:', err);
      });
    } else {
      console.log('非Tauri环境，跳过热键初始化');
    }
  }

  // 获取当前环境是否为Tauri
  public isInTauriEnv(): boolean {
    return this.isTauriEnv;
  }

  // 在Tauri环境中执行函数，否则返回false
  private async inTauriOrFalse<T>(func: () => Promise<T>): Promise<T | false> {
    if (!this.isTauriEnv) return Promise.resolve(false);
    return func();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // 注册发送文本热键
      if (!await this.setReadClipboardTextHotkey(this.currentShortcut)) {
        Toast.fail(`发送文本热键 "${this.currentShortcut}" 注册失败，请重启软件。`);
      }

      // 注册截图热键
      if (!await this.setScreenshotHotkey(this.settingsStore.hotkeyScreenshot)) {
        Toast.fail(`截图发送热键 "${this.settingsStore.hotkeyScreenshot}" 注册失败，请重启软件。`);
      }
      
      // 初始化剪切板寄存器热键
      await this.initClipRegHotkeys();
    } catch (error) {
      console.error('初始化热键服务失败:', error);
      Toast.fail('热键服务初始化失败');
    }
  }

  // 注册单个快捷键
  private async registerShortcut(
    newShortcut: string,
    callback: HotkeyCallback,
    oldShortcut?: string
  ): Promise<boolean> {
    if (!this.isTauriEnv) return false;

    try {
      const alreadyRegistered = await isRegistered(newShortcut);
      if (alreadyRegistered) {
        Toast.fail(`热键 "${newShortcut}" 已被其他应用占用。`);
        return false;
      }
      
      await register(newShortcut, callback);
      this.registeredShortcuts.add(newShortcut);
      
      // 如果之前有旧热键且与新热键不同，则注销旧热键
      if (oldShortcut && oldShortcut !== newShortcut) {
        await this.unregisterShortcut(oldShortcut);
      }
      
      return true;
    } catch (error) {
      console.error(`注册热键失败 (${newShortcut}):`, error);
      return false;
    }
  }

  async setReadClipboardTextHotkey(newShortcut: string): Promise<boolean> {
    return this.inTauriOrFalse(async () => {
      const success = await this.registerShortcut(
        newShortcut, 
        async (event) => {
          if (event.state === 'Pressed') {
            try {
              const clipboardText = await readText();
              if (clipboardText) {
                SendingService.sendTextMessage(clipboardText);
              }
            } catch (error) {
              console.error('读取剪贴板失败:', error);
              Toast.fail('读取剪贴板失败');
            }
          }
        }, 
        this.currentShortcut
      );
      
      if (success) {
        this.currentShortcut = newShortcut;
        this.settingsStore.setReadClipboardTextHotkeySendText(newShortcut);
      }
      
      return success;
    });
  }

  async setScreenshotHotkey(newShortcut: string): Promise<boolean> {
    return this.inTauriOrFalse(async () => {
      const success = await this.registerShortcut(
        newShortcut, 
        async (event) => {
          if (event.state === 'Pressed') {
            try {
              const base64 = await invoke<string>('screenshot', {
                monitorIndex: this.settingsStore.selectedMonitor
              });
              
              if (base64) {
                SocketService.sendMessage('image', base64);
              }
            } catch (err) {
              console.error('截图失败:', err);
              Toast.fail('截图失败');
            }
          }
        }, 
        this.settingsStore.hotkeyScreenshot
      );
      
      if (success) {
        this.settingsStore.setReadClipboardTextHotkeyScreenshot(newShortcut);
      }
      
      return success;
    });
  }

  // 注销单个热键
  private async unregisterShortcut(shortcut: string): Promise<void> {
    if (!this.isTauriEnv || !this.registeredShortcuts.has(shortcut)) return;
    
    try {
      await unregister(shortcut);
      this.registeredShortcuts.delete(shortcut);
    } catch (error) {
      console.error(`注销热键失败 (${shortcut}):`, error);
    }
  }

  // 注销所有热键（在应用关闭时调用）
  async unregisterAll(): Promise<void> {
    if (!this.isTauriEnv) return;
    try {
      await unregisterAll();
      this.registeredShortcuts.clear();
      console.log('已注销所有全局热键。');
    } catch (error) {
      console.error('注销所有热键失败:', error);
    }
  }

  // 创建寄存器操作回调函数
  private createRegisterCallback(index: number, operation: RegisterOperation): HotkeyCallback {
    return async (event) => {
      if (event.state !== 'Pressed') return;
      
      try {
        switch (operation) {
          case RegisterOperation.PASTE:
          case RegisterOperation.TYPE:
            await this.handleRegisterRead(index, operation);
            break;
          case RegisterOperation.SAVE:
            await this.handleRegisterSave(index);
            break;
        }
      } catch (error) {
        console.error(`寄存器操作失败 (${RegisterOperation[operation]}):`, error);
        Toast.fail(`操作失败: ${error}`);
      }
    };
  }
  
  // 处理从寄存器读取内容（粘贴或输入）
  private async handleRegisterRead(index: number, operation: RegisterOperation): Promise<void> {
    const content = this.clipRegStore.getFromRegister(index);
    if (!content) {
      Toast.fail(`寄存器${index + 1}为空`);
      return;
    }
    
    if (operation === RegisterOperation.PASTE) {
      await writeText(content);
      await invoke('paste_text');
      Toast.success(`已粘贴寄存器${index + 1}的内容`);
    } else {
      await invoke('type_text', { text: content });
      Toast.success(`已输入寄存器${index + 1}的内容`);
    }
  }
  
  // 处理保存内容到寄存器
  private async handleRegisterSave(index: number): Promise<void> {
    const clipboardText = await readText();
    if (!clipboardText) {
      Toast.fail('剪切板为空');
      return;
    }
    
    // 保存到本地寄存器
    this.clipRegStore.saveToRegister(index, clipboardText);
    Toast.success(`已保存到寄存器${index + 1}`);
    
    // 如果启用了同步，发送到其他设备
    if (this.clipRegStore.syncEnabled) {
      try {
        SocketService.sendMessage('text', clipboardText, index);
        console.log(`已同步寄存器${index + 1}内容到其他设备`);
      } catch (error) {
        console.error('同步剪切板寄存器失败:', error);
        Toast.fail('同步失败');
      }
    }
  }

  // 生成所有寄存器热键配置
  private generateRegisterConfigs(): RegisterConfig[] {
    const configs: RegisterConfig[] = [];
    
    // Ctrl+Alt+1 到 Ctrl+Alt+5 (粘贴)
    for (let i = 0; i < this.REGISTER_COUNT; i++) {
      configs.push({
        shortcut: `Ctrl+Alt+${i + 1}`,
        operation: RegisterOperation.PASTE,
        index: i
      });
    }
    
    // Ctrl+Alt+6 到 Ctrl+Alt+0 (保存)
    this.SAVE_KEYS.forEach((key, i) => {
      configs.push({
        shortcut: `Ctrl+Alt+${key}`,
        operation: RegisterOperation.SAVE,
        index: i
      });
    });
    
    // Ctrl+Shift+Alt+1 到 Ctrl+Shift+Alt+5 (模拟输入)
    for (let i = 0; i < this.REGISTER_COUNT; i++) {
      configs.push({
        shortcut: `Ctrl+Shift+Alt+${i + 1}`,
        operation: RegisterOperation.TYPE,
        index: i
      });
    }
    
    return configs;
  }

  // 初始化剪切板寄存器热键
  private async initClipRegHotkeys(): Promise<void> {
    if (!this.isTauriEnv || !this.clipRegStore.enabled) {
      console.log('剪切板寄存器功能已禁用或非Tauri环境，跳过热键注册');
      return;
    }
    
    try {
      const configs = this.generateRegisterConfigs();
      
      // 注册所有热键
      await Promise.all(configs.map(config => 
        this.registerShortcut(
          config.shortcut, 
          this.createRegisterCallback(config.index, config.operation)
        )
      ));
      
      console.log('剪切板寄存器热键注册成功');
    } catch (error) {
      console.error('注册剪切板寄存器热键失败:', error);
    }
  }
  
  // 设置剪切板寄存器功能状态
  async setClipRegEnabled(enabled: boolean): Promise<void> {
    if (!this.isTauriEnv) return;
    this.clipRegStore.setEnabled(enabled);
    
    if (!enabled) {
      await this.unregisterClipRegHotkeys();
    } else {
      await this.initClipRegHotkeys();
    }
  }
  
  // 注销所有剪切板寄存器热键
  private async unregisterClipRegHotkeys(): Promise<void> {
    if (!this.isTauriEnv) return;
    
    try {
      const configs = this.generateRegisterConfigs();
      const shortcuts = configs.map(config => config.shortcut);
      
      // 并行注销所有热键
      await Promise.all(shortcuts.map(shortcut => this.unregisterShortcut(shortcut)));
      
      console.log('已注销所有剪切板寄存器热键');
    } catch (error) {
      console.error('注销剪切板寄存器热键失败:', error);
    }
  }

  // 设置剪切板寄存器同步功能状态
  async setClipRegSyncEnabled(enabled: boolean): Promise<void> {
    if (!this.isTauriEnv) return;
    this.clipRegStore.setSyncEnabled(enabled);
  }
}

// 单例模式实现
let hotkeyServiceInstance: HotkeyService | null = null;

export function initializeHotkeyService(): HotkeyService {
  if (!hotkeyServiceInstance) {
    hotkeyServiceInstance = new HotkeyService();
  }
  return hotkeyServiceInstance;
}

export function getHotkeyService(): HotkeyService {
  if (!hotkeyServiceInstance) {
    throw new Error('HotkeyService 未初始化，需先调用 initializeHotkeyService 获取实例');
  }
  return hotkeyServiceInstance;
}

