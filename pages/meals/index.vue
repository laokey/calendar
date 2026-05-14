<template>
  <view class="bl-page meals-page">
    <BlHeader title="餐食" back />

    <view class="top-bar">
      <view class="cat-btn" @click="goCategories">
        <view class="grid-icon" />
        <text class="cat-text">类别</text>
      </view>

      <view class="week">
        <view class="week-arrow" @click="shiftWeek(-7)"><text class="week-arrow-text">‹</text></view>
        <text class="week-text">{{ weekText }}</text>
        <view class="week-arrow" @click="shiftWeek(7)"><text class="week-arrow-text">›</text></view>
      </view>
    </view>

    <scroll-view scroll-x class="days" show-scrollbar="false">
      <view class="days-row">
        <view v-for="d in days" :key="d.key" class="day" @click="selectDay(d.key)">
          <text class="day-w">{{ d.weekday }}</text>
          <view class="day-b" :class="{ on: d.key === activeDateKey }">
            <text class="day-n" :class="{ on: d.key === activeDateKey }">{{ d.date }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="sections">
      <view v-for="d in days" :key="d.key" class="section">
        <view class="section-head">
          <text class="sec-title">{{ d.weekday }}—{{ d.date }}</text>
        </view>

        <BlSegmented v-model="activeCategoryId" :options="categoryOptions" />

        <view v-if="itemsFor(d.key).length" class="meal-items">
          <view v-for="it in itemsFor(d.key)" :key="it.id" class="meal-item" @click="openDetail(it.id)">
            <view class="thumb">
              <image v-if="it.photoPath" class="thumb-img" :src="it.photoPath" mode="aspectFill" />
              <view v-else class="thumb-ph" />
            </view>
            <text class="meal-title">{{ it.title }}</text>
            <view class="meal-del" @click.stop="removePlan(it.id)"><text class="meal-del-text">删</text></view>
          </view>
        </view>

        <view v-else class="add-card" @click="openPlanForm(d.key)">
          <text class="add-plus">+</text>
          <text class="add-text">添加</text>
        </view>
      </view>
    </view>

    <view class="fab" @click="openPlanForm(activeDateKey)">
      <text class="fab-plus">+</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import BlSegmented from '../../components/BlSegmented.vue'
import {
  clearRecipeSelectTmp,
  ensureMealState,
  findRecipe,
  listCategories,
  plansForDateCategory,
  setActiveCategoryId,
  setActiveDateKey,
  setWeekStartKey,
  weekDaysForKey,
  weekRangeText,
  deletePlan,
} from '../../utils/mealStore'

const mealState = ref(ensureMealState())

function refresh() {
  mealState.value = ensureMealState()
  const enabled = listCategories(mealState.value, { enabledOnly: true })
  if (enabled.length && !enabled.some((c) => c.id === activeCategoryId.value)) {
    mealState.value = setActiveCategoryId(mealState.value, enabled[0].id)
  }
}

onShow(() => refresh())

const weekStartKey = computed(() => mealState.value.weekStartKey)
const activeDateKey = computed(() => mealState.value.activeDateKey)
const activeCategoryId = computed({
  get() {
    return mealState.value.activeCategoryId
  },
  set(v) {
    mealState.value = setActiveCategoryId(mealState.value, v)
  },
})

const days = computed(() => weekDaysForKey(weekStartKey.value))
const weekText = computed(() => weekRangeText(weekStartKey.value))

const categoryOptions = computed(() =>
  listCategories(mealState.value, { enabledOnly: true }).map((c) => ({ label: c.name, value: c.id }))
)

function shiftWeek(deltaDays) {
  const cur = days.value[0] ? days.value[0].key : weekStartKey.value
  const d = parseKey(cur)
  d.setDate(d.getDate() + deltaDays)
  mealState.value = setWeekStartKey(mealState.value, formatKey(d))
  refresh()
}

function selectDay(key) {
  mealState.value = setActiveDateKey(mealState.value, key)
}

function itemsFor(dateKeyVal) {
  const plans = plansForDateCategory(mealState.value, dateKeyVal, activeCategoryId.value)
  return plans
    .map((p) => {
      const r = findRecipe(mealState.value, p.recipeId)
      return { id: p.id, title: r ? r.title : '未命名', photoPath: r ? r.photoPath : '' }
    })
    .filter(Boolean)
}

function openPlanForm(dateKeyVal) {
  clearRecipeSelectTmp()
  uni.navigateTo({ url: `/pages/meals/meal-plan-form?date=${dateKeyVal}&categoryId=${activeCategoryId.value}` })
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
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.grid-icon {
  width: 34rpx;
  height: 34rpx;
  border-radius: 10rpx;
  background: rgba(17, 17, 17, 0.14);
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
  background: rgba(17, 17, 17, 0.04);
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

.days {
  margin-top: 14rpx;
}

.days-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 6rpx 0;
}

.day {
  width: 98rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.day-w {
  font-size: 24rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.7);
}

.day-b {
  width: 58rpx;
  height: 58rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-b.on {
  background: #3d6afb;
}

.day-n {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.day-n.on {
  color: #ffffff;
}

.sections {
  margin-top: 10rpx;
  display: flex;
  flex-direction: column;
  gap: 26rpx;
}

.section-head {
  margin-bottom: 12rpx;
}

.sec-title {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
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
  background: rgba(76, 195, 138, 0.12);
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

.meal-del-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.45);
}

.add-card {
  margin-top: 14rpx;
  height: 106rpx;
  border-radius: 24rpx;
  background: rgba(17, 17, 17, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.add-plus {
  font-size: 36rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
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
  width: 116rpx;
  height: 116rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  box-shadow: 0 18rpx 36rpx rgba(61, 106, 251, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-plus {
  color: #ffffff;
  font-size: 64rpx;
  font-weight: 700;
  line-height: 1;
}
</style>

