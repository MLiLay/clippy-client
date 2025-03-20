<template>
  <vue-easy-lightbox
    :visible="visible"
    :imgs="imgs"
    :index="currentIndex"
    :moveDisabled="false"
    :titleShow="false"
    :swipeTolerance="50"
    :teleport="'body'"
    :zoomScale="0.5"
    @hide="$emit('close')"
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
import { defineComponent, watch, onUnmounted } from 'vue';

export default defineComponent({
  name: 'ImageLightbox',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    imgs: {
      type: Array as () => string[],
      required: true
    },
    currentIndex: {
      type: Number,
      required: true
    }
  },
  emits: ['close'],
  setup(props) {
    // 处理键盘事件
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!props.visible) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          // 触发上一张
          const prevBtn = document.querySelector('.custom-prev-btn') as HTMLElement;
          if (prevBtn) prevBtn.click();
          e.preventDefault();
          break;
        case 'ArrowRight':
          // 触发下一张
          const nextBtn = document.querySelector('.custom-next-btn') as HTMLElement;
          if (nextBtn) nextBtn.click();
          e.preventDefault();
          break;
        case 'Escape':
          // 触发关闭
          const closeBtn = document.querySelector('.custom-close-btn') as HTMLElement;
          if (closeBtn) closeBtn.click();
          e.preventDefault();
          break;
      }
    };
    
    // 监听图片浏览器可见性变化，添加或移除键盘事件监听
    watch(() => props.visible, (newValue) => {
      if (newValue) {
        window.addEventListener('keydown', handleKeyDown);
      } else {
        window.removeEventListener('keydown', handleKeyDown);
      }
    });
    
    // 组件卸载时清除事件监听
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });

    return {};
  }
});
</script>

<style scoped>
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
  .custom-nav-btn, .custom-close-btn {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
  
  .custom-footer {
    padding: 4px 12px;
    font-size: 12px;
  }
}
</style> 