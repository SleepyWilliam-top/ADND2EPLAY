<template>
  <div class="character-creation">
    <!-- 标题区域 -->
    <div class="creation-header">
      <h1>ADND 2E 角色创建</h1>
      <div class="step-indicator">
        <div
          v-for="(stepInfo, index) in steps"
          :key="index"
          class="step-item"
          :class="{
            active: currentStep === index + 1,
            completed: currentStep > index + 1,
          }"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-label">{{ stepInfo.label }}</div>
        </div>
      </div>
    </div>

    <!-- 步骤内容区域 -->
    <div class="creation-content">
      <Step1AbilityRoll v-if="currentStep === 1" @back-to-menu="handleBackToMenu" />
      <Step2RaceSelection v-else-if="currentStep === 2" />
      <Step3ClassSelection v-else-if="currentStep === 3" />
      <Step4CombatStats v-else-if="currentStep === 4" />
      <Step5WeaponProficiency v-else-if="currentStep === 5" />
      <Step6NonweaponProficiency v-else-if="currentStep === 6" />
      <Step7EquipmentPurchase v-else-if="currentStep === 7" />
      <Step8SpellSelection v-else-if="currentStep === 8" />
      <Step9AlignmentSelection v-else-if="currentStep === 9" />
      <Step10BasicInfo v-else-if="currentStep === 10" />
      <Step11CharacterSheet v-else-if="currentStep === 11" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Step10BasicInfo from './steps/Step10BasicInfo.vue';
import Step11CharacterSheet from './steps/Step11CharacterSheet.vue';
import Step1AbilityRoll from './steps/Step1AbilityRoll.vue';
import Step2RaceSelection from './steps/Step2RaceSelection.vue';
import Step3ClassSelection from './steps/Step3ClassSelection.vue';
import Step4CombatStats from './steps/Step4CombatStats.vue';
import Step5WeaponProficiency from './steps/Step5WeaponProficiency.vue';
import Step6NonweaponProficiency from './steps/Step6NonweaponProficiency.vue';
import Step7EquipmentPurchase from './steps/Step7EquipmentPurchase.vue';
import Step8SpellSelection from './steps/Step8SpellSelection.vue';
import Step9AlignmentSelection from './steps/Step9AlignmentSelection.vue';
import { useCharacterStore } from './stores/characterStore';

const router = useRouter();
const characterStore = useCharacterStore();

const steps = [
  { label: '投掷属性' },
  { label: '选择种族' },
  { label: '选择职业' },
  { label: '战斗数据' },
  { label: '武器熟练' },
  { label: '非武器熟练' },
  { label: '装备购买' },
  { label: '法术选择' },
  { label: '选择阵营' },
  { label: '基本信息' },
  { label: '角色卡' },
];

const currentStep = computed(() => characterStore.characterData.step);

function handleBackToMenu() {
  // 重置角色数据
  characterStore.resetCharacter();
  // 返回主菜单
  router.push('/');
}
</script>

<style lang="scss" scoped>
.character-creation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
    padding: 15px 10px;
  }

  @media (max-width: 480px) {
    padding: 10px 8px;
  }
}

.creation-header {
  max-width: 1200px;
  margin: 0 auto 40px;
  background-color: #fff;
  border: 4px solid #000;
  padding: 30px;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
    border: 1px solid #666;
    pointer-events: none;
  }

  h1 {
    font-family:
      'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', 'Source Han Sans CN', 'Noto Sans CJK SC',
      'SimSun', '宋体', 'SimHei', '黑体', sans-serif;
    font-size: 32px;
    font-weight: bold;
    letter-spacing: 3px;
    text-align: center;
    margin: 0 0 30px 0;
    text-transform: uppercase;

    @media (max-width: 768px) {
      font-size: 20px;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }
  }

  @media (max-width: 768px) {
    padding: 20px 15px;
    margin-bottom: 20px;
    border-width: 3px;
  }
}

// 步骤指示器
.step-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  position: relative;

  // 连接线
  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 50px;
    right: 50px;
    height: 2px;
    background-color: #ddd;
    z-index: 0;

    @media (max-width: 992px) {
      display: none;
    }
  }

  @media (max-width: 992px) {
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  @media (max-width: 480px) {
    gap: 6px;
  }
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  position: relative;
  z-index: 1;
  min-width: 70px;

  @media (max-width: 768px) {
    flex: 0 0 auto;
    min-width: 60px;
  }
}

.step-number {
  width: 40px;
  height: 40px;
  border: 3px solid #999;
  border-radius: 50%;
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family:
    'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', 'Source Han Sans CN', 'Noto Sans CJK SC',
    'SimSun', '宋体', 'SimHei', '黑体', sans-serif;
  font-size: 18px;
  font-weight: bold;
  color: #999;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: 35px;
    height: 35px;
    font-size: 16px;
    border-width: 2px;
  }
}

.step-label {
  font-family:
    'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', 'Source Han Sans CN', 'Noto Sans CJK SC',
    'SimSun', '宋体', 'SimHei', '黑体', sans-serif;
  font-size: 14px;
  color: #999;
  text-align: center;
  transition: all 0.3s ease;
  white-space: nowrap;
  max-width: 80px;

  @media (max-width: 768px) {
    font-size: 11px;
    white-space: normal;
    max-width: 60px;
    line-height: 1.2;
  }
}

.step-item.active {
  .step-number {
    border-color: #000;
    background-color: #000;
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transform: scale(1.1);
  }

  .step-label {
    color: #000;
    font-weight: bold;
  }
}

.step-item.completed {
  .step-number {
    border-color: #5cb85c;
    background-color: #5cb85c;
    color: #fff;

    &::after {
      content: '\f00c';
      font-family: 'Font Awesome 6 Free';
      font-weight: 900;
      font-size: 20px;
    }
  }

  .step-label {
    color: #5cb85c;
  }
}

// 内容区域
.creation-content {
  max-width: 1200px;
  margin: 0 auto;
  background-color: #fff;
  border: 3px solid #000;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  @media (max-width: 768px) {
    border-width: 2px;
  }
}

// 占位符样式
.placeholder,
.step-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  text-align: center;

  p {
    font-family:
      'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', 'Source Han Sans CN', 'Noto Sans CJK SC',
      'SimSun', '宋体', 'SimHei', '黑体', sans-serif;
    font-size: 20px;
    color: #999;
    margin-bottom: 30px;
  }
}

.placeholder-content {
  max-width: 600px;
  margin: 0 auto;

  h2 {
    font-family:
      'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', 'Source Han Sans CN', 'Noto Sans CJK SC',
      'SimSun', '宋体', 'SimHei', '黑体', sans-serif;
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 20px;
    color: #000;
  }

  .placeholder-text {
    font-size: 18px;
    color: #666;
    margin-bottom: 40px;
  }
}

.placeholder-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;

  .adnd-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    font-size: 16px;
    font-family:
      'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', 'Source Han Sans CN', 'Noto Sans CJK SC',
      'SimSun', '宋体', 'SimHei', '黑体', sans-serif;
    font-weight: bold;
    border: 3px solid #000;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: #fff;
    color: #000;

    &:hover {
      background-color: #f5f5f5;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .button-icon {
      font-size: 18px;
    }
  }
}
</style>
