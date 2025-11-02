/**
 * 性能监控 Composable
 *
 * 提供性能监控和分析工具：
 * 1. 组件渲染时间追踪
 * 2. 内存使用监控
 * 3. FPS 监控
 * 4. 长任务检测
 * 5. 性能报告生成
 */

import { onMounted, onUnmounted, ref } from 'vue';

export interface PerformanceMetrics {
  fps: number;
  memory?: {
    usedJSHeapSize: number; // MB
    totalJSHeapSize: number; // MB
    jsHeapSizeLimit: number; // MB
  };
  renderTime: number; // ms
  longTasks: number; // 超过 50ms 的任务数量
}

export interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
}

class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, PerformanceMark>();
  private fpsFrames: number[] = [];
  private lastFrameTime = 0;
  private rafId: number | null = null;
  private longTaskCount = 0;

  /**
   * 标记性能点（开始）
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());

    // 使用 Performance API
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * 测量两个标记点之间的时间
   */
  measure(name: string, startMark: string, endMark?: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`[Performance] 未找到起始标记: ${startMark}`);
      return 0;
    }

    const endTime = endMark ? this.marks.get(endMark) : performance.now();
    if (!endTime) {
      console.warn(`[Performance] 未找到结束标记: ${endMark}`);
      return 0;
    }

    const duration = endTime - startTime;
    this.measures.set(name, {
      name,
      startTime,
      duration,
    });

    // 检测长任务（>50ms）
    if (duration > 50) {
      this.longTaskCount++;
      console.warn(`[Performance] 检测到长任务: ${name} 耗时 ${duration.toFixed(2)}ms`);
    }

    // 使用 Performance API
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        console.warn('[Performance] Performance.measure 失败:', error);
      }
    }

    return duration;
  }

  /**
   * 获取测量结果
   */
  getMeasure(name: string): PerformanceMark | undefined {
    return this.measures.get(name);
  }

  /**
   * 获取所有测量结果
   */
  getAllMeasures(): PerformanceMark[] {
    return Array.from(this.measures.values());
  }

  /**
   * 清除标记和测量
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();

    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  /**
   * 开始 FPS 监控
   */
  startFPSMonitoring(): void {
    const measureFPS = (timestamp: number) => {
      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime;
        const fps = 1000 / delta;

        this.fpsFrames.push(fps);

        // 只保留最近 60 帧的数据
        if (this.fpsFrames.length > 60) {
          this.fpsFrames.shift();
        }
      }

      this.lastFrameTime = timestamp;
      this.rafId = requestAnimationFrame(measureFPS);
    };

    this.rafId = requestAnimationFrame(measureFPS);
  }

  /**
   * 停止 FPS 监控
   */
  stopFPSMonitoring(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * 获取当前 FPS（平均值）
   */
  getCurrentFPS(): number {
    if (this.fpsFrames.length === 0) return 0;

    const sum = this.fpsFrames.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.fpsFrames.length);
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): PerformanceMetrics['memory'] | undefined {
    // @ts-ignore - performance.memory 是非标准 API
    if (typeof performance !== 'undefined' && performance.memory) {
      // @ts-ignore
      const memory = performance.memory;
      return {
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return undefined;
  }

  /**
   * 获取完整的性能指标
   */
  getMetrics(): PerformanceMetrics {
    return {
      fps: this.getCurrentFPS(),
      memory: this.getMemoryUsage(),
      renderTime: 0, // 需要外部设置
      longTasks: this.longTaskCount,
    };
  }

  /**
   * 重置长任务计数
   */
  resetLongTaskCount(): void {
    this.longTaskCount = 0;
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const measures = this.getAllMeasures();

    let report = '=== ADND 2E 性能报告 ===\n\n';

    report += `FPS: ${metrics.fps}\n`;

    if (metrics.memory) {
      report += `内存使用: ${metrics.memory.usedJSHeapSize} / ${metrics.memory.totalJSHeapSize} MB\n`;
      report += `内存限制: ${metrics.memory.jsHeapSizeLimit} MB\n`;
    }

    report += `长任务数量: ${metrics.longTasks}\n\n`;

    if (measures.length > 0) {
      report += '=== 性能测量 ===\n';
      measures
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .forEach(measure => {
          report += `${measure.name}: ${measure.duration?.toFixed(2)}ms\n`;
        });
    }

    return report;
  }

  /**
   * 打印性能报告到控制台
   */
  logReport(): void {
    console.log(this.generateReport());
  }
}

// 全局性能监控实例
const globalMonitor = new PerformanceMonitor();

/**
 * 性能监控 Composable
 */
export function usePerformanceMonitor() {
  const metrics = ref<PerformanceMetrics>({
    fps: 0,
    renderTime: 0,
    longTasks: 0,
  });

  let updateInterval: number | null = null;

  // 启动监控
  function startMonitoring(intervalMs: number = 1000): void {
    globalMonitor.startFPSMonitoring();

    updateInterval = window.setInterval(() => {
      metrics.value = globalMonitor.getMetrics();
    }, intervalMs);

    console.log('[Performance] 性能监控已启动');
  }

  // 停止监控
  function stopMonitoring(): void {
    globalMonitor.stopFPSMonitoring();

    if (updateInterval !== null) {
      clearInterval(updateInterval);
      updateInterval = null;
    }

    console.log('[Performance] 性能监控已停止');
  }

  // 标记性能点
  function mark(name: string): void {
    globalMonitor.mark(name);
  }

  // 测量性能
  function measure(name: string, startMark: string, endMark?: string): number {
    return globalMonitor.measure(name, startMark, endMark);
  }

  // 获取性能报告
  function getReport(): string {
    return globalMonitor.generateReport();
  }

  // 打印性能报告
  function logReport(): void {
    globalMonitor.logReport();
  }

  // 清除标记和测量
  function clear(): void {
    globalMonitor.clear();
  }

  // 组件卸载时停止监控
  onUnmounted(() => {
    stopMonitoring();
  });

  return {
    metrics,
    startMonitoring,
    stopMonitoring,
    mark,
    measure,
    getReport,
    logReport,
    clear,
  };
}

/**
 * 组件渲染性能监控 Composable
 */
export function useComponentPerformance(componentName: string) {
  const monitor = usePerformanceMonitor();

  onMounted(() => {
    monitor.mark(`${componentName}-mount-start`);

    // 等待下一帧测量渲染时间
    requestAnimationFrame(() => {
      monitor.mark(`${componentName}-mount-end`);
      const duration = monitor.measure(
        `${componentName}-mount`,
        `${componentName}-mount-start`,
        `${componentName}-mount-end`,
      );

      console.log(`[Performance] ${componentName} 挂载耗时: ${duration.toFixed(2)}ms`);
    });
  });

  onUnmounted(() => {
    monitor.mark(`${componentName}-unmount`);
    console.log(`[Performance] ${componentName} 已卸载`);
  });

  return monitor;
}

/**
 * 异步操作性能监控装饰器
 */
export function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  globalMonitor.mark(startMark);

  return fn()
    .then(result => {
      globalMonitor.mark(endMark);
      const duration = globalMonitor.measure(name, startMark, endMark);
      console.log(`[Performance] ${name} 耗时: ${duration.toFixed(2)}ms`);
      return result;
    })
    .catch(error => {
      globalMonitor.mark(endMark);
      globalMonitor.measure(name, startMark, endMark);
      throw error;
    });
}

/**
 * 获取导航性能指标
 */
export function getNavigationMetrics() {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) {
    return null;
  }

  const [navigationTiming] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

  if (!navigationTiming) return null;

  return {
    // DNS 查询时间
    dns: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
    // TCP 连接时间
    tcp: navigationTiming.connectEnd - navigationTiming.connectStart,
    // 请求时间
    request: navigationTiming.responseStart - navigationTiming.requestStart,
    // 响应时间
    response: navigationTiming.responseEnd - navigationTiming.responseStart,
    // DOM 解析时间
    domParse: navigationTiming.domInteractive - navigationTiming.domLoading,
    // 资源加载时间
    resourceLoad: navigationTiming.loadEventStart - navigationTiming.domContentLoadedEventEnd,
    // 总加载时间
    total: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
  };
}

// 导出全局监控实例（供高级使用）
export { globalMonitor };
