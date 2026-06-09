<template>
  <view class="bl-page box-page">
    <BlHeader title="食谱盒" back>
      <template #right>
        <view class="top-add" @click="goAddRecipe">
          <image class="top-add-icon" src="/static/meals/icon_plus.png" mode="aspectFit" />
          <text class="top-add-text">添加食谱</text>
        </view>
      </template>
    </BlHeader>

    <BlSegmented v-model="activeTab" :options="tabOptions" />

    <view class="search">
      <image class="search-icon" src="/static/meals/icon_search.png" mode="aspectFit" />
      <input v-model="q" class="search-input" placeholder="搜索" placeholder-class="ph" />
    </view>

    <view class="list">
      <view v-for="r in filtered" :key="r.id" class="row" @click="toggleSelect(r.id)">
        <view class="sel">
          <view class="sel-circle" :class="{ on: selectedSet.has(r.id) }">
            <text v-if="selectedSet.has(r.id)" class="sel-check">✓</text>
          </view>
        </view>
        <view class="thumb">
          <image v-if="r.photoPath" class="thumb-img" :src="r.photoPath" mode="aspectFill" />
          <view v-else class="thumb-ph" />
        </view>
        <text class="title">{{ r.title }}</text>
        <view class="more" @click.stop="openActions(r.id)">
          <image class="more-icon" src="/static/meals/icon_more.png" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view class="bottom" :class="{ disabled: selectedIds.length === 0 }" @click="confirmSelect">
      <text class="bottom-text">添加到计划（{{ selectedIds.length }}）</text>
    </view>

    <BlSheet v-model="actionOpen" title="" :confirm-text="''">
      <view class="action-list">
        <view class="action-item" @click="editRecipe"><text class="action-text">编辑</text></view>
        <view class="action-item danger" @click="openDelete"><text class="action-text danger-text">删除</text></view>
        <view class="action-cancel" @click="actionOpen = false"><text class="action-cancel-text">取消</text></view>
      </view>
    </BlSheet>

    <BlSheet v-model="deleteOpen" title="删除食谱" :confirm-text="''">
      <view class="del-list">
        <view class="del-item" @click="deleteScope = 'recipe_only'">
          <text class="del-text">此食谱</text>
          <view class="mark">
            <view v-if="deleteScope === 'recipe_only'" class="check"><text class="check-text">✓</text></view>
            <view v-else class="dot" />
          </view>
        </view>
        <view class="del-item" @click="deleteScope = 'recipe_and_plans'">
          <text class="del-text">此食谱和计划的餐点</text>
          <view class="mark">
            <view v-if="deleteScope === 'recipe_and_plans'" class="check"><text class="check-text">✓</text></view>
            <view v-else class="dot" />
          </view>
        </view>
        <view class="del-btn" @click="doDelete"><text class="del-btn-text">删除</text></view>
      </view>
    </BlSheet>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import BlSegmented from '../../components/BlSegmented.vue'
import BlSheet from '../../components/BlSheet.vue'
import { ensureMealState, listCategories, readRecipeSelectTmp, writeRecipeSelectTmp } from '../../utils/mealStore'
import { mealsApi } from '../../utils/api'

const mealState = ref(ensureMealState())
const recipes = ref([])

const selectMode = ref(true)
const single = ref(false)
const date = ref('')
const categoryId = ref('')

const activeTab = ref('all')
const q = ref('')

const selectedIds = ref([])

const actionOpen = ref(false)
const activeRecipeId = ref('')
const deleteOpen = ref(false)
const deleteScope = ref('recipe_only')

function refresh() {
  mealState.value = ensureMealState()
}

onLoad((options) => {
  refresh()
  selectMode.value = String(options && options.select ? options.select : '1') !== '0'
  single.value = String(options && options.single ? options.single : '0') === '1'
  date.value = options && options.date ? String(options.date) : ''
  categoryId.value = options && options.categoryId ? String(options.categoryId) : ''

  const tmp = readRecipeSelectTmp()
  selectedIds.value = Array.isArray(tmp.recipeIds) ? tmp.recipeIds : []
  if (tmp.categoryId) categoryId.value = tmp.categoryId
  if (categoryId.value) activeTab.value = categoryId.value
})

const categories = computed(() => listCategories(mealState.value, { enabledOnly: true }))

const tabOptions = computed(() => {
  const base = [{ label: '全部', value: 'all' }]
  const cats = categories.value.map((c) => ({ label: c.name, value: c.id }))
  return [...base, ...cats]
})

const recipesView = computed(() => recipes.value || [])

const filtered = computed(() => {
  const key = String(q.value || '').trim()
  const tab = activeTab.value
  return recipesView.value
    .filter((r) => (tab === 'all' ? true : r.categoryId === tab))
    .filter((r) => (!key ? true : String(r.title || '').includes(key)))
})

const selectedSet = computed(() => new Set(selectedIds.value))

function toggleSelect(id) {
  if (single.value) {
    selectedIds.value = selectedIds.value[0] === id ? [] : [id]
    return
  }
  const set = new Set(selectedIds.value)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  selectedIds.value = Array.from(set)
}

function confirmSelect() {
  if (!selectedIds.value.length) return
  const tmp = readRecipeSelectTmp()
  writeRecipeSelectTmp({
    date: date.value || tmp.date,
    categoryId: categoryId.value || tmp.categoryId,
    note: tmp.note,
    repeat: tmp.repeat,
    recipeIds: selectedIds.value,
  })
  uni.navigateBack()
}

function goAddRecipe() {
  uni.navigateTo({ url: '/pages/meals/recipe-form' })
}

function openActions(id) {
  activeRecipeId.value = id
  actionOpen.value = true
}

function editRecipe() {
  const id = activeRecipeId.value
  actionOpen.value = false
  if (!id) return
  uni.navigateTo({ url: `/pages/meals/recipe-form?id=${id}` })
}

function openDelete() {
  actionOpen.value = false
  deleteScope.value = 'recipe_only'
  deleteOpen.value = true
}

function doDelete() {
  const id = activeRecipeId.value
  if (!id) return
  deleteOpen.value = false
  removeRecipe(id)
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

function categoryIdFromRecipeType(type) {
  const enabled = listCategories(mealState.value, { enabledOnly: true })
  const t = Number(type)
  for (const c of enabled) {
    const mt = mealTypeFromCategoryId(c.id)
    if (mt === t) return c.id
  }
  return enabled[0] ? enabled[0].id : ''
}

async function fetchRecipes() {
  try {
    const list = await mealsApi.getRecipeList()
    recipes.value = (list || []).map((x) => ({
      id: String(x.recipeId),
      title: String(x.recipeName || ''),
      photoPath: String(x.imageUrl || ''),
      categoryId: categoryIdFromRecipeType(x.recipeType),
    }))
  } catch (e) {
    recipes.value = []
    uni.showToast({ title: String((e && e.message) || '获取食谱失败'), icon: 'none' })
  }
}

async function removeRecipe(recipeId) {
  const id = String(recipeId || '').trim()
  if (!id) return
  uni.showLoading({ title: '删除中' })
  try {
    const res = await mealsApi.deleteRecipeInfo({ recipeId: id })
    if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
      uni.showToast({ title: '删除失败', icon: 'none' })
      return
    }
    uni.showToast({ title: '已删除', icon: 'none' })
    await fetchRecipes()
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || '删除失败'), icon: 'none' })
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
}

onShow(() => {
  refresh()
  fetchRecipes()
})
</script>

<style scoped lang="scss">
.box-page {
  padding-bottom: 220rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

.top-add {
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6rpx;

}

.top-add-icon {
  width: 32rpx;
  height: 32rpx;
  display: block;
}

.top-add-text {
  color: #3d6afb;
  font-size: 28rpx;
  font-weight: 900;
  white-space: nowrap;
}

.search {
  margin-top: 14rpx;
  height: 92rpx;
  border-radius: 999rpx;
  background: #f5f6f7;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.search-icon {
  width: 28rpx;
  height: 28rpx;
  display: block;
  opacity: 0.75;
}

.search-input {
  flex: 1;
  font-size: 30rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.9);
}

.ph {
  color: rgba(17, 17, 17, 0.35);
}

.list {
  margin-top: 10rpx;
  display: flex;
  flex-direction: column;
}

.row {
  height: 104rpx;
  border-radius: 24rpx;
  background: #f5f6f7;
  padding: 0 12rpx 0 10rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.row + .row {
  margin-top: 10rpx;
}

.sel {
  width: 54rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sel-circle {
  width: 34rpx;
  height: 34rpx;
  border-radius: 999rpx;
  border: 3rpx solid rgba(17, 17, 17, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sel-circle.on {
  background: #3d6afb;
  border-color: #3d6afb;
}

.sel-check {
  font-size: 20rpx;
  font-weight: 900;
  color: #ffffff;
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

.title {
  flex: 1;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.more {
  width: 80rpx;
  height: 80rpx;
  border-radius: 18rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-icon {
  width: 32rpx;
  height: 32rpx;
  display: block;
  opacity: 0.75;
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

.action-list {
  padding: 6rpx 0 10rpx;
}

.action-item {
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-text {
  font-size: 32rpx;
  font-weight: 900;
  color: #111111;
}

.action-item.danger .action-text {
  color: #ff3b30;
}

.action-cancel {
  margin-top: 18rpx;
  height: 92rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-cancel-text {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
}

.del-list {
  padding: 6rpx 0 12rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.del-item {
  height: 92rpx;
  border-radius: 20rpx;
  background: rgba(17, 17, 17, 0.06);
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.del-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.mark {
  width: 54rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.check {
  width: 38rpx;
  height: 38rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-text {
  font-size: 22rpx;
  font-weight: 900;
  color: #ffffff;
}

.dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.18);
}

.del-btn {
  margin-top: 10rpx;
  height: 96rpx;
  border-radius: 999rpx;
  background: #ff3b30;
  display: flex;
  align-items: center;
  justify-content: center;
}

.del-btn-text {
  font-size: 34rpx;
  font-weight: 900;
  color: #ffffff;
}
</style>
