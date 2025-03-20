<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="close-icon" @click="close" aria-label="关闭">
        <font-awesome-icon :icon="['fas', 'xmark']" class="w-5 h-5 text-gray-700 hover:text-gray-900" />
      </button>
      <h2 class="text-xl font-semibold mb-6">Settings</h2>
      
      <!-- 自动复制文本设置 - 仅在Tauri环境中显示 -->
      <div v-if="isTauriEnv" class="setting-item flex items-center justify-between mb-4">
        <label for="autoCopyText" class="text-md font-medium">自动复制文本到剪切板</label>
        <input 
          type="checkbox" 
          id="autoCopyText" 
          v-model="autoCopyText" 
          class="toggle-checkbox"
        />
      </div>
      
      <!-- 剪切板寄存器功能设置 - 仅在Tauri环境中显示 -->
      <div v-if="isTauriEnv" class="setting-item flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <label for="clipRegEnabled" class="text-md font-medium">剪切板寄存器</label>
          <font-awesome-icon 
            :icon="['fas', 'circle-info']" 
            class="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-pointer"
            @mouseenter="clipRegTooltipVisible = true"
            @mouseleave="clipRegTooltipVisible = false"
          />
          <div 
            v-if="clipRegTooltipVisible" 
            class="absolute ml-2 w-64 bg-gray-800 text-white text-xs rounded p-2 shadow-lg"
            style="bottom: 80%; left: 0; margin-top: 4px; z-index: 100;"
          >
            5个剪切板寄存器，Alt+1~5粘贴，Alt+6~0保存(对应Ctrl+Alt+1~5输入)，Ctrl+Alt+1~5输入
          </div>
        </div>
        <input 
          type="checkbox" 
          id="clipRegEnabled" 
          v-model="clipRegEnabled" 
          class="toggle-checkbox"
        />
      </div>
      
      <!-- 剪切板寄存器同步设置 - 仅在剪切板寄存器启用时显示 -->
      <div v-if="isTauriEnv && clipRegEnabled" class="setting-item flex items-center justify-between mb-4 ml-6">
        <div class="flex items-center space-x-2">
          <label for="clipRegSyncEnabled" class="text-md font-medium">同步到其他设备</label>
          <font-awesome-icon 
            :icon="['fas', 'circle-info']" 
            class="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-pointer"
            @mouseenter="clipRegSyncTooltipVisible = true"
            @mouseleave="clipRegSyncTooltipVisible = false"
          />
          <div 
            v-if="clipRegSyncTooltipVisible" 
            class="absolute ml-2 w-64 bg-gray-800 text-white text-xs rounded p-2 shadow-lg"
            style="bottom: 80%; left: 0; margin-top: 4px; z-index: 100;"
          >
            将剪切板寄存器内容同步到其他设备，同时在接收端自动存储
          </div>
        </div>
        <input 
          type="checkbox" 
          id="clipRegSyncEnabled" 
          v-model="clipRegSyncEnabled" 
          class="toggle-checkbox"
        />
      </div>

      <!-- 热键设置 - 仅在Tauri环境中显示 -->
      <template v-if="isTauriEnv">
        <div v-for="(config, _) in hotkeyConfigs" 
             :key="config.type" 
             class="setting-item flex items-center justify-between mb-4 relative">
          <div class="flex items-center space-x-2">
            <label class="text-md">{{ config.label }}</label>
            <font-awesome-icon 
              v-if="config.tooltip"
              :icon="['fas', 'circle-info']" 
              class="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-pointer"
              @mouseenter="tooltipVisibility[config.type] = true"
              @mouseleave="tooltipVisibility[config.type] = false"
            />
            <div 
              v-if="tooltipVisibility[config.type] && config.tooltip" 
              class="absolute ml-2 w-53 bg-gray-800 text-white text-xs rounded p-2 shadow-lg"
              style="bottom: 80%; left: 0; margin-top: 4px; z-index: 100;"
            >
              {{ config.tooltip }}
            </div>
          </div>
          <button
            @click="() => startListening(config.type)"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
            :disabled="isListening"
          >
            <span v-if="!isListening || activeConfigType !== config.type">{{ config.currentHotkey }}</span>
            <span v-else>按下新的热键...</span>
          </button>
          <div v-if="errorMessages[config.type]" class="error-text">{{ errorMessages[config.type] }}</div>
        </div>
              
        <!-- 显示器选择 - 仅在Tauri环境中显示 -->
        <div class="setting-item flex items-center justify-between mb-4">
          <label for="monitorSelect" class="text-md font-medium">截图显示器</label>
          <select
            id="monitorSelect"
            v-model="selectedMonitor"
            class="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="i in monitorCount" :key="i-1" :value="i-1">
              显示器 {{ i }}
            </option>
          </select>
        </div>
      </template>

      <!-- 非Tauri环境下显示提示信息 -->
      <div v-if="!isTauriEnv" class="setting-item text-center p-4 text-gray-600">
        自动复制、快捷键等功能仅在桌面客户端可用
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onBeforeUnmount, onMounted } from 'vue';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useClipRegStore } from '../stores/useClipRegStore';
import { getHotkeyService } from '../services/HotkeyService';
import { Toast } from 'vant';
import { invoke } from '@tauri-apps/api/core'; // 用于调用 Tauri 命令

type HotkeyType = 'send' | 'screenshot';

// 明确定义热键类型
const VALID_MODIFIERS = ['Control', 'Alt', 'Shift', 'Meta'] as const;
type Modifier = typeof VALID_MODIFIERS[number];

interface HotkeyConfig {
  type: HotkeyType;
  label: string;
  tooltip?: string;
  currentHotkey: string;
  setter: (shortcut: string) => Promise<boolean>;
  errorMessage?: string;
}

export default defineComponent({
  name: 'Settings',
  emits: ['close'],
  setup(_, { emit }) {
    const settingsStore = useSettingsStore();
    const clipRegStore = useClipRegStore();
    const hotkeyService = getHotkeyService();
    const isTauriEnv = ref(false);
    
    const isListening = ref(false);
    const activeConfigType = ref<HotkeyType | null>(null);
    const tooltipVisibility = ref<Record<HotkeyType, boolean>>({
      send: false,
      screenshot: false
    });
    const errorMessages = ref<Record<HotkeyType, string>>({
      send: '',
      screenshot: ''
    });
    
    // 剪切板寄存器功能相关
    const clipRegTooltipVisible = ref(false);
    const clipRegEnabled = computed({
      get: () => clipRegStore.enabled,
      set: async (value: boolean) => {
        await hotkeyService.setClipRegEnabled(value);
        if (value) {
          Toast.success('剪切板寄存器功能已启用');
        } else {
          Toast.success('剪切板寄存器功能已禁用');
        }
      }
    });

    // 剪切板寄存器同步相关
    const clipRegSyncTooltipVisible = ref(false);
    const clipRegSyncEnabled = computed({
      get: () => clipRegStore.syncEnabled,
      set: async (value: boolean) => {
        await hotkeyService.setClipRegSyncEnabled(value);
        if (value) {
          Toast.success('剪切板寄存器同步已启用');
        } else {
          Toast.success('剪切板寄存器同步已禁用');
        }
      }
    });

    // 基础计算属性
    const autoCopyText = computed({
      get: () => settingsStore.autoCopyText,
      set: (value: boolean) => settingsStore.setAutoCopyText(value),
    });

    const formatHotkey = (hotkey: string) => {
      return hotkey.replace(/Control/g, 'Ctrl');
    };

    // 热键配置
    const hotkeyConfigs = computed<HotkeyConfig[]>(() => [
      {
        type: 'send',
        label: '发送剪切板文本',
        tooltip: '发送剪切板文本内容，非文本不发送',
        currentHotkey: formatHotkey(settingsStore.hotkeySendText),
        setter: hotkeyService.setHotkey.bind(hotkeyService),
      },
      {
        type: 'screenshot',
        label: '截取全屏并发送',
        currentHotkey: formatHotkey(settingsStore.hotkeyScreenshot),
        setter: hotkeyService.setScreenshotHotkey.bind(hotkeyService),
      },
    ]);

    const validateHotkey = (keys: string[]): { isValid: boolean; message?: string } => {
      const modifiers = keys.filter(k => VALID_MODIFIERS.includes(k as Modifier));
      const nonModifiers = keys.filter(k => !VALID_MODIFIERS.includes(k as Modifier));

      if (modifiers.length === 0) {
        return { isValid: false, message: '请至少包含一个修饰键 (Ctrl/Alt/Shift)' };
      }
      
      if (nonModifiers.length !== 1) {
        return { isValid: false, message: '请包含一个非修饰键' };
      }

      return { isValid: true };
    };

    // 统一的热键设置处理函数
    const startListening = async (type: HotkeyType) => {
      if (isListening.value) return;
      
      isListening.value = true;
      activeConfigType.value = type;
      errorMessages.value[type] = '';

      const handleKeyDown = async (event: KeyboardEvent) => {
        event.preventDefault();
        
        const keys: string[] = [];
        if (event.ctrlKey) keys.push('Control');
        if (event.altKey) keys.push('Alt');
        if (event.shiftKey) keys.push('Shift');
        if (event.metaKey) keys.push('Meta');

        const key = event.key.toUpperCase();
        if (!VALID_MODIFIERS.includes(key as Modifier) && key.length === 1) {
          keys.push(key);
        } else {
          return;
        }

        const validation = validateHotkey(keys);
        if (!validation.isValid) {
          errorMessages.value[type] = validation.message || '';
          return;
        }

        const newShortcut = keys.join('+');
        const config = hotkeyConfigs.value.find(c => c.type === type);
        
        if (config) {
          try {
            const success = await config.setter(newShortcut);
            if (success) {
              Toast.success('热键设置成功');
            } else {
              errorMessages.value[type] = '该热键已被占用';
            }
          } catch (error) {
            errorMessages.value[type] = '设置热键失败，请重试';
            console.error('热键设置错误:', error);
          }
        }

        cleanup();
      };

      const cleanup = () => {
        isListening.value = false;
        activeConfigType.value = null;
        window.removeEventListener('keydown', handleKeyDown);
      };

      window.addEventListener('keydown', handleKeyDown);
    };

    const close = () => emit('close');

    const monitorCount = ref(1); // 显示器数量
    
    // 选中的显示器
    const selectedMonitor = computed({
      get: () => settingsStore.selectedMonitor,
      set: (value: number) => settingsStore.setSelectedMonitor(value)
    });

    // 获取显示器数量
    const getMonitorCount = async () => {
      if (!isTauriEnv.value) return;
      
      try {
        const count = await invoke<number>('get_monitor_count');
        monitorCount.value = count;
      } catch (error) {
        console.error('获取显示器数量失败:', error);
      }
    };

    // 检测是否在Tauri环境中
    const checkTauriEnv = async () => {
      try {
        // 从HotkeyService获取Tauri环境状态
        isTauriEnv.value = hotkeyService.isInTauriEnv();
        console.log(`设置界面 - 当前环境: ${isTauriEnv.value ? 'Tauri' : 'Web'}`);
      } catch (error) {
        console.error('检测Tauri环境失败:', error);
        isTauriEnv.value = false;
      }
    };

    onMounted(() => {
      checkTauriEnv();
      if (isTauriEnv.value) {
        getMonitorCount();
      }
    });

    onBeforeUnmount(() => {
      if (isListening.value) {
        window.removeEventListener('keydown', () => {});
      }
    });

    return {
      autoCopyText,
      close,
      isListening,
      tooltipVisibility,
      activeConfigType,
      hotkeyConfigs,
      startListening,
      errorMessages,
      selectedMonitor,
      monitorCount,
      isTauriEnv,
      // 剪切板寄存器相关
      clipRegTooltipVisible,
      clipRegEnabled,
      clipRegSyncTooltipVisible,
      clipRegSyncEnabled,
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
  position: relative;
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

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  position: relative;
}

.toggle-checkbox {
  appearance: none;
  width: 3rem;
  height: 1.5rem;
  background-color: rgb(209 213 219);
  border-radius: 9999px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.toggle-checkbox:checked {
  background-color: rgb(37 99 235);
}

.toggle-checkbox::before {
  content: '';
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: 1rem;
  height: 1rem;
  background-color: white;
  border-radius: 9999px;
  transition: transform 0.2s ease-in-out;
}

.toggle-checkbox:checked::before {
  transform: translateX(1.5rem);
}

.absolute {
  position: absolute;
}

.relative {
  position: relative;
}

.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 
              0 4px 6px -2px rgba(0,0,0,0.05);
}

.error-message {
  color: red;
  font-size: 0.875rem;
  margin-top: 4px;
}

.error-text {
  color: rgb(239 68 68);
  font-size: 0.875rem;
  margin-top: 0.25rem;
  position: absolute;
  bottom: -1.25rem;
  left: 0;
}
</style>

