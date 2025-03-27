<template>
  <div :class="messageClasses">
    <div class="message-header">
      <div class="header-content">
        <span class="sender-id">{{ isSent ? 'You' : message.userId }}</span>
        <span class="timestamp">{{ formattedTimestamp }}</span>
      </div>
      <div class="header-actions">
        <span v-if="message.clipReg !== undefined && message.clipReg !== null" class="clipreg-badge">REG {{ message.clipReg + 1 }}</span>
        <button 
          v-if="isTextMessage && needsExpansion" 
          class="header-button" 
          @click="toggleExpand"
        >
          {{ isExpanded ? '收起' : '展开' }}
        </button>
        <button 
          v-if="isTextMessage" 
          class="header-button" 
          @click="handleCopy" 
          :disabled="copyStatus !== 'idle'"
          aria-label="复制消息"
        >
          <span :class="['copy-status', copyStatus]">
            {{ copyStatusText }}
          </span>
        </button>
      </div>
    </div>
    <div class="message-content">
      <div v-if="isTextMessage" :class="['text-content', {'collapsed': !isExpanded && needsExpansion}]">
        {{ message.content }}
        <div v-if="!isExpanded && needsExpansion" class="fade-overlay"></div>
      </div>
      <div v-else class="image-container" @click="openLightbox">
        <img 
          :src="message.content" 
          alt="Image" 
          class="message-image thumbnail" 
        />
        <div class="image-overlay">
          <span class="zoom-icon"><font-awesome-icon :icon="['fas', 'magnifying-glass']" /></span>
        </div>
      </div>
    </div>
  </div>
  <ImageLightbox
    v-if="lightboxVisible"
    :visible="lightboxVisible"
    :imgs="lightboxImgs"
    :current-index="lightboxIndex"
    @close="closeLightbox"
  />
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { Message, useChatStore } from '../stores/useChatStore';
import ClipboardService from '../services/ClipboardService';
import { isTauri } from '@tauri-apps/api/core';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import ImageLightbox from './ImageLightbox.vue';

// 常量定义
const COPY_TIMEOUT = 3000;
const TEXT_EXPANSION_THRESHOLD = {
  LINE_COUNT: 3,
  CHAR_LENGTH: 150
};

// 类型定义
type CopyStatus = 'idle' | 'success' | 'fail';

interface Props {
  message: Message;
  userId: string;
}

// Props 和 Store
const props = defineProps<Props>();
const chatStore = useChatStore();

// 状态管理
const copyStatus = ref<CopyStatus>('idle');
const isExpanded = ref(false);
const needsExpansion = ref(false);
const lightboxVisible = ref(false);
const lightboxImgs = ref<string[]>([]);
const lightboxIndex = ref(0);

// 计算属性
const isTextMessage = computed(() => props.message.type === 'text');
const isSent = computed(() => props.message.userId === props.userId);
const messageClasses = computed(() => ['message', props.message.type, isSent.value ? 'sent' : 'received']);
const copyStatusText = computed(() => ({
  idle: '复制',
  success: '已复制',
  fail: '复制失败'
}[copyStatus.value]));

const formattedTimestamp = computed(() => 
  dayjs(props.message.timestamp)
    .utc()
    .utcOffset(-480)
    .format('YYYY-MM-DD HH:mm:ss')
);

const imageMessages = computed(() => 
  chatStore.messages
    .filter(msg => msg.type === 'image')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
);

// 方法
const toggleExpand = () => isExpanded.value = !isExpanded.value;
const closeLightbox = () => lightboxVisible.value = false;

function openLightbox() {
  if (props.message.type !== 'image') return;
  
  const urls = imageMessages.value.map(img => img.content);
  const currentIndex = imageMessages.value.findIndex(
    img => img.content === props.message.content && img.timestamp === props.message.timestamp
  );
  
  if (urls.length > 0 && currentIndex !== -1) {
    lightboxImgs.value = urls;
    lightboxIndex.value = currentIndex;
    lightboxVisible.value = true;
  }
}

async function handleCopy() {
  if (copyStatus.value !== 'idle') return;

  try {
    if (isTauri()) {
      await ClipboardService.copyMessage(props.message);
    } else {
      await navigator.clipboard.writeText(props.message.content);
    }
    copyStatus.value = 'success';
  } catch (error) {
    console.error('复制失败:', error);
    copyStatus.value = 'fail';
  }

  setTimeout(() => copyStatus.value = 'idle', COPY_TIMEOUT);
}

// 生命周期钩子
onMounted(() => {
  if (isTextMessage.value) {
    const lineCount = (props.message.content.match(/\n/g) || []).length + 1;
    needsExpansion.value = lineCount > TEXT_EXPANSION_THRESHOLD.LINE_COUNT || 
                          props.message.content.length > TEXT_EXPANSION_THRESHOLD.CHAR_LENGTH;
  }
});

watch(imageMessages, (newImages) => {
  if (lightboxVisible.value && newImages.length > 0) {
    const currentImg = lightboxImgs.value[lightboxIndex.value];
    lightboxImgs.value = newImages.map(img => img.content);
    const newIndex = lightboxImgs.value.findIndex(img => img === currentImg);
    if (newIndex !== -1) {
      lightboxIndex.value = newIndex;
    }
  }
}, { deep: true });

// 初始化 dayjs
dayjs.extend(utc);
</script>

<style scoped>
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

.header-actions {
  margin-left: 16px;
}

.sender-id {
  font-weight: 600;
  color: #4a5568;
}

.timestamp {
  font-size: 0.75rem;
  color: #718096;
}

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

.clipreg-badge {
  background: transparent;
  font-size: 0.75rem;
  color: #4a5568;
  height: 22px;
  display: flex;
  align-items: center;
}

.header-button:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.1);
}

.header-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.copy-status {
  &.success { color: #38a169; }
  &.fail { color: #e53e3e; }
}

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

.image-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
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
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.05s;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.zoom-icon {
  color: white;
  font-size: 24px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

@media (max-width: 600px) {
  .message { max-width: 90%; }
  .message-header { padding: 6px 10px; font-size: 0.8rem; }
  .message-content { font-size: 0.95rem; padding: 8px 10px 10px; }
  .header-button { padding: 1px 6px; font-size: 0.7rem; height: 20px; }
  .sender-id { font-size: 0.8rem; }
  .timestamp { font-size: 0.7rem; }
  .image-container { max-width: 300px; }
  .message-image.thumbnail { max-width: 300px; max-height: 240px; }
  .zoom-icon { font-size: 18px; }
}
</style>