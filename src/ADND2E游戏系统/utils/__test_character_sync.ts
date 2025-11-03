/**
 * 测试：验证 character 和 npcs 数据在聊天记录编辑/删除时的实时同步
 * 
 * 测试场景：
 * 1. 初始状态：创建角色，添加NPC
 * 2. 编辑AI消息：修改NPC数据
 * 3. 验证：角色卡变量中的NPC数据是否同步更新
 * 4. 删除消息：回溯游戏状态
 * 5. 验证：角色卡变量中的NPC数据是否回溯
 */

import { useGameStateStore } from '../stores/gameStateStore';
import { useGameStore } from '../stores/gameStore';

export async function testCharacterSync() {
  console.log('=== 开始测试 character 和 npcs 实时同步 ===\n');

  try {
    const gameStateStore = useGameStateStore();
    const gameStore = useGameStore();

    // 1. 初始状态
    console.log('步骤 1: 初始化游戏状态');
    gameStateStore.resetGameState();
    
    const charVars = getVariables({ type: 'character' });
    if (!charVars?.adnd2e?.character) {
      console.error('❌ 测试失败：未找到角色数据');
      return;
    }

    gameStateStore.initializeGameState(charVars.adnd2e.character);
    console.log('✅ 游戏状态已初始化\n');

    // 2. 添加 NPC
    console.log('步骤 2: 添加测试 NPC');
    const addNpcCommand = {
      type: 'add_npc' as const,
      data: {
        name: '测试地精',
        ac: 6,
        mv: 6,
        hd: '1-1',
        hp: 4,
        thac0: 20,
        at: '1',
        dmg: '1d6',
        sz: 'S',
        int: '低（5-7）',
        al: 'LE',
        ml: 8,
        xp: 15,
      },
    };

    const success = gameStateStore.applyCommand(addNpcCommand);
    if (!success) {
      console.error('❌ 添加 NPC 失败');
      return;
    }
    console.log('✅ NPC 已添加到游戏状态');

    // 3. 验证游戏状态中的 NPC
    const npcInGameState = gameStateStore.gameState.npcs.find(n => n.name === '测试地精');
    if (!npcInGameState) {
      console.error('❌ 测试失败：游戏状态中未找到 NPC');
      return;
    }
    console.log('✅ 游戏状态中找到 NPC:', npcInGameState.name);

    // 4. 同步到角色卡变量
    console.log('\n步骤 3: 同步到角色卡变量');
    gameStateStore.syncToCharacterVariables();

    // 5. 验证角色卡变量中的 NPC
    const updatedCharVars = getVariables({ type: 'character' });
    const npcsInCharVar = updatedCharVars?.adnd2e?.gameState?.npcs || [];
    const npcInCharVar = npcsInCharVar.find((n: any) => n.name === '测试地精');

    if (!npcInCharVar) {
      console.error('❌ 测试失败：角色卡变量中未找到 NPC');
      console.error('角色卡变量中的 NPCs:', npcsInCharVar);
      return;
    }
    console.log('✅ 角色卡变量中找到 NPC:', npcInCharVar.name);

    // 6. 修改 NPC 数据
    console.log('\n步骤 4: 更新 NPC 数据');
    const updateNpcCommand = {
      type: 'update_npc' as const,
      data: {
        name: '测试地精',
        hp: 2,
        status: '受伤',
      },
    };

    gameStateStore.applyCommand(updateNpcCommand);
    console.log('✅ NPC 数据已更新（HP: 2, 状态: 受伤）');

    // 7. 再次同步
    console.log('\n步骤 5: 再次同步到角色卡变量');
    gameStateStore.syncToCharacterVariables();

    // 8. 验证更新后的数据
    const updatedCharVars2 = getVariables({ type: 'character' });
    const npcsInCharVar2 = updatedCharVars2?.adnd2e?.gameState?.npcs || [];
    const updatedNpcInCharVar = npcsInCharVar2.find((n: any) => n.name === '测试地精');

    if (!updatedNpcInCharVar) {
      console.error('❌ 测试失败：同步后角色卡变量中未找到 NPC');
      return;
    }

    if (updatedNpcInCharVar.hp !== 2 || updatedNpcInCharVar.status !== '受伤') {
      console.error('❌ 测试失败：NPC 数据未正确同步');
      console.error('期望 HP: 2, 实际 HP:', updatedNpcInCharVar.hp);
      console.error('期望状态: 受伤, 实际状态:', updatedNpcInCharVar.status);
      return;
    }
    console.log('✅ NPC 数据已正确同步到角色卡变量');
    console.log('   HP:', updatedNpcInCharVar.hp);
    console.log('   状态:', updatedNpcInCharVar.status);

    // 9. 删除 NPC
    console.log('\n步骤 6: 删除 NPC');
    const removeNpcCommand = {
      type: 'remove_npc' as const,
      data: {
        name: '测试地精',
      },
    };

    gameStateStore.applyCommand(removeNpcCommand);
    console.log('✅ NPC 已从游戏状态中删除');

    // 10. 同步删除
    console.log('\n步骤 7: 同步删除到角色卡变量');
    gameStateStore.syncToCharacterVariables();

    // 11. 验证删除
    const updatedCharVars3 = getVariables({ type: 'character' });
    const npcsInCharVar3 = updatedCharVars3?.adnd2e?.gameState?.npcs || [];
    const deletedNpcInCharVar = npcsInCharVar3.find((n: any) => n.name === '测试地精');

    if (deletedNpcInCharVar) {
      console.error('❌ 测试失败：NPC 删除未同步到角色卡变量');
      return;
    }
    console.log('✅ NPC 删除已正确同步到角色卡变量');

    console.log('\n=== 测试完成：所有测试通过 ✅ ===');
    toastr.success('Character 和 NPCs 实时同步测试通过！');
  } catch (error) {
    console.error('❌ 测试失败，错误:', error);
    toastr.error('测试失败: ' + (error as Error).message);
  }
}

// 在控制台中运行测试
(window as any).testCharacterSync = testCharacterSync;
console.log('测试函数已加载，在控制台运行: testCharacterSync()');

