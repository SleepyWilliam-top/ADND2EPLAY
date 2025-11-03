<template>
  <div class="equipment-purchase">
    <!-- 掷骰对话框 -->
    <div v-if="showDiceDialog" class="dice-dialog-overlay" @click="showDiceDialog = false">
      <div class="dice-dialog" @click.stop>
        <div class="dice-dialog-header">
          <h2 class="dice-dialog-title"><i class="fa-solid fa-dice-d20"></i> 掷起始资金骰</h2>
        </div>
        <div class="dice-dialog-body">
          <p class="dice-instruction">
            根据你的职业 <strong>{{ getClassName() }}</strong
            >，你需要掷 <strong>{{ diceFormula }}</strong> 来决定起始资金。
          </p>
          <div class="dice-result-area">
            <div v-if="!diceRolled" class="roll-prompt">
              <p>点击下方按钮掷骰</p>
            </div>
            <div v-else class="roll-result">
              <div class="roll-details">
                <span class="roll-label">掷骰结果：</span>
                <span class="roll-values">{{ diceRollDetails.join(' + ') }}</span>
                <span class="roll-total">= {{ diceRollSum }}</span>
              </div>
              <div class="money-result">
                <span class="money-label">起始资金：</span>
                <span class="money-value">{{ finalMoney }} GP</span>
              </div>
            </div>
          </div>
        </div>
        <div class="dice-dialog-footer">
          <button v-if="!diceRolled" class="dice-roll-button" @click="rollDice">掷骰</button>
          <template v-else>
            <button class="dice-reroll-button" @click="rollDice">重新掷骰</button>
            <button class="dice-confirm-button" @click="confirmMoney">确认</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 顶部信息栏 -->
    <div class="money-info">
      <div class="info-card">
        <div class="info-label">起始资金</div>
        <div class="info-value">{{ characterStore.characterData.startingMoney }} GP</div>
      </div>
      <div class="info-card">
        <div class="info-label">已花费</div>
        <div class="info-value spent">{{ characterStore.getTotalSpent() }} GP</div>
      </div>
      <div class="info-card">
        <div class="info-label">剩余金币</div>
        <div class="info-value remaining">{{ characterStore.characterData.currentMoney }} GP</div>
      </div>
      <div class="info-card">
        <div class="info-label">总负重</div>
        <div class="info-value">{{ characterStore.getTotalWeight().toFixed(1) }} 磅</div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧：分类标签页 -->
      <div class="categories-panel">
        <h3 class="panel-title">装备分类</h3>
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          :class="{ active: selectedCategory === category.id }"
          @click="selectedCategory = category.id"
        >
          <span class="category-name">{{ category.name }}</span>
          <span class="category-count">({{ getEquipmentByCategory(category.id).length }})</span>
        </div>
      </div>

      <!-- 中间：装备列表 -->
      <div class="equipment-list-panel">
        <div class="panel-header">
          <h3 class="panel-title">{{ getCurrentCategoryName() }}</h3>
          <div class="search-box">
            <input v-model="searchQuery" type="text" placeholder="搜索装备..." class="search-input" />
          </div>
        </div>

        <div class="equipment-table-container">
          <table class="equipment-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>价格</th>
                <th>重量</th>
                <th class="quantity-col">数量</th>
                <th class="action-col">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="equipment in paginatedEquipment" :key="equipment.id" class="equipment-row">
                <td class="name-col">
                  <div class="equipment-name-wrapper">
                    <span class="equipment-name">{{ equipment.name }}</span>
                    <span v-if="equipment.nameEn" class="name-en">{{ equipment.nameEn }}</span>
                    <span v-if="equipment.description" class="equipment-desc">{{ equipment.description }}</span>
                  </div>
                </td>
                <td class="price-col">{{ formatPrice(equipment.price) }}</td>
                <td class="weight-col">{{ formatWeight(equipment.weight) }}</td>
                <td class="quantity-col">
                  <input
                    v-model.number="quantities[equipment.id]"
                    type="number"
                    min="1"
                    max="999"
                    class="quantity-input"
                    @keypress="onlyNumber"
                  />
                </td>
                <td class="action-col">
                  <button
                    class="add-button"
                    :disabled="!canAddEquipment(equipment.id)"
                    @click="handleAddEquipment(equipment.id)"
                  >
                    添加
                  </button>
                </td>
              </tr>
              <tr v-if="filteredEquipment.length === 0">
                <td colspan="5" class="no-data">未找到符合条件的装备</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <button class="page-button" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
          <button class="page-button" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
        </div>
      </div>

      <!-- 右侧：购物车 -->
      <div class="cart-panel">
        <h3 class="panel-title">购物车</h3>

        <div v-if="characterStore.characterData.purchasedEquipment.length === 0" class="empty-cart">
          <div class="empty-icon">🛒</div>
          <div class="empty-text">购物车为空</div>
        </div>

        <div v-else class="cart-items">
          <div v-for="item in characterStore.characterData.purchasedEquipment" :key="item.id" class="cart-item">
            <div class="cart-item-header">
              <span class="cart-item-name">{{ item.name }}</span>
              <button class="remove-button" title="移除" @click="handleRemoveEquipment(item.id)">×</button>
            </div>
            <div class="cart-item-details">
              <div class="cart-item-row">
                <span>单价：{{ formatPrice(item.unitPrice) }}</span>
                <span>重量：{{ formatWeight(item.weight) }}</span>
              </div>
              <div class="cart-item-row">
                <div class="cart-quantity-control">
                  <button class="quantity-btn" @click="handleUpdateQuantity(item.id, item.quantity - 1)">-</button>
                  <input
                    :value="item.quantity"
                    type="number"
                    min="0"
                    class="cart-quantity-input"
                    @input="handleQuantityInput(item.id, $event)"
                    @keypress="onlyNumber"
                  />
                  <button
                    class="quantity-btn"
                    :disabled="item.unitPrice > characterStore.characterData.currentMoney"
                    @click="handleUpdateQuantity(item.id, item.quantity + 1)"
                  >
                    +
                  </button>
                </div>
              </div>
              <div class="cart-item-total">
                小计：{{ formatPrice(item.totalPrice) }} / {{ formatWeight(item.totalWeight) }}
              </div>
            </div>
          </div>

          <div class="cart-summary">
            <div class="summary-row">
              <span>总价：</span>
              <span class="summary-value">{{ formatPrice(characterStore.getTotalSpent()) }}</span>
            </div>
            <div class="summary-row">
              <span>总重：</span>
              <span class="summary-value">{{ formatWeight(characterStore.getTotalWeight()) }}</span>
            </div>
            <button class="clear-cart-button" @click="handleClearCart">清空购物车</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航按钮 -->
    <div class="navigation-buttons">
      <button class="adnd-button secondary" @click="handlePrevious">上一步</button>
      <button class="adnd-button primary" @click="handleNext">下一步</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useCharacterStore } from '../stores/characterStore';
import { getClassById } from '../utils/classData';
import { EQUIPMENT_CATEGORIES, formatPrice as formatPriceUtil, getEquipmentByCategory } from '../utils/equipmentData';

const characterStore = useCharacterStore();

// 分类数据
const categories = EQUIPMENT_CATEGORIES;
const selectedCategory = ref('weapons'); // 默认选择武器

// 搜索和分页
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 15; // 减少每页项目数，降低拥挤感

// 数量输入
const quantities = ref<Record<string, number>>({});

// 掷骰相关
const showDiceDialog = ref(false);
const diceRolled = ref(false);
const diceRollDetails = ref<number[]>([]);
const diceRollSum = ref(0);
const finalMoney = ref(0);

// 获取职业名称
function getClassName(): string {
  if (!characterStore.characterData.class) return '未知';
  const classData = getClassById(characterStore.characterData.class);
  return classData?.name || '未知';
}

// 计算掷骰公式
const diceFormula = computed(() => {
  if (!characterStore.characterData.class) return '';
  const classData = getClassById(characterStore.characterData.class);
  if (!classData) return '';

  switch (classData.category) {
    case 'warrior':
      return '5d4 × 10';
    case 'wizard':
      return '(1d4+1) × 10';
    case 'rogue':
      return '2d6 × 10';
    case 'priest':
      return '3d6 × 10';
    default:
      return '';
  }
});

// 掷骰
function rollDice() {
  if (!characterStore.characterData.class) return;
  const classData = getClassById(characterStore.characterData.class);
  if (!classData) return;

  const rolls: number[] = [];
  let sum = 0;

  switch (classData.category) {
    case 'warrior': {
      // 5d4
      for (let i = 0; i < 5; i++) {
        const roll = Math.floor(Math.random() * 4) + 1;
        rolls.push(roll);
        sum += roll;
      }
      break;
    }
    case 'wizard': {
      // 1d4+1
      const roll = Math.floor(Math.random() * 4) + 1;
      rolls.push(roll, 1);
      sum = roll + 1;
      break;
    }
    case 'rogue': {
      // 2d6
      for (let i = 0; i < 2; i++) {
        const roll = Math.floor(Math.random() * 6) + 1;
        rolls.push(roll);
        sum += roll;
      }
      break;
    }
    case 'priest': {
      // 3d6
      for (let i = 0; i < 3; i++) {
        const roll = Math.floor(Math.random() * 6) + 1;
        rolls.push(roll);
        sum += roll;
      }
      break;
    }
  }

  diceRollDetails.value = rolls;
  diceRollSum.value = sum;
  finalMoney.value = sum * 10;
  diceRolled.value = true;
}

// 确认金币
function confirmMoney() {
  characterStore.updateCharacterData(data => {
    data.startingMoney = finalMoney.value;
    data.currentMoney = finalMoney.value;
  });
  showDiceDialog.value = false;
  toastr.success(`起始资金已设置为 ${finalMoney.value} GP`);
}

// 初始化起始资金
onMounted(() => {
  if (characterStore.characterData.startingMoney === 0) {
    showDiceDialog.value = true;
  }
});

// 获取当前分类名称
function getCurrentCategoryName(): string {
  return categories.find(c => c.id === selectedCategory.value)?.name || '';
}

// 过滤后的装备列表
const filteredEquipment = computed(() => {
  let equipment = getEquipmentByCategory(selectedCategory.value);

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    equipment = equipment.filter(
      eq => eq.name.toLowerCase().includes(query) || eq.nameEn?.toLowerCase().includes(query),
    );
  }

  return equipment;
});

// 分页后的装备列表
const paginatedEquipment = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredEquipment.value.slice(start, end);
});

// 总页数
const totalPages = computed(() => {
  return Math.ceil(filteredEquipment.value.length / itemsPerPage);
});

// 切换分类时重置页码
watch(selectedCategory, () => {
  currentPage.value = 1;
  searchQuery.value = '';
});

// 搜索时重置页码
watch(searchQuery, () => {
  currentPage.value = 1;
});

// 格式化价格显示
function formatPrice(gp: number): string {
  return formatPriceUtil(gp);
}

// 格式化重量显示
function formatWeight(weight: number): string {
  if (weight === 0) return '-';
  if (weight < 0.1) return '<0.1磅';
  return `${weight.toFixed(1)}磅`;
}

// 检查是否可以添加装备
function canAddEquipment(equipmentId: string): boolean {
  const equipment = getEquipmentByCategory(selectedCategory.value).find(e => e.id === equipmentId);
  if (!equipment) return false;

  const quantity = quantities.value[equipmentId] || 1;
  const totalPrice = equipment.price * quantity;

  return totalPrice <= characterStore.characterData.currentMoney;
}

// 添加装备到购物车
function handleAddEquipment(equipmentId: string) {
  const quantity = quantities.value[equipmentId] || 1;

  if (quantity < 1) {
    toastr.warning('数量必须大于0');
    return;
  }

  const success = characterStore.addEquipmentToCart(equipmentId, quantity);

  if (success) {
    const equipment = getEquipmentByCategory(selectedCategory.value).find(e => e.id === equipmentId);
    toastr.success(`已添加 ${equipment?.name} × ${quantity}`);
    quantities.value[equipmentId] = 1; // 重置数量
  } else {
    toastr.error('金币不足');
  }
}

// 从购物车移除装备
function handleRemoveEquipment(equipmentId: string) {
  const item = characterStore.characterData.purchasedEquipment.find(e => e.id === equipmentId);
  if (item) {
    characterStore.removeEquipmentFromCart(equipmentId);
    toastr.info(`已移除 ${item.name}`);
  }
}

// 更新购物车中装备的数量
function handleUpdateQuantity(equipmentId: string, newQuantity: number) {
  if (newQuantity < 0) return;

  const success = characterStore.updateEquipmentQuantity(equipmentId, newQuantity);

  if (!success && newQuantity > 0) {
    toastr.error('金币不足');
  }
}

// 处理购物车数量输入
function handleQuantityInput(equipmentId: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const newQuantity = parseInt(target.value) || 0;
  handleUpdateQuantity(equipmentId, newQuantity);
}

// 清空购物车
function handleClearCart() {
  if (confirm('确定要清空购物车吗？')) {
    characterStore.clearCart();
    toastr.info('购物车已清空');
  }
}

// 只允许输入数字
function onlyNumber(event: KeyboardEvent) {
  if (!/^\d$/.test(event.key) && event.key !== 'Enter') {
    event.preventDefault();
  }
}

// 上一步
function handlePrevious() {
  characterStore.updateCharacterData(data => {
    data.step = 6;
  });
}

// 下一步
function handleNext() {
  // 检查职业是否1级就能施法
  if (characterStore.canCastSpellsAtLevel1()) {
    // 进入法术选择步骤
    characterStore.updateCharacterData(data => {
      data.step = 8;
    });
    toastr.success('装备购买完成，请选择法术');
  } else {
    // 跳过法术选择，进入阵营选择
    characterStore.updateCharacterData(data => {
      data.step = 9;
    });
    toastr.success('装备购买完成，请选择阵营');
  }
}
</script>

<style lang="scss" scoped>
.equipment-purchase {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

// 掷骰对话框
.dice-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dice-dialog {
  background-color: #fff;
  border: 4px solid #000;
  min-width: 500px;
  max-width: 600px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);

  &-header {
    padding: 25px 30px;
    border-bottom: 3px solid #000;
    background-color: #f5f5f5;
  }

  &-title {
    font-family: '临海体', serif;
    font-size: 26px;
    font-weight: bold;
    margin: 0;
    text-align: center;
  }

  &-body {
    padding: 35px 30px;
  }

  &-footer {
    padding: 20px 30px;
    border-top: 3px solid #000;
    background-color: #f5f5f5;
    display: flex;
    justify-content: center;
    gap: 15px;
  }
}

.dice-instruction {
  font-family: '临海体', serif;
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 25px 0;
  text-align: center;

  strong {
    color: #c00;
    font-weight: bold;
  }
}

.dice-result-area {
  min-height: 120px;
  padding: 25px;
  border: 3px solid #000;
  background-color: #fafafa;
  display: flex;
  justify-content: center;
  align-items: center;
}

.roll-prompt {
  font-family: '临海体', serif;
  font-size: 18px;
  color: #666;
  font-style: italic;
  text-align: center;

  p {
    margin: 0;
  }
}

.roll-result {
  width: 100%;
}

.roll-details {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  font-family: '临海体', serif;
  font-size: 18px;
}

.roll-label {
  font-weight: bold;
}

.roll-values {
  color: #666;
}

.roll-total {
  font-weight: bold;
  color: #000;
  font-size: 20px;
}

.money-result {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background-color: #fff;
  border: 2px solid #000;
  font-family: '临海体', serif;
  font-size: 20px;
}

.money-label {
  font-weight: bold;
}

.money-value {
  font-family: '临海体', serif;
  font-size: 28px;
  font-weight: bold;
  color: #0a0;
}

.dice-roll-button,
.dice-reroll-button,
.dice-confirm-button {
  padding: 14px 35px;
  border: 3px solid #000;
  background-color: #fff;
  font-family: '临海体', serif;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}

.dice-roll-button {
  background-color: #0a0;
  color: #fff;
  border-color: #0a0;
  min-width: 150px;

  &:hover {
    background-color: #0c0;
    border-color: #0c0;
  }
}

.dice-reroll-button {
  background-color: #f90;
  color: #fff;
  border-color: #f90;

  &:hover {
    background-color: #fa0;
    border-color: #fa0;
  }
}

.dice-confirm-button {
  background-color: #00a;
  color: #fff;
  border-color: #00a;

  &:hover {
    background-color: #00c;
    border-color: #00c;
  }
}

// 顶部信息栏
.money-info {
  display: flex;
  gap: 25px;
  flex-wrap: wrap;
}

.info-card {
  flex: 1;
  min-width: 160px;
  padding: 20px 25px;
  background-color: #f5f5f5;
  border: 3px solid #000;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    right: 3px;
    bottom: 3px;
    border: 1px solid #666;
    pointer-events: none;
  }
}

.info-label {
  font-family: '临海体', serif;
  font-size: 15px;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-value {
  font-family: '临海体', serif;
  font-size: 26px;
  font-weight: bold;
  color: #000;

  &.spent {
    color: #c00;
  }

  &.remaining {
    color: #0a0;
  }
}

// 主内容区域
.main-content {
  display: flex;
  gap: 30px;
  flex: 1;

  @media (max-width: 1200px) {
    flex-direction: column;
  }
}

// 左侧分类面板
.categories-panel {
  width: 220px;
  border: 3px solid #000;
  padding: 20px;
  background-color: #fff;
  overflow-y: auto;

  @media (max-width: 1200px) {
    width: 100%;
    max-height: 300px;
  }
}

.panel-title {
  font-family: '临海体', serif;
  font-size: 19px;
  font-weight: bold;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #000;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.category-item {
  padding: 12px 14px;
  margin-bottom: 8px;
  border: 2px solid #999;
  background-color: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: #e0e0e0;
    border-color: #000;
  }

  &.active {
    background-color: #000;
    color: #fff;
    border-color: #000;

    .category-count {
      color: #ccc;
    }
  }
}

.category-name {
  font-family: '临海体', serif;
  font-size: 15px;
}

.category-count {
  font-size: 13px;
  color: #666;
}

// 中间装备列表面板
.equipment-list-panel {
  flex: 2;
  border: 3px solid #000;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 15px 20px;
  border-bottom: 2px solid #000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #000;
  font-family: '临海体', serif;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #000;
    background-color: #f9f9f9;
  }
}

.equipment-table-container {
  flex: 1;
  overflow-y: auto;
  padding: 25px;
}

.equipment-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  font-family: '临海体', serif;

  thead {
    background-color: #f5f5f5;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  th {
    padding: 15px;
    text-align: left;
    border: 2px solid #000;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 14px;
    letter-spacing: 1px;
    background-color: #f5f5f5;
  }

  td {
    padding: 15px;
    border: 1px solid #ccc;
    background-color: #fff;
  }

  .equipment-row {
    transition: background-color 0.2s;

    &:hover td {
      background-color: #f9f9f9;
    }
  }

  .name-col {
    min-width: 220px;
  }

  .equipment-name-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .equipment-name {
    font-weight: bold;
    font-size: 15px;
  }

  .name-en {
    font-size: 13px;
    color: #666;
    font-style: italic;
  }

  .equipment-desc {
    font-size: 12px;
    color: #999;
    font-style: italic;
  }

  .price-col,
  .weight-col {
    font-family: '临海体', serif;
    white-space: nowrap;
  }

  .quantity-col {
    width: 100px;
    text-align: center;
  }

  .action-col {
    width: 100px;
    text-align: center;
  }

  .no-data {
    text-align: center;
    padding: 40px;
    color: #999;
    font-style: italic;
  }
}

.quantity-input {
  width: 60px;
  padding: 5px;
  border: 2px solid #000;
  text-align: center;
  font-family: '临海体', serif;

  &:focus {
    outline: none;
    background-color: #f9f9f9;
  }
}

.add-button {
  padding: 6px 16px;
  border: 2px solid #000;
  background-color: #fff;
  font-family: '临海体', serif;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: #000;
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// 分页
.pagination {
  padding: 15px 20px;
  border-top: 2px solid #000;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.page-button {
  padding: 8px 16px;
  border: 2px solid #000;
  background-color: #fff;
  font-family: '临海体', serif;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: #000;
    color: #fff;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.page-info {
  font-family: '临海体', serif;
  font-size: 14px;
}

// 右侧购物车面板
.cart-panel {
  width: 340px;
  border: 3px solid #000;
  padding: 20px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  @media (max-width: 1200px) {
    width: 100%;
    max-height: 400px;
  }
}

.empty-cart {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 15px;
  opacity: 0.3;
}

.empty-text {
  font-family: '临海体', serif;
  font-size: 16px;
  color: #999;
  font-style: italic;
}

.cart-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
}

.cart-item {
  padding: 16px;
  border: 2px solid #000;
  background-color: #f9f9f9;
}

.cart-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.cart-item-name {
  font-family: '临海体', serif;
  font-weight: bold;
  font-size: 15px;
}

.remove-button {
  width: 24px;
  height: 24px;
  border: 2px solid #c00;
  background-color: #fff;
  color: #c00;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: bold;

  &:hover {
    background-color: #c00;
    color: #fff;
  }
}

.cart-item-details {
  font-family: '临海体', serif;
  font-size: 12px;
  color: #666;
}

.cart-item-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.cart-quantity-control {
  display: flex;
  gap: 5px;
  align-items: center;
}

.quantity-btn {
  width: 24px;
  height: 24px;
  border: 2px solid #000;
  background-color: #fff;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: #000;
    color: #fff;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.cart-quantity-input {
  width: 50px;
  padding: 3px;
  border: 2px solid #000;
  text-align: center;
  font-family: '临海体', serif;
  font-size: 12px;

  &:focus {
    outline: none;
    background-color: #fff;
  }
}

.cart-item-total {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #ccc;
  font-weight: bold;
  color: #000;
}

.cart-summary {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #000;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-family: '临海体', serif;
  font-size: 14px;
}

.summary-value {
  font-weight: bold;
  font-family: '临海体', serif;
}

.clear-cart-button {
  width: 100%;
  margin-top: 10px;
  padding: 10px;
  border: 2px solid #c00;
  background-color: #fff;
  color: #c00;
  font-family: '临海体', serif;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #c00;
    color: #fff;
  }
}

// 底部导航按钮
.navigation-buttons {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding-top: 20px;
  border-top: 3px solid #000;
}

.adnd-button {
  padding: 12px 24px;
  border: 3px solid #000;
  background-color: #fff;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  font-family: '临海体', serif;
  letter-spacing: 1px;

  &:hover:not(:disabled) {
    background-color: #f0f0f0;
    transform: translateY(-2px);
  }

  &.primary {
    background-color: #000;
    color: #fff;

    &:hover:not(:disabled) {
      background-color: #333;
    }
  }

  &.secondary {
    background-color: #666;
    color: #fff;
    border-color: #666;

    &:hover:not(:disabled) {
      background-color: #888;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
