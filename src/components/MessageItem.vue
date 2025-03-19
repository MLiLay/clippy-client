<template>
  <div :class="['message', message.type, isSent ? 'sent' : 'received']">
    <div class="message-header">
      <div class="header-content">
        <span class="sender-id">{{ isSent ? 'You' : `${message.userId}` }}</span>
        <span class="timestamp">{{ formattedTimestamp }}</span>
      </div>
      <div class="header-actions">
        <!-- 展开/收起按钮 -->
        <button 
          v-if="message.type === 'text' && needsExpansion" 
          class="header-button" 
          @click="toggleExpand"
        >
          {{ isExpanded ? '收起' : '展开' }}
        </button>
        <!-- 复制按钮 -->
        <button 
          v-if="message.type === 'text'" 
          class="header-button" 
          @click="handleCopy" 
          :disabled="copyStatus !== 'idle'"
          aria-label="复制消息"
        >
          <span v-if="copyStatus === 'idle'">复制</span>
          <span v-else-if="copyStatus === 'success'" class="success-text">已复制</span>
          <span v-else-if="copyStatus === 'fail'" class="error-text">复制失败</span>
        </button>
      </div>
    </div>
    <div class="message-content">
      <div v-if="message.type === 'text'" :class="['text-content', {'collapsed': !isExpanded && needsExpansion}]">
        {{ message.content }}
        <div v-if="!isExpanded && needsExpansion" class="fade-overlay"></div>
      </div>
      <div v-else class="image-container">
        <img 
          :src="message.content" 
          alt="Image" 
          class="message-image thumbnail" 
          @click="openLightbox" 
        />
        <div class="image-overlay" @click="openLightbox">
          <span class="zoom-icon">🔍</span>
        </div>
      </div>
    </div>
  </div>
  <!-- 图片浏览器 -->
  <vue-easy-lightbox
    :visible="lightboxVisible"
    :imgs="lightboxImgs"
    :index="lightboxIndex"
    :moveDisabled="false"
    :titleShow="false"
    :swipeTolerance="50"
    :teleport="'body'"
    :zoomScale="0.5"
    @hide="closeLightbox"
  >
    <!-- 自定义上一张按钮 -->
    <template v-slot:prev-btn="{ prev }">
      <div class="custom-nav-btn custom-prev-btn" @click="prev" title="上一张">
        <span>&#10094;</span>
      </div>
    </template>
    
    <!-- 自定义下一张按钮 -->
    <template v-slot:next-btn="{ next }">
      <div class="custom-nav-btn custom-next-btn" @click="next" title="下一张">
        <span>&#10095;</span>
      </div>
    </template>
    
    <!-- 自定义关闭按钮 -->
    <template v-slot:close-btn="{ close }">
      <div class="custom-close-btn" @click="close" title="关闭">
        <span>&#10005;</span>
      </div>
    </template>
    
    <!-- 图片索引信息 -->
    <template v-slot:footer="{ index, total }">
      <div class="custom-footer">
        <span>{{ index + 1 }} / {{ total }}</span>
      </div>
    </template>
  </vue-easy-lightbox>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, watch, onUnmounted } from 'vue';
import { Message } from '../stores/useChatStore';
import ClipboardService from '../services/ClipboardService';
import { isTauri } from '@tauri-apps/api/core';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useChatStore } from '../stores/useChatStore';

dayjs.extend(utc);

export default defineComponent({
  name: 'MessageItem',
  props: {
    message: {
      type: Object as () => Message,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const store = useChatStore();
    
    const isSent = computed(() => props.message.userId === props.userId);
    const formattedTimestamp = computed(() => {
      return dayjs(props.message.timestamp)
        .utc()
        .utcOffset(-480) // UTC-8
        .format('YYYY-MM-DD HH:mm:ss');
    });

    const copyStatus = ref<'idle' | 'success' | 'fail'>('idle');
    const isExpanded = ref(false);
    const needsExpansion = ref(false);
    
    // 图片浏览器相关状态
    const lightboxVisible = ref(false);
    const lightboxImgs = ref<string[]>([]);
    const lightboxIndex = ref(0);
    
    // 获取所有图片消息
    const imageMessages = computed(() => {
      return store.messages
        .filter(msg => msg.type === 'image')
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });
    
    // 获取当前图片在所有图片中的索引
    const getCurrentImageIndex = () => {
      if (props.message.type !== 'image') return -1;
      
      return imageMessages.value.findIndex(
        img => img.content === props.message.content && img.timestamp === props.message.timestamp
      );
    };
    
    // 提取所有图片URL
    const getAllImageUrls = () => {
      return imageMessages.value.map(img => img.content);
    };
    
    // 打开图片浏览器
    const openLightbox = () => {
      if (props.message.type === 'image') {
        const urls = getAllImageUrls();
        const currentIndex = getCurrentImageIndex();
        
        if (urls.length > 0 && currentIndex !== -1) {
          lightboxImgs.value = urls;
          lightboxIndex.value = currentIndex;
          lightboxVisible.value = true;
        }
      }
    };
    
    // 关闭图片浏览器
    const closeLightbox = () => {
      lightboxVisible.value = false;
    };
    
    // 显示上一张图片
    const showPrevImage = () => {
      if (lightboxImgs.value.length > 1) {
        lightboxIndex.value = (lightboxIndex.value - 1 + lightboxImgs.value.length) % lightboxImgs.value.length;
      }
    };
    
    // 显示下一张图片
    const showNextImage = () => {
      if (lightboxImgs.value.length > 1) {
        lightboxIndex.value = (lightboxIndex.value + 1) % lightboxImgs.value.length;
      }
    };
    
    // 处理键盘事件
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxVisible.value) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          showPrevImage();
          e.preventDefault();
          break;
        case 'ArrowRight':
          showNextImage();
          e.preventDefault();
          break;
        case 'Escape':
          closeLightbox();
          e.preventDefault();
          break;
      }
    };
    
    // 监听图片浏览器可见性变化，添加或移除键盘事件监听
    watch(lightboxVisible, (newValue) => {
      if (newValue) {
        // 浏览器打开时添加键盘事件监听
        window.addEventListener('keydown', handleKeyDown);
      } else {
        // 浏览器关闭时移除键盘事件监听
        window.removeEventListener('keydown', handleKeyDown);
      }
    });
    
    // 组件卸载时清除事件监听
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });
    
    // 在组件挂载后检查消息是否需要展开按钮
    onMounted(() => {
      if (props.message.type === 'text') {
        // 根据消息内容的行数判断是否需要展开按钮
        const lineCount = (props.message.content.match(/\n/g) || []).length + 1;
        needsExpansion.value = lineCount > 3 || props.message.content.length > 150;
      }
    });

    // 切换展开/收起状态
    const toggleExpand = () => {
      isExpanded.value = !isExpanded.value;
    };

    // 检查是否在Tauri环境中
    const handleCopy = async () => {
      if (copyStatus.value !== 'idle') return; // 防止多次点击

      try {
        if (isTauri()) {
          // 在Tauri环境下使用ClipboardService
          await ClipboardService.copyMessage(props.message);
        } else {
          // 在浏览器环境下使用navigator.clipboard API
          await navigator.clipboard.writeText(props.message.content);
        }
        copyStatus.value = 'success';
      } catch (error) {
        console.error('复制失败:', error);
        copyStatus.value = 'fail';
      }

      setTimeout(() => {
        copyStatus.value = 'idle';
      }, 3000);
    };

    return {
      isSent,
      formattedTimestamp,
      handleCopy,
      copyStatus,
      isExpanded,
      needsExpansion,
      toggleExpand,
      lightboxVisible,
      lightboxImgs,
      lightboxIndex,
      openLightbox,
      closeLightbox,
      showPrevImage,
      showNextImage
    };
  },
});
</script>

<style scoped>
/* 基础消息样式 */
.message {
  padding: 0;
  margin: 8px 0;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  word-break: break-word;
  position: relative;
  max-width: 80%;
  overflow: visible;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-self: flex-start;
}

.message.sent {
  background-color: #e3f2fd;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.message.received {
  background-color: #f0f2f5;
  border-bottom-left-radius: 4px;
}

/* 消息头部 */
.message-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 8px 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
  font-size: 0.85rem;
  margin: 8px 8px 4px;
  width: calc(100% - 16px);
}

.message.sent .message-header {
  background: rgba(192, 222, 247, 0.95);
}

.message.received .message-header {
  background: rgba(220, 225, 235, 0.95);
}

.header-content, .header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sender-id {
  font-weight: 600;
  color: #4a5568;
}

.timestamp {
  font-size: 0.75rem;
  color: #718096;
}

/* 头部按钮 */
.header-button {
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.75rem;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-button:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.1);
}

.header-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 消息状态文本 */
.success-text {
  color: #38a169;
}

.error-text {
  color: #e53e3e;
}

/* 消息内容区 */
.message-content {
  font-size: 1rem;
  color: #333;
  white-space: pre-wrap;
  line-height: 1.5;
  padding: 10px 12px 12px;
}

.text-content {
  word-break: break-word;
  position: relative;
}

/* 文本折叠相关 */
.text-content.collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: 4.5em;
}

.fade-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 24px;
  background: linear-gradient(transparent, var(--message-bg-color, #f0f2f5));
  pointer-events: none;
}

.message.sent .fade-overlay {
  --message-bg-color: #e3f2fd;
}

.message.received .fade-overlay {
  --message-bg-color: #f0f2f5;
}

/* 图片相关 */
.image-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 8px;
}

.message-image.thumbnail {
  max-width: 500px;
  max-height: 400px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
  width: 100%;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.05s;
  cursor: pointer;
}

.image-overlay:hover {
  opacity: 1;
}

.zoom-icon {
  color: white;
  font-size: 24px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

/* 图片浏览器按钮通用样式 */
.custom-nav-btn, .custom-close-btn {
  position: absolute;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  z-index: 1001;
  transition: background 0.05s;
}

.custom-nav-btn:hover, .custom-close-btn:hover {
  background: rgba(0, 0, 0, 0.6);
}

.custom-nav-btn {
  top: 50%;
  transform: translateY(-50%);
}

.custom-prev-btn {
  left: 20px;
}

.custom-next-btn {
  right: 20px;
}

.custom-close-btn {
  top: 20px;
  right: 20px;
}

.custom-footer {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 5px 15px;
  border-radius: 15px;
  font-size: 14px;
}

/* 确保图片浏览器中的图片显示正确 */
:deep(.vel-img) {
  max-width: 90vw !important;
  max-height: 90vh !important;
  object-fit: contain !important;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .message {
    max-width: 90%;
  }

  .message-header {
    padding: 6px 10px;
    font-size: 0.8rem;
  }

  .message-content {
    font-size: 0.95rem;
    padding: 8px 10px 10px;
  }
  
  .header-button {
    padding: 1px 6px;
    font-size: 0.7rem;
    height: 20px;
  }
  
  .sender-id {
    font-size: 0.8rem;
  }
  
  .timestamp {
    font-size: 0.7rem;
  }
  
  .custom-nav-btn, .custom-close-btn {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
  
  .custom-footer {
    padding: 4px 12px;
    font-size: 12px;
  }
  
  .image-container {
    max-width: 300px;
  }
  
  .message-image.thumbnail {
    max-width: 300px;
    max-height: 240px;
  }
  
  .zoom-icon {
    font-size: 18px;
  }
}
</style>

