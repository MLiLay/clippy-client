<template>
  <div :class="['message', message.type, isSent ? 'sent' : 'received']">
    <div class="message-header flex justify-between items-center mb-1">
      <span class="sender-id text-xs text-gray-500">{{ isSent ? 'You' : `User ${message.fromUserId}` }}</span>
      <div class="timestamp-copy-container flex items-center space-x-2">
        <span class="timestamp text-xs text-gray-500">{{ formattedTimestamp }}</span>
        <!-- 仅当消息类型为 'text' 时显示复制按钮 -->
        <button 
          v-if="message.type === 'text'" 
          class="copy-button" 
          @click="handleCopy" 
          :disabled="copyStatus !== 'idle'"
          aria-label="复制消息"
        >
          <span v-if="copyStatus === 'idle'">
            <font-awesome-icon :icon="['fas', 'copy']" class="w-4 h-4 text-gray-500 hover:text-gray-700" />
          </span>
          <span v-else-if="copyStatus === 'success'" class="text-green-500">✓</span>
          <span v-else-if="copyStatus === 'fail'" class="text-red-500">✗</span>
        </button>
      </div>
    </div>
    <div class="message-content">
      <div v-if="message.type === 'text'" class="text-content">{{ message.content }}</div>
      <div v-else>
        <img :src="message.content" alt="Image" class="message-image rounded-md" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { Message } from '../stores/useChatStore';
import ClipboardService from '../services/ClipboardService';
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
    const isSent = computed(() => props.message.fromUserId === props.userId);
    const formattedTimestamp = computed(() => {
      return dayjs(props.message.timestamp)
        .utc()
        .utcOffset(-480) // UTC-8
        .format('YYYY-MM-DD HH:mm:ss');
    });

    const copyStatus = ref<'idle' | 'success' | 'fail'>('idle');

    const handleCopy = async () => {
      if (copyStatus.value !== 'idle') return; // 防止多次点击

      try {
        await ClipboardService.copyMessage(props.message);
        copyStatus.value = 'success';
      } catch (error) {
        copyStatus.value = 'fail';
      }

      // 5秒后恢复按钮状态
      setTimeout(() => {
        copyStatus.value = 'idle';
      }, 5000);
    };

    return {
      isSent,
      formattedTimestamp,
      handleCopy,
      copyStatus,
    };
  },
});
</script>

<style scoped>
.message {
  padding: 10px;
  border-left: 4px solid #007bff;
  background-color: #f9f9f9;
  border-radius: 0.5rem; /* 圆角 */
  word-break: break-word; /* 自动换行 */
  position: relative; /* 为复制按钮定位提供基础 */
  max-width: 80%;
}

.message.sent {
  border-left-color: #28A745; /* 发送消息颜色 */
  background-color: #e6ffe6;
  align-self: flex-end;
}

.message.received {
  border-left-color: #007bff;
  background-color: #e6f0ff;
  align-self: flex-start;
}

.message-header {
  font-size: 0.9rem;
  color: #555;
  display: flex;
  justify-content: space-between;
}

.timestamp-copy-container {
  display: flex;
  align-items: center;
}

.timestamp {
  font-size: 0.8rem;
}

.copy-button {
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  padding: 4px;
}

.copy-button:disabled {
  cursor: not-allowed;
}

.copy-button:hover:not(:disabled) {
  color: #000;
}

.message-content {
  font-size: 1rem;
  color: #333;
  white-space: pre-wrap; /* 保留换行和空格 */
}

.text-content {
  word-break: break-word; /* 防止长字符串溢出 */
}

.message-image {
  max-width: 100%;
  height: auto;
  border-radius: 0.25rem; /* 圆角 */
}

@media (max-width: 600px) {
  .message {
    padding: 8px;
    border-left-width: 3px;
    max-width: 100%;
  }

  .message-header {
    font-size: 0.8rem;
  }

  .message-content {
    font-size: 0.9rem;
  }
}
</style>

