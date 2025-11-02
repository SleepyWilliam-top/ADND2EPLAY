import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import app from './app.vue';
import MainMenu from './MainMenu.vue';
import './style.scss';
import './performance.scss'; // 性能优化 CSS

// 创建 Pinia 实例
const pinia = createPinia();

// 创建路由（使用 createMemoryHistory 因为是 iframe 环境）
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'MainMenu',
      component: MainMenu,
    },
    {
      path: '/character-creation',
      name: 'CharacterCreation',
      component: () => import('./CharacterCreation.vue'),
    },
    {
      path: '/game',
      name: 'Game',
      component: () => import('./Game.vue'),
    },
  ],
});

// 强制设置 iframe 尺寸的函数
function forceIframeSize() {
  try {
    const iframe = window.frameElement as HTMLElement;
    if (iframe) {
      // 获取父容器的高度和内容高度
      const parentHeight = iframe.parentElement?.clientHeight || 1200;
      const contentHeight = document.body.scrollHeight || 1200;

      // 使用内容高度和父容器高度中的较大值，最小 1200px
      const targetHeight = Math.max(parentHeight, contentHeight, 1200);

      // 强制设置样式
      iframe.style.minHeight = '1200px';
      iframe.style.height = `${targetHeight}px`;
      iframe.style.width = '100%';
      iframe.style.display = 'block';

      console.log(
        `[ADND2E] iframe 高度已设置为: ${targetHeight}px (父容器: ${parentHeight}px, 内容: ${contentHeight}px)`,
      );
    }
  } catch (error) {
    console.error('[ADND2E] 调整 iframe 尺寸失败:', error);
  }
}

// 在页面加载时挂载 Vue 应用
$(() => {
  console.log('[ADND2E] 正在加载游戏系统...');
  console.log('[ADND2E] 当前 body:', document.body);
  console.log('[ADND2E] #app 元素:', document.getElementById('app'));

  try {
    // 确保 #app 元素存在
    const appElement = document.getElementById('app');
    if (!appElement) {
      console.error('[ADND2E] 错误: #app 元素不存在!');
      toastr.error('#app 元素不存在，无法加载游戏系统');
      return;
    }

    console.log('[ADND2E] #app 元素存在，准备挂载 Vue 应用');

    // 初始设置 iframe 尺寸
    forceIframeSize();

    // 定期检查并调整 iframe 尺寸（防止被酒馆重置）
    setInterval(forceIframeSize, 1000);

    // 监听窗口大小变化
    $(window).on('resize', forceIframeSize);

    // 挂载 Vue 应用
    const vueApp = createApp(app);
    vueApp.use(pinia);
    vueApp.use(router);
    vueApp.mount('#app');

    console.log('[ADND2E] Vue 应用已成功挂载');
    console.log('[ADND2E] 当前路由:', router.currentRoute.value.path);
    toastr.success('ADND 2E 游戏系统已加载');

    // 额外检查：确认内容是否渲染
    setTimeout(() => {
      const appContent = document.querySelector('#app');
      if (appContent) {
        console.log('[ADND2E] #app 内容:', appContent.innerHTML.substring(0, 200));
        console.log('[ADND2E] #app 子元素数量:', appContent.children.length);
      }
    }, 500);
  } catch (error) {
    console.error('[ADND2E] Vue 应用挂载失败:', error);
    console.error('[ADND2E] 错误堆栈:', (error as Error).stack);
    toastr.error('游戏系统加载失败: ' + (error as Error).message);
  }
});

// 监听页面卸载事件，保存状态
$(window).on('pagehide', () => {
  console.log('[ADND2E] 游戏系统正在卸载');
});
