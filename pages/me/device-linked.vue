<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <image class="back-img" src="/static/my/icon_back.png" mode="aspectFit" />
      </view>
      <text class="head-title">已关联设备</text>
      <view class="head-right" @click="goManage">
        <text class="manage">管理</text>
      </view>
    </view>

    <view class="list">
      <view v-for="d in devices" :key="d.id" class="item" @click="open(d)">
        <view class="item-left">
          <text class="status">已激活</text>
          <text class="name">{{ d.name }}</text>
        </view>
        <image class="chev" src="/static/my/icon_chevron_right.png" mode="aspectFit" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'

const devices = ref([
  { id: 'dev_1', name: '日历' },
  { id: 'dev_2', name: '日历' },
])

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

function goManage() {
  uni.navigateTo({ url: '/pages/me/device-linked-manage' })
}

function open(d) {
  uni.navigateTo({ url: `/pages/me/device-linked-manage?id=${encodeURIComponent(String(d && d.id ? d.id : ''))}` })
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

.manage {
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

.chev {
  width: 22rpx;
  height: 22rpx;
  opacity: 0.55;
}
</style>
