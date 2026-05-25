<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back"><image class="back-img" src="/static/my/icon_back.png" mode="aspectFit" /></view>
      <text class="title">卡片记录</text>
      <view class="head-right" @click="clearAll"><text class="clear">清除</text></view>
    </view>

    <view v-if="items.length === 0" class="empty">
      <image class="empty-img" src="/static/my/img_empty_cards.png" mode="widthFix" />
      <text class="empty-text">尚无卡片记录</text>
    </view>

    <view v-else class="list">
      <view v-for="it in items" :key="it.id" class="card">
        <view class="top">
          <view class="env"><image class="env-img" src="/static/my/icon_cards.png" mode="aspectFit" /></view>
          <view class="meta">
            <text class="c-title">{{ it.title }}</text>
            <text class="c-sub">设备：{{ it.device }}</text>
            <text class="c-sub">时间：{{ it.timeText }}</text>
          </view>
        </view>

        <view class="bottom">
          <text class="badge" :class="{ unread: it.status === 'unread' }">{{ it.status === 'unread' ? '未读' : '已读' }}</text>
          <view class="actions">
            <view class="a-btn" @click="undo(it.id)"><image class="a-img" src="/static/my/icon_refresh.png" mode="aspectFit" /></view>
            <view class="a-btn" @click="preview(it.id)"><image class="a-img" src="/static/my/icon_preview.png" mode="aspectFit" /></view>
            <view class="a-btn danger" @click="remove(it.id)"><image class="a-img danger-img" src="/static/my/icon_trash.png" mode="aspectFit" /></view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { clearCardRecords, deleteCardRecord, ensureMeState, listCardRecords } from '../../utils/meStore'

const state = ref(ensureMeState())

onShow(() => {
  state.value = ensureMeState()
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

const items = computed(() => listCardRecords(state.value))

function back() {
  uni.navigateBack()
}

function clearAll() {
  if (!items.value.length) return
  uni.showModal({
    title: '',
    content: '确定清除全部卡片记录？',
    cancelText: '取消',
    confirmText: '清除',
    success: (res) => {
      if (!res.confirm) return
      const s = ensureMeState()
      clearCardRecords(s)
      state.value = ensureMeState()
    },
  })
}

function preview(id) {
  uni.navigateTo({ url: `/pages/me/card-preview?id=${encodeURIComponent(id)}` })
}

function undo(id) {
  uni.showModal({
    title: '撤销',
    content: '您确定要撤销卡片吗？',
    cancelText: '取消',
    confirmText: '撤销',
    success: (res) => {
      if (!res.confirm) return
      const s = ensureMeState()
      deleteCardRecord(s, id)
      state.value = ensureMeState()
      uni.showToast({ title: '已撤销', icon: 'none' })
    },
  })
}

function remove(id) {
  uni.showModal({
    title: '删除',
    content: '设备端的卡片也将被删除',
    cancelText: '取消',
    confirmText: '删除',
    success: (res) => {
      if (!res.confirm) return
      const s = ensureMeState()
      deleteCardRecord(s, id)
      state.value = ensureMeState()
    },
  })
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

.back-img {
  width: 34rpx;
  height: 34rpx;
  opacity: 0.75;
}

.title {
  font-size: 34rpx;
  font-weight: 900;
}

.head-right {
  width: 120rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.clear {
  font-size: 28rpx;
  font-weight: 900;
  color: #3d6afb;
}

.empty {
  padding: 220rpx 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-img {
  width: 280rpx;
}

.empty-text {
  margin-top: 18rpx;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.45);
}

.list {
  margin-top: 10rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.card {
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
  padding: 20rpx;
}

.top {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.env {
  width: 110rpx;
  height: 110rpx;
  border-radius: 28rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.env-img {
  width: 56rpx;
  height: 56rpx;
}

.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.c-title {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
}

.c-sub {
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
}

.bottom {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge {
  height: 44rpx;
  padding: 0 16rpx;
  border-radius: 9999rpx;
  background: rgba(17, 17, 17, 0.04);
  color: rgba(17, 17, 17, 0.45);
  font-size: 26rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge.unread {
  color: #ff4b3f;
  background: rgba(255, 75, 63, 0.1);
}

.actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.a-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(17, 17, 17, 0.65);
}

.a-btn.danger {
  color: #ff4b3f;
}

.a-img {
  width: 34rpx;
  height: 34rpx;
  opacity: 0.7;
}

.danger-img {
  opacity: 1;
}
</style>
