<template>
  <view class="bl-page settings-page">
    <BlHeader title="显示设置" back />

    <view class="card">
      <view class="row" @click="sortOpen = true">
        <view class="left">
          <view class="sort-icon" />
          <text class="label">列表排序</text>
        </view>
        <view class="right">
          <text class="value">{{ sortLabel }}</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="divider" />

      <view class="row">
        <view class="left">
          <view class="clock-icon" />
          <text class="label">显示已完成</text>
        </view>
        <switch :checked="showDone" color="#3d6afb" @change="toggleShowDone" />
      </view>
      <text class="desc">若开启则奖励列表显示已完成的奖励/惩罚，关闭则不显示已完成的奖励/惩罚</text>
    </view>

    <BlSheet v-model="sortOpen" title="排序" :confirm-text="''">
      <view class="sort-list">
        <view class="sort-item" :class="{ on: sort === 'asc' }" @click="setSort('asc')">
          <text class="sort-text">心心从小到大排列</text>
          <view class="mark">
            <view v-if="sort === 'asc'" class="check"><text class="check-text">✓</text></view>
            <view v-else class="dot" />
          </view>
        </view>
        <view class="sort-item" :class="{ on: sort === 'desc' }" @click="setSort('desc')">
          <text class="sort-text">心心从大到小排序</text>
          <view class="mark">
            <view v-if="sort === 'desc'" class="check"><text class="check-text">✓</text></view>
            <view v-else class="dot" />
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
import { ensureRewardState, updateRewardSettings } from '../../utils/rewardStore'

const rewardState = ref(ensureRewardState())
const sortOpen = ref(false)

function refresh() {
  rewardState.value = ensureRewardState()
}

onLoad(() => refresh())
onShow(() => refresh())

const sort = computed(() => (rewardState.value.settings && rewardState.value.settings.sort) || 'asc')
const showDone = computed(() => (rewardState.value.settings && typeof rewardState.value.settings.showDone === 'boolean' ? rewardState.value.settings.showDone : true))

const sortLabel = computed(() => (sort.value === 'desc' ? '从大到小' : '从小到大'))

function setSort(v) {
  updateRewardSettings(rewardState.value, { sort: v === 'desc' ? 'desc' : 'asc' })
  sortOpen.value = false
  refresh()
  uni.$emit && uni.$emit('reward:refresh')
}

function toggleShowDone(e) {
  updateRewardSettings(rewardState.value, { showDone: !!(e && e.detail && e.detail.value) })
  refresh()
  uni.$emit && uni.$emit('reward:refresh')
}
</script>

<style scoped lang="scss">
.settings-page {
  padding-bottom: 80rpx;
}

.card {
  margin-top: 18rpx;
  background: #ffffff;
  border-radius: 28rpx;
  padding: 18rpx 22rpx 18rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.row {
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.sort-icon,
.clock-icon {
  width: 28rpx;
  height: 28rpx;
  border-radius: 8rpx;
  background: rgba(17, 17, 17, 0.12);
}

.clock-icon {
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
  color: rgba(17, 17, 17, 0.55);
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

.desc {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.55);
  line-height: 1.4;
}

.sort-list {
  padding: 6rpx 0 10rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.sort-item {
  height: 92rpx;
  border-radius: 20rpx;
  background: rgba(17, 17, 17, 0.06);
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sort-item.on {
  background: rgba(61, 106, 251, 0.12);
}

.sort-text {
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
</style>
