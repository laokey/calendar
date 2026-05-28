<template>
  <view class="bl-page">
    <BlHeader title="显示设置" back back-icon-src="/static/task/icon_nav_back_small.png" />

    <view class="card" @click="openSort">
      <text class="card-title">排序列表</text>
      <view class="card-right">
        <view class="pill"><text class="pill-text">{{ sortText }}</text></view>
        <image class="chev-img" src="/static/task/icon_chevron_right.png" mode="aspectFit" />
      </view>
    </view>

    <view class="card">
      <view class="row-between">
        <text class="card-title">显示已完成任务</text>
        <switch :checked="showDone" color="#3d6afb" @change="setShowDone(!!$event.detail.value)" />
      </view>
      <text class="desc bl-muted">开启后，任务列表将展示已完成任务；关闭则不展示。</text>
    </view>

    <view class="card">
      <view class="row-between">
        <text class="card-title">显示逾期任务</text>
        <switch :checked="showOverdue" color="#3d6afb" @change="setShowOverdue(!!$event.detail.value)" />
      </view>
      <text class="desc bl-muted">若开启则已逾期的任务将持续在任务列表显示；关闭则仅在逾期当天显示。</text>
    </view>

    <BlSheet v-model="sortSheetOpen" title="" :confirm-text="''">
      <view class="sort-sheet">
        <view v-for="opt in sortOptions" :key="opt.value" class="sort-item" @click="sortDraft = opt.value">
          <text class="sort-text">{{ opt.label }}</text>
          <image
            class="sort-sel-img"
            :src="sortDraft === opt.value ? '/static/common/icon_checkbox_checked.png' : '/static/common/icon_radio_off.png'"
            mode="aspectFit"
          />
        </view>
        <view class="sort-actions">
          <view class="btn cancel" @click="sortSheetOpen = false"><text class="btn-text">取消</text></view>
          <view class="btn ok" @click="confirmSort"><text class="btn-text ok-text">确认</text></view>
        </view>
      </view>
    </BlSheet>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BlHeader from '../../components/BlHeader.vue'
import BlSheet from '../../components/BlSheet.vue'
import { ensureTaskState, updateTaskSettings } from '../../utils/taskStore'

const taskState = ref(ensureTaskState())
const sortSheetOpen = ref(false)

const sortOptions = [
  { label: '按时间排序', value: 'time' },
  { label: '按优先级排序', value: 'priority' },
  { label: '按创建排序', value: 'created' },
]

const sortDraft = ref('time')

function refresh() {
  taskState.value = ensureTaskState()
  sortDraft.value = taskState.value.settings && taskState.value.settings.sort ? taskState.value.settings.sort : 'time'
}

onShow(() => refresh())

const showDone = computed(() => !!(taskState.value.settings && taskState.value.settings.showDone))
const showOverdue = computed(() => !!(taskState.value.settings && taskState.value.settings.showOverdue))

const sortText = computed(() => {
  const v = taskState.value.settings && taskState.value.settings.sort ? taskState.value.settings.sort : 'time'
  const opt = sortOptions.find((x) => x.value === v)
  return opt ? opt.label : '按时间排序'
})

function openSort() {
  sortDraft.value = taskState.value.settings && taskState.value.settings.sort ? taskState.value.settings.sort : 'time'
  sortSheetOpen.value = true
}

function confirmSort() {
  updateTaskSettings(taskState.value, { sort: sortDraft.value })
  sortSheetOpen.value = false
  uni.$emit && uni.$emit('task:refresh')
  refresh()
}

function setShowDone(v) {
  updateTaskSettings(taskState.value, { showDone: !!v })
  uni.$emit && uni.$emit('task:refresh')
  refresh()
}

function setShowOverdue(v) {
  updateTaskSettings(taskState.value, { showOverdue: !!v })
  uni.$emit && uni.$emit('task:refresh')
  refresh()
}
</script>

<style scoped lang="scss">
.card {
  margin-top: 16rpx;
  background: #ffffff;
  border-radius: 28rpx;
  padding: 22rpx;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
}

.desc {
  margin-top: 10rpx;
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.4;
}

.card-right {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.pill {
  height: 54rpx;
  padding: 0 18rpx;
  border-radius: 16rpx;
  background: rgba(61, 106, 251, 0.12);
  display: flex;
  align-items: center;
}

.pill-text {
  color: #3d6afb;
  font-size: 26rpx;
  font-weight: 900;
}

.chev-img {
  width: 22rpx;
  height: 22rpx;
  display: block;
}

.sort-sheet {
  padding: 6rpx 0 10rpx;
}

.sort-item {
  height: 88rpx;
  padding: 0 10rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sort-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.sort-sel-img {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.sort-actions {
  margin-top: 14rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.btn {
  flex: 1;
  height: 92rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn.cancel {
  background: rgba(17, 17, 17, 0.06);
}

.btn.ok {
  background: #3d6afb;
}

.btn-text {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
}

.ok-text {
  color: #ffffff;
}
</style>
