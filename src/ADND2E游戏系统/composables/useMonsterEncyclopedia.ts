/**
 * 怪物图鉴 Composable
 *
 * 功能:
 * - 怪物数据管理和分类索引
 * - 自动遭遇检测（监听 AI 输出）
 * - 遭遇记录管理（IndexedDB）
 * - 笔记管理（结构化字段）
 * - 图片关联管理
 * - AI 格式转换
 * - 搜索和筛选
 */

import Dexie, { type Table } from 'dexie';
import pinyinLib from 'pinyin';
import toastr from 'toastr';
import { monsters, type Monster } from '../utils/monsterData';

// ==================== 类型导出 ====================

export type { Monster };

// ==================== 类型定义 ====================

export interface MonsterEncounterRecord {
  monsterId: string;
  encounterCount: number;
  firstEncounteredAt: string;
  lastEncounteredAt: string;
  encounterHistory: EncounterEntry[];
  notes: MonsterNotes;
  customImageId?: string; // 图库中的图片 ID
}

export interface EncounterEntry {
  timestamp: string;
  source: 'auto' | 'manual'; // 自动检测 or 手动标记
  context?: string; // AI 输出的上下文片段（自动检测时）
}

export interface MonsterNotes {
  general: string; // 通用笔记
  status?: string; // 当前状态
  appearance?: string; // 外貌
  personality?: string; // 性格
  relationship?: string; // 与角色关系
}

export interface CategoryIndex {
  id: string;
  label: string;
  count: number;
  icon?: string; // Font Awesome 图标类名
}

export type BrowseMode = 'letter' | 'series';

// ==================== IndexedDB 数据库 ====================

class MonsterEncyclopediaDatabase extends Dexie {
  encounters!: Table<MonsterEncounterRecord, string>;

  constructor() {
    super('ADND2E_MonsterEncyclopedia');

    this.version(1).stores({
      encounters: '&monsterId, encounterCount, lastEncounteredAt',
    });
  }
}

const db = new MonsterEncyclopediaDatabase();

// ==================== 工具函数 ====================

/**
 * 获取中文字符的拼音首字母
 */
function getFirstLetter(text: string): string {
  if (!text) return '#';

  const firstChar = text.charAt(0);

  // 检查是否是英文字母
  if (/[A-Za-z]/.test(firstChar)) {
    return firstChar.toUpperCase();
  }

  // 获取中文拼音首字母
  try {
    const pinyinResult = pinyinLib(firstChar, {
      style: pinyinLib.STYLE_FIRST_LETTER,
    });
    if (pinyinResult && pinyinResult[0] && pinyinResult[0][0]) {
      return pinyinResult[0][0].toUpperCase();
    }
  } catch (error) {
    console.warn('[MonsterEncyclopedia] 拼音转换失败:', error);
  }

  return '#'; // 无法识别的字符
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==================== 系列图标映射 ====================

const seriesIcons: Record<string, string> = {
  Beholder: 'fa-eye',
  Baatezu: 'fa-fire-flame-curved',
  Demon: 'fa-ghost',
  Devil: 'fa-fire',
  Dragon: 'fa-dragon',
  Undead: 'fa-skull',
  Elemental: 'fa-wind',
  Giant: 'fa-person',
  Construct: 'fa-cube',
  Fey: 'fa-sparkles',
  Plant: 'fa-leaf',
  Ooze: 'fa-droplet',
  无分类: 'fa-circle-question',
};

// ==================== 分类索引生成 ====================

/**
 * 生成首字母索引
 */
export function generateLetterIndex(): CategoryIndex[] {
  const letterMap = new Map<string, number>();

  monsters.forEach(monster => {
    const letter = getFirstLetter(monster.name);
    letterMap.set(letter, (letterMap.get(letter) || 0) + 1);
  });

  // 生成 A-Z 索引
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const index: CategoryIndex[] = letters.map(letter => ({
    id: letter,
    label: letter,
    count: letterMap.get(letter) || 0,
  }));

  // 添加 # 用于特殊字符
  if (letterMap.has('#')) {
    index.push({
      id: '#',
      label: '#',
      count: letterMap.get('#') || 0,
    });
  }

  return index.filter(item => item.count > 0);
}

/**
 * 生成系列索引
 */
export function generateSeriesIndex(): CategoryIndex[] {
  const seriesMap = new Map<string, number>();

  monsters.forEach(monster => {
    const series = monster.series || '无分类';
    seriesMap.set(series, (seriesMap.get(series) || 0) + 1);
  });

  const index: CategoryIndex[] = [];
  seriesMap.forEach((count, series) => {
    index.push({
      id: series,
      label: series,
      count,
      icon: seriesIcons[series] || 'fa-dragon',
    });
  });

  // 按数量降序排序，"无分类"放最后
  return index.sort((a, b) => {
    if (a.id === '无分类') return 1;
    if (b.id === '无分类') return -1;
    return b.count - a.count;
  });
}

/**
 * 根据分类 ID 获取怪物列表
 */
export function getMonstersByCategory(categoryId: string, browseMode: BrowseMode): Monster[] {
  if (browseMode === 'letter') {
    return monsters.filter(monster => {
      const letter = getFirstLetter(monster.name);
      return letter === categoryId;
    });
  } else {
    // 按系列
    return monsters.filter(monster => {
      const series = monster.series || '无分类';
      return series === categoryId;
    });
  }
}

// ==================== 遭遇记录管理 ====================

/**
 * 获取遭遇记录
 */
export async function getEncounterRecord(monsterId: string): Promise<MonsterEncounterRecord | null> {
  try {
    return (await db.encounters.get(monsterId)) || null;
  } catch (error) {
    console.error('[MonsterEncyclopedia] 获取遭遇记录失败:', error);
    return null;
  }
}

/**
 * 获取所有遭遇记录
 */
export async function getAllEncounterRecords(): Promise<MonsterEncounterRecord[]> {
  try {
    return await db.encounters.toArray();
  } catch (error) {
    console.error('[MonsterEncyclopedia] 获取所有遭遇记录失败:', error);
    return [];
  }
}

/**
 * 创建遭遇记录
 */
export async function createEncounterRecord(record: MonsterEncounterRecord): Promise<void> {
  try {
    await db.encounters.add(record);
  } catch (error) {
    console.error('[MonsterEncyclopedia] 创建遭遇记录失败:', error);
    throw error;
  }
}

/**
 * 更新遭遇记录
 */
export async function updateEncounterRecord(record: MonsterEncounterRecord): Promise<void> {
  try {
    await db.encounters.put(record);
  } catch (error) {
    console.error('[MonsterEncyclopedia] 更新遭遇记录失败:', error);
    throw error;
  }
}

/**
 * 手动记录遭遇
 */
export async function recordEncounterManual(monsterId: string): Promise<void> {
  const record = await getEncounterRecord(monsterId);
  const newEntry: EncounterEntry = {
    timestamp: new Date().toISOString(),
    source: 'manual',
  };

  if (record) {
    record.encounterCount++;
    record.lastEncounteredAt = newEntry.timestamp;
    record.encounterHistory.push(newEntry);
    await updateEncounterRecord(record);
  } else {
    await createEncounterRecord({
      monsterId,
      encounterCount: 1,
      firstEncounteredAt: newEntry.timestamp,
      lastEncounteredAt: newEntry.timestamp,
      encounterHistory: [newEntry],
      notes: { general: '' },
    });
  }

  const monster = monsters.find(m => m.id === monsterId);
  if (monster) {
    toastr.success(`已记录遭遇：${monster.name}`);
  }
}

/**
 * 自动记录遭遇（从 AI 输出检测）
 */
async function recordEncounterAuto(monsterId: string, context: string): Promise<void> {
  const record = await getEncounterRecord(monsterId);
  const newEntry: EncounterEntry = {
    timestamp: new Date().toISOString(),
    source: 'auto',
    context: context.substring(0, 200), // 保存前 200 字符上下文
  };

  if (record) {
    record.encounterCount++;
    record.lastEncounteredAt = newEntry.timestamp;
    record.encounterHistory.push(newEntry);
    await updateEncounterRecord(record);
  } else {
    await createEncounterRecord({
      monsterId,
      encounterCount: 1,
      firstEncounteredAt: newEntry.timestamp,
      lastEncounteredAt: newEntry.timestamp,
      encounterHistory: [newEntry],
      notes: { general: '' },
    });
  }
}

/**
 * 删除单个遭遇记录
 */
export async function deleteEncounterEntry(monsterId: string, entryIndex: number): Promise<void> {
  const record = await getEncounterRecord(monsterId);
  
  if (!record) {
    throw new Error('未找到遭遇记录');
  }

  if (entryIndex < 0 || entryIndex >= record.encounterHistory.length) {
    throw new Error('无效的遭遇记录索引');
  }

  // 删除指定的遭遇记录
  record.encounterHistory.splice(entryIndex, 1);
  
  // 更新遭遇次数
  record.encounterCount = Math.max(0, record.encounterCount - 1);
  
  // 如果还有遭遇记录，更新首次和最近遭遇时间
  if (record.encounterHistory.length > 0) {
    record.firstEncounteredAt = record.encounterHistory[0].timestamp;
    record.lastEncounteredAt = record.encounterHistory[record.encounterHistory.length - 1].timestamp;
    await updateEncounterRecord(record);
  } else {
    // 如果没有遭遇记录了，删除整个记录（如果没有笔记）
    if (!record.notes.general && !record.notes.status && !record.notes.appearance && 
        !record.notes.personality && !record.notes.relationship && !record.customImageId) {
      await db.encounters.delete(monsterId);
    } else {
      // 保留记录但清空遭遇相关数据
      record.encounterCount = 0;
      record.encounterHistory = [];
      await updateEncounterRecord(record);
    }
  }

  const monster = monsters.find(m => m.id === monsterId);
  if (monster) {
    toastr.success(`已删除遭遇记录：${monster.name}`);
  }
}

/**
 * 更新笔记
 */
export async function updateMonsterNotes(monsterId: string, notes: MonsterNotes): Promise<void> {
  const record = await getEncounterRecord(monsterId);

  if (record) {
    record.notes = notes;
    await updateEncounterRecord(record);
  } else {
    // 如果没有遭遇记录，创建一个
    await createEncounterRecord({
      monsterId,
      encounterCount: 0,
      firstEncounteredAt: new Date().toISOString(),
      lastEncounteredAt: new Date().toISOString(),
      encounterHistory: [],
      notes,
    });
  }
}

/**
 * 更新自定义图片
 */
export async function updateMonsterImage(monsterId: string, imageId: string): Promise<void> {
  const record = await getEncounterRecord(monsterId);

  if (record) {
    record.customImageId = imageId;
    await updateEncounterRecord(record);
  } else {
    await createEncounterRecord({
      monsterId,
      encounterCount: 0,
      firstEncounteredAt: new Date().toISOString(),
      lastEncounteredAt: new Date().toISOString(),
      encounterHistory: [],
      notes: { general: '' },
      customImageId: imageId,
    });
  }
}

// ==================== 自动遭遇检测 ====================

let detectionInitialized = false;
const detectedInCurrentMessage = new Set<string>(); // 防止同一消息重复检测

/**
 * 检查文本上下文是否包含遭遇相关关键词
 */
function hasValidContext(text: string, monsterName: string): boolean {
  const contextKeywords = [
    '遭遇',
    '战斗',
    '攻击',
    '出现',
    '发现',
    '看到',
    '面对',
    'encounter',
    'battle',
    'fight',
    'appear',
    'attack',
    'face',
  ];

  const monsterIndex = text.indexOf(monsterName);
  if (monsterIndex === -1) return false;

  // 提取怪物名称前后 50 个字符作为上下文
  const start = Math.max(0, monsterIndex - 50);
  const end = Math.min(text.length, monsterIndex + monsterName.length + 50);
  const context = text.substring(start, end);

  // 检查上下文中是否包含关键词
  return contextKeywords.some(keyword => context.toLowerCase().includes(keyword.toLowerCase()));
}

/**
 * 检测文本中的怪物并自动记录遭遇
 *
 * 性能优化：
 * 1. 使用异步处理，避免阻塞主线程
 * 2. 限制检测频率
 * 3. 早期退出优化
 */
async function detectMonstersInText(text: string): Promise<void> {
  if (!text || typeof text !== 'string' || text.length < 2) return;

  // 使用 setTimeout 让渡控制权，避免阻塞 UI
  await new Promise(resolve => setTimeout(resolve, 0));

  const detectedMonsters: Array<{ id: string; name: string; context: string }> = [];
  const textLower = text.toLowerCase();

  // 只检测前 1000 个字符，避免长文本导致性能问题
  const searchText = text.substring(0, 1000);
  const searchTextLower = textLower.substring(0, 1000);

  for (const monster of monsters) {
    // 避免重复检测
    if (detectedInCurrentMessage.has(monster.id)) continue;

    // 快速预检：先用 includes 判断，再用正则精确匹配
    const nameLower = monster.name.toLowerCase();
    const englishLower = monster.englishName.toLowerCase();

    if (!searchTextLower.includes(nameLower) && !searchTextLower.includes(englishLower)) {
      continue; // 早期退出，跳过不匹配的
    }

    // 精确匹配
    const nameRegex = new RegExp(`(${escapeRegex(monster.name)}|${escapeRegex(monster.englishName)})`, 'gi');

    if (nameRegex.test(searchText)) {
      // 验证上下文，避免误报
      if (hasValidContext(searchText, monster.name) || hasValidContext(searchText, monster.englishName)) {
        detectedMonsters.push({
          id: monster.id,
          name: monster.name,
          context: searchText,
        });
        detectedInCurrentMessage.add(monster.id);
      }
    }
  }

  // 批量记录遭遇（限制最多 5 个，避免刷屏）
  const limitedDetected = detectedMonsters.slice(0, 5);
  for (const detected of limitedDetected) {
    try {
      await recordEncounterAuto(detected.id, detected.context);
      toastr.info(`🐉 已自动记录遭遇：${detected.name}`);
    } catch (error) {
      console.error('[MonsterEncyclopedia] 自动记录遭遇失败:', error);
    }
  }

  if (detectedMonsters.length > 5) {
    toastr.info(`🐉 检测到更多怪物 (共 ${detectedMonsters.length} 个)`);
  }
}

/**
 * 初始化自动遭遇检测
 */
export function initializeAutoDetection(): void {
  if (detectionInitialized) {
    console.log('[MonsterEncyclopedia] 自动检测已初始化');
    return;
  }

  console.log('[MonsterEncyclopedia] 正在初始化自动遭遇检测...');

  // 监听生成结束事件
  eventOn(iframe_events.GENERATION_ENDED, (text: string) => {
    // 清空当前消息的检测记录
    detectedInCurrentMessage.clear();

    if (text && typeof text === 'string') {
      detectMonstersInText(text).catch(error => {
        console.error('[MonsterEncyclopedia] 检测怪物失败:', error);
      });
    }
  });

  detectionInitialized = true;
  console.log('[MonsterEncyclopedia] 自动遭遇检测已启动');
}

/**
 * 清理自动遭遇检测
 */
export function cleanupAutoDetection(): void {
  // 注：eventRemoveListener 会在组件卸载时自动调用
  detectionInitialized = false;
  detectedInCurrentMessage.clear();
  console.log('[MonsterEncyclopedia] 自动遭遇检测已清理');
}

// ==================== AI 格式转换 ====================

/**
 * 将 HD 转换为 HP 公式
 *
 * 规则:
 * - 默认使用 d8（如无特殊说明）
 * - HD 1+3 → hp 1d8+3
 * - HD 2+3 → hp 2d8+3
 * - HD 3-8 → hp 3d8-8d8
 * - 如果 HD 中明确指定骰子类型（d6/d10/d12），则使用对应骰子
 */
function convertHDtoHP(hitDice: string): string {
  // 检测是否已经有骰子类型
  const diceMatch = hitDice.match(/(\d+)[dD](\d+)/);
  if (diceMatch) {
    return hitDice; // 已有骰子类型，直接返回
  }

  // 格式1: "1+2" → "1d8+2"
  const singleMatch = hitDice.match(/^(\d+)\+(\d+)$/);
  if (singleMatch) {
    return `${singleMatch[1]}d8+${singleMatch[2]}`;
  }

  // 格式2: "3-8" → "3d8-8d8"
  const rangeMatch = hitDice.match(/^(\d+)[-~](\d+)$/);
  if (rangeMatch) {
    return `${rangeMatch[1]}d8-${rangeMatch[2]}d8`;
  }

  // 格式3: 纯数字 "5" → "5d8"
  const pureNumber = hitDice.match(/^(\d+)$/);
  if (pureNumber) {
    return `${pureNumber[1]}d8`;
  }

  // 无法解析，返回原始值
  return hitDice;
}

/**
 * 从怪物数据中提取特殊弱点
 */
function extractSpecialWeakness(monster: Monster): string {
  // 从 specialRules 或描述中提取
  if (monster.specialRules && monster.specialRules.length > 0) {
    const weaknessRule = monster.specialRules.find(
      rule => rule.name.includes('弱点') || rule.name.toLowerCase().includes('weakness'),
    );
    if (weaknessRule) {
      return weaknessRule.content.substring(0, 50);
    }
  }
  return '无';
}

/**
 * 从怪物数据中提取法术
 */
function extractSpells(monster: Monster): string {
  if (monster.specialRules && monster.specialRules.length > 0) {
    const spellRule = monster.specialRules.find(
      rule => rule.name.includes('法术') || rule.name.toLowerCase().includes('spell'),
    );
    if (spellRule) {
      return spellRule.content.substring(0, 50);
    }
  }
  return '无';
}

/**
 * 从怪物数据中提取魔法物品
 */
function extractMagicItems(monster: Monster): string {
  // 从 treasure 字段推测
  if (monster.treasure && monster.treasure !== '无' && monster.treasure !== 'None') {
    return monster.treasure;
  }
  return '无';
}

/**
 * 转换为 AI 可读格式
 */
export function convertToAIFormat(monster: Monster, notes?: MonsterNotes): string {
  const hpFormula = convertHDtoHP(monster.hitDice);
  const sw = extractSpecialWeakness(monster);
  const sp = extractSpells(monster);
  const magicItem = extractMagicItems(monster);

  return (
    `<${monster.name}：` +
    `AC ${monster.armorClass}；` +
    `MV ${monster.movement}；` +
    `HD ${monster.hitDice}；` +
    `hp ${hpFormula}；` +
    `THAC0 ${monster.thac0}；` +
    `#AT ${monster.numberOfAttacks}；` +
    `Dmg ${monster.damage}；` +
    `SA ${monster.specialAttacks}；` +
    `SD ${monster.specialDefenses}；` +
    `SW ${sw}；` +
    `SP ${sp}；` +
    `MR ${monster.magicResistance}；` +
    `SZ ${monster.size}；` +
    `Int ${monster.intelligence}；` +
    `AL ${monster.alignment}；` +
    `ML ${monster.morale}；` +
    `XP ${monster.xpValue}；` +
    `MagicItem ${magicItem}；` +
    `状态 ${notes?.status || '未知'}；` +
    `外貌 ${notes?.appearance || monster.description.substring(0, 50) + '...'}；` +
    `性格 ${notes?.personality || '未知'}；` +
    `与角色关系 ${notes?.relationship || '未知'}>`
  );
}

/**
 * 复制 AI 格式到剪贴板
 */
export async function copyAIFormatToClipboard(monster: Monster, notes?: MonsterNotes): Promise<void> {
  const aiFormat = convertToAIFormat(monster, notes);

  try {
    await navigator.clipboard.writeText(aiFormat);
    toastr.success(`已复制 ${monster.name} 的 AI 格式到剪贴板`);
  } catch (error) {
    console.error('[MonsterEncyclopedia] 复制失败:', error);
    toastr.error('复制失败，请手动复制');
  }
}

// ==================== 搜索功能 ====================

/**
 * 搜索怪物
 */
export function searchMonsters(keyword: string): Monster[] {
  if (!keyword || !keyword.trim()) {
    return monsters;
  }

  const lowerKeyword = keyword.toLowerCase().trim();

  return monsters.filter(monster => {
    // 搜索中文名
    if (monster.name.toLowerCase().includes(lowerKeyword)) {
      return true;
    }

    // 搜索英文名
    if (monster.englishName.toLowerCase().includes(lowerKeyword)) {
      return true;
    }

    // 搜索系列
    if (monster.series && monster.series.toLowerCase().includes(lowerKeyword)) {
      return true;
    }

    return false;
  });
}

// ==================== 快捷筛选 ====================

/**
 * 获取已遭遇的怪物列表
 */
export async function getEncounteredMonsters(): Promise<Monster[]> {
  try {
    const records = await getAllEncounterRecords();
    const encounteredIds = records.filter(r => r.encounterCount > 0).map(r => r.monsterId);

    return monsters.filter(m => encounteredIds.includes(m.id));
  } catch (error) {
    console.error('[MonsterEncyclopedia] 获取已遭遇怪物失败:', error);
    return [];
  }
}

/**
 * 获取有笔记的怪物列表
 */
export async function getMonstersWithNotes(): Promise<Monster[]> {
  try {
    const records = await getAllEncounterRecords();
    const withNotesIds = records
      .filter(
        r => r.notes.general || r.notes.status || r.notes.appearance || r.notes.personality || r.notes.relationship,
      )
      .map(r => r.monsterId);

    return monsters.filter(m => withNotesIds.includes(m.id));
  } catch (error) {
    console.error('[MonsterEncyclopedia] 获取有笔记怪物失败:', error);
    return [];
  }
}

/**
 * 获取有自定义图片的怪物列表
 */
export async function getMonstersWithCustomImage(): Promise<Monster[]> {
  try {
    const records = await getAllEncounterRecords();
    const withImageIds = records.filter(r => r.customImageId).map(r => r.monsterId);

    return monsters.filter(m => withImageIds.includes(m.id));
  } catch (error) {
    console.error('[MonsterEncyclopedia] 获取自定义图片怪物失败:', error);
    return [];
  }
}

// 导出数据库实例（供高级使用）
export { db as monsterEncyclopediaDB };
