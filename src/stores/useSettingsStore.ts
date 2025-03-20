import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  // 自动复制设置
  const autoCopyText = ref(true);
  const autoCopyImage = ref(false);

  // 热键设置
  const hotkeySendText = ref('Control+Alt+J');
  const hotkeyScreenshot = ref('Control+Alt+K');

  // 显示器设置
  const selectedMonitor = ref(0);

  const setAutoCopyText = (value: boolean) => {
    autoCopyText.value = value;
  };

  const setAutoCopyImage = (value: boolean) => {
    autoCopyImage.value = value;
  };

  const setReadClipboardTextHotkeySendText = (newHotkey: string) => {
    hotkeySendText.value = newHotkey;
  };

  const setReadClipboardTextHotkeyScreenshot = (newHotkey: string) => {
    hotkeyScreenshot.value = newHotkey;
  };

  const setSelectedMonitor = (index: number) => {
    selectedMonitor.value = index;
  };

  return {
    autoCopyText,
    autoCopyImage,
    hotkeySendText,
    hotkeyScreenshot,
    selectedMonitor,
    setAutoCopyText,
    setAutoCopyImage,
    setReadClipboardTextHotkeySendText,
    setReadClipboardTextHotkeyScreenshot,
    setSelectedMonitor,
  };
}); 