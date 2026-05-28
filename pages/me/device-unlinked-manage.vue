<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <image class="back-img" src="/static/my/icon_back.png" mode="aspectFit" />
      </view>
      <text class="head-title">管理设备</text>
      <view class="head-right" @click="done">
        <text class="done">完成</text>
      </view>
    </view>

    <view class="list">
      <view v-for="d in devices" :key="d.id" class="item">
        <view class="item-left">
          <text class="status">未激活</text>
          <text class="name">{{ d.name }}</text>
        </view>
        <view class="item-right">
          <view class="mini-btn ghost" @click="edit(d)">
            <text class="mini-btn-text ghost-text">编辑</text>
          </view>
          <view class="mini-btn primary" @click="goActivate(d)">
            <text class="mini-btn-text primary-text">获取激活码</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const devices = ref([
  { id: 'cal_1', name: '日历' },
])

onLoad((options) => {
  const id = options && options.id ? String(options.id) : ''
  if (!id) return
  devices.value = [{ id, name: '日历' }]
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

function back() {
  uni.navigateBack()
}

function done() {
  uni.navigateBack()
}

function edit() {
  uni.showToast({ title: '编辑', icon: 'none' })
}

function goActivate(d) {
  uni.navigateTo({ url: `/pages/me/device-activate?id=${encodeURIComponent(String(d && d.id ? d.id : ''))}` })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #ffffff;
  background-image: url('/static/my/bg_my.png');
  background-repeat: no-repeat;
  background-position: top center;
  background-size: 100% auto;
  padding: 0 28rpx 40rpx;
}

.head {
  position: sticky;
  top: 0;
  z-index: 999;
  padding: 18rpx 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
}

.head-left,
.head-right {
  width: 120rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
}

.head-right {
  justify-content: flex-end;
}

.back-img {
  width: 44rpx;
  height: 44rpx;
  display: block;
  opacity: 0.92;
}

.head-title {
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.done {
  font-size: 28rpx;
  font-weight: 500;
  color: #406dff;
}

.list {
  margin-top: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.item {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 28rpx;
  padding: 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.item-left {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.status {
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.4);
}

.name {
  font-size: 36rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.item-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.mini-btn {
  height: 72rpx;
  border-radius: 999rpx;
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-btn.ghost {
  background: rgba(64, 109, 255, 0.12);
}

.mini-btn.primary {
  background: #406dff;
}

.mini-btn-text {
  font-size: 26rpx;
  font-weight: 900;
}

.ghost-text {
  color: #406dff;
}

.primary-text {
  color: #ffffff;
}
</style>
