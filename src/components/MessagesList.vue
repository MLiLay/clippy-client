<template>
  <div class="messages-list-container flex flex-col space-y-4" ref="messagesContainer">
    <MessageItem
      v-for="(message, index) in sortedMessages"
      :key="index"
      :message="message"
      :userId="userId"
    />
    <!-- 滚动锚点 -->
    <div ref="scrollAnchor"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, watch, ref, nextTick } from 'vue';
import { useChatStore } from '../stores/useChatStore';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import MessageItem from './MessageItem.vue';

dayjs.extend(utc);

export default defineComponent({
  name: 'MessagesList',
  components: {
    MessageItem,
  },
  setup() {
    const store = useChatStore();
    const messagesContainer = ref<HTMLDivElement | null>(null);
    const scrollAnchor = ref<HTMLDivElement | null>(null);

    const sortedMessages = computed(() => {
      return [...store.messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });

    const userId = computed(() => store.userId);

    const scrollToBottom = async () => {
      await nextTick();
      if (scrollAnchor.value) {
        scrollAnchor.value.scrollIntoView({ behavior: 'smooth' });
      }
    };

    onMounted(() => {
      scrollToBottom();
    });

    watch(sortedMessages, () => {
      scrollToBottom();
    });

    return {
      sortedMessages,
      userId,
      messagesContainer,
      scrollAnchor,
    };
  },
});
</script>

<style scoped>
.messages-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto; /* 确保滚动 */
}
</style>

