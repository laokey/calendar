<template>
  <view class="page">
    <BlHeader title="" back />

    <view class="hero">
      <view class="device-pic">
        <image class="device-img" src="/static/device/device_hero_plain.png" mode="aspectFit" />
        <view class="device-badge"><text class="device-badge-text">⌁</text></view>
      </view>
      <text class="hero-title">邀请您的家人或朋友</text>
      <text class="hero-sub">您要传给哪个设备？</text>
    </view>

    <view class="card">
      <text class="card-title">芝麻日历</text>
      <view class="opt" :class="{ active: selected === 0 }" @click="selected = 0">
        <text class="opt-text">601347083</text>
      </view>
      <view class="opt" :class="{ active: selected === 1 }" @click="selected = 1">
        <text class="opt-text">a1234567890</text>
      </view>
    </view>

    <view class="btn" @click="send">
      <text class="btn-text">发送邀请</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import BlHeader from '../../components/BlHeader.vue'

const selected = ref(0)

function send() {
  uni.showToast({ title: '已发送邀请', icon: 'none' })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #ffffff;
  padding: 0 28rpx 40rpx;
}

.hero {
  margin-top: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.device-pic {
  width: 420rpx;
  height: 240rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-img {
  width: 420rpx;
  height: 240rpx;
}

.device-badge {
  position: absolute;
  right: 36rpx;
  bottom: 26rpx;
  width: 92rpx;
  height: 92rpx;
  border-radius: 9999rpx;
  background: #ffb020;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 36rpx rgba(255, 176, 32, 0.25);
}

.device-badge-text {
  color: #ffffff;
  font-size: 40rpx;
  font-weight: 900;
}

.hero-title {
  margin-top: 14rpx;
  font-size: 40rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.hero-sub {
  margin-top: 10rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.55);
}

.card {
  margin-top: 26rpx;
  background: rgba(17, 17, 17, 0.03);
  border-radius: 28rpx;
  padding: 22rpx;
}

.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.85);
  margin-bottom: 16rpx;
}

.opt {
  height: 96rpx;
  border-radius: 22rpx;
  background: #ffffff;
  border: 2rpx solid rgba(17, 17, 17, 0.06);
  padding: 0 18rpx;
  display: flex;
  align-items: center;
}

.opt + .opt {
  margin-top: 12rpx;
}

.opt.active {
  background: #eef2ff;
  border-color: rgba(61, 106, 251, 0.8);
}

.opt-text {
  font-size: 30rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.85);
}

.btn {
  margin-top: 22rpx;
  height: 104rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>
