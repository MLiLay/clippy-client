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

library.add(faImage, faGear, faGlobe, faPaperPlane, faCopy, faXmark, faCircleInfo);

const app = createApp(App);
const pinia = createPinia();

app.component('font-awesome-icon', FontAwesomeIcon);
app.use(pinia);
app.use(Vant); // 使用 Vant

app.mount('#app');

// 获取 store 实例
const store = useChatStore(pinia);

// 初始化 HotkeyService
initializeHotkeyService(store);

