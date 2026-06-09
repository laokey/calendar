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
  clearRecipeSelectTmp,
  cnMonthDayText,
  ensureMealState,
  listCategories,
  readRecipeSelectTmp,
  writeRecipeSelectTmp,
} from '../../utils/mealStore'
import { mealsApi } from '../../utils/api'

const mealState = ref(ensureMealState())

const planId = ref('')
const date = ref('')
const categoryId = ref('')
const note = ref('')
const repeat = ref(false)
const selectedIds = ref([])
const recipes = ref([])

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
  date.value = options && options.date ? String(options.date) : ''
  categoryId.value = options && options.categoryId ? String(options.categoryId) : ''
  if (options && options.categoryId) categoryId.value = String(options.categoryId)
  if (options && options.mealId) planId.value = String(options.mealId)
  if (options && options.selected) {
    const sid = String(options.selected).trim()
    if (sid) selectedIds.value = [sid]
  }
  clearRecipeSelectTmp()
  writeRecipeSelectTmp({ date: date.value, categoryId: categoryId.value, note: note.value, repeat: repeat.value, recipeIds: selectedIds.value })
})

onShow(() => {
  refresh()
  syncFromTmp()
  fetchRecipes()
})

const categories = computed(() => listCategories(mealState.value, { enabledOnly: true }))
const categoryName = computed(() => {
  const c = categories.value.find((x) => x.id === categoryId.value)
  return c ? c.name : ''
})

const dateText = computed(() => cnMonthDayText(date.value))

const recipeMap = computed(() => {
  const map = {}
  for (const r of recipes.value || []) {
    if (!r || !r.id) continue
    map[String(r.id)] = r
  }
  return map
})

const selectedRecipes = computed(() => selectedIds.value.map((id) => recipeMap.value[String(id)]).filter(Boolean).slice(0, 6))

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
  if (!date.value) {
    uni.showToast({ title: '日期缺失', icon: 'none' })
    return
  }
  const mealType = mealTypeFromCategoryId(categoryId.value)
  if (isEdit.value) {
    const rid = selectedIds.value[0] || ''
    if (!rid) return
    saveEdit({ mealId: planId.value, mealDate: date.value, mealType, recipeId: rid })
    return
  }
  saveAdd({ mealDate: date.value, mealType, recipeIds: selectedIds.value })
}

function categoryNameById(id) {
  const list = listCategories(mealState.value, { enabledOnly: true })
  const c = list.find((x) => x && x.id === id) || null
  return c ? String(c.name || '') : ''
}

function mealTypeFromCategoryId(id) {
  const name = categoryNameById(id)
  const n = name.replace(/\s+/g, '')
  if (n.includes('早餐') || n === '早') return 0
  if (n.includes('午餐') || n === '午') return 1
  if (n.includes('晚餐') || n === '晚') return 2
  if (n.includes('点心') || n.includes('加餐') || n === '点') return 3
  const enabled = listCategories(mealState.value, { enabledOnly: true })
  const idx = enabled.findIndex((x) => x && x.id === id)
  return idx >= 0 ? idx : 0
}

async function fetchRecipes() {
  try {
    const list = await mealsApi.getRecipeList()
    recipes.value = (list || []).map((x) => ({
      id: String(x.recipeId),
      title: String(x.recipeName || ''),
      photoPath: String(x.imageUrl || ''),
      recipeType: x.recipeType,
      note: String(x.description || ''),
    }))
  } catch (e) {
    recipes.value = []
  }
}

async function saveAdd({ mealDate, mealType, recipeIds }) {
  const ids = Array.isArray(recipeIds) ? recipeIds.map((x) => String(x || '').trim()).filter(Boolean) : []
  if (!ids.length) return
  uni.showLoading({ title: '添加中' })
  try {
    for (const rid of ids) {
      const res = await mealsApi.addMealInfo({ mealType, mealDate, recipeId: rid })
      if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
        uni.showToast({ title: '添加失败', icon: 'none' })
        return
      }
    }
    clearRecipeSelectTmp()
    uni.navigateBack()
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || '添加失败'), icon: 'none' })
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
}

async function saveEdit({ mealId, mealDate, mealType, recipeId }) {
  const mid = String(mealId || '').trim()
  if (!mid) return
  uni.showLoading({ title: '保存中' })
  try {
    await mealsApi.deleteMealInfo({ mealId: mid })
    const res = await mealsApi.addMealInfo({ mealType, mealDate, recipeId })
    if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
      uni.showToast({ title: '保存失败', icon: 'none' })
      return
    }
    clearRecipeSelectTmp()
    uni.navigateBack()
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || '保存失败'), icon: 'none' })
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
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
