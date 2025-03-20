<template>
  <div class="messages-list-container" ref="messagesContainer">
    <MessageItem
      v-for="message in sortedMessages"
      :key="`${message.userId}-${message.timestamp}`"
      :message="message"
      :userId="userId"
    />
    <div ref="scrollAnchor"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref, nextTick } from 'vue';
import { useChatStore } from '../stores/useChatStore';
import { useConnectionStore } from '../stores/useConnectionStore';
import MessageItem from './MessageItem.vue';

const chatStore = useChatStore();
const connectionStore = useConnectionStore();
const messagesContainer = ref<HTMLDivElement | null>(null);
const scrollAnchor = ref<HTMLDivElement | null>(null);

const sortedMessages = computed(() => 
  [...chatStore.messages].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
);

const userId = computed(() => connectionStore.userId);

const scrollToBottom = async () => {
  await nextTick();
  scrollAnchor.value?.scrollIntoView({ behavior: 'smooth' });
};

onMounted(scrollToBottom);

watch(() => chatStore.messages.length, scrollToBottom);
</script>

<style scoped>
.messages-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}
</style>

