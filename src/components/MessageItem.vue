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
      <div v-else>
        <img :src="message.content" alt="Image" class="message-image" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from 'vue';
import { Message } from '../stores/useChatStore';
import ClipboardService from '../services/ClipboardService';
import { isTauri } from '@tauri-apps/api/core';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

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
      toggleExpand
    };
  },
});
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
}

.message.sent {
  border-left: none;
  background-color: #e3f2fd; /* 浅蓝色背景 */
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.message.received {
  border-left: none;
  background-color: #f0f2f5;
  align-self: flex-start;
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

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
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

/* 添加折叠样式 */
.text-content.collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3; /* 标准属性，提高兼容性 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: 4.5em; /* 大约3行的高度 */
}

/* 添加渐变遮罩效果 */
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

.success-text {
  color: #38a169;
}

.error-text {
  color: #e53e3e;
}

.message-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 600px) {
  .message {
    max-width: 90%;
  }

  .message-header {
    padding: 6px 10px;
    font-size: 0.8rem;
  }

  .header-button {
    padding: 1px 6px;
    font-size: 0.7rem;
    height: 20px;
  }

  .message-content {
    font-size: 0.95rem;
    padding: 8px 10px 10px;
  }
  
  .sender-id {
    font-size: 0.8rem;
  }
  
  .timestamp {
    font-size: 0.7rem;
  }
}
</style>

