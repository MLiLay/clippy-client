import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faImage, faGear, faGlobe, faPaperPlane, faCopy, faXmark, faCircleInfo } from '@fortawesome/free-solid-svg-icons'; // 添加 faCircleInfo
import './assets/tailwind.css';
import { initializeHotkeyService } from './services/HotkeyService'; // 导入 HotkeyService 初始化函数
import { useChatStore } from './stores/useChatStore';
import Vant from 'vant';
import 'vant/lib/index.css'; // 导入 Vant 样式
import { isTauri } from '@tauri-apps/api/core';
import VueEasyLightbox from 'vue-easy-lightbox';
import 'vue-easy-lightbox/dist/external-css/vue-easy-lightbox.css';

library.add(faImage, faGear, faGlobe, faPaperPlane, faCopy, faXmark, faCircleInfo);

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

// 获取 store 实例
const store = useChatStore(pinia);

// 检查是否在Tauri环境中运行
const initApp = async () => {
  try {
    // 无论在什么环境下都初始化HotkeyService，它内部会做环境检测
    // 但在Web环境下它会跳过热键注册
    initializeHotkeyService(store);
    
    console.log(`应用初始化完成，环境: ${await isTauri() ? 'Tauri桌面端' : 'Web浏览器'}`);
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
  
  // 挂载应用
  app.mount('#app');
};

initApp();

