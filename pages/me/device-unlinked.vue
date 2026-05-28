<template>
  <view class="page">
    <view class="head" :style="{ paddingTop: safeTop + 'px' }">
      <view class="head-left" @click="back">
        <image class="back-img" src="/static/my/icon_back.png" mode="aspectFit" />
      </view>
      <text class="head-title">未关联设备</text>
      <view class="head-right" @click="goActivate">
        <image class="plus-img" src="/static/common/icon_plus.png" mode="aspectFit" />
      </view>
    </view>

    <view class="empty">
      <image class="empty-img" src="/static/device/device_thumb_new.png" mode="aspectFit" />
      <text class="empty-title">暂无关联设备</text>
      <text class="empty-sub">点击右上角或右下角的+号，添加新设备并进行激活。</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

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

function goActivate() {
  uni.navigateTo({ url: '/pages/me/device-activate' })
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
  width: 96rpx;
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

.plus-img {
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

.empty {
  margin-top: 90rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 28rpx;
}

.empty-img {
  width: 260rpx;
  height: 260rpx;
}

.empty-title {
  margin-top: 18rpx;
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.empty-sub {
  margin-top: 12rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
  line-height: 1.25;
}
</style>
