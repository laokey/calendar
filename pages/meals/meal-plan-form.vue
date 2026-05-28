<template>
  <view class="bl-page plan-form-page">
    <BlHeader title="编辑餐点计划" back />

    <view class="block">
      <view class="row">
        <view class="left">
          <image class="row-icon" src="/static/meals/icon_calendar.png" mode="aspectFit" />
          <text class="label">日期</text>
        </view>
        <text class="value">{{ dateText }}</text>
      </view>

      <view class="divider" />

      <view class="row" @click="catOpen = true">
        <view class="left">
          <image class="row-icon" src="/static/meals/icon_grid.png" mode="aspectFit" />
          <text class="label">分类</text>
        </view>
        <view class="right">
          <text class="value">{{ categoryName }}</text>
          <image class="row-icon" src="/static/common/icon_down.png" mode="aspectFit" />
        </view>
      </view>

      <view class="divider" />

      <view class="row col">
        <view class="left">
          <image class="row-icon" src="/static/meals/icon_note.png" mode="aspectFit" />
          <text class="label">笔记</text>
        </view>
        <view class="note-wrap">
          <textarea v-model="note" class="note-input" placeholder="请输入" placeholder-class="ph" />
        </view>
      </view>

      <view class="divider" />

      <view class="row">
        <view class="left">
          <image class="row-icon" src="/static/common/icon_refresh.png" mode="aspectFit" />
          <text class="label">重复</text>
        </view>
        <switch :checked="repeat" color="#3d6afb" @change="repeat = !!$event.detail.value" />
      </view>
    </view>

    <view class="sec">
      <text class="sec-title">你想吃什么？</text>
      <view v-if="selectedRecipes.length" class="recipe-list">
        <view v-for="r in selectedRecipes" :key="r.id" class="recipe-row" @click="openRecipeBox">
          <view class="thumb">
            <image v-if="r.photoPath" class="thumb-img" :src="r.photoPath" mode="aspectFill" />
            <view v-else class="thumb-ph" />
          </view>
          <text class="recipe-title">{{ r.title }}</text>
          <image class="row-icon" src="/static/common/icon_right.png" mode="aspectFit" />
        </view>
      </view>
      <view v-else class="recipe-empty" @click="openRecipeBox">
        <text class="recipe-empty-text bl-muted">去食谱盒选择</text>
        <image class="row-icon" src="/static/common/icon_right.png" mode="aspectFit" />
      </view>
    </view>

    <view class="bottom" :class="{ disabled: bottomDisabled }" @click="onBottom">
      <text class="bottom-text">{{ bottomText }}</text>
    </view>

    <BlSheet v-model="catOpen" title="分类" :confirm-text="''">
      <view class="cat-list">
        <view v-for="c in categories" :key="c.id" class="cat-item" @click="selectCategory(c.id)">
          <view class="cat-left">
            <view class="cat-badge" :style="{ background: c.color }"><text class="cat-glyph">{{ c.glyph }}</text></view>
            <text class="cat-name">{{ c.name }}</text>
          </view>
          <view class="cat-right">
            <view v-if="categoryId === c.id" class="cat-check"><text class="cat-check-text">✓</text></view>
            <view v-else class="cat-dot" />
          </view>
        </view>
      </view>
    </BlSheet>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import BlSheet from '../../components/BlSheet.vue'
import {
  addPlans,
  clearRecipeSelectTmp,
  cnMonthDayText,
  ensureMealState,
  findPlan,
  findRecipe,
  listCategories,
  readRecipeSelectTmp,
  updatePlan,
  writeRecipeSelectTmp,
} from '../../utils/mealStore'

const mealState = ref(ensureMealState())

const planId = ref('')
const date = ref('')
const categoryId = ref('')
const note = ref('')
const repeat = ref(false)
const selectedIds = ref([])

const catOpen = ref(false)

function refresh() {
  mealState.value = ensureMealState()
}

function syncFromTmp() {
  const tmp = readRecipeSelectTmp()
  if (tmp.date && tmp.date === date.value) {
    if (tmp.categoryId) categoryId.value = tmp.categoryId
    if (typeof tmp.note === 'string') note.value = tmp.note
    repeat.value = !!tmp.repeat
    selectedIds.value = Array.isArray(tmp.recipeIds) ? tmp.recipeIds : []
  }
}

onLoad((options) => {
  refresh()
  planId.value = options && options.planId ? String(options.planId) : ''
  if (planId.value) {
    const p = findPlan(mealState.value, planId.value)
    if (!p) {
      uni.navigateBack()
      return
    }
    date.value = p.date
    categoryId.value = p.categoryId
    note.value = p.note || ''
    repeat.value = !!p.repeat
    selectedIds.value = p.recipeId ? [p.recipeId] : []
    clearRecipeSelectTmp()
    writeRecipeSelectTmp({ date: date.value, categoryId: categoryId.value, note: note.value, repeat: repeat.value, recipeIds: selectedIds.value })
    return
  }
  date.value = options && options.date ? String(options.date) : ''
  categoryId.value = options && options.categoryId ? String(options.categoryId) : ''
  clearRecipeSelectTmp()
  writeRecipeSelectTmp({ date: date.value, categoryId: categoryId.value, note: note.value, repeat: repeat.value, recipeIds: [] })
})

onShow(() => {
  refresh()
  syncFromTmp()
})

const categories = computed(() => listCategories(mealState.value, { enabledOnly: true }))
const categoryName = computed(() => {
  const c = categories.value.find((x) => x.id === categoryId.value)
  return c ? c.name : ''
})

const dateText = computed(() => cnMonthDayText(date.value))

const selectedRecipes = computed(() =>
  selectedIds.value
    .map((id) => findRecipe(mealState.value, id))
    .filter(Boolean)
    .slice(0, 6)
)

function selectCategory(id) {
  categoryId.value = id
  catOpen.value = false
  writeRecipeSelectTmp({ date: date.value, categoryId: categoryId.value, note: note.value, repeat: repeat.value, recipeIds: selectedIds.value })
}

function openRecipeBox() {
  writeRecipeSelectTmp({ date: date.value, categoryId: categoryId.value, note: note.value, repeat: repeat.value, recipeIds: selectedIds.value })
  const single = planId.value ? '1' : '0'
  uni.navigateTo({ url: `/pages/meals/recipe-box?select=1&single=${single}&date=${date.value}&categoryId=${categoryId.value}` })
}

const isEdit = computed(() => !!planId.value)

const bottomDisabled = computed(() => {
  if (isEdit.value) return selectedIds.value.length !== 1
  return selectedIds.value.length === 0
})

const bottomText = computed(() => {
  if (isEdit.value) return '保存'
  return `添加到计划（${selectedIds.value.length}）`
})

function onBottom() {
  if (bottomDisabled.value) return
  if (isEdit.value) {
    const rid = selectedIds.value[0] || ''
    updatePlan(mealState.value, planId.value, { categoryId: categoryId.value, note: note.value, repeat: repeat.value, recipeId: rid })
    clearRecipeSelectTmp()
    uni.navigateBack()
    return
  }
  const added = addPlans(mealState.value, {
    date: date.value,
    categoryId: categoryId.value,
    recipeIds: selectedIds.value,
    note: note.value,
    repeat: repeat.value,
  })
  if (!added.length) {
    uni.showToast({ title: '没有新增餐点', icon: 'none' })
    return
  }
  clearRecipeSelectTmp()
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.plan-form-page {
  padding-bottom: 220rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

.block {
  margin-top: 12rpx;
  background: #fafafa;
  border-radius: 28rpx;
  padding: 10rpx 22rpx;
  box-shadow: none;
}

.row {
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row.col {
  height: auto;
  padding: 18rpx 0;
  align-items: flex-start;
  flex-direction: column;
  justify-content: flex-start;
  gap: 14rpx;
}

.left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.row-icon {
  width: 28rpx;
  height: 28rpx;
  display: block;
  opacity: 0.8;
}

.icon {
  width: 28rpx;
  height: 28rpx;
  border-radius: 8rpx;
  background: rgba(17, 17, 17, 0.12);
}

.icon.rep {
  border-radius: 999rpx;
}

.label {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.value {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.6);
}

.arrow {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.35);
}

.divider {
  height: 1px;
  background: rgba(17, 17, 17, 0.06);
}

.note-wrap {
  width: 100%;
  margin-top: 0;
  border-radius: 24rpx;
  background: #fafafa;
  padding: 12rpx 16rpx;
}

.note-input {
  width: 100%;
  height: 110rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #111111;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
}

.sec {
  margin-top: 22rpx;
}

.sec-title {
  display: block;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.recipe-list {
  margin-top: 12rpx;
}

.recipe-row {
  height: 96rpx;
  border-radius: 22rpx;
  background: #fafafa;
  padding: 0 18rpx 0 14rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.thumb {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: rgba(17, 17, 17, 0.06);
}

.thumb-img {
  width: 64rpx;
  height: 64rpx;
}

.thumb-ph {
  width: 64rpx;
  height: 64rpx;
  background: rgba(17, 17, 17, 0.12);
}

.recipe-title {
  flex: 1;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.chev {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.35);
}

.recipe-empty {
  margin-top: 12rpx;
  height: 96rpx;
  border-radius: 22rpx;
  background: #fafafa;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.recipe-empty-text {
  font-size: 28rpx;
  font-weight: 800;
}

.bottom {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 34rpx;
  height: 104rpx;
  background: #3d6afb;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom.disabled {
  background: #d7d7d7;
}

.bottom-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.bottom.disabled .bottom-text {
  color: rgba(17, 17, 17, 0.45);
}

.cat-list {
  padding: 6rpx 0 10rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.cat-item {
  height: 92rpx;
  border-radius: 20rpx;
  background: #fafafa;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cat-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.cat-badge {
  width: 46rpx;
  height: 46rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-glyph {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 900;
}

.cat-name {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.cat-right {
  width: 54rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.cat-check {
  width: 38rpx;
  height: 38rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-check-text {
  font-size: 22rpx;
  font-weight: 900;
  color: #ffffff;
}

.cat-dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.18);
}
</style>
