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
      <view v-for="d in days" :key="d.key" class="section">
        <view class="section-head">
          <view v-if="d.key === todayKey" class="sec-today">
            <text class="sec-week">{{ d.weekday }}</text>
            <view class="sec-date-on"><text class="sec-date-on-text">{{ d.date }}</text></view>
          </view>
          <text v-else class="sec-title">{{ d.weekday }} {{ d.date }}</text>
        </view>

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
          <view v-for="it in dayItems(d.key)" :key="it.id" class="meal-item" @click="openDetail(it.id)">
            <view class="thumb">
              <image v-if="it.photoPath" class="thumb-img" :src="it.photoPath" mode="aspectFill" />
              <view v-else class="thumb-ph" />
            </view>
            <text class="meal-title">{{ it.title }}</text>
            <view class="meal-del" @click.stop="removePlan(it.id)">
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
  findRecipe,
  listCategories,
  plansForDateCategory,
  setActiveDateKey,
  setWeekStartKey,
  weekDaysForKey,
  weekRangeText,
  deletePlan,
} from '../../utils/mealStore'

const mealState = ref(ensureMealState())
const todayKey = ref('')
const dayCategoryMap = ref({})

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
})

const weekStartKey = computed(() => mealState.value.weekStartKey)
const activeDateKey = computed(() => mealState.value.activeDateKey)

const days = computed(() => weekDaysForKey(weekStartKey.value))
const weekText = computed(() => weekRangeText(weekStartKey.value))

const categoryOptions = computed(() =>
  listCategories(mealState.value, { enabledOnly: true }).map((c) => ({ label: c.name, value: c.id }))
)

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
}

function itemsFor(dateKeyVal, categoryIdVal) {
  const plans = plansForDateCategory(mealState.value, dateKeyVal, categoryIdVal)
  return plans
    .map((p) => {
      const r = findRecipe(mealState.value, p.recipeId)
      return { id: p.id, title: r ? r.title : '未命名', photoPath: r ? r.photoPath : '' }
    })
    .filter(Boolean)
}

function dayItems(dateKeyVal) {
  return itemsFor(dateKeyVal, dayCategoryId(dateKeyVal))
}

function openPlanForm(dateKeyVal, categoryIdVal) {
  clearRecipeSelectTmp()
  const catId = String(categoryIdVal || dayCategoryId(dateKeyVal) || '')
  uni.navigateTo({ url: `/pages/meals/meal-plan-form?date=${dateKeyVal}&categoryId=${catId}` })
}

function openDetail(planId) {
  uni.navigateTo({ url: `/pages/meals/meal-detail?id=${planId}` })
}

function removePlan(planId) {
  deletePlan(mealState.value, planId)
  refresh()
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

.section {
  background: #f5f6f7;
  border-radius: 28rpx;
  padding: 18rpx 22rpx 22rpx;
}

.section-head {
  margin-bottom: 12rpx;
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
  height: 106rpx;
  border-radius: 24rpx;
  background: rgba(17, 17, 17, 0.04);
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
