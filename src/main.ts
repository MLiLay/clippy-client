import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faImage, faGear, faGlobe, faPaperPlane, faCopy, faXmark, faCircleInfo, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import './assets/tailwind.css';
import { initializeHotkeyService } from './services/HotkeyService';
import Vant from 'vant';
import 'vant/lib/index.css';
import { isTauri } from '@tauri-apps/api/core';
import VueEasyLightbox from 'vue-easy-lightbox';
import 'vue-easy-lightbox/dist/external-css/vue-easy-lightbox.css';
import { useTray } from './composables/useTray';
import { getCurrentWindow } from '@tauri-apps/api/window';

library.add(faImage, faGear, faGlobe, faPaperPlane, faCopy, faXmark, faCircleInfo, faMagnifyingGlass);

// 创建应用实例
const app = createApp(App);

// 添加字体图标组件
app.component('font-awesome-icon', FontAwesomeIcon);

// 使用 Pinia 状态管理库
const pinia = createPinia();
app.use(pinia);

// 使用 Vant UI 组件库
app.use(Vant);

// 使用 VueEasyLightbox 图片浏览器插件
app.use(VueEasyLightbox);

// 初始化应用
const initApp = async () => {
  try {
    initializeHotkeyService();
    
    // 检查是否为 Tauri 环境
    const isTauriEnv = await isTauri();
    console.log(`应用初始化完成，环境: ${isTauriEnv ? 'Tauri桌面端' : 'Web浏览器'}`);
    
    // 在 Tauri 环境下初始化系统托盘
    if (isTauriEnv) {
      try {
        const { initTray, handleCloseRequested } = useTray();
        
        // 初始化托盘并监听窗口关闭事件
        await initTray();
        await getCurrentWindow().listen('tauri://close-requested', handleCloseRequested);
      } catch (error) {
        console.error('托盘初始化失败:', error);
      }
    }
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
  
  // 挂载应用
  app.mount('#app');
};

initApp();

