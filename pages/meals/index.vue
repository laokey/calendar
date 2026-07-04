<template>
  <view class="bl-page meals-page">
    <BlHeader title="餐食" back />

    <view class="top-bar">
      <view class="cat-btn" @click="goCategories">
        <image class="cat-icon" src="/static/meals/icon_grid.png" mode="aspectFit" />
        <text class="cat-text">类别</text>
      </view>

      <view class="week">
        <view class="week-arrow" @click="shiftWeek(-7)"><text class="week-arrow-text">‹</text></view>
        <text class="week-text">{{ weekText }}</text>
        <view class="week-arrow" @click="shiftWeek(7)"><text class="week-arrow-text">›</text></view>
      </view>
    </view>

    <view class="sections">
      <view v-for="d in days" :key="d.key" class="day">
        <view class="section-head">
          <view v-if="d.key === todayKey" class="sec-today">
            <text class="sec-week">{{ d.weekday }}</text>
            <view class="sec-date-on"><text class="sec-date-on-text">{{ d.date }}</text></view>
          </view>
          <text v-else class="sec-title">{{ d.weekday }} {{ d.date }}</text>
        </view>

        <view class="section">
          <view class="tabs">
            <view
              v-for="opt in categoryOptions"
              :key="opt.value"
              class="tab"
              @click="setDayCategory(d.key, opt.value)"
            >
              <text class="tab-text" :class="{ on: dayCategoryId(d.key) === opt.value }">{{ opt.label }}</text>
              <view class="tab-line" :class="{ on: dayCategoryId(d.key) === opt.value }" />
            </view>
          </view>

          <view v-if="dayItems(d.key).length" class="meal-items">
            <view
              v-for="it in dayItems(d.key)"
              :key="it.id"
              class="meal-item"
              :style="{ background: mealItemBg(d.key) }"
              @click="openDetail(d.key, it)"
            >
              <view class="thumb">
                <image v-if="it.photoPath" class="thumb-img" :src="it.photoPath" mode="aspectFill" />
                <view v-else class="thumb-ph" />
              </view>
              <text class="meal-title">{{ it.title }}</text>
              <view class="meal-del" @click.stop="removePlan(d.key, it)">
                <image class="meal-del-icon" src="/static/meals/icon_trash.png" mode="aspectFit" />
              </view>
            </view>
          </view>

          <view class="add-card" @click="openPlanForm(d.key, dayCategoryId(d.key))">
            <image class="add-icon" src="/static/common/icon_plus.png" mode="aspectFit" />
            <text class="add-text">添加</text>
          </view>
        </view>
      </view>
    </view>

    <view class="fab" @click="openPlanForm(activeDateKey, dayCategoryId(activeDateKey))">
      <image class="fab-img" src="/static/common/btn_fab_add.png" mode="aspectFit" />
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import {
  clearRecipeSelectTmp,
  ensureMealState,
  listCategories,
  setActiveDateKey,
  setWeekStartKey,
  weekDaysForKey,
  weekRangeText,
} from '../../utils/mealStore'
import { mealsApi } from '../../utils/api'

const mealState = ref(ensureMealState())
const todayKey = ref('')
const dayCategoryMap = ref({})
const weekMealsMap = ref({})
const loading = ref(false)

function refresh() {
  mealState.value = ensureMealState()
  const enabled = listCategories(mealState.value, { enabledOnly: true })
  const fallback = enabled[0] ? enabled[0].id : ''
  for (const k of Object.keys(dayCategoryMap.value || {})) {
    const v = dayCategoryMap.value[k]
    if (!enabled.some((c) => c.id === v)) dayCategoryMap.value[k] = fallback
  }
}

function startOfWeekDate(d) {
  const x = new Date(d)
  const dow = x.getDay()
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - dow)
  return x
}

function initToday() {
  const key = formatKey(new Date())
  const weekKey = formatKey(startOfWeekDate(new Date()))
  todayKey.value = key
  if (mealState.value.weekStartKey !== weekKey) {
    mealState.value = setWeekStartKey(mealState.value, weekKey)
  }
  if (mealState.value.activeDateKey !== key) {
    mealState.value = setActiveDateKey(mealState.value, key)
  }
}

onShow(() => {
  mealState.value = ensureMealState()
  initToday()
  refresh()
  fetchWeekMeals()
})

const weekStartKey = computed(() => mealState.value.weekStartKey)
const activeDateKey = computed(() => mealState.value.activeDateKey)

const days = computed(() => weekDaysForKey(weekStartKey.value))
const weekText = computed(() => weekRangeText(weekStartKey.value))

const categoryOptions = computed(() =>
  listCategories(mealState.value, { enabledOnly: true }).map((c) => ({ label: c.name, value: c.id }))
)

function hexToRgba(hex, alpha) {
  const a = Math.max(0, Math.min(1, Number(alpha)))
  const raw = String(hex || '').trim()
  if (!raw) return ''
  if (raw.startsWith('rgba(') || raw.startsWith('rgb(')) return raw
  if (!raw.startsWith('#')) return ''
  const h = raw.slice(1)
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  if (full.length !== 6) return ''
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return ''
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

const categoryColorMap = computed(() => {
  const map = {}
  for (const c of listCategories(mealState.value)) {
    if (!c || !c.id) continue
    map[String(c.id)] = String(c.color || '')
  }
  return map
})

const defaultCategoryId = computed(() => {
  const enabled = listCategories(mealState.value, { enabledOnly: true })
  const stateId = String(mealState.value.activeCategoryId || '')
  if (stateId && enabled.some((c) => c.id === stateId)) return stateId
  return enabled[0] ? enabled[0].id : ''
})

function dayCategoryId(dateKeyVal) {
  const k = String(dateKeyVal || '')
  const v = dayCategoryMap.value && dayCategoryMap.value[k] ? String(dayCategoryMap.value[k]) : ''
  return v || defaultCategoryId.value
}

function setDayCategory(dateKeyVal, categoryIdVal) {
  const k = String(dateKeyVal || '')
  const v = String(categoryIdVal || '')
  if (!k) return
  dayCategoryMap.value = { ...(dayCategoryMap.value || {}), [k]: v }
}

function shiftWeek(deltaDays) {
  const cur = days.value[0] ? days.value[0].key : weekStartKey.value
  const d = parseKey(cur)
  d.setDate(d.getDate() + deltaDays)
  mealState.value = setWeekStartKey(mealState.value, formatKey(d))
  refresh()
  fetchWeekMeals()
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

function categoryIdFromMealType(type) {
  const enabled = listCategories(mealState.value, { enabledOnly: true })
  const t = Number(type)
  for (const c of enabled) {
    if (mealTypeFromCategoryId(c.id) === t) return c.id
  }
  return enabled[0] ? enabled[0].id : ''
}

function mealsForDate(dateKeyVal) {
  const key = String(dateKeyVal || '')
  return (weekMealsMap.value && weekMealsMap.value[key] ? weekMealsMap.value[key] : []).slice()
}

function itemsFor(dateKeyVal, categoryIdVal) {
  const type = mealTypeFromCategoryId(categoryIdVal)
  const list = mealsForDate(dateKeyVal)
  const filtered = list.filter((x) => {
    if (x && x.mealType !== undefined && x.mealType !== null && Number.isFinite(Number(x.mealType))) {
      return Number(x.mealType) === Number(type)
    }
    return true
  })
  return filtered.map((x, i) => ({
    id: x && x.uid ? String(x.uid) : `${String(dateKeyVal || 'day')}_${String(type)}_${i}`,
    mealId: x && x.mealId ? String(x.mealId) : '',
    title: x && x.recipeName ? String(x.recipeName) : '',
    photoPath: x && x.imageUrl ? String(x.imageUrl) : '',
    mealType: x && x.mealType !== undefined ? x.mealType : undefined,
  }))
}

function dayItems(dateKeyVal) {
  return itemsFor(dateKeyVal, dayCategoryId(dateKeyVal))
}

function mealItemBg(dateKeyVal) {
  const catId = dayCategoryId(dateKeyVal)
  const color = categoryColorMap.value && categoryColorMap.value[catId] ? categoryColorMap.value[catId] : ''
  return hexToRgba(color, 0.12) || 'rgba(17, 17, 17, 0.04)'
}

function openPlanForm(dateKeyVal, categoryIdVal) {
  clearRecipeSelectTmp()
  const catId = String(categoryIdVal || dayCategoryId(dateKeyVal) || '')
  uni.navigateTo({ url: `/pages/meals/meal-plan-form?date=${dateKeyVal}&categoryId=${catId}` })
}

function openDetail(dateKeyVal, it) {
  const mealId = it && it.mealId ? String(it.mealId) : ''
  if (!mealId) {
    uni.showToast({ title: '该餐点缺少 mealId', icon: 'none' })
    return
  }
  const title = it ? String(it.title || '') : ''
  const photoPath = it ? String(it.photoPath || '') : ''
  const catId = it && it.mealType !== undefined && it.mealType !== null ? categoryIdFromMealType(it.mealType) : dayCategoryId(dateKeyVal)
  uni.navigateTo({
    url: `/pages/meals/meal-detail?id=${encodeURIComponent(mealId)}&date=${encodeURIComponent(dateKeyVal)}&categoryId=${encodeURIComponent(
      catId,
    )}&title=${encodeURIComponent(title)}&photoPath=${encodeURIComponent(photoPath)}`,
  })
}

async function removePlan(dateKeyVal, it) {
  const id = it && it.mealId ? String(it.mealId) : ''
  if (!id) {
    uni.showToast({ title: '该餐点暂无 mealId，无法删除', icon: 'none' })
    return
  }
  uni.showLoading({ title: '删除中' })
  try {
    const res = await mealsApi.deleteMealInfo({ mealId: id })
    if (res && typeof res === 'object' && res.code !== undefined && res.code !== 200 && res.code !== '200') {
      uni.showToast({ title: '删除失败', icon: 'none' })
      return
    }
    uni.showToast({ title: '已删除', icon: 'none' })
    await fetchWeekMeals()
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || '删除失败'), icon: 'none' })
  } finally {
    try {
      uni.hideLoading()
    } catch (e) {}
  }
}

function goCategories() {
  uni.navigateTo({ url: '/pages/meals/categories' })
}

function parseKey(key) {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return new Date()
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

function formatKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function fetchWeekMeals() {
  const ds = days.value.map((x) => x.key)
  if (!ds.length) return
  loading.value = true
  try {
    const list = await mealsApi.getWeekMealInfo({ dates: ds })
    const map = {}
    for (const d of list) {
      const k = String(d.mealDate || '').trim()
      if (!k) continue
      map[k] = Array.isArray(d.meals) ? d.meals : []
    }
    weekMealsMap.value = map
  } catch (e) {
    weekMealsMap.value = {}
    uni.showToast({ title: String((e && e.message) || '获取餐食失败'), icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.meals-page {
  padding-bottom: 220rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

.top-bar {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.cat-btn {
  height: 76rpx;
  padding: 0 18rpx;
  border-radius: 22rpx;
  background: #f5f6f7;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.cat-icon {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.cat-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.week {
  flex: 1;
  height: 76rpx;
  border-radius: 999rpx;
  background: #f5f6f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14rpx;
}

.week-arrow {
  width: 64rpx;
  height: 64rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.week-arrow-text {
  font-size: 46rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
}

.week-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.sections {
  margin-top: 14rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.day {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.section {
  background: #f5f6f7;
  border-radius: 28rpx;
  padding: 16rpx 22rpx 22rpx;
}

.sec-today {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.sec-week {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.sec-date-on {
  width: 52rpx;
  height: 52rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sec-date-on-text {
  font-size: 28rpx;
  font-weight: 900;
  color: #ffffff;
}

.sec-title {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.tabs {
  margin-top: 6rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tab {
  flex: 1;
  height: 70rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.tab-text {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.55);
}

.tab-text.on {
  color: rgba(17, 17, 17, 0.9);
}

.tab-line {
  width: 30rpx;
  height: 6rpx;
  border-radius: 999rpx;
  background: transparent;
}

.tab-line.on {
  background: #3d6afb;
}

.meal-items {
  margin-top: 14rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.meal-item {
  height: 106rpx;
  border-radius: 24rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  padding: 0 18rpx 0 14rpx;
  gap: 14rpx;
}

.thumb {
  width: 74rpx;
  height: 74rpx;
  border-radius: 18rpx;
  overflow: hidden;
  background: rgba(17, 17, 17, 0.06);
}

.thumb-img {
  width: 74rpx;
  height: 74rpx;
}

.thumb-ph {
  width: 74rpx;
  height: 74rpx;
  background: rgba(17, 17, 17, 0.12);
}

.meal-title {
  flex: 1;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.meal-del {
  width: 66rpx;
  height: 66rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meal-del-icon {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.add-card {
  margin-top: 14rpx;
  height: 96rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.add-icon {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.add-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}


.fab {
  position: fixed;
  right: 34rpx;
  bottom: 120rpx;
  width: 152rpx;
  height: 96rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-img {
  width: 152rpx;
  height: 96rpx;
  display: block;
}
</style>
