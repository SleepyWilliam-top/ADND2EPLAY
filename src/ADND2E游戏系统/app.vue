<template>
  <div class="app-container">
    <!-- 路由视图（使用 KeepAlive 缓存组件，性能优化）-->
    <RouterView v-slot="{ Component }">
      <KeepAlive :max="3">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>

    <!-- 悬浮设置按钮（仅在主菜单显示） -->
    <FloatingButton v-if="isMainMenu" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import FloatingButton from './FloatingButton.vue';

const route = useRoute();

// 只在主菜单显示悬浮按钮
const isMainMenu = computed(() => route.path === '/');

// 应用初始化时的检查
onMounted(() => {
  console.log('[App] ADND2E 应用已挂载');
  console.log('[App] 当前路由:', route.path);

  // 确保iframe可见
  try {
    const iframe = window.frameElement as HTMLElement;
    if (iframe) {
      console.log('[App] Iframe元素:', iframe.id);
      // 确保iframe有适当的样式以保持可见
      if (iframe.style.display === 'none') {
        console.warn('[App] Iframe被隐藏，尝试显示');
        iframe.style.display = '';
      }
    }
  } catch (error) {
    console.error('[App] 检查iframe状态失败:', error);
  }
});
</script>

<style lang="scss" scoped>
.app-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
