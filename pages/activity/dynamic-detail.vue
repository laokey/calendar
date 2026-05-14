<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <text class="back">‹</text>
      </view>
      <text class="head-title">动态详情</text>
      <view class="head-right">
        <view class="icon-btn" @click="editTitle"><text class="icon">✎</text></view>
        <view class="icon-btn" @click="remove"><text class="icon danger">🗑</text></view>
      </view>
    </view>

    <view v-if="item" class="hero">
      <view class="big-icon">
        <text class="big-glyph">{{ item.task.icon === 'run' ? '🏃' : '🥣' }}</text>
      </view>
      <text class="task-title">{{ item.task.title }}</text>
    </view>

    <view v-if="item" class="panel">
      <view class="row">
        <text class="r-ico">🕒</text>
        <text class="r-text">{{ item.detail.dateText }}</text>
      </view>
      <view class="line" />
      <view class="row">
        <text class="r-ico">↻</text>
        <text class="r-text">{{ item.detail.repeatText }}</text>
      </view>
      <view class="line" />
      <view class="row">
        <text class="r-ico star">★</text>
        <text class="r-text">{{ item.detail.starText }}</text>
      </view>
      <view class="line" />
      <view class="row">
        <text class="r-ico">👤</text>
        <text class="r-text">分配给</text>
        <view class="assignee">
          <view class="a-avatar" :style="{ background: item.detail.assignTo.color }">
            <text class="a-text">{{ item.detail.assignTo.glyph }}</text>
          </view>
          <text class="a-name">{{ item.detail.assignTo.name }}</text>
        </view>
      </view>
      <view class="line" />
      <view class="row">
        <text class="r-ico">☑</text>
        <text class="r-text">{{ item.detail.doneAtText }}</text>
      </view>
    </view>

    <view class="btn" :class="{ disabled: !item }" @click="toggleDone">
      <text class="btn-text">{{ item && item.action === 'done' ? '标记为未完成' : '标记为已完成' }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ensureActivityState, findDynamic, removeDynamic, updateDynamic } from '../../utils/activityStore'

const id = ref('')
const state = ref(ensureActivityState())

onLoad((options) => {
  id.value = options && options.id ? String(options.id) : ''
})

onShow(() => {
  state.value = ensureActivityState()
  if (id.value && !item.value) {
    uni.showToast({ title: '动态不存在', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 300)
  }
})

const safeTop = computed(() => {
  try {
    const info = uni.getSystemInfoSync()
    const insets = info && info.safeAreaInsets ? info.safeAreaInsets : null
    return insets && typeof insets.top === 'number' ? insets.top : 0
  } catch (e) {
    return 0
  }
})

const item = computed(() => findDynamic(state.value, id.value))

function back() {
  uni.navigateBack()
}

function editTitle() {
  if (!item.value) return
  uni.showModal({
    title: '编辑标题',
    editable: true,
    placeholderText: item.value.task.title,
    success: (res) => {
      if (!res.confirm) return
      const v = String(res.content || '').trim()
      if (!v) return
      const s = ensureActivityState()
      updateDynamic(s, id.value, { task: { ...item.value.task, title: v } })
      state.value = ensureActivityState()
    },
  })
}

function remove() {
  if (!item.value) return
  uni.showModal({
    title: '',
    content: '删除该动态？',
    cancelText: '取消',
    confirmText: '确定',
    success: (res) => {
      if (!res.confirm) return
      const s = ensureActivityState()
      removeDynamic(s, id.value)
      uni.navigateBack()
    },
  })
}

function toggleDone() {
  if (!item.value) return
  const next = item.value.action === 'done' ? 'cancel' : 'done'
  const s = ensureActivityState()
  updateDynamic(s, id.value, { action: next })
  state.value = ensureActivityState()
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx 40rpx;
}

.head {
  position: sticky;
  top: 0;
  z-index: 999;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  padding: 18rpx 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.head-left {
  width: 120rpx;
  display: flex;
  align-items: center;
}

.back {
  font-size: 56rpx;
  font-weight: 700;
  line-height: 1;
  color: rgba(17, 17, 17, 0.85);
}

.head-title {
  font-size: 34rpx;
  font-weight: 900;
}

.head-right {
  width: 160rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10rpx;
}

.icon-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(17, 17, 17, 0.8);
}

.icon {
  font-size: 34rpx;
  font-weight: 900;
}

.danger {
  color: #ff4b3f;
}

.hero {
  margin-top: 26rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
}

.big-icon {
  width: 220rpx;
  height: 220rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
}

.big-glyph {
  font-size: 80rpx;
}

.task-title {
  font-size: 44rpx;
  font-weight: 900;
}

.panel {
  margin-top: 30rpx;
  background: rgba(17, 17, 17, 0.03);
  border-radius: 28rpx;
  overflow: hidden;
}

.row {
  padding: 22rpx 22rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.r-ico {
  width: 46rpx;
  text-align: center;
  color: rgba(17, 17, 17, 0.45);
  font-size: 28rpx;
  font-weight: 900;
}

.r-ico.star {
  color: #ffcc00;
}

.r-text {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.8);
}

.line {
  height: 2rpx;
  background: rgba(17, 17, 17, 0.06);
}

.assignee {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.a-avatar {
  width: 44rpx;
  height: 44rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.a-text {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 900;
}

.a-name {
  font-size: 28rpx;
  font-weight: 900;
}

.btn {
  margin-top: 40rpx;
  height: 104rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn.disabled {
  opacity: 0.7;
}

.btn-text {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.65);
}
</style>
