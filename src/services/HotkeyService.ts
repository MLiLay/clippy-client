import { register, unregister, isRegistered, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { sendTextMessage } from './SendingService';
import SocketService from './SocketService';
import { useChatStore } from '../stores/useChatStore';
import { useClipRegStore } from '../stores/clipRegStore';
import { Toast } from 'vant';
import { invoke, isTauri } from '@tauri-apps/api/core';

class HotkeyService {
  private currentShortcut: string;
  private store: ReturnType<typeof useChatStore>;
  private clipRegStore: ReturnType<typeof useClipRegStore>;
  private isInitialized: boolean = false;
  private isTauriEnv: boolean = false;

  constructor(store: ReturnType<typeof useChatStore>) {
    this.store = store;
    this.clipRegStore = useClipRegStore();
    this.currentShortcut = this.store.hotkeySendText;
    console.log('HotkeyService 实例化');

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
    
    // 初始化剪切板寄存器热键
    await this.initClipRegHotkeys();
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

  // 初始化剪切板寄存器热键
  private async initClipRegHotkeys() {
    if (!this.isTauriEnv) return;
    
    // 如果剪切板寄存器功能被禁用，则不注册热键
    if (!this.clipRegStore.enabled) {
      console.log('剪切板寄存器功能已禁用，跳过热键注册');
      return;
    }
    
    try {
      // 注册粘贴热键 (Alt+1 到 Alt+5)
      for (let i = 1; i <= 5; i++) {
        const shortcut = `Alt+${i}`;
        const registerIndex = i - 1; // 转换为0-4的索引
        
        await this.registerShortcut(shortcut, async (event) => {
          if (event.state === 'Pressed') {
            const content = this.clipRegStore.getFromRegister(registerIndex);
            if (content) {
              try {
                // 先写入系统剪切板
                await writeText(content);
                // 然后触发系统粘贴操作
                await invoke('paste_text');
                Toast.success(`已粘贴寄存器${i}的内容`);
              } catch (error) {
                console.error('粘贴操作失败:', error);
                Toast.fail(`粘贴失败: ${error}`);
              }
            } else {
              Toast.fail(`寄存器${i}为空`);
            }
          }
        });
      }
      
      // 注册保存热键 (Alt+6 到 Alt+0)
      const saveKeys = ['6', '7', '8', '9', '0'];
      for (let i = 0; i < 5; i++) {
        const shortcut = `Alt+${saveKeys[i]}`;
        const registerIndex = i; // 6-0对应寄存器0-4
        
        await this.registerShortcut(shortcut, async (event) => {
          if (event.state === 'Pressed') {
            const clipboardText = await readText();
            if (clipboardText) {
              // 保存到本地寄存器
              this.clipRegStore.saveToRegister(registerIndex, clipboardText);
              Toast.success(`已保存到寄存器${registerIndex + 1}`);
              
              // 如果启用了同步，发送到其他设备
              if (this.clipRegStore.syncEnabled) {
                try {
                  // 使用clipreg字段发送消息
                  SocketService.sendMessage('text', clipboardText, registerIndex);
                  console.log(`已同步寄存器${registerIndex + 1}内容到其他设备`);
                } catch (error) {
                  console.error('同步剪切板寄存器失败:', error);
                  Toast.fail('同步失败');
                }
              }
            } else {
              Toast.fail('剪切板为空');
            }
          }
        });
      }
      
      // 注册输入热键 (Ctrl+Alt+1 到 Ctrl+Alt+5)
      for (let i = 1; i <= 5; i++) {
        const shortcut = `Ctrl+Alt+${i}`;
        const registerIndex = i - 1; // 转换为0-4的索引
        
        await this.registerShortcut(shortcut, async (event) => {
          if (event.state === 'Pressed') {
            const content = this.clipRegStore.getFromRegister(registerIndex);
            if (content) {
              try {
                // 直接使用type_text输入
                await invoke('type_text', { text: content });
                Toast.success(`已输入寄存器${i}的内容`);
              } catch (error) {
                console.error('文本输入失败:', error);
                Toast.fail(`输入失败: ${error}`);
              }
            } else {
              Toast.fail(`寄存器${i}为空`);
            }
          }
        });
      }
      
      // 注册保存热键 (Ctrl+Alt+6 到 Ctrl+Alt+0)
      for (let i = 0; i < 5; i++) {
        const shortcut = `Ctrl+Alt+${saveKeys[i]}`;
        const registerIndex = i; // 6-0对应寄存器0-4
        
        await this.registerShortcut(shortcut, async (event) => {
          if (event.state === 'Pressed') {
            const clipboardText = await readText();
            if (clipboardText) {
              this.clipRegStore.saveToRegister(registerIndex, clipboardText);
              Toast.success(`已保存到寄存器${registerIndex + 1}`);
              
              // 如果启用了同步，发送到其他设备
              if (this.clipRegStore.syncEnabled) {
                try {
                  // 使用clipreg字段发送消息
                  SocketService.sendMessage('text', clipboardText, registerIndex);
                  console.log(`已同步寄存器${registerIndex + 1}内容到其他设备`);
                } catch (error) {
                  console.error('同步剪切板寄存器失败:', error);
                  Toast.fail('同步失败');
                }
              }
            } else {
              Toast.fail('剪切板为空');
            }
          }
        });
      }
      
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
      // 如果禁用，注销所有剪切板寄存器相关快捷键
      await this.unregisterClipRegHotkeys();
    } else {
      // 如果启用，重新注册所有剪切板寄存器相关快捷键
      await this.initClipRegHotkeys();
    }
  }
  
  // 注销所有剪切板寄存器热键
  private async unregisterClipRegHotkeys(): Promise<void> {
    if (!this.isTauriEnv) return;
    
    try {
      // 注销Alt+1到Alt+5
      for (let i = 1; i <= 5; i++) {
        await unregister(`Alt+${i}`);
      }
      
      // 注销Alt+6到Alt+0
      const saveKeys = ['6', '7', '8', '9', '0'];
      for (const key of saveKeys) {
        await unregister(`Alt+${key}`);
      }
      
      // 注销Ctrl+Alt+1到Ctrl+Alt+5
      for (let i = 1; i <= 5; i++) {
        await unregister(`Ctrl+Alt+${i}`);
      }
      
      // 注销Ctrl+Alt+6到Ctrl+Alt+0
      for (const key of saveKeys) {
        await unregister(`Ctrl+Alt+${key}`);
      }
      
      console.log('已注销所有剪切板寄存器热键');
    } catch (error) {
      console.error('注销剪切板寄存器热键失败:', error);
    }
  }

  // 设置剪切板寄存器同步功能状态
  async setClipRegSyncEnabled(enabled: boolean): Promise<void> {
    if (!this.isTauriEnv) return;
    
    // 更新store中的同步状态
    this.clipRegStore.setSyncEnabled(enabled);
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

