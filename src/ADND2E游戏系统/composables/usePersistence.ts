/**
 * ADND 2E 游戏系统持久化机制
 *
 * 实现双重持久化：
 * 1. IndexedDB (本地浏览器存储) - 用于快速读写和自动保存
 * 2. 酒馆消息楼层 (第0层 data 字段) - 用于导出和分
 *
 * 核心概念：
 * - "同层游玩"：所有游戏交互都在前端界面中进行，不创建新的消息楼层
 * - 游戏状态保存在第0层消息的 data 字段中
 * - 使用 IndexedDB 作为缓存层，提升读写性能
 * - 定期将 IndexedDB 数据同步到酒馆消息楼层
 */

import Dexie, { type Table } from 'dexie';
import { klona } from 'klona';

// ==================== 类型定义 ====================

export interface GameArchive {
  name: string; // 存档名称（使用角色卡名称 + 聊天ID）
  characterId: string; // 角色卡ID
  chatId: string; // 聊天ID
  data: {
    messages: any[]; // 游戏消息历史
    gameState: any; // 游戏状态（HP、位置、NPC等）
    character: any; // 角色数据
    lastSaved: string; // 最后保存时间
    version: string; // 存档版本
  };
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

export interface PersistenceSettings {
  key: string;
  value: any;
}

// ==================== IndexedDB 数据库 ====================

class ADND2EDatabase extends Dexie {
  archives!: Table<GameArchive, string>;
  settings!: Table<PersistenceSettings, string>;

  constructor() {
    super('ADND2E_GameDB');

    // 版本 1: 初始架构
    this.version(1).stores({
      archives: '&name, characterId, chatId, updatedAt',
      settings: '&key',
    });
  }
}

// 创建数据库实例
const db = new ADND2EDatabase();

// ==================== 持久化 API ====================

/**
 * 请求持久化存储权限（学习自 lucklyjkop）
 * 防止浏览器在存储压力下清除 IndexedDB 数据
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) {
    console.warn('[Persistence] 浏览器不支持持久化存储 API');
    return false;
  }

  if (!window.isSecureContext) {
    console.warn('[Persistence] 非安全上下文（HTTPS），无法请求持久化存储');
    return false;
  }

  try {
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) {
      console.log('[Persistence] 存储已经是持久化的');
      return true;
    }

    const result = await navigator.storage.persist();
    console.log(`[Persistence] 持久化存储请求结果: ${result ? '成功' : '失败'}`);
    return result;
  } catch (error) {
    console.error('[Persistence] 请求持久化存储失败:', error);
    return false;
  }
}

/**
 * 获取当前存档名称
 * 格式: characterName_timestamp (基于角色名称和当前会话)
 */
export function getCurrentArchiveName(): string {
  try {
    // 从角色卡变量获取角色名称
    const charVars = getVariables({ type: 'character' });
    const characterName =
      charVars?.adnd2e?.character?.characterName ||
      (typeof SillyTavern !== 'undefined' && SillyTavern.name2) ||
      'Unknown';

    // 使用角色卡ID作为标识（更稳定）
    const characterId = typeof SillyTavern !== 'undefined' && SillyTavern.characterId;

    return `ADND2E_${characterName}_${characterId}`;
  } catch (error) {
    console.error('[Persistence] 获取存档名称失败:', error);
    return 'ADND2E_default_archive';
  }
}

/**
 * 保存游戏数据到 IndexedDB
 */
export async function saveToIndexedDB(data: Partial<GameArchive['data']>): Promise<void> {
  try {
    const archiveName = getCurrentArchiveName();
    const characterId = (typeof SillyTavern !== 'undefined' && SillyTavern.characterId) || 'default';
    // 简化chatId，使用时间戳或固定值
    const chatId = 'current';

    // 获取现有存档或创建新存档
    let archive = await db.archives.get(archiveName);

    if (archive) {
      // 更新现有存档
      archive.data = {
        ...archive.data,
        ...data,
        lastSaved: new Date().toISOString(),
      };
      archive.updatedAt = new Date().toISOString();
    } else {
      // 创建新存档
      archive = {
        name: archiveName,
        characterId,
        chatId,
        data: {
          messages: [],
          gameState: {},
          character: null,
          ...data,
          lastSaved: new Date().toISOString(),
          version: '1.0.0',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    await db.archives.put(archive);
    console.log('[Persistence] 已保存到 IndexedDB:', archiveName);
  } catch (error) {
    console.error('[Persistence] 保存到 IndexedDB 失败:', error);
    throw error;
  }
}

/**
 * 从 IndexedDB 加载游戏数据
 */
export async function loadFromIndexedDB(): Promise<GameArchive['data'] | null> {
  try {
    const archiveName = getCurrentArchiveName();
    const archive = await db.archives.get(archiveName);

    if (!archive) {
      console.log('[Persistence] IndexedDB 中未找到存档:', archiveName);
      return null;
    }

    console.log('[Persistence] 已从 IndexedDB 加载:', archiveName);
    return klona(archive.data);
  } catch (error) {
    console.error('[Persistence] 从 IndexedDB 加载失败:', error);
    return null;
  }
}

/**
 * 保存游戏数据到角色卡变量（替代酒馆消息楼层，实现同层游玩）
 */
export async function saveToCharacterVariables(data: Partial<GameArchive['data']>): Promise<void> {
  try {
    const charVars = getVariables({ type: 'character' }) || {};

    charVars.adnd2e = charVars.adnd2e || {};
    charVars.adnd2e.gameData = {
      ...(charVars.adnd2e.gameData || {}),
      ...data,
      lastSaved: new Date().toISOString(),
      version: '1.0.0',
    };

    replaceVariables(charVars, { type: 'character' });
    console.log('[Persistence] 已保存到角色卡变量（同层游玩模式）');
  } catch (error) {
    console.error('[Persistence] 保存到角色卡变量失败:', error);
    throw error;
  }
}

/**
 * 从角色卡变量加载游戏数据（替代酒馆消息楼层）
 */
export async function loadFromCharacterVariables(): Promise<GameArchive['data'] | null> {
  try {
    const charVars = getVariables({ type: 'character' });

    if (!charVars?.adnd2e?.gameData) {
      console.log('[Persistence] 角色卡变量中没有游戏数据');
      return null;
    }

    console.log('[Persistence] 已从角色卡变量加载');
    return klona(charVars.adnd2e.gameData);
  } catch (error) {
    console.error('[Persistence] 从角色卡变量加载失败:', error);
    return null;
  }
}

/**
 * 同步 IndexedDB 到角色卡变量（替代酒馆消息楼层）
 * 定期调用此函数以保持两者同步
 */
export async function syncIndexedDBToCharacterVariables(): Promise<void> {
  try {
    const archiveName = getCurrentArchiveName();
    const archive = await db.archives.get(archiveName);

    if (!archive) {
      console.warn('[Persistence] IndexedDB 中没有数据可同步');
      return;
    }

    await saveToCharacterVariables(archive.data);
    console.log('[Persistence] 已同步 IndexedDB 到角色卡变量');
  } catch (error) {
    console.error('[Persistence] 同步失败:', error);
  }
}

/**
 * 完整保存：同时保存到 IndexedDB 和角色卡变量（同层游玩模式）
 */
export async function saveGameData(data: Partial<GameArchive['data']>): Promise<void> {
  try {
    // 🔧 修复：从角色卡变量中读取最新的 character 数据，确保 IndexedDB 也保存了完整的 character
    const charVars = getVariables({ type: 'character' });
    const latestCharacter = charVars?.adnd2e?.character;
    
    // 合并 character 数据（优先使用传入的，如果没有则从角色卡变量读取）
    const completeData = {
      ...data,
      character: data.character || latestCharacter,
    };

    // 1. 快速保存到 IndexedDB（主要存储）- 包含完整的 character 数据
    await saveToIndexedDB(completeData);
    console.log('[Persistence] 已保存到 IndexedDB，包含 character:', !!completeData.character);

    // 2. 同层游玩：不保存到酒馆消息楼层，改为保存到角色卡变量
    // 角色卡变量作为备份，在浏览器数据丢失时可以恢复

    // 3. 保存关键数据到角色卡变量（确保重进时能找到角色数据和最新角色卡）
    // 注意：gameStateStore.syncToCharacterVariables() 已经同步了 character 和 gameState 数据
    // 这里只需要保存 messages（消息历史）到角色卡变量
    if (data.messages) {
      try {
        const charVars = getVariables({ type: 'character' }) || {};
        charVars.adnd2e = charVars.adnd2e || {};

        // 保存第一条消息（角色卡）到角色卡变量，确保始终是最新版本
        if (data.messages.length > 0) {
          // 只保存第一条消息（角色卡），不保存全部历史对话
          charVars.adnd2e.messages = [data.messages[0]];
          console.log('[Persistence] 最新角色卡已同步到角色卡变量');
        }

        charVars.adnd2e.lastSaved = new Date().toISOString();
        replaceVariables(charVars, { type: 'character' });
        console.log('[Persistence] 消息数据已同步到角色卡变量');
      } catch (error) {
        console.error('[Persistence] 保存到角色卡变量失败:', error);
        // 不抛出错误，因为 IndexedDB 保存已成功
      }
    }

    console.log('[Persistence] 游戏数据已完整保存（同层游玩模式：IndexedDB + 角色卡变量）');
    console.log('[Persistence] 注意：character 和 gameState 数据已由 gameStateStore.syncToCharacterVariables() 同步');
  } catch (error) {
    console.error('[Persistence] 完整保存失败:', error);
    throw error;
  }
}

/**
 * 智能加载：优先从 IndexedDB 加载，回退到角色卡变量（同层游玩模式）
 * 加载后自动用角色卡变量中的最新角色卡更新 IndexedDB
 */
export async function loadGameData(): Promise<GameArchive['data'] | null> {
  try {
    // 1. 优先从 IndexedDB 加载（更快，主要存储）
    let data = await loadFromIndexedDB();

    if (data) {
      console.log('[Persistence] 使用 IndexedDB 数据（同层游玩模式）');

      // 1.1 从角色卡变量中获取最新的角色卡，更新 IndexedDB 中的第一条消息
      try {
        const charVars = getVariables({ type: 'character' });
        if (charVars?.adnd2e?.messages && charVars.adnd2e.messages.length > 0) {
          const latestCharacterCard = charVars.adnd2e.messages[0];

          // 如果 IndexedDB 中有消息，更新第一条为最新角色卡
          if (data.messages && data.messages.length > 0) {
            const oldCard = data.messages[0];
            // 只有当角色卡内容不同时才更新
            if (oldCard.content !== latestCharacterCard.content) {
              console.log('[Persistence] 检测到角色卡变量中有更新，同步到 IndexedDB');
              data.messages[0] = {
                ...latestCharacterCard,
                timestamp: oldCard.timestamp, // 保留原有时间戳
              };
              // 立即保存更新后的数据回 IndexedDB
              await saveToIndexedDB(data);
              console.log('[Persistence] IndexedDB 中的角色卡已更新为最新版本');
            }
          }
        }
      } catch (error) {
        console.error('[Persistence] 更新 IndexedDB 中的角色卡失败:', error);
        // 不影响主流程，继续返回数据
      }

      return data;
    }

    // 2. 回退到角色卡变量（备份存储）
    data = await loadFromCharacterVariables();

    if (data) {
      console.log('[Persistence] 使用角色卡变量数据，同步到 IndexedDB');
      // 将角色卡变量数据恢复到 IndexedDB
      await saveToIndexedDB(data);
      return data;
    }

    console.log('[Persistence] 未找到任何保存的数据（同层游玩模式）');
    return null;
  } catch (error) {
    console.error('[Persistence] 加载游戏数据失败:', error);
    return null;
  }
}

/**
 * 设置项管理
 */
export async function getSetting<T = any>(key: string): Promise<T | null> {
  try {
    const setting = await db.settings.get(key);
    return setting ? setting.value : null;
  } catch (error) {
    console.error('[Persistence] 获取设置失败:', error);
    return null;
  }
}

export async function setSetting(key: string, value: any): Promise<void> {
  try {
    await db.settings.put({ key, value });
  } catch (error) {
    console.error('[Persistence] 保存设置失败:', error);
  }
}

export async function removeSetting(key: string): Promise<void> {
  try {
    await db.settings.delete(key);
  } catch (error) {
    console.error('[Persistence] 删除设置失败:', error);
  }
}

/**
 * 获取所有存档列表
 */
export async function getAllArchives(): Promise<GameArchive[]> {
  try {
    return await db.archives.toArray();
  } catch (error) {
    console.error('[Persistence] 获取存档列表失败:', error);
    return [];
  }
}

/**
 * 删除指定存档
 */
export async function deleteArchive(archiveName: string): Promise<void> {
  try {
    await db.archives.delete(archiveName);
    console.log('[Persistence] 已删除存档:', archiveName);
  } catch (error) {
    console.error('[Persistence] 删除存档失败:', error);
  }
}

/**
 * 导出存档为 JSON
 */
export async function exportArchive(archiveName: string): Promise<string | null> {
  try {
    const archive = await db.archives.get(archiveName);
    if (!archive) {
      console.warn('[Persistence] 存档不存在:', archiveName);
      return null;
    }

    return JSON.stringify(archive, null, 2);
  } catch (error) {
    console.error('[Persistence] 导出存档失败:', error);
    return null;
  }
}

/**
 * 从 JSON 导入存档
 */
export async function importArchive(jsonString: string): Promise<boolean> {
  try {
    const archive: GameArchive = JSON.parse(jsonString);

    // 验证数据结构
    if (!archive.name || !archive.data) {
      throw new Error('无效的存档格式');
    }

    await db.archives.put(archive);
    console.log('[Persistence] 已导入存档:', archive.name);
    return true;
  } catch (error) {
    console.error('[Persistence] 导入存档失败:', error);
    return false;
  }
}

/**
 * 清除所有存档（慎用！）
 */
export async function clearAllArchives(): Promise<void> {
  try {
    await db.archives.clear();
    console.log('[Persistence] 已清除所有存档');
  } catch (error) {
    console.error('[Persistence] 清除存档失败:', error);
  }
}

/**
 * 清除所有设置缓存（学习 lucklyjkop 的 npcAvatars 清除机制）
 */
export async function clearAllSettings(): Promise<void> {
  try {
    await db.settings.clear();
    console.log('[Persistence] 已清除所有设置缓存');
  } catch (error) {
    console.error('[Persistence] 清除设置缓存失败:', error);
  }
}

/**
 * 完全清除所有数据（存档 + 设置）
 * 学习 lucklyjkop.html 的完整清除机制
 */
export async function clearAllData(): Promise<void> {
  try {
    await db.archives.clear();
    await db.settings.clear();
    console.log('[Persistence] 已清除所有数据（存档 + 设置）');
  } catch (error) {
    console.error('[Persistence] 清除所有数据失败:', error);
    throw error;
  }
}

// ==================== 自动保存机制 ====================

let autoSaveTimer: number | null = null;
let saveDebounceTimer: number | null = null;
let pendingSaveData: Partial<GameArchive['data']> | null = null;

/**
 * 防抖保存到 IndexedDB（性能优化：避免频繁写入）
 */
export function debouncedSaveToIndexedDB(data: Partial<GameArchive['data']>, debounceMs: number = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    // 合并待保存的数据
    pendingSaveData = pendingSaveData ? { ...pendingSaveData, ...data } : data;

    // 清除之前的定时器
    if (saveDebounceTimer !== null) {
      clearTimeout(saveDebounceTimer);
    }

    // 设置新的防抖定时器
    saveDebounceTimer = window.setTimeout(async () => {
      try {
        if (pendingSaveData) {
          await saveToIndexedDB(pendingSaveData);
          pendingSaveData = null;
          resolve();
        }
      } catch (error) {
        reject(error);
      } finally {
        saveDebounceTimer = null;
      }
    }, debounceMs);
  });
}

/**
 * 立即保存（跳过防抖）
 */
export async function flushPendingSave(): Promise<void> {
  if (saveDebounceTimer !== null) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }

  if (pendingSaveData) {
    await saveToIndexedDB(pendingSaveData);
    pendingSaveData = null;
  }
}

/**
 * 启动自动保存（每隔指定秒数同步 IndexedDB 到角色卡变量）
 */
export function startAutoSync(intervalSeconds: number = 30): void {
  if (autoSaveTimer !== null) {
    stopAutoSync();
  }

  console.log(`[Persistence] 启动自动同步（同层游玩模式），间隔 ${intervalSeconds} 秒`);

  autoSaveTimer = window.setInterval(async () => {
    try {
      // 先刷新待保存的数据
      await flushPendingSave();
      // 再同步到角色卡变量
      await syncIndexedDBToCharacterVariables();
    } catch (error) {
      console.error('[Persistence] 自动同步失败:', error);
    }
  }, intervalSeconds * 1000);
}

/**
 * 停止自动保存
 */
export async function stopAutoSync(): Promise<void> {
  if (autoSaveTimer !== null) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
    console.log('[Persistence] 已停止自动同步');
  }

  // 在停止时刷新所有待保存的数据
  await flushPendingSave();
}

// ==================== 导出游戏记录 ====================

/**
 * 导出游戏记录为 JSON 文件
 */
export async function exportMessagesToFile(): Promise<void> {
  try {
    const archiveName = getCurrentArchiveName();
    const archive = await db.archives.get(archiveName);

    if (!archive) {
      toastr.error('没有可导出的游戏记录');
      return;
    }

    const jsonString = JSON.stringify(archive, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${archiveName}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
    toastr.success('游戏记录已导出为文件');
  } catch (error) {
    console.error('[Persistence] 导出文件失败:', error);
    toastr.error('导出失败: ' + (error as Error).message);
  }
}

// ==================== 导出数据库实例（供高级使用） ====================

export { db };
