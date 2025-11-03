/**
 * ADND2E 双事件系统
 * 
 * 学习自 lucklyjkop.html 的事件处理机制
 * 结合 DOM 自定义事件 + 酒馆助手事件系统，实现双重保障
 * 
 * 类似于我们的双重持久化机制：
 * - 酒馆变量 + IndexedDB
 * - 酒馆助手事件 + DOM 自定义事件
 */

// ==================== 事件类型定义 ====================

export interface ADND2EEventMap {
  // 游戏数据更新事件
  'adnd2e:game-data-updated': {
    source: 'command' | 'chat-edit' | 'chat-delete' | 'manual';
    timestamp: number;
    changes?: {
      hp?: boolean;
      gold?: boolean;
      xp?: boolean;
      level?: boolean;
      npcs?: boolean;
    };
  };

  // 角色数据同步事件
  'adnd2e:character-data-synced': {
    source: 'initial-load' | 'update' | 'rollback';
    timestamp: number;
  };

  // NPC 相关事件
  'adnd2e:npc-added': {
    npcId: string;
    npcName: string;
    timestamp: number;
  };

  'adnd2e:npc-updated': {
    npcId: string;
    npcName: string;
    changes: string[];
    timestamp: number;
  };

  'adnd2e:npc-removed': {
    npcId: string;
    npcName: string;
    timestamp: number;
  };

  // 状态栏更新事件
  'adnd2e:status-refresh': {
    source: 'auto' | 'manual' | 'force';
    timestamp: number;
  };

  // AI 生成相关事件
  'adnd2e:generation-started': {
    timestamp: number;
  };

  'adnd2e:generation-ended': {
    timestamp: number;
    hasCommands: boolean;
  };

  // 聊天记录管理事件
  'adnd2e:chat-message-edited': {
    messageIndex: number;
    timestamp: number;
  };

  'adnd2e:chat-message-deleted': {
    messageIndex: number;
    timestamp: number;
  };

  // 存档相关事件
  'adnd2e:save-cleared': {
    timestamp: number;
  };

  'adnd2e:save-loaded': {
    timestamp: number;
  };
}

// ==================== 事件总线类 ====================

class EventBus {
  private listeners: Map<string, Set<Function>> = new Map();
  private debugMode = true; // 开发模式下启用调试日志

  /**
   * 🔧 触发事件（双系统）
   * 同时触发 DOM 自定义事件和内部监听器
   */
  emit<K extends keyof ADND2EEventMap>(
    eventName: K,
    detail: ADND2EEventMap[K],
  ): void {
    const timestamp = Date.now();

    // 1. 触发 DOM 自定义事件（学习 lucklyjkop 的 DOM 事件机制）
    try {
      const customEvent = new CustomEvent(eventName, {
        detail: { ...detail, _timestamp: timestamp },
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(customEvent);

      if (this.debugMode) {
        console.log(`[EventBus] 🔵 DOM事件触发: ${eventName}`, detail);
      }
    } catch (error) {
      console.error(`[EventBus] DOM事件触发失败: ${eventName}`, error);
    }

    // 2. 触发酒馆助手事件（兼容旧系统）
    try {
      // 转换为下划线格式（酒馆助手事件命名风格）
      const tavernEventName = eventName.replace(/:/g, '_');
      if (typeof eventEmit === 'function') {
        eventEmit(tavernEventName, detail);

        if (this.debugMode) {
          console.log(`[EventBus] 🟢 酒馆事件触发: ${tavernEventName}`, detail);
        }
      }
    } catch (error) {
      console.error(`[EventBus] 酒馆事件触发失败: ${eventName}`, error);
    }

    // 3. 触发内部监听器
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(detail);
        } catch (error) {
          console.error(`[EventBus] 内部监听器执行失败: ${eventName}`, error);
        }
      });

      if (this.debugMode) {
        console.log(`[EventBus] 🟡 内部监听器触发: ${eventName} (${listeners.size} 个监听器)`);
      }
    }
  }

  /**
   * 🔧 监听事件（双系统）
   * 同时监听 DOM 自定义事件和内部事件
   */
  on<K extends keyof ADND2EEventMap>(
    eventName: K,
    callback: (detail: ADND2EEventMap[K]) => void,
  ): () => void {
    // 1. 注册 DOM 事件监听器
    const domListener = (e: Event) => {
      const customEvent = e as CustomEvent<ADND2EEventMap[K]>;
      callback(customEvent.detail);
    };
    window.addEventListener(eventName, domListener);

    // 2. 注册酒馆助手事件监听器（如果可用）
    let tavernListenerId: number | null = null;
    try {
      const tavernEventName = eventName.replace(/:/g, '_');
      if (typeof eventOn === 'function') {
        tavernListenerId = eventOn(tavernEventName, callback);
      }
    } catch (error) {
      console.warn(`[EventBus] 酒馆事件监听注册失败: ${eventName}`, error);
    }

    // 3. 注册内部监听器
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);

    if (this.debugMode) {
      console.log(`[EventBus] 📝 已注册监听器: ${eventName} (DOM + 酒馆 + 内部)`);
    }

    // 返回清理函数
    return () => {
      window.removeEventListener(eventName, domListener);
      if (tavernListenerId !== null && typeof eventOff === 'function') {
        try {
          eventOff(tavernListenerId);
        } catch (error) {
          console.warn(`[EventBus] 酒馆事件监听清理失败: ${eventName}`, error);
        }
      }
      this.listeners.get(eventName)?.delete(callback);

      if (this.debugMode) {
        console.log(`[EventBus] 🗑️ 已清理监听器: ${eventName}`);
      }
    };
  }

  /**
   * 仅监听一次
   */
  once<K extends keyof ADND2EEventMap>(
    eventName: K,
    callback: (detail: ADND2EEventMap[K]) => void,
  ): () => void {
    const cleanup = this.on(eventName, detail => {
      callback(detail);
      cleanup();
    });
    return cleanup;
  }

  /**
   * 移除所有监听器
   */
  off(eventName?: keyof ADND2EEventMap): void {
    if (eventName) {
      this.listeners.delete(eventName);
      if (this.debugMode) {
        console.log(`[EventBus] 🗑️ 已清理所有监听器: ${eventName}`);
      }
    } else {
      this.listeners.clear();
      if (this.debugMode) {
        console.log(`[EventBus] 🗑️ 已清理所有事件监听器`);
      }
    }
  }

  /**
   * 获取事件的监听器数量
   */
  getListenerCount(eventName: keyof ADND2EEventMap): number {
    return this.listeners.get(eventName)?.size || 0;
  }

  /**
   * 启用/禁用调试模式
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`[EventBus] 调试模式: ${enabled ? '已启用' : '已禁用'}`);
  }

  /**
   * 获取所有已注册的事件名称
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.listeners.keys());
  }
}

// ==================== 导出单例 ====================

export const eventBus = new EventBus();

// 开发模式下暴露到 window（方便调试）
if (typeof window !== 'undefined') {
  (window as any).__ADND2E_EventBus__ = eventBus;
  console.log('[EventBus] 🎯 双事件系统已初始化 (DOM + 酒馆助手)');
  console.log('[EventBus] 💡 调试命令: window.__ADND2E_EventBus__');
}

// ==================== 便捷函数 ====================

/**
 * 触发游戏数据更新事件
 */
export function emitGameDataUpdated(
  source: 'command' | 'chat-edit' | 'chat-delete' | 'manual' = 'command',
  changes?: ADND2EEventMap['adnd2e:game-data-updated']['changes'],
): void {
  eventBus.emit('adnd2e:game-data-updated', {
    source,
    timestamp: Date.now(),
    changes,
  });
}

/**
 * 触发角色数据同步事件
 */
export function emitCharacterDataSynced(
  source: 'initial-load' | 'update' | 'rollback' = 'update',
): void {
  eventBus.emit('adnd2e:character-data-synced', {
    source,
    timestamp: Date.now(),
  });
}

/**
 * 触发 NPC 添加事件
 */
export function emitNpcAdded(npcId: string, npcName: string): void {
  eventBus.emit('adnd2e:npc-added', {
    npcId,
    npcName,
    timestamp: Date.now(),
  });
}

/**
 * 触发 NPC 更新事件
 */
export function emitNpcUpdated(npcId: string, npcName: string, changes: string[]): void {
  eventBus.emit('adnd2e:npc-updated', {
    npcId,
    npcName,
    changes,
    timestamp: Date.now(),
  });
}

/**
 * 触发 NPC 移除事件
 */
export function emitNpcRemoved(npcId: string, npcName: string): void {
  eventBus.emit('adnd2e:npc-removed', {
    npcId,
    npcName,
    timestamp: Date.now(),
  });
}

/**
 * 触发状态栏刷新事件
 */
export function emitStatusRefresh(source: 'auto' | 'manual' | 'force' = 'auto'): void {
  eventBus.emit('adnd2e:status-refresh', {
    source,
    timestamp: Date.now(),
  });
}

/**
 * 触发 AI 生成结束事件
 */
export function emitGenerationEnded(hasCommands: boolean = false): void {
  eventBus.emit('adnd2e:generation-ended', {
    timestamp: Date.now(),
    hasCommands,
  });
}

/**
 * 触发聊天消息编辑事件
 */
export function emitChatMessageEdited(messageIndex: number): void {
  eventBus.emit('adnd2e:chat-message-edited', {
    messageIndex,
    timestamp: Date.now(),
  });
}

/**
 * 触发聊天消息删除事件
 */
export function emitChatMessageDeleted(messageIndex: number): void {
  eventBus.emit('adnd2e:chat-message-deleted', {
    messageIndex,
    timestamp: Date.now(),
  });
}

